import { v } from "convex/values";
import { internalQuery, internalMutation, query, mutation } from "./_generated/server";

// ==================== QUERIES ====================

// Get sessions that need Discord setup (starting in ~2 hours, not yet set up)
export const getSessionsNeedingSetup = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      sessionPlatform: v.optional(v.string()),
      discordSetupComplete: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const twoHoursFromNow = now + 2 * 60 * 60 * 1000; // 2 hours
    const threeHoursFromNow = now + 3 * 60 * 60 * 1000; // 3 hours buffer

    // Get all scheduled sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .take(500);

    // Filter for Discord sessions starting in 2-3 hours that haven't been set up
    return sessions.filter((session) => {
      const platform = session.sessionPlatform;
      if (platform !== "discord") return false; // Only Discord needs setup

      const sessionTime = session.scheduledDate;
      const notSetUp = !session.discordSetupComplete;
      const inTimeWindow = sessionTime >= twoHoursFromNow && sessionTime <= threeHoursFromNow;

      return notSetUp && inTimeWindow;
    });
  },
});

// Get sessions that need cleanup (ended >1 hour ago, not yet cleaned)
export const getSessionsNeedingCleanup = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      endTime: v.string(),
      discordChannelId: v.optional(v.string()),
      discordRoleId: v.optional(v.string()),
      discordSetupComplete: v.optional(v.boolean()),
      discordCleanedUp: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - 1 * 60 * 60 * 1000; // 1 hour ago

    // Get completed or in-progress sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "COMPLETED"),
          q.eq(q.field("status"), "IN_PROGRESS")
        )
      )
      .take(500);

    // Filter for sessions that ended >1 hour ago and haven't been cleaned
    return sessions.filter((session) => {
      // Parse end time and add to scheduled date
      const [hours, minutes] = session.endTime.split(":").map(Number);
      const sessionEndTime = session.scheduledDate + (hours * 60 + minutes) * 60 * 1000;

      const hasDiscordResources = session.discordChannelId && session.discordRoleId;
      const notCleaned = !session.discordCleanedUp;
      const pastEndTime = sessionEndTime < oneHourAgo;

      return hasDiscordResources && notCleaned && pastEndTime;
    });
  },
});

// Get guild info for a session
export const getSessionGuildInfo = internalQuery({
  args: { coachId: v.string() },
  returns: v.union(
    v.object({
      guildId: v.string(),
      botToken: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get coach's store by userId (clerkId)
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.coachId))
      .first();

    if (!store) return null;

    // Get store's Discord guild
    const guild = await ctx.db
      .query("discordGuilds")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .first();

    if (!guild || !guild.isActive) return null;

    return {
      guildId: guild.guildId,
      botToken: guild.botToken,
    };
  },
});

// ==================== MUTATIONS ====================

export const markSessionSetupComplete = internalMutation({
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

export const markSessionCleanedUp = internalMutation({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      discordCleanedUp: true,
    });
    return null;
  },
});

// Get sessions that need reminder notifications (starting in 24h or 1h, not yet reminded)
export const getSessionsNeedingReminders = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      totalCost: v.number(),
      reminderSent: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourFromNow = now + 1 * 60 * 60 * 1000; // 1 hour
    const twentyFourHoursFromNow = now + 24 * 60 * 60 * 1000; // 24 hours

    // Get all scheduled sessions
    const sessions = await ctx.db
      .query("coachingSessions")
      .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
      .take(500);

    // Filter for sessions that need reminders
    return sessions.filter((session) => {
      const sessionTime = session.scheduledDate;
      const notReminded = !session.reminderSent;

      // Sessions starting in ~1 hour or ~24 hours
      const isOneHourReminder = sessionTime >= now && sessionTime <= oneHourFromNow;
      const isTwentyFourHourReminder =
        sessionTime >= twentyFourHoursFromNow - (30 * 60 * 1000) &&
        sessionTime <= twentyFourHoursFromNow + (30 * 60 * 1000);

      return notReminded && (isOneHourReminder || isTwentyFourHourReminder);
    });
  },
});

// Mark session reminder as sent
export const markReminderSent = mutation({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      reminderSent: true,
    });
    return null;
  },
});

// ==================== PAYMENT HELPERS ====================

