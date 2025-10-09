import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ==================== QUERIES ====================

// Get all coaching products by store
export const getCoachingProductsByStore = query({
  args: { storeId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      isPublished: v.optional(v.boolean()),
      // Coaching specific fields
      duration: v.optional(v.number()), // session duration in minutes
      sessionType: v.optional(v.string()), // 'video', 'audio', 'phone'
      customFields: v.optional(v.any()), // custom info fields
      availability: v.optional(v.any()), // availability settings
      discordRoleId: v.optional(v.string()), // Discord role for coaching channels
    })
  ),
  handler: async (ctx, args) => {
    // Coaching products are stored in digitalProducts with productType='coaching'
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Filter for coaching products (we'll add productType field)
    return products.map((p) => ({
      _id: p._id,
      _creationTime: p._creationTime,
      title: p.title,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      storeId: p.storeId,
      userId: p.userId,
      isPublished: p.isPublished,
      duration: (p as any).duration,
      sessionType: (p as any).sessionType,
      customFields: (p as any).customFields,
      availability: (p as any).availability,
      discordRoleId: (p as any).discordRoleId,
    }));
  },
});

// Get published coaching products by store (for public storefront)
export const getPublishedCoachingProductsByStore = query({
  args: { storeId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    // Filter for published coaching products
    return products
      .filter((p) => p.isPublished && (p as any).productType === "coaching")
      .map((p) => ({
        _id: p._id,
        _creationTime: p._creationTime,
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        storeId: p.storeId,
        userId: p.userId,
        duration: (p as any).duration,
        sessionType: (p as any).sessionType,
      }));
  },
});

// Get single coaching product
export const getCoachingProductById = query({
  args: { productId: v.id("digitalProducts") },
  returns: v.union(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      isPublished: v.optional(v.boolean()),
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
      customFields: v.optional(v.any()),
      availability: v.optional(v.any()),
      discordRoleId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    return {
      _id: product._id,
      _creationTime: product._creationTime,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      userId: product.userId,
      isPublished: product.isPublished,
      duration: (product as any).duration,
      sessionType: (product as any).sessionType,
      customFields: (product as any).customFields,
      availability: (product as any).availability,
      discordRoleId: (product as any).discordRoleId,
    };
  },
});

// Check if user has Discord connected (for booking verification)
export const checkUserDiscordConnection = query({
  args: { userId: v.string() },
  returns: v.object({
    isConnected: v.boolean(),
    discordUsername: v.optional(v.string()),
    guildMemberStatus: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("discordIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!connection) {
      return { isConnected: false };
    }

    return {
      isConnected: true,
      discordUsername: connection.discordUsername,
      guildMemberStatus: connection.guildMemberStatus,
    };
  },
});

// ==================== MUTATIONS ====================

// Create coaching product
export const createCoachingProduct = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    duration: v.number(), // session duration in minutes
    sessionType: v.string(), // 'video', 'audio', 'phone'
    customFields: v.optional(v.any()), // custom info fields to collect
    availability: v.optional(v.any()), // availability configuration
    thumbnailStyle: v.optional(v.string()), // thumbnail display style
  },
  returns: v.object({
    success: v.boolean(),
    productId: v.optional(v.id("digitalProducts")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const productId = await ctx.db.insert("digitalProducts", {
        title: args.title,
        description: args.description,
        price: args.price,
        imageUrl: args.imageUrl,
        storeId: args.storeId,
        userId: args.userId,
        isPublished: false,
        orderBumpEnabled: false,
        affiliateEnabled: false,
        // Coaching-specific fields
        productType: "coaching",
        duration: args.duration,
        sessionType: args.sessionType,
        customFields: args.customFields,
        availability: args.availability,
        thumbnailStyle: args.thumbnailStyle,
      });

      return { success: true, productId };
    } catch (error: any) {
      console.error("Error creating coaching product:", error);
      return { success: false, error: error.message };
    }
  },
});

