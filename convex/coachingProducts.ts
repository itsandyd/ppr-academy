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
    sessionPlatform: v.optional(v.string()), // "zoom" | "google_meet" | "discord" | etc.
    sessionLink: v.optional(v.string()),
    sessionPhone: v.optional(v.string()),
    lateCancellationFeePercent: v.optional(v.number()),
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
        sessionPlatform: args.sessionPlatform,
        sessionLink: args.sessionLink,
        sessionPhone: args.sessionPhone,
        lateCancellationFeePercent: args.lateCancellationFeePercent,
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
    sessionPlatform: v.optional(v.string()),
    sessionLink: v.optional(v.string()),
    sessionPhone: v.optional(v.string()),
    lateCancellationFeePercent: v.optional(v.number()),
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
      const sessionPlatform = (product as any).sessionPlatform || "zoom";

      // Check if user has Discord connected (only required for Discord-based sessions)
      if (sessionPlatform === "discord") {
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
        sessionPlatform,
        sessionLink: (product as any).sessionLink,
        sessionPhone: (product as any).sessionPhone,
        discordSetupComplete: false,
        reminderSent: false,
        paymentStatus: "held",
      });

      // Schedule Discord setup only for Discord-based sessions
      if (sessionPlatform === "discord") {
        await ctx.scheduler.runAfter(0, internal.coachingDiscordActions.setupDiscordForSession, {
          sessionId,
          coachId,
          studentId,
          productId: args.productId,
        });
      }

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
          coachEmail: coach.email,
          sessionDate,
          sessionTime: args.startTime,
          scheduledTimestamp: args.scheduledDate,
          duration,
          sessionPlatform,
          sessionLink: (product as any).sessionLink,
          sessionPhone: (product as any).sessionPhone,
          notes: args.notes,
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
          scheduledTimestamp: args.scheduledDate,
          duration,
          amount: product.price,
          notes: args.notes,
          sessionPlatform,
          sessionLink: (product as any).sessionLink,
          sessionPhone: (product as any).sessionPhone,
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
      const sessionPlatform = (product as any).sessionPlatform || "zoom";

      // Check Discord connection only for Discord-based sessions
      if (sessionPlatform === "discord") {
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
        sessionPlatform,
        sessionLink: (product as any).sessionLink,
        sessionPhone: (product as any).sessionPhone,
        discordSetupComplete: false,
        reminderSent: false,
        paymentStatus: "held",
      });

      // Schedule Discord setup only for Discord-based sessions
      if (sessionPlatform === "discord") {
        await ctx.scheduler.runAfter(0, internal.coachingDiscordActions.setupDiscordForSession, {
          sessionId,
          coachId,
          studentId,
          productId: args.productId,
        });
      }

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
          coachEmail: coach.email,
          sessionDate,
          sessionTime: args.startTime,
          scheduledTimestamp: args.scheduledDate,
          duration,
          sessionPlatform,
          sessionLink: (product as any).sessionLink,
          sessionPhone: (product as any).sessionPhone,
          notes: args.notes,
        });

        await ctx.scheduler.runAfter(0, internal.coachingEmails.sendNewBookingNotificationEmail, {
          coachName,
          coachEmail: coach.email,
          studentName,
          studentEmail: student.email,
          sessionTitle: product.title,
          sessionDate,
          sessionTime: args.startTime,
          scheduledTimestamp: args.scheduledDate,
          duration,
          amount: product.price,
          notes: args.notes,
          sessionPlatform,
          sessionLink: (product as any).sessionLink,
          sessionPhone: (product as any).sessionPhone,
        });

        // Schedule Google Calendar event creation if coach has connected their calendar
        const meetingLink = (product as any).sessionLink;
        await ctx.scheduler.runAfter(0, internal.googleCalendarActions.createCalendarEvent, {
          coachId,
          sessionId,
          title: `Coaching: ${product.title} with ${studentName}`,
          description: `${duration}-minute coaching session with ${studentName} (${student.email}).\n\n${args.notes ? `Notes: ${args.notes}\n\n` : ""}${meetingLink ? `Join: ${meetingLink}` : ""}`,
          startTime: args.scheduledDate,
          durationMinutes: duration,
          location: meetingLink,
          attendeeEmail: student.email,
        });
      }

      return { success: true, sessionId };
    } catch (error: any) {
      console.error("Error booking coaching session:", error);
      return { success: false, error: error.message };
    }
  },
});

