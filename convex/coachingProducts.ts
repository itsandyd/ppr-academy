import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { generateSlug } from "./lib/utils";
import { requireAuth, requireStoreOwner } from "./lib/auth";

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
      .take(500);

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
      .take(100);

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

export const getCoachingProductsByCoach = query({
  args: { coachId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("digitalProducts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      isPublished: v.optional(v.boolean()),
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_userId", (q) => q.eq("userId", args.coachId))
      .take(500);

    return products
      .filter((p) => (p as any).productType === "coaching")
      .map((p) => ({
        _id: p._id,
        _creationTime: p._creationTime,
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        storeId: p.storeId,
        isPublished: p.isPublished,
        duration: (p as any).duration,
        sessionType: (p as any).sessionType,
      }));
  },
});

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
      const { identity, store } = await requireStoreOwner(ctx, args.storeId);
      const userId = identity.subject;

      const storeName = store.name || "coach";
      const baseSlug = generateSlug(`${args.title}-${storeName}`);

      const existing = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId_and_slug", (q) => q.eq("storeId", args.storeId).eq("slug", baseSlug))
        .first();

      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      const productId = await ctx.db.insert("digitalProducts", {
        title: args.title,
        slug,
        description: args.description,
        price: args.price,
        imageUrl: args.imageUrl,
        storeId: args.storeId,
        userId,
        isPublished: false,
        orderBumpEnabled: false,
        affiliateEnabled: false,
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
      const { productId, title, ...otherUpdates } = args;

      const product = await ctx.db.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Verify caller owns the product's store
      await requireStoreOwner(ctx, product.storeId);

      const updates: Record<string, any> = { ...otherUpdates };

      if (title && title !== product.title) {
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("_id"), product.storeId))
          .first();

        const storeName = store?.name || "coach";
        const baseSlug = generateSlug(`${title}-${storeName}`);

        const existing = await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId_and_slug", (q) =>
            q.eq("storeId", product.storeId).eq("slug", baseSlug)
          )
          .first();

        if (!existing || existing._id === productId) {
          updates.slug = baseSlug;
        } else {
          updates.slug = `${baseSlug}-${Date.now()}`;
        }
        updates.title = title;
      }

      await ctx.db.patch(productId, updates);

      return { success: true };
    } catch (error: any) {
      console.error("Error updating coaching product:", error);
      return { success: false, error: error.message };
    }
  },
});

export const publishCoachingProduct = mutation({
  args: { productId: v.id("digitalProducts") },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db.get(args.productId);
      if (!product) return { success: false, error: "Product not found" };
      await requireStoreOwner(ctx, product.storeId);
      await ctx.db.patch(args.productId, { isPublished: true });
      return { success: true };
    } catch (error: any) {
      console.error("Error publishing coaching product:", error);
      return { success: false, error: error.message };
    }
  },
});

export const unpublishCoachingProduct = mutation({
  args: { productId: v.id("digitalProducts") },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db.get(args.productId);
      if (!product) return { success: false, error: "Product not found" };
      await requireStoreOwner(ctx, product.storeId);
      await ctx.db.patch(args.productId, { isPublished: false });
      return { success: true };
    } catch (error: any) {
      console.error("Error unpublishing coaching product:", error);
      return { success: false, error: error.message };
    }
  },
});

export const deleteCoachingSession = mutation({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const identity = await requireAuth(ctx);
      const session = await ctx.db.get(args.sessionId);
      if (!session) {
        return { success: false, error: "Session not found" };
      }
      // Verify caller is the coach
      if (session.coachId !== identity.subject) {
        return { success: false, error: "Not authorized" };
      }

      if (session.discordChannelId || session.discordRoleId) {
        await ctx.scheduler.runAfter(0, internal.coachingDiscordActions.cleanupSessionDiscord, {
          sessionId: args.sessionId,
        });
      }

      await ctx.db.delete(args.sessionId);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting coaching session:", error);
      return { success: false, error: error.message };
    }
  },
});

