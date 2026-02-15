import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================================================
// EMAIL MARKETING SYSTEM - Queries & Mutations (V8 Runtime)
// ============================================================================

/**
 * Debug: Count campaigns in resendCampaigns table
 */
export const debugCountCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("resendCampaigns").take(10000);
    return {
      count: campaigns.length,
      names: campaigns.slice(0, 5).map(c => c.name || c.subject || "unnamed"),
      ids: campaigns.slice(0, 5).map(c => c._id),
    };
  },
});

// ============================================================================
// ADMIN EMAIL SYSTEM (Simplified - uses environment variables)
// ============================================================================

/**
 * Get email analytics for admin (no connection required)
 * Calculates real metrics from resendLogs table
 */
export const getEmailAnalytics = query({
  args: { days: v.optional(v.number()) },
  returns: v.object({
    totalSent: v.number(),
    totalDelivered: v.number(),
    totalOpened: v.number(),
    totalClicked: v.number(),
    totalBounced: v.number(),
    totalComplaints: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
    deliveryRate: v.number(),
    clickToOpenRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const numDays = args.days || 30;
    const cutoffTime = Date.now() - numDays * 24 * 60 * 60 * 1000;

    // Query all email logs within the time range
    const allLogs = await ctx.db
      .query("resendLogs")
      .filter((q) => q.gte(q.field("sentAt"), cutoffTime))
      .take(10000);

    // Calculate metrics
    const totalSent = allLogs.length;
    const totalDelivered = allLogs.filter((l) =>
      l.status === "delivered" || l.status === "opened" || l.status === "clicked"
    ).length;
    const totalOpened = allLogs.filter((l) =>
      l.status === "opened" || l.status === "clicked"
    ).length;
    const totalClicked = allLogs.filter((l) => l.status === "clicked").length;
    const totalBounced = allLogs.filter((l) => l.status === "bounced").length;
    const totalComplaints = allLogs.filter((l) => l.status === "complained").length;

    // Calculate rates as percentages
    const openRate = totalDelivered > 0
      ? Math.round((totalOpened / totalDelivered) * 1000) / 10
      : 0;
    const clickRate = totalDelivered > 0
      ? Math.round((totalClicked / totalDelivered) * 1000) / 10
      : 0;
    const bounceRate = totalSent > 0
      ? Math.round((totalBounced / totalSent) * 1000) / 10
      : 0;
    const deliveryRate = totalSent > 0
      ? Math.round((totalDelivered / totalSent) * 1000) / 10
      : 0;
    const clickToOpenRate = totalOpened > 0
      ? Math.round((totalClicked / totalOpened) * 1000) / 10
      : 0;

    return {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      totalComplaints,
      openRate,
      clickRate,
      bounceRate,
      deliveryRate,
      clickToOpenRate,
    };
  },
});

/**
 * Get all campaigns (admin-wide)
 */
export const getCampaigns = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const campaigns = await ctx.db
      .query("resendCampaigns")
      .filter((q) => q.eq(q.field("connectionId"), undefined))
      .take(10000);
    return campaigns;
  },
});

/**
 * Debug campaign sending issues
 */
export const debugCampaign: any = query({
  args: { campaignId: v.id("resendCampaigns") },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      return { error: "Campaign not found" };
    }

    // Get recipients - explicit type annotation to avoid circular reference
    const recipients: any = await ctx.runQuery(internal.emailQueries.getCampaignRecipients, {
      campaignId: args.campaignId,
    });

    return {
      campaign: {
        name: campaign.name,
        status: campaign.status,
        targetAudience: campaign.targetAudience,
        customRecipients: campaign.customRecipients,
        templateId: campaign.templateId,
      },
      recipientCount: recipients.length,
      recipients: recipients.slice(0, 3), // First 3 recipients
      hasResendKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.FROM_EMAIL || "not set (will use default)",
      fromName: process.env.FROM_NAME || "not set (will use default)",
    };
  },
});

/**
 * Get all templates (admin-wide)
 */