// Store Stripe payment info on a coaching session (called from webhook after checkout)
export const storePaymentInfo = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    stripePaymentIntentId: v.string(),
    coachStripeAccountId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      stripePaymentIntentId: args.stripePaymentIntentId,
      paymentStatus: "held",
      ...(args.coachStripeAccountId && { coachStripeAccountId: args.coachStripeAccountId }),
    });
    return null;
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
      paymentStatus: v.optional(v.string()),
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      coachConfirmed: v.optional(v.boolean()),
      studentConfirmed: v.optional(v.boolean()),
      confirmationDeadline: v.optional(v.number()),
      review: v.optional(v.object({
        rating: v.number(),
        reviewText: v.optional(v.string()),
      })),
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

        const review = await ctx.db
          .query("coachingReviews")
          .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
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
          paymentStatus: session.paymentStatus,
          sessionPlatform: session.sessionPlatform,
          sessionLink: session.sessionLink,
          sessionPhone: session.sessionPhone,
          coachConfirmed: session.coachConfirmed,
          studentConfirmed: session.studentConfirmed,
          confirmationDeadline: session.confirmationDeadline,
          review: review ? { rating: review.rating, reviewText: review.reviewText } : undefined,
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
      paymentStatus: v.optional(v.string()),
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      coachConfirmed: v.optional(v.boolean()),
      studentConfirmed: v.optional(v.boolean()),
      confirmationDeadline: v.optional(v.number()),
      cancelledBy: v.optional(v.string()),
      cancelledAt: v.optional(v.number()),
      review: v.optional(v.object({
        rating: v.number(),
        reviewText: v.optional(v.string()),
      })),
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

        const review = await ctx.db
          .query("coachingReviews")
          .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
          .first();

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
          paymentStatus: session.paymentStatus,
          sessionPlatform: session.sessionPlatform,
          sessionLink: session.sessionLink,
          sessionPhone: session.sessionPhone,
          coachConfirmed: session.coachConfirmed,
          studentConfirmed: session.studentConfirmed,
          confirmationDeadline: session.confirmationDeadline,
          cancelledBy: session.cancelledBy,
          cancelledAt: session.cancelledAt,
          review: review ? { rating: review.rating, reviewText: review.reviewText } : undefined,
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
    averageRating: v.number(),
    reviewCount: v.number(),
    pendingRevenue: v.number(),
    releasedRevenue: v.number(),
  }),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_coachId", (q) => q.eq("coachId", args.coachId))
      .take(1000);

    const reviews = await ctx.db
      .query("coachingReviews")
      .withIndex("by_coachId", (q) => q.eq("coachId", args.coachId))
      .take(1000);

    const now = Date.now();
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      total: sessions.length,
      upcoming: sessions.filter((s) => s.status === "SCHEDULED" && s.scheduledDate > now).length,
      completed: sessions.filter((s) => s.status === "COMPLETED").length,
      cancelled: sessions.filter((s) => s.status === "CANCELLED").length,
      revenue: sessions
        .filter((s) => s.status === "COMPLETED")
        .reduce((sum, s) => sum + s.totalCost, 0),
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      pendingRevenue: sessions
        .filter((s) => s.paymentStatus === "held")
        .reduce((sum, s) => sum + s.totalCost, 0),
      releasedRevenue: sessions
        .filter((s) => s.paymentStatus === "released")
        .reduce((sum, s) => sum + s.totalCost, 0),
    };
  },
});

// ==================== AVAILABILITY QUERIES ====================