// Update coaching product
export const updateCoachingProduct = mutation({
  args: {
    productId: v.id("digitalProducts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    sessionType: v.optional(v.string()),
    customFields: v.optional(v.any()),
    availability: v.optional(v.any()),
    thumbnailStyle: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    discordRoleId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const { productId, ...updates } = args;
      
      await ctx.db.patch(productId, updates);

      return { success: true };
    } catch (error: any) {
      console.error("Error updating coaching product:", error);
      return { success: false, error: error.message };
    }
  },
});

// Publish coaching product
export const publishCoachingProduct = mutation({
  args: { productId: v.id("digitalProducts") },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.productId, { isPublished: true });
      return { success: true };
    } catch (error: any) {
      console.error("Error publishing coaching product:", error);
      return { success: false, error: error.message };
    }
  },
});

// Create coaching session booking
export const bookCoachingSession = mutation({
  args: {
    productId: v.id("digitalProducts"),
    studentId: v.string(), // Clerk user ID
    scheduledDate: v.number(), // timestamp
    startTime: v.string(), // e.g., "14:00"
    notes: v.optional(v.string()),
    customFieldResponses: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
    sessionId: v.optional(v.id("coachingSessions")),
    error: v.optional(v.string()),
    requiresDiscordAuth: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the coaching product
      const product = await ctx.db.get(args.productId);
      if (!product) {
        return { success: false, error: "Coaching product not found" };
      }

      const coachId = product.userId;
      const duration = (product as any).duration || 60;

      // Check if user has Discord connected
      const discordConnection = await ctx.db
        .query("discordIntegrations")
        .withIndex("by_userId", (q) => q.eq("userId", args.studentId))
        .unique();

      if (!discordConnection) {
        return {
          success: false,
          error: "Discord connection required",
          requiresDiscordAuth: true,
        };
      }

      // Calculate end time
      const [hours, minutes] = args.startTime.split(":").map(Number);
      const endMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(
        endMins
      ).padStart(2, "0")}`;

      // Create session
      const sessionId = await ctx.db.insert("coachingSessions", {
        productId: args.productId,
        coachId,
        studentId: args.studentId,
        scheduledDate: args.scheduledDate,
        startTime: args.startTime,
        endTime,
        duration,
        status: "SCHEDULED",
        notes: args.notes,
        sessionType: (product as any).sessionType || "video",
        totalCost: product.price,
        discordSetupComplete: false,
        reminderSent: false,
      });

      // Schedule Discord setup (will create channel and assign role)
      await ctx.scheduler.runAfter(
        0,
        internal.coachingDiscordActions.setupDiscordForSession,
        {
          sessionId,
          coachId,
          studentId: args.studentId,
          productId: args.productId,
        }
      );

      return { success: true, sessionId };
    } catch (error: any) {
      console.error("Error booking coaching session:", error);
      return { success: false, error: error.message };
    }
  },
});

// ==================== INTERNAL QUERIES/MUTATIONS ====================

// Internal query helper
export const getProductForDiscord = internalQuery({
  args: { productId: v.id("digitalProducts") },
  returns: v.union(
    v.object({
      storeId: v.string(),
      title: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    return {
      storeId: product.storeId,
      title: product.title,
    };
  },
});

// Internal mutation to update session with Discord info
export const updateSessionDiscordInfo = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    discordChannelId: v.string(),
    discordRoleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      discordChannelId: args.discordChannelId,
      discordRoleId: args.discordRoleId,
      discordSetupComplete: true,
    });
    return null;
  },
});

// Internal query helper to get session for cleanup
export const getSessionForCleanup = internalQuery({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.union(
    v.object({
      discordChannelId: v.optional(v.string()),
      discordRoleId: v.optional(v.string()),
      productId: v.id("digitalProducts"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    return {
      discordChannelId: session.discordChannelId,
      discordRoleId: session.discordRoleId,
      productId: session.productId,
    };
  },
});