export const getTemplates = query({
  args: { activeOnly: v.optional(v.boolean()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("resendTemplates")
      .filter((q) => q.eq(q.field("connectionId"), undefined))
      .take(500);

    if (args.activeOnly) {
      return templates.filter((t) => t.isActive);
    }

    return templates;
  },
});

/**
 * Create template (admin - no connection required)
 */
export const createTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    type: v.union(
      v.literal("welcome"),
      v.literal("launch"),
      v.literal("enrollment"),
      v.literal("progress_reminder"),
      v.literal("completion"),
      v.literal("certificate"),
      v.literal("new_course"),
      v.literal("re_engagement"),
      v.literal("weekly_digest"),
      v.literal("custom")
    ),
    htmlContent: v.string(),
    textContent: v.string(),
  },
  returns: v.id("resendTemplates"),
  handler: async (ctx, args) => {
    // Extract variables from HTML content
    const variableRegex = /\{([^}]+)\}/g;
    const variables = Array.from(args.htmlContent.matchAll(variableRegex))
      .map((match) => match[1])
      .filter((v, i, arr) => arr.indexOf(v) === i); // unique

    return await ctx.db.insert("resendTemplates", {
      // connectionId omitted for admin templates
      name: args.name,
      subject: args.subject,
      type: args.type,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      variables,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create or update campaign (admin - no connection required)
 * If campaignId is provided, updates the existing campaign
 */
export const createCampaign = mutation({
  args: {
    campaignId: v.optional(v.id("resendCampaigns")), // For updating existing campaigns
    name: v.string(),
    subject: v.string(),
    templateId: v.optional(v.id("resendTemplates")),
    htmlContent: v.optional(v.string()),
    textContent: v.optional(v.string()),
    audienceType: v.union(
      v.literal("all"),
      v.literal("enrolled"),
      v.literal("active"),
      v.literal("specific"),
      v.literal("creators")
    ),
    scheduledFor: v.optional(v.number()),
    specificUserIds: v.optional(v.array(v.id("users"))),
  },
  returns: v.id("resendCampaigns"),
  handler: async (ctx, args) => {
    // If campaignId provided, update existing campaign
    if (args.campaignId) {
      await ctx.db.patch(args.campaignId, {
        name: args.name,
        subject: args.subject,
        templateId: args.templateId,
        htmlContent: args.htmlContent,
        textContent: args.textContent,
        updatedAt: Date.now(),
      });
      return args.campaignId;
    }

    const status = args.scheduledFor && args.scheduledFor > Date.now() ? "scheduled" : "draft";

    // Map audienceType to targetAudience
    let targetAudience:
      | "all_users"
      | "course_students"
      | "store_students"
      | "inactive_users"
      | "completed_course"
      | "custom_list"
      | "creators" = "all_users";
    if (args.audienceType === "specific") {
      targetAudience = "custom_list";
    } else if (args.audienceType === "enrolled") {
      targetAudience = "course_students";
    } else if (args.audienceType === "active") {
      targetAudience = "inactive_users";
    } else if (args.audienceType === "creators") {
      targetAudience = "creators";
    }

    return await ctx.db.insert("resendCampaigns", {
      // connectionId omitted for admin campaigns
      templateId: args.templateId,
      name: args.name,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      targetAudience,
      customRecipients: args.audienceType === "specific" ? args.specificUserIds : undefined,
      status,
      scheduledFor: args.scheduledFor,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: 0,
      recipientCount: 0,
      complainedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create automation (admin - no connection required)
 */
export const createAutomation = mutation({
  args: {
    name: v.string(),
    trigger: v.union(
      v.literal("user_enrolled"),
      v.literal("course_completed"),
      v.literal("user_inactive"),
      v.literal("certificate_issued"),
      v.literal("user_registered")
    ),
    templateId: v.id("resendTemplates"),
    delayMinutes: v.number(),
  },
  returns: v.id("resendAutomations"),
  handler: async (ctx, args) => {
    // Map trigger names to schema triggerType
    const triggerTypeMap: Record<string, string> = {
      user_enrolled: "course_enrollment",
      course_completed: "course_completion",
      user_inactive: "inactivity",
      certificate_issued: "certificate_issued",
      user_registered: "user_signup",
    };

    return await ctx.db.insert("resendAutomations", {
      // connectionId omitted for admin automations
      name: args.name,
      description: `Automated email: ${args.name}`,
      triggerType: triggerTypeMap[args.trigger] as any,
      templateId: args.templateId,
      delayMinutes: args.delayMinutes,
      isActive: true,
      triggeredCount: 0,
      sentCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// STORE EMAIL SYSTEM (Original - requires connection)
// ============================================================================

/**
 * Create email template for store
 */
export const createStoreTemplate = mutation({
  args: {
    connectionId: v.id("resendConnections"),
    name: v.string(),
    subject: v.string(),
    type: v.union(
      v.literal("welcome"),
      v.literal("launch"),
      v.literal("enrollment"),
      v.literal("progress_reminder"),
      v.literal("completion"),
      v.literal("certificate"),
      v.literal("new_course"),
      v.literal("re_engagement"),
      v.literal("weekly_digest"),
      v.literal("custom")
    ),
    htmlContent: v.string(),
    textContent: v.string(),
    variables: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resendTemplates", {
      connectionId: args.connectionId,
      name: args.name,
      subject: args.subject,
      type: args.type,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      variables: args.variables,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get templates for a store connection
 */
export const getStoreTemplates = query({
  args: {
    connectionId: v.id("resendConnections"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("resendTemplates")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .take(500);

    if (args.activeOnly) {
      return templates.filter((t) => t.isActive);
    }

    return templates;
  },
});

/**
 * Create email campaign for store
 */
export const createStoreCampaign = mutation({
  args: {
    connectionId: v.id("resendConnections"),
    name: v.string(),
    subject: v.string(),
    templateId: v.optional(v.id("resendTemplates")),
    htmlContent: v.optional(v.string()),
    textContent: v.optional(v.string()),
    targetAudience: v.union(
      v.literal("all_users"),
      v.literal("course_students"),
      v.literal("store_students"),
      v.literal("inactive_users"),
      v.literal("completed_course"),
      v.literal("custom_list")
    ),
    targetCourseId: v.optional(v.id("courses")),
    targetStoreId: v.optional(v.id("stores")),
    customRecipients: v.optional(v.array(v.string())),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resendCampaigns", {
      connectionId: args.connectionId,
      templateId: args.templateId,
      name: args.name,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      targetAudience: args.targetAudience,
      targetCourseId: args.targetCourseId,
      targetStoreId: args.targetStoreId,
      customRecipients: args.customRecipients,
      status: args.scheduledFor ? "scheduled" : "draft",
      scheduledFor: args.scheduledFor,
      recipientCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: 0,
      complainedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get campaigns for a store connection
 */
export const getStoreCampaigns = query({
  args: {
    connectionId: v.id("resendConnections"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("resendCampaigns")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .take(5000);

    if (args.status) {
      return campaigns.filter((c) => c.status === args.status);
    }

    return campaigns;
  },
});

/**
 * Get campaign by ID (INTERNAL)
 */
export const getCampaignById = internalQuery({
  args: { campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")) },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

/**
 * Get connection by ID (INTERNAL)
 */
export const getConnectionById = internalQuery({
  args: { connectionId: v.id("resendConnections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get template by ID (INTERNAL)
 */
export const getTemplateById = internalQuery({
  args: { templateId: v.id("resendTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * Check if campaign has recipients in emailCampaignRecipients table (INTERNAL)
 * Returns true if ANY recipients exist, false otherwise
 * This is optimized to avoid reading large datasets
 */
export const checkEmailCampaignRecipients = internalQuery({
  args: { campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Just check if any recipient exists - much faster than counting all
    const firstRecipient = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId as any))
      .first();

    return firstRecipient !== null;
  },
});

/**
 * Get campaign recipients (INTERNAL) - with pagination support for large campaigns
 */
export const getCampaignRecipients = internalQuery({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return { recipients: [], isDone: true, continueCursor: null };

    const batchSize = args.batchSize || 100;

    // Try to fetch from emailCampaignRecipients table first (for emailCampaigns)
    const paginationResult = await ctx.db
      .query("emailCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId as any))
      .filter((q) => q.eq(q.field("status"), "queued")) // Only get unsent emails
      .paginate({
        cursor: args.cursor || null,
        numItems: batchSize,
      });

    // If we found recipients in emailCampaignRecipients, this is an emailCampaign
    if (paginationResult.page.length > 0) {
      // Fetch customer details for each recipient to get personalization fields
      const recipients = [];
      for (const recipient of paginationResult.page) {
        const customer = await ctx.db.get(recipient.customerId);
        if (customer && customer.email) {
          recipients.push({
            recipientId: recipient._id, // Include recipient ID for status tracking
            email: customer.email,
            userId: customer.adminUserId,
            name: customer.name,
            // Add additional customer fields for personalization
            musicAlias: customer.musicAlias,
            daw: customer.daw,
            studentLevel: customer.studentLevel,
            city: customer.city,
            state: customer.state,
            country: customer.country,
          });
        }
      }
      return {
        recipients,
        isDone: paginationResult.isDone,
        continueCursor: paginationResult.continueCursor,
      };
    }

    // Otherwise, this is a resendCampaign - use original logic (no pagination for now)
    // Return all recipients at once for backwards compatibility
    const resendCampaign = campaign as any;

    let recipients: Array<{ email: string; userId: string | undefined; name: string | undefined; storeName?: string; storeSlug?: string }> =
      [];

    // Custom recipients (specific users)
    if (resendCampaign.targetAudience === "custom_list" && resendCampaign.customRecipients) {
      // customRecipients contains user IDs, so we need to look them up
      for (const userId of resendCampaign.customRecipients) {
        // Type assertion: we know these are user IDs
        const user = await ctx.db.get(userId as any);
        // Type guard: check if this is actually a user document
        if (user && "email" in user && user.email) {
          recipients.push({
            email: user.email,
            userId: "clerkId" in user ? user.clerkId : undefined,
            name: "name" in user ? user.name : undefined,
          });
        }
      }
      return { recipients, isDone: true, continueCursor: null };
    }

    switch (resendCampaign.targetAudience) {
      case "all_users": {
        // Use emailContacts scoped to the campaign's store instead of loading all platform users
        if (resendCampaign.targetStoreId) {
          const contacts = await ctx.db
            .query("emailContacts")
            .withIndex("by_storeId_and_status", (q) =>
              q.eq("storeId", resendCampaign.targetStoreId).eq("status", "subscribed")
            )
            .take(50000);
          recipients = contacts
            .filter((c) => c.email)
            .map((c) => ({ email: c.email, userId: undefined, name: c.firstName }));
        } else {
          // Platform-wide campaign: query users with safety limit, check suppression per-user via index
          const users = await ctx.db
            .query("users")
            .withIndex("by_email")
            .take(50000);

          for (const u of users) {
            if (!u.email) continue;
            const emailLower = u.email.toLowerCase();

            // Check suppression via resendPreferences index (O(1) per user)
            const pref = await ctx.db
              .query("resendPreferences")
              .withIndex("by_user", (q) => q.eq("userId", emailLower))
              .first();
            if (pref?.isUnsubscribed) continue;

            // Check emailContacts for unsubscribed status via index
            const unsubContact = await ctx.db
              .query("emailContacts")
              .withIndex("by_email", (q) => q.eq("email", emailLower))
              .filter((q) =>
                q.or(
                  q.eq(q.field("status"), "unsubscribed"),
                  q.eq(q.field("status"), "complained")
                )
              )
              .first();
            if (unsubContact) continue;

            recipients.push({ email: u.email, userId: u.clerkId, name: u.name });
          }
        }
        break;
      }

      case "course_students": {
        if (resendCampaign.targetCourseId) {
          const courseIdStr = resendCampaign.targetCourseId as string;
          const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_courseId", (q) => q.eq("courseId", courseIdStr))
            .take(10000);
          // Look up each enrolled user individually by clerkId instead of loading all users
          for (const enrollment of enrollments) {
            const user = await ctx.db
              .query("users")
              .withIndex("by_clerkId", (q) => q.eq("clerkId", enrollment.userId))
              .first();
            if (user?.email && user.clerkId) {
              recipients.push({ email: user.email, userId: user.clerkId, name: user.name });
            }
          }
        }
        break;
      }

      case "store_students": {
        if (resendCampaign.targetStoreId) {
          const courses = await ctx.db
            .query("courses")
            .withIndex("by_storeId", (q) => q.eq("storeId", resendCampaign.targetStoreId))
            .take(500);
          // Query enrollments per course (scoped) instead of loading all enrollments
          const seenUserIds = new Set<string>();
          for (const course of courses) {
            const enrollments = await ctx.db
              .query("enrollments")
              .withIndex("by_courseId", (q) => q.eq("courseId", course._id as any))
              .take(10000);
            for (const enrollment of enrollments) {
              if (seenUserIds.has(enrollment.userId)) continue;
              seenUserIds.add(enrollment.userId);
              const user = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", enrollment.userId))
                .first();
              if (user?.email && user.clerkId) {
                recipients.push({ email: user.email, userId: user.clerkId, name: user.name });
              }
            }
          }
        }
        break;
      }

      case "inactive_users": {
        if (resendCampaign.inactiveDays) {
          const cutoff = Date.now() - resendCampaign.inactiveDays * 24 * 60 * 60 * 1000;
          // Query users created before the cutoff date using default _creationTime order.
          // Filter server-side for _creationTime < cutoff (Convex default index is by _creationTime).
          const users = await ctx.db
            .query("users")
            .filter((q) =>
              q.and(
                q.lt(q.field("_creationTime"), cutoff),
                q.neq(q.field("email"), undefined)
              )
            )
            .take(50000);
          recipients = users
            .filter((u) => u.email)
            .map((u) => ({ email: u.email!, userId: u.clerkId, name: u.name }));
        }
        break;
      }

      case "completed_course": {
        if (resendCampaign.targetCourseId) {
          const courseIdStr = resendCampaign.targetCourseId as string;
          const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_courseId", (q) => q.eq("courseId", courseIdStr))
            .take(10000);
          // Only look up users who completed the course
          const completedEnrollments = enrollments.filter((e) => e.progress === 100);
          for (const enrollment of completedEnrollments) {
            const user = await ctx.db
              .query("users")
              .withIndex("by_clerkId", (q) => q.eq("clerkId", enrollment.userId))
              .first();
            if (user?.email && user.clerkId) {
              recipients.push({ email: user.email, userId: user.clerkId, name: user.name });
            }
          }
        }
        break;
      }

      case "creators": {
        // Query users flagged as creators instead of loading all stores + all users
        const creatorUsers = await ctx.db
          .query("users")
          .withIndex("by_isCreator", (q) => q.eq("isCreator", true))
          .take(10000);
        for (const u of creatorUsers) {
          if (!u.email || !u.clerkId) continue;
          const store = await ctx.db
            .query("stores")
            .withIndex("by_userId", (q) => q.eq("userId", u.clerkId!))
            .first();
          recipients.push({
            email: u.email,
            userId: u.clerkId,
            name: u.name,
            storeName: store?.name,
            storeSlug: store?.slug,
          });
        }
        break;
      }
    }

    // CAN-SPAM: Filter out unsubscribed recipients for all audience types
    // (store-scoped "all_users" already filters via emailContacts status index,
    //  and platform-wide "all_users" checks suppression per-user above)
    if (resendCampaign.targetAudience !== "all_users" && recipients.length > 0) {
      // Check suppression per-recipient using indexes instead of loading all prefs/contacts
      const filtered: typeof recipients = [];
      for (const r of recipients) {
        const emailLower = r.email.toLowerCase();

        // Check resendPreferences via index
        const pref = await ctx.db
          .query("resendPreferences")
          .withIndex("by_user", (q) => q.eq("userId", emailLower))
          .first();
        if (pref?.isUnsubscribed) continue;

        // Check emailContacts for unsubscribed/complained status via index
        const unsubContact = await ctx.db
          .query("emailContacts")
          .withIndex("by_email", (q) => q.eq("email", emailLower))
          .filter((q) =>
            q.or(
              q.eq(q.field("status"), "unsubscribed"),
              q.eq(q.field("status"), "complained")
            )
          )
          .first();
        if (unsubContact) continue;

        filtered.push(r);
      }
      recipients = filtered;
    }

    return { recipients, isDone: true, continueCursor: null };
  },
});

/**
 * Update campaign status (INTERNAL)
 * Now supports additional states for resumability
 */
export const updateCampaignStatus = internalMutation({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("partial"), // Some emails sent, some failed
      v.literal("paused") // Can be resumed
    ),
    sentAt: v.optional(v.number()),
    error: v.optional(v.string()), // Store error message for debugging
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status, updatedAt: Date.now() };
    if (args.sentAt) updates.sentAt = args.sentAt;
    if (args.error) updates.lastError = args.error;
    await ctx.db.patch(args.campaignId, updates);
  },
});

/**
 * Update campaign content - for fixing campaigns missing content
 */
export const updateCampaignContent = mutation({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
    htmlContent: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      htmlContent: args.htmlContent,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Patch campaign content by name (INTERNAL - for HTTP action)
 */
export const patchCampaignContent = internalMutation({
  args: {
    campaignName: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    htmlContent: v.string(),
  },
  handler: async (ctx, args) => {
    let campaign;

    if (args.campaignId) {
      // Direct lookup by ID is O(1)
      campaign = await ctx.db.get(args.campaignId as any);
    }

    if (!campaign && args.campaignName) {
      // Substring search requires scanning, but resendCampaigns is a small table (not users)
      const campaigns = await ctx.db.query("resendCampaigns").take(10000);
      campaign = campaigns.find(c => c.name?.includes(args.campaignName!) || c.subject?.includes(args.campaignName!));

      if (!campaign) {
        throw new Error(`Campaign not found: ${args.campaignName}. Available: ${campaigns.map(c => c.name).slice(0, 5).join(", ")}`);
      }
    }

    if (!campaign) {
      throw new Error(`Campaign not found: ${args.campaignName || args.campaignId}`);
    }

    await ctx.db.patch(campaign._id, {
      htmlContent: args.htmlContent,
      updatedAt: Date.now(),
    });

    return { success: true, updatedId: campaign._id };
  },
});

/**
 * Update recipient status (INTERNAL)
 */
export const updateRecipientStatus = internalMutation({
  args: {
    recipientId: v.id("emailCampaignRecipients"),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipientId, { status: args.status });
  },
});

/**
 * Update campaign metrics (INTERNAL)
 * Now supports progress tracking for resumability
 */
export const updateCampaignMetrics = internalMutation({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
    recipientCount: v.optional(v.number()),
    sentCount: v.optional(v.number()),
    failedCount: v.optional(v.number()), // Track failed emails
    lastProcessedCursor: v.optional(v.string()), // For resumability
  },
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    if (args.recipientCount !== undefined) updates.recipientCount = args.recipientCount;
    if (args.sentCount !== undefined) updates.sentCount = args.sentCount;
    if (args.failedCount !== undefined) updates.failedCount = args.failedCount;
    if (args.lastProcessedCursor !== undefined) updates.lastProcessedCursor = args.lastProcessedCursor;
    await ctx.db.patch(args.campaignId, updates);
  },
});

/**
 * Log email send (INTERNAL)
 */
export const logEmail = internalMutation({
  args: {
    connectionId: v.id("resendConnections"),
    resendEmailId: v.optional(v.string()),
    recipientEmail: v.string(),
    recipientUserId: v.optional(v.string()),
    recipientName: v.optional(v.string()),
    campaignId: v.optional(v.id("resendCampaigns")),
    automationId: v.optional(v.id("resendAutomations")),
    templateId: v.optional(v.id("resendTemplates")),
    subject: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resendLogs", {
      connectionId: args.connectionId,
      resendEmailId: args.resendEmailId,
      recipientEmail: args.recipientEmail,
      recipientUserId: args.recipientUserId,
      recipientName: args.recipientName,
      campaignId: args.campaignId,
      automationId: args.automationId,
      templateId: args.templateId,
      subject: args.subject,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      status: args.status,
      errorMessage: args.errorMessage,
      sentAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Handle webhook event from Resend
 * Updates both resendLogs (for campaigns) and emailContacts (for workflow tracking)
 */
export const handleWebhookEvent = mutation({
  args: {
    event: v.string(),
    emailId: v.string(),
    timestamp: v.number(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    // Extract recipient email from metadata
    const recipientEmail = args.metadata?.to;
    const recipientEmailNormalized = Array.isArray(recipientEmail)
      ? recipientEmail[0]?.toLowerCase()
      : recipientEmail?.toLowerCase();

    // Find email log by Resend email ID (for campaign emails)
    const log = await ctx.db
      .query("resendLogs")
      .withIndex("by_resend_id", (q) => q.eq("resendEmailId", args.emailId))
      .first();

    // Determine new status based on event
    let newStatus: "delivered" | "opened" | "clicked" | "bounced" | "complained" | "failed" =
      "delivered";
    const updates: any = { updatedAt: Date.now() };

    switch (args.event) {
      case "email.delivered":
        newStatus = "delivered";
        updates.deliveredAt = args.timestamp;
        break;
      case "email.opened":
        newStatus = "opened";
        updates.openedAt = args.timestamp;
        break;
      case "email.clicked":
        newStatus = "clicked";
        updates.clickedAt = args.timestamp;
        break;
      case "email.bounced":
        newStatus = "bounced";
        updates.bouncedAt = args.timestamp;
        updates.errorMessage = args.metadata?.bounce_type || "Email bounced";
        break;
      case "email.complained":
        newStatus = "complained";
        break;
      case "email.delivery_delayed":
      case "email.failed":
        newStatus = "failed";
        updates.errorMessage = args.metadata?.error || "Email delivery failed";
        break;
    }

    // Update resendLogs if found (campaign emails)
    if (log) {
      updates.status = newStatus;
      await ctx.db.patch(log._id, updates);

      // Update campaign metrics if applicable
      if (log.campaignId) {
        await ctx.runMutation(internal.emailQueries.incrementCampaignMetric, {
          campaignId: log.campaignId,
          metric: newStatus,
        });
      }
    }

    // Update email contacts for open/click tracking (works for ALL emails including workflow)
    if (
      recipientEmailNormalized &&
      (args.event === "email.opened" || args.event === "email.clicked")
    ) {
      // Find all contacts with this email across all stores using index
      const contacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_email", (q) => q.eq("email", recipientEmailNormalized))
        .take(5000);

      for (const contact of contacts) {
        const now = Date.now();

        if (args.event === "email.opened") {
          await ctx.db.patch(contact._id, {
            emailsOpened: (contact.emailsOpened || 0) + 1,
            lastOpenedAt: now,
            updatedAt: now,
          });

          // Log activity
          await ctx.db.insert("emailContactActivity", {
            contactId: contact._id,
            storeId: contact.storeId,
            activityType: "email_opened",
            metadata: {
              emailId: args.emailId,
              timestamp: args.timestamp,
            },
            timestamp: now,
          });

        } else if (args.event === "email.clicked") {
          await ctx.db.patch(contact._id, {
            emailsClicked: (contact.emailsClicked || 0) + 1,
            lastClickedAt: now,
            updatedAt: now,
          });

          // Log activity
          await ctx.db.insert("emailContactActivity", {
            contactId: contact._id,
            storeId: contact.storeId,
            activityType: "email_clicked",
            metadata: {
              emailId: args.emailId,
              timestamp: args.timestamp,
              linkClicked: args.metadata?.clickedUrl,
            },
            timestamp: now,
          });

        }

        await ctx.scheduler.runAfter(0, internal.emailContactSync.syncContactEngagement, {
          storeId: contact.storeId,
          email: contact.email,
          eventType: args.event === "email.opened" ? "email_opened" : "email_clicked",
          linkUrl: args.metadata?.clickedUrl,
          emailSubject: log?.subject,
        });
      }
    }

    if (!log && !recipientEmailNormalized) {
      console.warn(
        `[Webhook] No tracking possible for email ID: ${args.emailId} - no log found and no recipient email`
      );
      return { success: false, message: "No tracking data found" };
    }

    return { success: true, logUpdated: !!log, contactsUpdated: !!recipientEmailNormalized };
  },
});

/**
 * Increment campaign metric (INTERNAL)
 */
export const incrementCampaignMetric = internalMutation({
  args: {
    campaignId: v.id("resendCampaigns"),
    metric: v.union(
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    const updates: any = { updatedAt: Date.now() };

    switch (args.metric) {
      case "delivered":
        updates.deliveredCount = (campaign.deliveredCount || 0) + 1;
        break;
      case "opened":
        updates.openedCount = (campaign.openedCount || 0) + 1;
        break;
      case "clicked":
        updates.clickedCount = (campaign.clickedCount || 0) + 1;
        break;
      case "bounced":
        updates.bouncedCount = (campaign.bouncedCount || 0) + 1;
        break;
      case "complained":
        updates.complainedCount = (campaign.complainedCount || 0) + 1;
        break;
    }

    await ctx.db.patch(args.campaignId, updates);
  },
});

// ============================================================================
// AUTOMATION ENGINE
// ============================================================================

/**
 * Create automation rule for store
 */
export const createStoreAutomation = mutation({
  args: {
    connectionId: v.id("resendConnections"),
    templateId: v.id("resendTemplates"),
    name: v.string(),
    description: v.string(),
    triggerType: v.union(
      v.literal("user_signup"),
      v.literal("course_enrollment"),
      v.literal("course_progress"),
      v.literal("course_completion"),
      v.literal("certificate_issued"),
      v.literal("purchase"),
      v.literal("inactivity"),
      v.literal("quiz_completion"),
      v.literal("milestone")
    ),
    triggerCourseId: v.optional(v.id("courses")),
    triggerStoreId: v.optional(v.id("stores")),
    progressThreshold: v.optional(v.number()),
    inactivityDays: v.optional(v.number()),
    delayMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resendAutomations", {
      connectionId: args.connectionId,
      templateId: args.templateId,
      name: args.name,
      description: args.description,
      isActive: true,
      triggerType: args.triggerType,
      triggerCourseId: args.triggerCourseId,
      triggerStoreId: args.triggerStoreId,
      progressThreshold: args.progressThreshold,
      inactivityDays: args.inactivityDays,
      delayMinutes: args.delayMinutes || 0,
      triggeredCount: 0,
      sentCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get automations
 */
export const getAutomations = query({
  args: {
    connectionId: v.id("resendConnections"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const automations = await ctx.db
      .query("resendAutomations")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .take(5000);

    if (args.activeOnly) {
      return automations.filter((a) => a.isActive);
    }

    return automations;
  },
});

/**
 * Toggle automation
 */
export const toggleAutomation = mutation({
  args: {
    automationId: v.id("resendAutomations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.automationId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get active automations (INTERNAL)
 */
export const getActiveAutomations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("resendAutomations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(5000);
  },
});

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get email analytics for a store connection
 */
export const getStoreEmailAnalytics = query({
  args: {
    connectionId: v.id("resendConnections"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all email logs
    const logs = await ctx.db
      .query("resendLogs")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .take(5000);

    const totalSent = logs.length;
    const delivered = logs.filter((l) =>
      ["delivered", "opened", "clicked"].includes(l.status)
    ).length;
    const opened = logs.filter((l) => ["opened", "clicked"].includes(l.status)).length;
    const clicked = logs.filter((l) => l.status === "clicked").length;
    const bounced = logs.filter((l) => l.status === "bounced").length;
    const complained = logs.filter((l) => l.status === "complained").length;

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;

    return {
      totalSent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      bounceRate: Math.round(bounceRate * 10) / 10,
    };
  },
});

/**
 * Get campaign performance stats
 */
export const getCampaignStats = query({
  args: {
    campaignId: v.id("resendCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const openRate =
      campaign.deliveredCount > 0 ? (campaign.openedCount / campaign.deliveredCount) * 100 : 0;

    const clickRate =
      campaign.deliveredCount > 0 ? (campaign.clickedCount / campaign.deliveredCount) * 100 : 0;

    const bounceRate =
      campaign.sentCount > 0 ? (campaign.bouncedCount / campaign.sentCount) * 100 : 0;

    return {
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount,
      bouncedCount: campaign.bouncedCount,
      complainedCount: campaign.complainedCount,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      bounceRate: Math.round(bounceRate * 10) / 10,
    };
  },
});

/**
 * Get email logs
 */
export const getEmailLogs = query({
  args: {
    connectionId: v.id("resendConnections"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orderedQuery = ctx.db
      .query("resendLogs")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .order("desc");

    if (args.limit) {
      return await orderedQuery.take(args.limit);
    }

    return await orderedQuery.take(5000);
  },
});

/**
 * Connect admin Resend account (INTERNAL - expects encrypted API key)
 */
export const saveAdminResendConnection = internalMutation({
  args: {
    encryptedApiKey: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin connection exists
    const existing = await ctx.db
      .query("resendConnections")
      .withIndex("by_type", (q) => q.eq("type", "admin"))
      .first();

    const data = {
      type: "admin" as const,
      userId: args.userId,
      resendApiKey: args.encryptedApiKey, // Already encrypted
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyToEmail: args.replyToEmail,
      isActive: true,
      isVerified: false,
      enableAutomations: true,
      enableCampaigns: true,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("resendConnections", {
      ...data,
      createdAt: Date.now(),
    });
  },
});

/**
 * Connect admin Resend account
 * @deprecated Use the action version via emails.connectAdminResendSecure for encrypted storage
 */
export const connectAdminResend = mutation({
  args: {
    resendApiKey: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin connection exists
    const existing = await ctx.db
      .query("resendConnections")
      .withIndex("by_type", (q) => q.eq("type", "admin"))
      .first();

    // Note: API key is stored unencrypted here for backward compatibility
    // Use emails.connectAdminResendSecure action for encrypted storage
    const data = {
      type: "admin" as const,
      userId: args.userId,
      resendApiKey: args.resendApiKey,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyToEmail: args.replyToEmail,
      isActive: true,
      isVerified: false,
      enableAutomations: true,
      enableCampaigns: true,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("resendConnections", {
      ...data,
      createdAt: Date.now(),
    });
  },
});

/**
 * Connect store Resend configuration (INTERNAL - expects encrypted API key)
 */
export const saveStoreResendConnection = internalMutation({
  args: {
    storeId: v.id("stores"),
    encryptedApiKey: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if store connection exists
    const existing = await ctx.db
      .query("resendConnections")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .first();

    const data = {
      type: "store" as const,
      storeId: args.storeId,
      userId: args.userId,
      resendApiKey: args.encryptedApiKey, // Already encrypted
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyToEmail: args.replyToEmail,
      isActive: true,
      isVerified: false,
      enableAutomations: true,
      enableCampaigns: true,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("resendConnections", {
      ...data,
      createdAt: Date.now(),
    });
  },
});

/**
 * Connect store Resend configuration
 * @deprecated Use the action version via emails.connectStoreResendSecure for encrypted storage
 */
export const connectStoreResend = mutation({
  args: {
    storeId: v.id("stores"),
    resendApiKey: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if store connection exists
    const existing = await ctx.db
      .query("resendConnections")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .first();

    // Note: API key is stored unencrypted here for backward compatibility
    // Use emails.connectStoreResendSecure action for encrypted storage
    const data = {
      type: "store" as const,
      storeId: args.storeId,
      userId: args.userId,
      resendApiKey: args.resendApiKey,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyToEmail: args.replyToEmail,
      isActive: true,
      isVerified: false,
      enableAutomations: true,
      enableCampaigns: true,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("resendConnections", {
      ...data,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get admin connection (PUBLIC)
 */
export const getAdminConnection = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("resendConnections")
      .withIndex("by_type", (q) => q.eq("type", "admin"))
      .first();
  },
});

/**
 * Get admin connection (INTERNAL - for actions)
 */
export const getAdminConnectionInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("resendConnections")
      .withIndex("by_type", (q) => q.eq("type", "admin"))
      .first();
  },
});

/**
 * Get store connection
 */
export const getStoreConnection = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resendConnections")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .first();
  },
});

/**
 * Get scheduled campaigns (INTERNAL)
 */
export const getScheduledCampaigns = internalQuery({
  args: {
    beforeTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resendCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .filter((q) =>
        q.and(
          q.neq(q.field("scheduledFor"), undefined),
          q.lte(q.field("scheduledFor"), args.beforeTimestamp)
        )
      )
      .take(5000);
  },
});

/**
 * Get old logs to delete (INTERNAL)
 */
export const getOldLogs = internalQuery({
  args: {
    cutoffTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resendLogs")
      .filter((q) => q.lt(q.field("createdAt"), args.cutoffTime))
      .take(10000);
  },
});

/**
 * Delete a single log (INTERNAL)
 */
export const deleteLog = internalMutation({
  args: {
    logId: v.id("resendLogs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.logId);
  },
});

// ============================================================================
// CONTACT IMPORT SYSTEM
// ============================================================================

/**
 * Start contact import
 */
export const startContactImport = mutation({
  args: {
    connectionId: v.id("resendConnections"),
    source: v.union(
      v.literal("csv"),
      v.literal("mailchimp"),
      v.literal("activecampaign"),
      v.literal("convertkit"),
      v.literal("manual")
    ),
    fileName: v.optional(v.string()),
    totalContacts: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resendImportedContacts", {
      connectionId: args.connectionId,
      source: args.source,
      fileName: args.fileName,
      status: "processing",
      totalContacts: args.totalContacts,
      processedContacts: 0,
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      importedBy: args.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Process contact import batch
 */
export const processContactBatch = mutation({
  args: {
    importId: v.id("resendImportedContacts"),
    contacts: v.array(
      v.object({
        email: v.string(),
        name: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        metadata: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord) {
      throw new Error("Import not found");
    }

    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Track emails seen in this import batch for intra-batch deduplication
    const seenInBatch = new Set<string>();

    for (const contact of args.contacts) {
      try {
        // Validate email
        if (!contact.email || !isValidEmail(contact.email)) {
          errorCount++;
          errors.push({ email: contact.email, error: "Invalid email format" });
          continue;
        }

        const emailLower = contact.email.toLowerCase();

        // Check intra-batch duplicate
        if (seenInBatch.has(emailLower)) {
          duplicateCount++;
          continue;
        }

        // Check if user already exists using the by_email index (O(1) per lookup)
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", emailLower))
          .first();

        if (existingUser) {
          duplicateCount++;
          seenInBatch.add(emailLower);
          continue;
        }

        // Success - in a real implementation, you might:
        // 1. Send them an invite email
        // 2. Create a "pending" user record
        // 3. Add to an audience list
        // For now, we just count it as success
        successCount++;
        seenInBatch.add(emailLower);
      } catch (error: any) {
        errorCount++;
        errors.push({
          email: contact.email,
          error: error.message || "Unknown error",
        });
      }
    }

    // Update import record
    await ctx.db.patch(args.importId, {
      processedContacts: (importRecord.processedContacts || 0) + args.contacts.length,
      successCount: (importRecord.successCount || 0) + successCount,
      errorCount: (importRecord.errorCount || 0) + errorCount,
      duplicateCount: (importRecord.duplicateCount || 0) + duplicateCount,
      errors: errors.length > 0 ? errors : undefined,
      updatedAt: Date.now(),
    });

    // Check if import is complete
    const updatedImport = await ctx.db.get(args.importId);
    if (updatedImport && updatedImport.processedContacts >= updatedImport.totalContacts) {
      await ctx.db.patch(args.importId, {
        status: errorCount > 0 ? "completed_with_errors" : "completed",
        completedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      successCount,
      errorCount,
      duplicateCount,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  },
});

/**
 * Get import status
 */
export const getImportStatus = query({
  args: {
    importId: v.id("resendImportedContacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.importId);
  },
});

/**
 * Get all imports for a connection
 */
export const getImports = query({
  args: {
    connectionId: v.id("resendConnections"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("resendImportedContacts")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.take(5000);
  },
});

/**
 * Cancel import
 */
export const cancelImport = mutation({
  args: {
    importId: v.id("resendImportedContacts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.importId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete import record
 */
export const deleteImport = mutation({
  args: {
    importId: v.id("resendImportedContacts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.importId);
  },
});

/**
 * Create audience list from import
 */
export const createAudienceFromImport = mutation({
  args: {
    connectionId: v.id("resendConnections"),
    name: v.string(),
    description: v.string(),
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resendAudienceLists", {
      connectionId: args.connectionId,
      name: args.name,
      description: args.description,
      userIds: args.userIds,
      subscriberCount: args.userIds.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get audience lists
 */
export const getAudienceLists = query({
  args: {
    connectionId: v.id("resendConnections"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resendAudienceLists")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .take(5000);
  },
});

/**
 * Update audience list
 */
export const updateAudienceList = mutation({
  args: {
    listId: v.id("resendAudienceLists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    userIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.userIds !== undefined) {
      updates.userIds = args.userIds;
      updates.subscriberCount = args.userIds.length;
    }
    await ctx.db.patch(args.listId, updates);
  },
});

/**
 * Delete audience list
 */
export const deleteAudienceList = mutation({
  args: {
    listId: v.id("resendAudienceLists"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.listId);
  },
});

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// DOMAIN VERIFICATION SYSTEM
// ============================================================================

/**
 * Get domain verification status
 */
export const getDomainStatus = query({
  args: {
    connectionId: v.id("resendConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    return {
      domain: connection.domain,
      fromEmail: connection.fromEmail,
      status: connection.status,
      isActive: connection.isActive,
      verificationStatus: connection.domainVerificationStatus || "not_verified",
      dnsRecords: connection.dnsRecords,
      lastChecked: connection.domainLastChecked,
    };
  },
});

/**
 * Update domain verification status (INTERNAL)
 */
export const updateDomainVerification = internalMutation({
  args: {
    connectionId: v.id("resendConnections"),
    status: v.union(
      v.literal("verified"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("not_verified")
    ),
    dnsRecords: v.optional(
      v.object({
        spf: v.object({
          record: v.string(),
          valid: v.boolean(),
        }),
        dkim: v.object({
          record: v.string(),
          valid: v.boolean(),
        }),
        dmarc: v.optional(
          v.object({
            record: v.string(),
            valid: v.boolean(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      domainVerificationStatus: args.status,
      dnsRecords: args.dnsRecords,
      domainLastChecked: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// WEEKLY DIGEST SYSTEM
// ============================================================================

/**
 * Get users eligible for weekly digest
 */
export const getUsersForWeeklyDigest = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all users who haven't unsubscribed from weekly digest
    const preferences = await ctx.db
      .query("resendPreferences")
      .filter((q) => q.eq(q.field("weeklyDigest"), true))
      .collect();

    const users: Array<{
      userId: string;
      email: string;
      name: string;
    }> = [];

    for (const pref of preferences) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", pref.userId))
        .first();

      if (user && user.email && user.clerkId) {
        users.push({
          userId: user.clerkId,
          email: user.email,
          name: user.name || user.email,
        });
      }
    }

    return users;
  },
});

/**
 * Get digest data for a specific user
 */
export const getUserDigestData = internalQuery({
  args: {
    userId: v.string(), // Clerk ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get user's enrolled courses
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const courseIds = enrollments.map((e) => e.courseId);

    // Get user's course info
    const courseProgress: Array<{
      courseId: string;
      courseTitle: string;
      progress: number;
      completedLessons: number;
      totalLessons: number;
    }> = [];

    for (const enrollment of enrollments) {
      const course = await ctx.db.get(enrollment.courseId as any);
      if (!course || !("title" in course)) continue;

      // Use enrollment progress if available
      const progress = (enrollment as any).progress || 0;
      const completedAt = (enrollment as any).completedAt;

      courseProgress.push({
        courseId: enrollment.courseId,
        courseTitle: course.title as string,
        progress: completedAt ? 100 : progress,
        completedLessons: completedAt ? 1 : 0,
        totalLessons: 1,
      });
    }

    // Get new courses published this week
    const newCourses = await ctx.db
      .query("courses")
      .filter((q) =>
        q.and(q.eq(q.field("isPublished"), true), q.gt(q.field("_creationTime"), oneWeekAgo))
      )
      .take(5);

    // Get user's recent activity
    const recentActivity = await ctx.db
      .query("enrollments")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(5);

    // Get certificates earned this week
    const certificates = await ctx.db
      .query("certificates")
      .filter((q) =>
        q.and(q.eq(q.field("userId"), args.userId), q.gt(q.field("issueDate"), oneWeekAgo))
      )
      .collect();

    return {
      user: {
        userId: args.userId,
      },
      stats: {
        activeCourses: enrollments.length,
        completedThisWeek: certificates.length,
        totalProgress:
          courseProgress.reduce((sum, c) => sum + c.progress, 0) /
          Math.max(courseProgress.length, 1),
      },
      courseProgress: courseProgress.slice(0, 3), // Top 3 in-progress courses
      newCourses: newCourses.map((c) => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        thumbnailUrl: c.imageUrl || "",
      })),
      certificates: certificates.map((c) => ({
        courseId: c.courseId,
        issuedAt: c.issueDate,
      })),
      recentActivity: recentActivity.length,
    };
  },
});

/**
 * Mark digest as sent
 */
export const markDigestSent = internalMutation({
  args: {
    userId: v.string(),
    emailLogId: v.id("resendLogs"),
  },
  handler: async (ctx, args) => {
    // Record that digest was sent
    // You could track this in user preferences or a separate table
    const pref = await ctx.db
      .query("resendPreferences")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (pref) {
      await ctx.db.patch(pref._id, {
        updatedAt: Date.now(),
      });
    }
  },
});

// ============================================================================
// EMAIL STATUS SYNC SYSTEM
// ============================================================================

/**
 * Get emails that need status sync
 * Returns emails that are pending or sent but haven't been updated in 24 hours
 */
export const getEmailsNeedingSync = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Get emails that are in "sent" or "pending" status
    // and haven't been updated recently
    const logs = await ctx.db
      .query("resendLogs")
      .filter((q) => q.or(q.eq(q.field("status"), "sent"), q.eq(q.field("status"), "pending")))
      .take(args.limit || 100);

    // Filter to only include those with Resend email IDs and created over 1 hour ago
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return logs
      .filter((log) => log.resendEmailId && log.sentAt && log.sentAt < oneHourAgo)
      .slice(0, args.limit || 100);
  },
});

/**
 * Update email status from sync
 */
export const updateEmailStatusFromSync = internalMutation({
  args: {
    emailLogId: v.id("resendLogs"),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("bounced"),
      v.literal("failed")
    ),
    deliveredAt: v.optional(v.number()),
    bouncedAt: v.optional(v.number()),
    bounceReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.deliveredAt) updates.deliveredAt = args.deliveredAt;
    if (args.bouncedAt) updates.bouncedAt = args.bouncedAt;
    // Note: bounceReason stored in errorMessage field
    if (args.bounceReason) {
      updates.errorMessage = args.bounceReason;
    }

    await ctx.db.patch(args.emailLogId, updates);

    // Update campaign metrics if applicable
    const log = await ctx.db.get(args.emailLogId);
    if (log?.campaignId) {
      const campaign = await ctx.db.get(log.campaignId);
      if (campaign) {
        if (args.status === "delivered" && !log.deliveredAt) {
          await ctx.db.patch(campaign._id, {
            deliveredCount: (campaign.deliveredCount || 0) + 1,
          });
        } else if (args.status === "bounced" && !log.bouncedAt) {
          await ctx.db.patch(campaign._id, {
            bouncedCount: (campaign.bouncedCount || 0) + 1,
          });
        }
      }
    }
  },
});

// ============================================================================
// MUTATIONS MOVED FROM emails.ts (Node.js runtime doesn't support mutations)
// ============================================================================

/**
 * Get contacts by IDs (internal query for broadcast)
 */
export const getContactsByIds = internalMutation({
  args: {
    contactIds: v.array(v.id("emailContacts")),
  },
  handler: async (ctx, args) => {
    const contacts = [];
    for (const id of args.contactIds) {
      const contact = await ctx.db.get(id);
      if (contact) {
        contacts.push(contact);
      }
    }
    return contacts;
  },
});

/**
 * Increment emails sent count for a contact
 */
export const incrementContactEmailsSent = internalMutation({
  args: {
    contactId: v.id("emailContacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (contact) {
      await ctx.db.patch(args.contactId, {
        emailsSent: (contact.emailsSent || 0) + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Update connection API key (internal mutation for migration)
 */
export const updateConnectionApiKey = internalMutation({
  args: {
    connectionId: v.id("resendConnections"),
    encryptedApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      resendApiKey: args.encryptedApiKey,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// RESEND FAILED ENROLLMENT EMAILS - Internal Query
// ============================================================================

/**
 * Fetches recent course purchases with user email and course info.
 * Used by the resendEnrollmentEmails action in emails.ts.
 */
export const getRecentCoursePurchases = internalQuery({
  args: {
    cutoffTime: v.number(),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      purchaseId: string;
      userEmail: string | null;
      userName: string | null;
      userFirstName: string | null;
      courseTitle: string | null;
      courseSlug: string | null;
      amount: number;
      currency: string | null;
      storeName: string | null;
      createdAt: number;
    }> = [];

    // Scan purchases - we need to filter by _creationTime and productType
    const PURCHASE_LIMIT = 5000;
    let count = 0;

    for await (const purchase of ctx.db.query("purchases").order("desc")) {
      if (count >= PURCHASE_LIMIT) break;
      count++;

      // Only recent purchases
      if (purchase._creationTime < args.cutoffTime) break;

      // Only course purchases
      if (purchase.productType !== "course") continue;
      if (purchase.status !== "completed") continue;

      // Look up user
      let userEmail: string | null = null;
      let userName: string | null = null;
      let userFirstName: string | null = null;

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
        .unique();

      if (user) {
        userEmail = user.email || null;
        userName = user.name || null;
        userFirstName = user.firstName || null;
      }

      // Look up course
      let courseTitle: string | null = null;
      let courseSlug: string | null = null;

      if (purchase.courseId) {
        const course = await ctx.db.get(purchase.courseId);
        if (course) {
          courseTitle = course.title;
          courseSlug = course.slug || null;
        }
      }

      // Look up store name
      let storeName: string | null = null;
      if (purchase.storeId) {
        const store = await ctx.db
          .query("stores")
          .withIndex("by_userId", (q) => q.eq("userId", purchase.storeId))
          .first();
        if (store) {
          storeName = store.name;
        }
      }

      results.push({
        purchaseId: purchase._id,
        userEmail,
        userName,
        userFirstName,
        courseTitle,
        courseSlug,
        amount: purchase.amount,
        currency: purchase.currency || null,
        storeName,
        createdAt: purchase._creationTime,
      });
    }

    return results;
  },
});