/**
 * Get available time slots for a coaching product on a specific date.
 *
 * This query applies all availability constraints:
 * 1. Weekly schedule (which days, which time windows)
 * 2. Date overrides (blocked dates, extra availability)
 * 3. Existing bookings (no double-booking)
 * 4. Buffer time between sessions
 * 5. Minimum scheduling notice
 * 6. Maximum advance booking window
 * 7. Daily booking cap
 *
 * Returns discrete bookable slots derived from the creator's time windows
 * and the requested session duration.
 */
export const getAvailableSlots = query({
  args: {
    productId: v.id("digitalProducts"),
    date: v.number(), // timestamp of the target date
    duration: v.optional(v.number()), // requested session duration (minutes)
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

    const weekSchedule = availability.weekSchedule;
    const dateOverrides: Array<{
      date: string;
      available: boolean;
      timeWindows?: Array<{ start: string; end: string }>;
    }> = availability.dateOverrides || [];
    const sessionDurations: number[] = availability.sessionDurations || [(product as any).duration || 60];
    const bufferTime: number = availability.bufferTime ?? 15;
    const maxBookingsPerDay: number = availability.maxBookingsPerDay ?? 99;
    const minNoticeHours: number = availability.minNoticeHours ?? 24;
    const advanceBookingDays: number = availability.advanceBookingDays ?? 30;

    const requestedDuration = args.duration || sessionDurations[0] || 60;

    // --- Date boundaries ---
    const dateObj = new Date(args.date);
    const dateStr = dateObj.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const now = Date.now();

    // Check: is the date within the advance booking window?
    const maxAdvanceMs = advanceBookingDays * 24 * 60 * 60 * 1000;
    if (args.date > now + maxAdvanceMs) return [];

    // Check: is the date in the past?
    const dateStart = new Date(args.date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(args.date);
    dateEnd.setHours(23, 59, 59, 999);
    if (dateEnd.getTime() < now) return [];

    // --- Determine time windows for this date ---
    // First check date overrides
    const override = dateOverrides.find((o: any) => o.date === dateStr);
    let timeWindows: Array<{ start: string; end: string }> = [];

    if (override) {
      if (!override.available) {
        // Date is blocked
        return [];
      }
      // Use override's time windows
      timeWindows = override.timeWindows || [];
    } else {
      // Fall back to weekly schedule
      const dayOfWeek = dateObj
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      const daySchedule = weekSchedule.schedule.find(
        (d: any) => d.day === dayOfWeek && d.enabled
      );

      if (!daySchedule) return [];

      // Support both new timeWindows and legacy timeSlots
      timeWindows =
        daySchedule.timeWindows && daySchedule.timeWindows.length > 0
          ? daySchedule.timeWindows
          : (daySchedule.timeSlots || []).map((s: any) => ({
              start: s.start,
              end: s.end,
            }));
    }

    if (timeWindows.length === 0) return [];

    // --- Get existing bookings for this date ---
    const existingSessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(1000);

    const dayBookings = existingSessions.filter((s) => {
      return (
        s.scheduledDate >= dateStart.getTime() &&
        s.scheduledDate <= dateEnd.getTime() &&
        s.status !== "CANCELLED"
      );
    });

    // Check daily booking cap
    if (dayBookings.length >= maxBookingsPerDay) {
      // All slots unavailable due to daily cap
      return timeWindows.flatMap((w: any) => {
        const slots = generateSlots(w.start, w.end, requestedDuration);
        return slots.map((s) => ({ ...s, available: false }));
      });
    }

    // --- Get Google Calendar busy times (from cache) ---
    const coachId = product.userId;
    const calendarCache = await ctx.db
      .query("googleCalendarCache")
      .withIndex("by_userId", (q) => q.eq("userId", coachId))
      .first();

    // Only use cache if it's fresh (10 min TTL) and covers this date
    const CACHE_TTL_MS = 10 * 60 * 1000;
    const googleBusyPeriods: Array<{ start: number; end: number }> =
      calendarCache &&
      now - calendarCache.cachedAt < CACHE_TTL_MS &&
      calendarCache.dateRangeStart <= dateStart.getTime() &&
      calendarCache.dateRangeEnd >= dateEnd.getTime()
        ? calendarCache.busyPeriods.filter(
            (p) => p.end > dateStart.getTime() && p.start < dateEnd.getTime()
          )
        : [];

    // --- Generate discrete slots from time windows ---
    const allSlots: Array<{ start: string; end: string; available: boolean }> = [];

    for (const window of timeWindows) {
      const slots = generateSlots(window.start, window.end, requestedDuration);

      for (const slot of slots) {
        // Check minimum notice
        const slotStartMinutes =
          parseInt(slot.start.split(":")[0]) * 60 +
          parseInt(slot.start.split(":")[1]);
        const slotTimestamp = dateStart.getTime() + slotStartMinutes * 60 * 1000;
        const minNoticeMs = minNoticeHours * 60 * 60 * 1000;

        if (slotTimestamp < now + minNoticeMs) {
          allSlots.push({ ...slot, available: false });
          continue;
        }

        // Check overlap with existing bookings (including buffer)
        const isBookingConflict = dayBookings.some((booking) => {
          const bookingStartMin = timeToMinutes(booking.startTime);
          const bookingEndMin = timeToMinutes(booking.endTime);
          const slotStartMin = timeToMinutes(slot.start);
          const slotEndMin = timeToMinutes(slot.end);

          // Add buffer on both sides of existing booking
          const bufferedBookingStart = bookingStartMin - bufferTime;
          const bufferedBookingEnd = bookingEndMin + bufferTime;

          // Check overlap
          return slotStartMin < bufferedBookingEnd && slotEndMin > bufferedBookingStart;
        });

        // Check overlap with Google Calendar busy times
        const slotEndMinutes =
          parseInt(slot.end.split(":")[0]) * 60 +
          parseInt(slot.end.split(":")[1]);
        const slotEndTimestamp = dateStart.getTime() + slotEndMinutes * 60 * 1000;

        const isGoogleConflict = googleBusyPeriods.some((busy) => {
          return slotTimestamp < busy.end && slotEndTimestamp > busy.start;
        });

        allSlots.push({ ...slot, available: !isBookingConflict && !isGoogleConflict });
      }
    }

    return allSlots;
  },
});

/** Convert "HH:MM" to minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to "HH:MM" */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Generate discrete bookable slots within a time window.
 * E.g., window 09:00-17:00 with 60-min sessions produces
 * 09:00-10:00, 10:00-11:00, ..., 16:00-17:00
 */
function generateSlots(
  windowStart: string,
  windowEnd: string,
  duration: number
): Array<{ start: string; end: string }> {
  const startMin = timeToMinutes(windowStart);
  const endMin = timeToMinutes(windowEnd);
  const slots: Array<{ start: string; end: string }> = [];

  let current = startMin;
  while (current + duration <= endMin) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + duration),
    });
    current += duration; // next slot starts at end of this one
  }

  return slots;
}

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
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      coachStripeAccountId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || !product.isPublished) return null;
    if ((product as any).productType !== "coaching") return null;

    // Get coach's Stripe Connect account ID
    const coach = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", product.userId))
      .first();

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
      sessionPlatform: (product as any).sessionPlatform,
      sessionLink: (product as any).sessionLink,
      sessionPhone: (product as any).sessionPhone,
      coachStripeAccountId: coach?.stripeConnectAccountId,
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
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      coachStripeAccountId: v.optional(v.string()),
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

    const coach = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", product.userId))
      .first();

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
      sessionPlatform: (product as any).sessionPlatform,
      sessionLink: (product as any).sessionLink,
      sessionPhone: (product as any).sessionPhone,
      coachStripeAccountId: coach?.stripeConnectAccountId,
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
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      coachStripeAccountId: v.optional(v.string()),
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

    const coach = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", product.userId))
      .first();

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
      sessionPlatform: (product as any).sessionPlatform,
      sessionLink: (product as any).sessionLink,
      sessionPhone: (product as any).sessionPhone,
      coachStripeAccountId: coach?.stripeConnectAccountId,
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