// Get session data needed for payment operations (used by coachingPayments actions)
export const getSessionForPayment = internalQuery({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.union(
    v.object({
      _id: v.id("coachingSessions"),
      coachId: v.string(),
      studentId: v.string(),
      totalCost: v.number(),
      paymentStatus: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeTransferId: v.optional(v.string()),
      coachStripeAccountId: v.optional(v.string()),
      status: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    return {
      _id: session._id,
      coachId: session.coachId,
      studentId: session.studentId,
      totalCost: session.totalCost,
      paymentStatus: session.paymentStatus,
      stripePaymentIntentId: session.stripePaymentIntentId,
      stripeTransferId: session.stripeTransferId,
      coachStripeAccountId: session.coachStripeAccountId,
      status: session.status,
    };
  },
});

// Update payment status on a session (used by coachingPayments actions)
export const updatePaymentStatus = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    paymentStatus: v.string(),
    stripeTransferId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {
      paymentStatus: args.paymentStatus,
    };
    if (args.stripeTransferId) {
      patch.stripeTransferId = args.stripeTransferId;
    }
    await ctx.db.patch(args.sessionId, patch);
    return null;
  },
});

// ==================== CONFIRMATION HELPERS ====================

// Get sessions that need confirmation requests (session ended, no confirmation requested yet)
export const getSessionsNeedingConfirmation = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      totalCost: v.number(),
      confirmationRequestedAt: v.optional(v.number()),
      coachConfirmed: v.optional(v.boolean()),
      studentConfirmed: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();

    // Get all SCHEDULED sessions (that have passed their end time)
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_status", (q) => q.eq("status", "SCHEDULED"))
      .take(500);

    return sessions.filter((session) => {
      // Parse end time and check if session has ended
      const [hours, minutes] = session.endTime.split(":").map(Number);
      const sessionDate = new Date(session.scheduledDate);
      sessionDate.setHours(hours, minutes, 0, 0);
      const sessionEndTime = sessionDate.getTime();

      // Session must have ended and confirmation not yet requested
      return sessionEndTime < now && !session.confirmationRequestedAt;
    });
  },
});

// Get sessions past their confirmation deadline
export const getSessionsPastDeadline = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      totalCost: v.number(),
      confirmationDeadline: v.optional(v.number()),
      coachConfirmed: v.optional(v.boolean()),
      studentConfirmed: v.optional(v.boolean()),
      paymentStatus: v.optional(v.string()),
      coachStripeAccountId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();

    // Get CONFIRMED sessions that have a confirmation deadline
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_status", (q) => q.eq("status", "CONFIRMED"))
      .take(500);

    return sessions.filter((session) => {
      return session.confirmationDeadline && session.confirmationDeadline < now;
    });
  },
});

// Update session status and confirmation fields
export const updateSessionConfirmation = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    status: v.optional(v.string()),
    coachConfirmed: v.optional(v.boolean()),
    studentConfirmed: v.optional(v.boolean()),
    confirmationRequestedAt: v.optional(v.number()),
    confirmationDeadline: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { sessionId, ...fields } = args;
    const patch: Record<string, any> = {};
    if (fields.status !== undefined) patch.status = fields.status;
    if (fields.coachConfirmed !== undefined) patch.coachConfirmed = fields.coachConfirmed;
    if (fields.studentConfirmed !== undefined) patch.studentConfirmed = fields.studentConfirmed;
    if (fields.confirmationRequestedAt !== undefined) patch.confirmationRequestedAt = fields.confirmationRequestedAt;
    if (fields.confirmationDeadline !== undefined) patch.confirmationDeadline = fields.confirmationDeadline;
    await ctx.db.patch(sessionId, patch);
    return null;
  },
});

// ==================== ENHANCED REMINDER HELPERS ====================

