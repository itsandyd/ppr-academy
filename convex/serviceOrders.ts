import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Service Orders Management
 * Handles mixing/mastering service orders with full workflow
 */

// Generate a human-readable order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MIX-${year}${month}-${random}`;
}

// ============================================================================
// QUERIES
// ============================================================================

// Get order by ID with full details
export const getOrderById = query({
  args: { orderId: v.id("serviceOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Get product details
    const product = await ctx.db.get(order.productId);

    // Get messages
    const messages = await ctx.db
      .query("serviceOrderMessages")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .order("asc")
      .collect();

    // Convert storage IDs to URLs for files
    const getFileUrls = async (files: any[] | undefined) => {
      if (!files) return [];
      return Promise.all(
        files.map(async (file) => ({
          ...file,
          url: file.storageId
            ? await ctx.storage.getUrl(file.storageId as Id<"_storage">)
            : file.url,
        }))
      );
    };

    const customerFilesWithUrls = await getFileUrls(order.customerFiles);
    const deliveredFilesWithUrls = await getFileUrls(order.deliveredFiles);

    // Get customer and creator info
    const customer = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", order.customerId))
      .first();

    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", order.creatorId))
      .first();

    return {
      ...order,
      customerFiles: customerFilesWithUrls,
      deliveredFiles: deliveredFilesWithUrls,
      product,
      messages,
      customerName: customer?.name || customer?.email || "Customer",
      customerEmail: customer?.email,
      customerAvatar: customer?.imageUrl,
      creatorName: creator?.name || creator?.email || "Creator",
      creatorEmail: creator?.email,
      creatorAvatar: creator?.imageUrl,
    };
  },
});

// Get customer's orders
export const getCustomerOrders = query({
  args: {
    userId: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending_payment"),
        v.literal("pending_upload"),
        v.literal("files_received"),
        v.literal("in_progress"),
        v.literal("pending_review"),
        v.literal("revision_requested"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("refunded")
      )
    ),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("serviceOrders")
        .withIndex("by_customer_status", (q) =>
          q.eq("customerId", args.userId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db
        .query("serviceOrders")
        .withIndex("by_customerId", (q) => q.eq("customerId", args.userId))
        .order("desc")
        .collect();
    }

    // Enrich with product info
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const product = await ctx.db.get(order.productId);
        return {
          ...order,
          productTitle: product?.title || "Unknown Service",
          productImage: product?.imageUrl,
        };
      })
    );

    return ordersWithProducts;
  },
});

// Get creator's orders (incoming work)
export const getCreatorOrders = query({
  args: {
    userId: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending_payment"),
        v.literal("pending_upload"),
        v.literal("files_received"),
        v.literal("in_progress"),
        v.literal("pending_review"),
        v.literal("revision_requested"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("refunded")
      )
    ),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("serviceOrders")
        .withIndex("by_creator_status", (q) =>
          q.eq("creatorId", args.userId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else {
      orders = await ctx.db
        .query("serviceOrders")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", args.userId))
        .order("desc")
        .collect();
    }

    // Enrich with customer info and product info
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const customer = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", order.customerId))
          .first();

        const product = await ctx.db.get(order.productId);

        return {
          ...order,
          customerName: customer?.name || customer?.email || "Customer",
          customerEmail: customer?.email,
          customerAvatar: customer?.imageUrl,
          productTitle: product?.title || "Unknown Service",
          productImage: product?.imageUrl,
        };
      })
    );

    return ordersWithDetails;
  },
});

// Get order messages with pagination
export const getOrderMessages = query({
  args: {
    orderId: v.id("serviceOrders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const messages = await ctx.db
      .query("serviceOrderMessages")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .order("asc")
      .take(limit);

    // Get sender info for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", msg.senderId))
          .first();

        // Convert attachment storage IDs to URLs
        const attachmentsWithUrls = msg.attachments
          ? await Promise.all(
              msg.attachments.map(async (att) => ({
                ...att,
                url: att.storageId
                  ? await ctx.storage.getUrl(att.storageId as Id<"_storage">)
                  : att.url,
              }))
            )
          : [];

        return {
          ...msg,
          attachments: attachmentsWithUrls,
          senderName: sender?.name || sender?.email || "Unknown",
          senderAvatar: sender?.imageUrl,
        };
      })
    );

    return messagesWithSenders;
  },
});