// Create coaching session booking
export const bookCoachingSession = mutation({
  args: {
    productId: v.id("digitalProducts"),
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
      const identity = await requireAuth(ctx);
      const studentId = identity.subject;

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
        .withIndex("by_userId", (q) => q.eq("userId", studentId))
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
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      // Create session
      const sessionId = await ctx.db.insert("coachingSessions", {
        productId: args.productId,
        coachId,
        studentId,
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
      await ctx.scheduler.runAfter(0, internal.coachingDiscordActions.setupDiscordForSession, {
        sessionId,
        coachId,
        studentId,
        productId: args.productId,
      });

      // Send confirmation emails
      const student = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", studentId))
        .unique();
      const coach = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", coachId))
        .unique();

      if (student?.email && coach?.email) {
        const sessionDate = new Date(args.scheduledDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const studentName = student.name || student.firstName || "Student";
        const coachName = coach.name || coach.firstName || "Coach";

        // Email to student
        await ctx.scheduler.runAfter(0, internal.coachingEmails.sendBookingConfirmationEmail, {
          studentName,
          studentEmail: student.email,
          sessionTitle: product.title,
          coachName,
          sessionDate,
          sessionTime: args.startTime,
          duration,
        });

        // Email to coach
        await ctx.scheduler.runAfter(0, internal.coachingEmails.sendNewBookingNotificationEmail, {
          coachName,
          coachEmail: coach.email,
          studentName,
          studentEmail: student.email,
          sessionTitle: product.title,
          sessionDate,
          sessionTime: args.startTime,
          duration,
          amount: product.price,
          notes: args.notes,
        });
      }

      return { success: true, sessionId };
    } catch (error: any) {
      console.error("Error booking coaching session:", error);
      return { success: false, error: error.message };
    }
  },
});

// Internal version for server-side callers (e.g. Stripe webhooks) that don't have user auth context
export const internalBookCoachingSession = internalMutation({
  args: {
    productId: v.id("digitalProducts"),
    studentId: v.string(),
    scheduledDate: v.number(),
    startTime: v.string(),
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
      const studentId = args.studentId;

      const product = await ctx.db.get(args.productId);
      if (!product) {
        return { success: false, error: "Coaching product not found" };
      }

      const coachId = product.userId;
      const duration = (product as any).duration || 60;

      const discordConnection = await ctx.db
        .query("discordIntegrations")
        .withIndex("by_userId", (q) => q.eq("userId", studentId))
        .unique();

      if (!discordConnection) {
        return {
          success: false,
          error: "Discord connection required",
          requiresDiscordAuth: true,
        };
      }

      const [hours, minutes] = args.startTime.split(":").map(Number);
      const endMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      const sessionId = await ctx.db.insert("coachingSessions", {
        productId: args.productId,
        coachId,
        studentId,
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

      await ctx.scheduler.runAfter(0, internal.coachingDiscordActions.setupDiscordForSession, {
        sessionId,
        coachId,
        studentId,
        productId: args.productId,
      });

      const student = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", studentId))
        .unique();
      const coach = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", coachId))
        .unique();

      if (student?.email && coach?.email) {
        const sessionDate = new Date(args.scheduledDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const studentName = student.name || student.firstName || "Student";
        const coachName = coach.name || coach.firstName || "Coach";

        await ctx.scheduler.runAfter(0, internal.coachingEmails.sendBookingConfirmationEmail, {
          studentName,
          studentEmail: student.email,
          sessionTitle: product.title,
          coachName,
          sessionDate,
          sessionTime: args.startTime,
          duration,
        });

        await ctx.scheduler.runAfter(0, internal.coachingEmails.sendNewBookingNotificationEmail, {
          coachName,
          coachEmail: coach.email,
          studentName,
          studentEmail: student.email,
          sessionTitle: product.title,
          sessionDate,
          sessionTime: args.startTime,
          duration,
          amount: product.price,
          notes: args.notes,
        });
      }

      return { success: true, sessionId };
    } catch (error: any) {
      console.error("Error booking coaching session:", error);
      return { success: false, error: error.message };
    }
  },
});

// ==================== COACH SESSION MANAGEMENT ====================

export const getCoachSessions = query({
  args: {
    coachId: v.string(),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      _creationTime: v.number(),
      productId: v.id("digitalProducts"),
      productTitle: v.string(),
      studentId: v.string(),
      studentName: v.optional(v.string()),
      studentEmail: v.optional(v.string()),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      status: v.string(),
      notes: v.optional(v.string()),
      totalCost: v.number(),
      discordSetupComplete: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    let sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_coachId", (q) => q.eq("coachId", args.coachId))
      .take(1000);

    if (args.status) {
      sessions = sessions.filter((s) => s.status === args.status);
    }

    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const product = await ctx.db.get(session.productId);
        const student = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", session.studentId))
          .first();

        return {
          _id: session._id,
          _creationTime: session._creationTime,
          productId: session.productId,
          productTitle: product?.title || "Unknown Session",
          studentId: session.studentId,
          studentName: student?.name,
          studentEmail: student?.email,
          scheduledDate: session.scheduledDate,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          status: session.status,
          notes: session.notes,
          totalCost: session.totalCost,
          discordSetupComplete: session.discordSetupComplete,
        };
      })
    );

    return enriched.sort((a, b) => b.scheduledDate - a.scheduledDate);
  },
});

export const updateSessionStatus = mutation({
  args: {
    sessionId: v.id("coachingSessions"),
    status: v.union(
      v.literal("SCHEDULED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
      v.literal("NO_SHOW")
    ),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const identity = await requireAuth(ctx);
      const session = await ctx.db.get(args.sessionId);
      if (!session) return { success: false, error: "Session not found" };
      // Only coach or student can update status
      if (session.coachId !== identity.subject && session.studentId !== identity.subject) {
        return { success: false, error: "Not authorized" };
      }
      const updates: Record<string, any> = { status: args.status };
      if (args.notes !== undefined) {
        updates.notes = args.notes;
      }
      await ctx.db.patch(args.sessionId, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const getStudentSessions = query({
  args: {
    studentId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      _creationTime: v.number(),
      productId: v.id("digitalProducts"),
      productTitle: v.string(),
      coachId: v.string(),
      coachName: v.optional(v.string()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      status: v.string(),
      notes: v.optional(v.string()),
      totalCost: v.number(),
      discordChannelId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(1000);

    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const product = await ctx.db.get(session.productId);
        const store = product?.storeId
          ? await ctx.db
              .query("stores")
              .filter((q) => q.eq(q.field("_id"), product.storeId))
              .first()
          : null;

        return {
          _id: session._id,
          _creationTime: session._creationTime,
          productId: session.productId,
          productTitle: product?.title || "Coaching Session",
          coachId: session.coachId,
          coachName: store?.name,
          storeName: store?.name,
          storeSlug: store?.slug,
          scheduledDate: session.scheduledDate,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          status: session.status,
          notes: session.notes,
          totalCost: session.totalCost,
          discordChannelId: session.discordChannelId,
        };
      })
    );

    return enriched.sort((a, b) => b.scheduledDate - a.scheduledDate);
  },
});

export const getCoachSessionStats = query({
  args: { coachId: v.string() },
  returns: v.object({
    total: v.number(),
    upcoming: v.number(),
    completed: v.number(),
    cancelled: v.number(),
    revenue: v.number(),
  }),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_coachId", (q) => q.eq("coachId", args.coachId))
      .take(1000);

    const now = Date.now();
    return {
      total: sessions.length,
      upcoming: sessions.filter((s) => s.status === "SCHEDULED" && s.scheduledDate > now).length,
      completed: sessions.filter((s) => s.status === "COMPLETED").length,
      cancelled: sessions.filter((s) => s.status === "CANCELLED").length,
      revenue: sessions
        .filter((s) => s.status === "COMPLETED")
        .reduce((sum, s) => sum + s.totalCost, 0),
    };
  },
});

// ==================== AVAILABILITY QUERIES ====================

// Get available time slots for a coaching product on a specific date
export const getAvailableSlots = query({
  args: {
    productId: v.id("digitalProducts"),
    date: v.number(),
  },
  returns: v.array(
    v.object({
      start: v.string(),
      end: v.string(),
      available: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    const availability = (product as any).availability;
    if (!availability?.weekSchedule?.schedule) return [];

    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    const daySchedule = availability.weekSchedule.schedule.find(
      (d: any) => d.day === dayOfWeek && d.enabled
    );

    if (!daySchedule || !daySchedule.timeSlots) return [];

    const existingSessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(1000);

    const dateStart = new Date(args.date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(args.date);
    dateEnd.setHours(23, 59, 59, 999);

    const bookedSlots = existingSessions.filter((s) => {
      return (
        s.scheduledDate >= dateStart.getTime() &&
        s.scheduledDate <= dateEnd.getTime() &&
        s.status !== "CANCELLED"
      );
    });

    return daySchedule.timeSlots.map((slot: any) => {
      const isBooked = bookedSlots.some((s) => s.startTime === slot.start);
      return {
        start: slot.start,
        end: slot.end,
        available: slot.available && !isBooked,
      };
    });
  },
});

// Get booked sessions for a date range (for calendar display)
export const getBookedSessions = query({
  args: {
    productId: v.id("digitalProducts"),
    startDate: v.number(),
    endDate: v.number(),
  },
  returns: v.array(
    v.object({
      date: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(1000);

    return sessions
      .filter(
        (s) =>
          s.scheduledDate >= args.startDate &&
          s.scheduledDate <= args.endDate &&
          s.status !== "CANCELLED"
      )
      .map((s) => ({
        date: s.scheduledDate,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
  },
});

// Get coaching product with full details for booking page
export const getCoachingProductForBooking = query({
  args: { productId: v.id("digitalProducts") },
  returns: v.union(
    v.object({
      _id: v.id("digitalProducts"),
      title: v.string(),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
      deliverables: v.optional(v.string()),
      availability: v.optional(v.any()),
      discordRequired: v.optional(v.boolean()),
      pricingModel: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || !product.isPublished) return null;
    if ((product as any).productType !== "coaching") return null;

    return {
      _id: product._id,
      title: product.title,
      slug: (product as any).slug,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      userId: product.userId,
      duration: (product as any).duration,
      sessionType: (product as any).sessionType,
      deliverables: (product as any).deliverables,
      availability: (product as any).availability,
      discordRequired: (product as any).discordConfig?.requireDiscord ?? true,
      pricingModel: (product as any).pricingModel,
    };
  },
});

// Get coaching product by slug (for SEO-friendly URLs)
export const getCoachingProductBySlug = query({
  args: {
    storeId: v.string(),
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("digitalProducts"),
      title: v.string(),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
      deliverables: v.optional(v.string()),
      availability: v.optional(v.any()),
      discordRequired: v.optional(v.boolean()),
      pricingModel: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("digitalProducts")
      .withIndex("by_storeId_and_slug", (q) => q.eq("storeId", args.storeId).eq("slug", args.slug))
      .unique();

    if (!product || !product.isPublished) return null;
    if ((product as any).productType !== "coaching") return null;

    return {
      _id: product._id,
      title: product.title,
      slug: (product as any).slug,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      userId: product.userId,
      duration: (product as any).duration,
      sessionType: (product as any).sessionType,
      deliverables: (product as any).deliverables,
      availability: (product as any).availability,
      discordRequired: (product as any).discordConfig?.requireDiscord ?? true,
      pricingModel: (product as any).pricingModel,
    };
  },
});

// Get coaching product by global slug (for marketplace URLs without storeId)
export const getCoachingProductByGlobalSlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("digitalProducts"),
      title: v.string(),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.number(),
      imageUrl: v.optional(v.string()),
      storeId: v.string(),
      userId: v.string(),
      duration: v.optional(v.number()),
      sessionType: v.optional(v.string()),
      deliverables: v.optional(v.string()),
      availability: v.optional(v.any()),
      discordRequired: v.optional(v.boolean()),
      pricingModel: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("digitalProducts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!product || !product.isPublished) return null;
    if ((product as any).productType !== "coaching") return null;

    return {
      _id: product._id,
      title: product.title,
      slug: (product as any).slug,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      userId: product.userId,
      duration: (product as any).duration,
      sessionType: (product as any).sessionType,
      deliverables: (product as any).deliverables,
      availability: (product as any).availability,
      discordRequired: (product as any).discordConfig?.requireDiscord ?? true,
      pricingModel: (product as any).pricingModel,
    };
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

// Backfill slugs for existing coaching products that don't have them
export const backfillCoachingSlugs = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    // Admin-only migration
    const identity = await requireAuth(ctx);
    const callingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!callingUser?.admin) throw new Error("Admin access required");

    const products = await ctx.db.query("digitalProducts").take(10000);

    const coachingProducts = products.filter(
      (p) => (p as any).productType === "coaching" && !(p as any).slug
    );

    let updated = 0;
    let skipped = 0;

    for (const product of coachingProducts) {
      const store = await ctx.db
        .query("stores")
        .filter((q) => q.eq(q.field("_id"), product.storeId))
        .first();

      const storeName = store?.name || "coach";
      const baseSlug = generateSlug(`${product.title}-${storeName}`);

      const existing = await ctx.db
        .query("digitalProducts")
        .withIndex("by_slug", (q) => q.eq("slug", baseSlug))
        .first();

      if (existing && existing._id !== product._id) {
        const slug = `${baseSlug}-${Date.now()}`;
        await ctx.db.patch(product._id, { slug } as any);
        updated++;
      } else {
        await ctx.db.patch(product._id, { slug: baseSlug } as any);
        updated++;
      }
    }

    skipped = products.filter(
      (p) => (p as any).productType === "coaching" && (p as any).slug
    ).length;

    return { updated, skipped };
  },
});