// Get sessions needing 24h, 1h, or start-time reminders
export const getSessionsNeedingEnhancedReminders = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      totalCost: v.number(),
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      reminder24hSent: v.optional(v.boolean()),
      reminder1hSent: v.optional(v.boolean()),
      reminderStartSent: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFiveHoursFromNow = now + 25 * 60 * 60 * 1000;

    // Get scheduled sessions within the next ~25 hours
    const sessions = await ctx.db
      .query("coachingSessions")
      .withIndex("by_status", (q) => q.eq("status", "SCHEDULED"))
      .take(500);

    return sessions.filter((session) => {
      const sessionTime = session.scheduledDate;
      // Only sessions in the next 25 hours that still have reminders to send
      if (sessionTime > twentyFiveHoursFromNow || sessionTime < now - 30 * 60 * 1000) return false;
      // Has at least one unsent reminder
      return !session.reminder24hSent || !session.reminder1hSent || !session.reminderStartSent;
    });
  },
});

// Mark specific reminder as sent
export const markEnhancedReminderSent = internalMutation({
  args: {
    sessionId: v.id("coachingSessions"),
    reminderType: v.union(v.literal("24h"), v.literal("1h"), v.literal("start")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const field = args.reminderType === "24h"
      ? "reminder24hSent"
      : args.reminderType === "1h"
        ? "reminder1hSent"
        : "reminderStartSent";
    await ctx.db.patch(args.sessionId, { [field]: true });
    return null;
  },
});

// ==================== USER-FACING CONFIRMATION MUTATIONS ====================

// Coach or student confirms a session happened
export const confirmSession = mutation({
  args: {
    sessionId: v.id("coachingSessions"),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { success: false, error: "Session not found" };

    if (session.status !== "CONFIRMED" && session.status !== "SCHEDULED") {
      return { success: false, error: `Cannot confirm session with status "${session.status}"` };
    }

    const isCoach = args.userId === session.coachId;
    const isStudent = args.userId === session.studentId;

    if (!isCoach && !isStudent) {
      return { success: false, error: "You are not a participant of this session" };
    }

    const patch: Record<string, any> = {};
    if (isCoach) patch.coachConfirmed = true;
    if (isStudent) patch.studentConfirmed = true;

    await ctx.db.patch(args.sessionId, patch);

    // Check if both have now confirmed → auto-complete
    const updatedCoachConfirmed = isCoach ? true : session.coachConfirmed;
    const updatedStudentConfirmed = isStudent ? true : session.studentConfirmed;

    if (updatedCoachConfirmed && updatedStudentConfirmed) {
      await ctx.db.patch(args.sessionId, { status: "COMPLETED" });
      // Payment release will be handled by the cron or can be triggered here via scheduler
      const { internal } = await import("./_generated/api");
      await ctx.scheduler.runAfter(0, internal.coachingPayments.releasePaymentToCreator, {
        sessionId: args.sessionId,
      });
    }

    return { success: true };
  },
});

// Report a no-show
export const reportNoShow = mutation({
  args: {
    sessionId: v.id("coachingSessions"),
    userId: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return { success: false, error: "Session not found" };

    if (session.status !== "CONFIRMED" && session.status !== "SCHEDULED") {
      return { success: false, error: `Cannot report no-show for session with status "${session.status}"` };
    }

    const isCoach = args.userId === session.coachId;
    const isStudent = args.userId === session.studentId;

    if (!isCoach && !isStudent) {
      return { success: false, error: "You are not a participant of this session" };
    }

    if (isStudent) {
      // Student reports coach no-show
      await ctx.db.patch(args.sessionId, {
        studentConfirmed: false,
        noShowReportedBy: "student",
        status: "NO_SHOW_CREATOR",
      });
      // Trigger refund
      const { internal } = await import("./_generated/api");
      await ctx.scheduler.runAfter(0, internal.coachingPayments.refundStudentPayment, {
        sessionId: args.sessionId,
        reason: "coach_no_show_reported_by_student",
      });
      // Increment coach no-show count
      await ctx.scheduler.runAfter(0, internal.coachingConfirmation.incrementCoachNoShow, {
        coachId: session.coachId,
      });
    } else {
      // Coach reports student no-show
      await ctx.db.patch(args.sessionId, {
        coachConfirmed: false,
        noShowReportedBy: "coach",
        status: "NO_SHOW_BUYER",
      });
      // Release payment to coach (they held the time)
      const { internal } = await import("./_generated/api");
      await ctx.scheduler.runAfter(0, internal.coachingPayments.releasePaymentToCreator, {
        sessionId: args.sessionId,
      });
    }

    return { success: true };
  },
});

// ==================== HELPERS FOR CONFIRMATION ACTIONS ====================

// Look up user by Clerk ID (used by coachingConfirmation actions)
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      firstName: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      firstName: user.firstName,
      email: user.email,
    };
  },
});