// Get order stats for dashboard
export const getOrderStats = query({
  args: {
    userId: v.string(),
    role: v.union(v.literal("customer"), v.literal("creator")),
  },
  handler: async (ctx, args) => {
    const indexName = args.role === "customer" ? "by_customerId" : "by_creatorId";

    const orders = await ctx.db
      .query("serviceOrders")
      .withIndex(indexName, (q) => q.eq(args.role === "customer" ? "customerId" : "creatorId", args.userId))
      .collect();

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending_upload" || o.status === "pending_payment").length,
      inProgress: orders.filter((o) => o.status === "files_received" || o.status === "in_progress").length,
      awaitingReview: orders.filter((o) => o.status === "pending_review").length,
      revisionRequested: orders.filter((o) => o.status === "revision_requested").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled" || o.status === "refunded").length,
    };

    return stats;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Create a new service order (called after payment)
export const createServiceOrder = mutation({
  args: {
    customerId: v.string(),
    creatorId: v.string(),
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    serviceType: v.union(
      v.literal("mixing"),
      v.literal("mastering"),
      v.literal("mix-and-master"),
      v.literal("stem-mixing")
    ),
    selectedTier: v.object({
      id: v.string(),
      name: v.string(),
      stemCount: v.string(),
      price: v.number(),
      turnaroundDays: v.number(),
      revisions: v.number(),
    }),
    basePrice: v.number(),
    rushFee: v.optional(v.number()),
    totalPrice: v.number(),
    isRush: v.optional(v.boolean()),
    customerNotes: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderNumber = generateOrderNumber();

    // Calculate due date based on turnaround
    const dueDate = now + args.selectedTier.turnaroundDays * 24 * 60 * 60 * 1000;

    const orderId = await ctx.db.insert("serviceOrders", {
      customerId: args.customerId,
      creatorId: args.creatorId,
      productId: args.productId,
      storeId: args.storeId,
      orderNumber,
      serviceType: args.serviceType,
      selectedTier: args.selectedTier,
      basePrice: args.basePrice,
      rushFee: args.rushFee,
      totalPrice: args.totalPrice,
      isRush: args.isRush,
      status: "pending_upload",
      customerNotes: args.customerNotes,
      revisionsUsed: 0,
      revisionsAllowed: args.selectedTier.revisions,
      paidAt: now,
      dueDate,
    });

    // Create system message
    await ctx.db.insert("serviceOrderMessages", {
      orderId,
      senderId: "system",
      senderType: "creator",
      content: `Order #${orderNumber} created. Waiting for customer to upload files.`,
      isSystemMessage: true,
      createdAt: now,
    });

    return orderId;
  },
});

// Customer uploads files
export const uploadCustomerFiles = mutation({
  args: {
    orderId: v.id("serviceOrders"),
    files: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        storageId: v.string(),
        size: v.number(),
        type: v.string(),
      })
    ),
    notes: v.optional(v.string()),
    referenceTrackUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();

    const filesWithTimestamp = args.files.map((f) => ({
      ...f,
      uploadedAt: now,
    }));

    await ctx.db.patch(args.orderId, {
      customerFiles: filesWithTimestamp,
      customerNotes: args.notes || order.customerNotes,
      referenceTrackUrl: args.referenceTrackUrl,
      status: "files_received",
      filesUploadedAt: now,
    });

    // Create system message
    await ctx.db.insert("serviceOrderMessages", {
      orderId: args.orderId,
      senderId: "system",
      senderType: "customer",
      content: `Customer uploaded ${args.files.length} file(s). Order is ready to be worked on.`,
      isSystemMessage: true,
      createdAt: now,
    });

    return { success: true };
  },
});

// Update order status
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("serviceOrders"),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("pending_upload"),
      v.literal("files_received"),
      v.literal("in_progress"),
      v.literal("pending_review"),
      v.literal("revision_requested"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();
    const updates: any = { status: args.status };

    // Set timestamps based on status
    if (args.status === "in_progress" && !order.workStartedAt) {
      updates.workStartedAt = now;
    }
    if (args.status === "completed") {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.orderId, updates);

    // Create system message
    const statusLabels: Record<string, string> = {
      pending_upload: "Waiting for customer files",
      files_received: "Files received",
      in_progress: "Work started",
      pending_review: "Delivered - awaiting review",
      revision_requested: "Revision requested",
      completed: "Order completed",
      cancelled: "Order cancelled",
      refunded: "Order refunded",
    };

    await ctx.db.insert("serviceOrderMessages", {
      orderId: args.orderId,
      senderId: "system",
      senderType: "creator",
      content: `Status updated: ${statusLabels[args.status] || args.status}${args.notes ? ` - ${args.notes}` : ""}`,
      isSystemMessage: true,
      createdAt: now,
    });

    return { success: true };
  },
});

// Creator delivers files
export const deliverFiles = mutation({
  args: {
    orderId: v.id("serviceOrders"),
    files: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        storageId: v.string(),
        size: v.number(),
        type: v.string(),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();

    // Determine version number
    const currentDeliveredFiles = order.deliveredFiles || [];
    const maxVersion = currentDeliveredFiles.reduce(
      (max, f) => Math.max(max, f.version || 0),
      0
    );
    const newVersion = maxVersion + 1;

    const filesWithMeta = args.files.map((f) => ({
      ...f,
      uploadedAt: now,
      version: newVersion,
      notes: args.notes,
    }));

    const updates: any = {
      deliveredFiles: [...currentDeliveredFiles, ...filesWithMeta],
      status: "pending_review",
    };

    if (!order.firstDeliveryAt) {
      updates.firstDeliveryAt = now;
    }

    await ctx.db.patch(args.orderId, updates);

    // Create system message
    await ctx.db.insert("serviceOrderMessages", {
      orderId: args.orderId,
      senderId: "system",
      senderType: "creator",
      content: `Delivery ${newVersion > 1 ? `(Revision ${newVersion - 1})` : ""}: ${args.files.length} file(s) delivered.${args.notes ? ` Notes: ${args.notes}` : ""}`,
      isSystemMessage: true,
      createdAt: now,
    });

    return { success: true, version: newVersion };
  },
});

// Customer requests revision
export const requestRevision = mutation({
  args: {
    orderId: v.id("serviceOrders"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    if (order.revisionsUsed >= order.revisionsAllowed) {
      throw new Error("No revisions remaining. Please contact the creator for additional revision options.");
    }

    const now = Date.now();

    await ctx.db.patch(args.orderId, {
      status: "revision_requested",
      revisionsUsed: order.revisionsUsed + 1,
    });

    // Create message with feedback
    await ctx.db.insert("serviceOrderMessages", {
      orderId: args.orderId,
      senderId: order.customerId,
      senderType: "customer",
      content: `Revision requested (${order.revisionsUsed + 1}/${order.revisionsAllowed}): ${args.feedback}`,
      createdAt: now,
    });

    return { success: true, revisionsRemaining: order.revisionsAllowed - order.revisionsUsed - 1 };
  },
});

// Customer approves delivery
export const approveDelivery = mutation({
  args: {
    orderId: v.id("serviceOrders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();

    await ctx.db.patch(args.orderId, {
      status: "completed",
      completedAt: now,
    });

    // Create system message
    await ctx.db.insert("serviceOrderMessages", {
      orderId: args.orderId,
      senderId: "system",
      senderType: "customer",
      content: "Customer approved the delivery. Order completed!",
      isSystemMessage: true,
      createdAt: now,
    });

    return { success: true };
  },
});

// Send message
export const sendMessage = mutation({
  args: {
    orderId: v.id("serviceOrders"),
    senderId: v.string(),
    senderType: v.union(v.literal("customer"), v.literal("creator")),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          storageId: v.string(),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();

    const messageId = await ctx.db.insert("serviceOrderMessages", {
      orderId: args.orderId,
      senderId: args.senderId,
      senderType: args.senderType,
      content: args.content,
      attachments: args.attachments,
      createdAt: now,
    });

    // Update unread count
    const unreadField = args.senderType === "customer" ? "unreadByCreator" : "unreadByCustomer";
    await ctx.db.patch(args.orderId, {
      lastMessageAt: now,
      [unreadField]: (order[unreadField] || 0) + 1,
    });

    return messageId;
  },
});

// Mark messages as read
export const markMessagesRead = mutation({
  args: {
    orderId: v.id("serviceOrders"),
    userId: v.string(),
    userType: v.union(v.literal("customer"), v.literal("creator")),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();

    // Mark all unread messages from the other party as read
    const messages = await ctx.db
      .query("serviceOrderMessages")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();

    const otherType = args.userType === "customer" ? "creator" : "customer";

    for (const msg of messages) {
      if (msg.senderType === otherType && !msg.readAt) {
        await ctx.db.patch(msg._id, { readAt: now });
      }
    }

    // Reset unread count
    const unreadField = args.userType === "customer" ? "unreadByCustomer" : "unreadByCreator";
    await ctx.db.patch(args.orderId, {
      [unreadField]: 0,
    });

    return { success: true };
  },
});