// Get product by ID (used by coachingConfirmation actions)
export const getProduct = internalQuery({
  args: { productId: v.id("digitalProducts") },
  returns: v.union(
    v.object({ title: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return { title: product.title };
  },
});

// Increment coach no-show count — returns new count for email logic
export const incrementCoachNoShowMutation = internalMutation({
  args: { coachId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.coachId))
      .unique();

    if (!user) return 0;

    const currentCount = (user as any).coachNoShowCount || 0;
    const newCount = currentCount + 1;

    const patch: Record<string, any> = { coachNoShowCount: newCount };

    // Disable coaching after 2 no-shows
    if (newCount >= 2) {
      patch.coachingDisabled = true;
      patch.coachingDisabledAt = Date.now();
      console.log(`Coach ${args.coachId} disabled after ${newCount} no-shows`);
    }

    await ctx.db.patch(user._id, patch);
    return newCount;
  },
});

// Increment student no-show count (for tracking only, no auto-disable)
export const incrementStudentNoShowMutation = internalMutation({
  args: { studentId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.studentId))
      .unique();

    if (!user) return 0;

    const currentCount = (user as any).studentNoShowCount || 0;
    const newCount = currentCount + 1;

    await ctx.db.patch(user._id, { studentNoShowCount: newCount } as any);
    return newCount;
  },
});

// Get session info for no-show email templates
export const getSessionForEmail = internalQuery({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.union(
    v.object({
      productTitle: v.optional(v.string()),
      studentName: v.optional(v.string()),
      scheduledDate: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const product = await ctx.db.get(session.productId);
    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", session.studentId))
      .first();

    return {
      productTitle: product?.title,
      studentName: student?.name,
      scheduledDate: session.scheduledDate,
    };
  },
});

// ==================== BOOKING CONFIRMATION QUERIES ====================

// Get a coaching session ID by Stripe payment intent ID
export const getSessionByPaymentIntent = query({
  args: { paymentIntentId: v.string() },
  returns: v.union(v.id("coachingSessions"), v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("coachingSessions")
      .withIndex("by_stripePaymentIntentId", (q) =>
        q.eq("stripePaymentIntentId", args.paymentIntentId)
      )
      .first();
    return session?._id ?? null;
  },
});

// Get a coaching session with full details for the confirmation page
export const getSessionForConfirmation = query({
  args: { sessionId: v.id("coachingSessions") },
  returns: v.union(
    v.object({
      _id: v.id("coachingSessions"),
      productId: v.id("digitalProducts"),
      coachId: v.string(),
      studentId: v.string(),
      scheduledDate: v.number(),
      startTime: v.string(),
      endTime: v.string(),
      duration: v.number(),
      status: v.string(),
      notes: v.optional(v.string()),
      totalCost: v.number(),
      sessionPlatform: v.optional(v.string()),
      sessionLink: v.optional(v.string()),
      sessionPhone: v.optional(v.string()),
      // Enriched fields
      productTitle: v.string(),
      coachName: v.optional(v.string()),
      coachEmail: v.optional(v.string()),
      studentName: v.optional(v.string()),
      studentEmail: v.optional(v.string()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const product = await ctx.db.get(session.productId);
    const coach = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", session.coachId))
      .first();
    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", session.studentId))
      .first();
    const store = product?.storeId
      ? await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("_id"), product.storeId))
          .first()
      : null;

    return {
      _id: session._id,
      productId: session.productId,
      coachId: session.coachId,
      studentId: session.studentId,
      scheduledDate: session.scheduledDate,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
      notes: session.notes,
      totalCost: session.totalCost,
      sessionPlatform: session.sessionPlatform,
      sessionLink: session.sessionLink,
      sessionPhone: session.sessionPhone,
      productTitle: product?.title || "Coaching Session",
      coachName: coach?.name || coach?.firstName,
      coachEmail: coach?.email,
      studentName: student?.name || student?.firstName,
      studentEmail: student?.email,
      storeName: store?.name,
      storeSlug: store?.slug,
    };
  },
});

