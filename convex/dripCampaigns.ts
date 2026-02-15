import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

export const createCampaign = mutation({
  args: {
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("lead_signup"),
      v.literal("product_purchase"),
      v.literal("tag_added"),
      v.literal("manual")
    ),
    triggerConfig: v.optional(v.any()),
  },
  returns: v.id("dripCampaigns"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("dripCampaigns", {
      storeId: args.storeId,
      name: args.name,
      description: args.description,
      triggerType: args.triggerType,
      triggerConfig: args.triggerConfig || {},
      isActive: false,
      totalEnrolled: 0,
      totalCompleted: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const addStep = mutation({
  args: {
    campaignId: v.id("dripCampaigns"),
    stepNumber: v.number(),
    delayMinutes: v.number(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
  },
  returns: v.id("dripCampaignSteps"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("dripCampaignSteps", {
      campaignId: args.campaignId,
      stepNumber: args.stepNumber,
      delayMinutes: args.delayMinutes,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      isActive: true,
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateStep = mutation({
  args: {
    stepId: v.id("dripCampaignSteps"),
    delayMinutes: v.optional(v.number()),
    subject: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    textContent: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { stepId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(stepId, filteredUpdates);
    return null;
  },
});

export const deleteStep = mutation({
  args: { stepId: v.id("dripCampaignSteps") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.stepId);
    return null;
  },
});

export const getCampaign = query({
  args: { campaignId: v.id("dripCampaigns") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const steps = await ctx.db
      .query("dripCampaignSteps")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(200);

    const enrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

    return {
      ...campaign,
      steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
      activeEnrollments: enrollments.filter((e) => e.status === "active").length,
      completedEnrollments: enrollments.filter((e) => e.status === "completed").length,
    };
  },
});

export const getCampaignsByStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dripCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(5000);
  },
});

// Admin query - returns ALL campaigns across all stores
export const getAllDripCampaigns = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("dripCampaigns").order("desc").take(10000);
  },
});

export const toggleCampaign = mutation({
  args: { campaignId: v.id("dripCampaigns") },
  returns: v.object({ isActive: v.boolean() }),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const newStatus = !campaign.isActive;
    await ctx.db.patch(args.campaignId, {
      isActive: newStatus,
      updatedAt: Date.now(),
    });

    return { isActive: newStatus };
  },
});

export const deleteCampaign = mutation({
  args: { campaignId: v.id("dripCampaigns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("dripCampaignSteps")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(200);

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    const enrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(5000);

    for (const enrollment of enrollments) {
      await ctx.db.delete(enrollment._id);
    }

    await ctx.db.delete(args.campaignId);
    return null;
  },
});

export const enrollContact = mutation({
  args: {
    campaignId: v.id("dripCampaigns"),
    email: v.string(),
    name: v.optional(v.string()),
    customerId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.union(v.id("dripCampaignEnrollments"), v.null()),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || !campaign.isActive) return null;

    const existing = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId_and_email", (q) =>
        q.eq("campaignId", args.campaignId).eq("email", args.email)
      )
      .first();

    if (existing) return null;

    const steps = await ctx.db
      .query("dripCampaignSteps")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(200);

    if (steps.length === 0) return null;

    const firstStep = steps.sort((a, b) => a.stepNumber - b.stepNumber)[0];
    const nextSendAt = Date.now() + firstStep.delayMinutes * 60 * 1000;

    const enrollmentId = await ctx.db.insert("dripCampaignEnrollments", {
      campaignId: args.campaignId,
      email: args.email,
      name: args.name,
      customerId: args.customerId,
      currentStepNumber: 1,
      status: "active",
      nextSendAt,
      enrolledAt: Date.now(),
      metadata: args.metadata,
    });

    await ctx.db.patch(args.campaignId, {
      totalEnrolled: (campaign.totalEnrolled || 0) + 1,
    });

    return enrollmentId;
  },
});

export const unenrollContact = mutation({
  args: {
    campaignId: v.id("dripCampaigns"),
    email: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId_and_email", (q) =>
        q.eq("campaignId", args.campaignId).eq("email", args.email)
      )
      .first();

    if (!enrollment) return false;

    await ctx.db.patch(enrollment._id, {
      status: "cancelled",
    });

    return true;
  },
});

export const getEnrollmentsByEmail = query({
  args: { email: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .take(5000);
  },
});

export const getDueEnrollments = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const now = Date.now();
    const enrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_status_and_nextSendAt")
      .filter((q) => q.and(q.eq(q.field("status"), "active"), q.lte(q.field("nextSendAt"), now)))
      .take(args.limit || 100);

    return enrollments;
  },
});

export const advanceEnrollment = internalMutation({
  args: {
    enrollmentId: v.id("dripCampaignEnrollments"),
    success: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment || enrollment.status !== "active") return null;

    const steps = await ctx.db
      .query("dripCampaignSteps")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", enrollment.campaignId))
      .take(200);

    const sortedSteps = steps.sort((a, b) => a.stepNumber - b.stepNumber);
    const currentStepIndex = sortedSteps.findIndex(
      (s) => s.stepNumber === enrollment.currentStepNumber
    );

    if (args.success && currentStepIndex >= 0) {
      await ctx.db.patch(sortedSteps[currentStepIndex]._id, {
        sentCount: (sortedSteps[currentStepIndex].sentCount || 0) + 1,
      });
    }

    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex >= sortedSteps.length) {
      await ctx.db.patch(args.enrollmentId, {
        status: "completed",
        completedAt: Date.now(),
        nextSendAt: undefined,
      });

      const campaign = await ctx.db.get(enrollment.campaignId);
      if (campaign) {
        await ctx.db.patch(enrollment.campaignId, {
          totalCompleted: (campaign.totalCompleted || 0) + 1,
        });
      }
    } else {
      const nextStep = sortedSteps[nextStepIndex];
      const nextSendAt = Date.now() + nextStep.delayMinutes * 60 * 1000;

      await ctx.db.patch(args.enrollmentId, {
        currentStepNumber: nextStep.stepNumber,
        nextSendAt,
        lastSentAt: Date.now(),
      });
    }

    return null;
  },
});

export const getCampaignInternal = internalQuery({
  args: { campaignId: v.id("dripCampaigns") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const steps = await ctx.db
      .query("dripCampaignSteps")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .take(200);

    return {
      ...campaign,
      steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
    };
  },
});

export const getActiveCampaignsByTrigger = internalQuery({
  args: {
    storeId: v.string(),
    triggerType: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("dripCampaigns")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(q.eq(q.field("isActive"), true), q.eq(q.field("triggerType"), args.triggerType))
      )
      .take(5000);

    return campaigns;
  },
});

export const enrollContactInternal = internalMutation({
  args: {
    campaignId: v.id("dripCampaigns"),
    email: v.string(),
    name: v.optional(v.string()),
    customerId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.union(v.id("dripCampaignEnrollments"), v.null()),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || !campaign.isActive) return null;

    const existing = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId_and_email", (q) =>
        q.eq("campaignId", args.campaignId).eq("email", args.email)
      )
      .first();

    if (existing) return null;

    const steps = await ctx.db
      .query("dripCampaignSteps")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    if (steps.length === 0) return null;

    const firstStep = steps.sort((a, b) => a.stepNumber - b.stepNumber)[0];
    const nextSendAt = Date.now() + firstStep.delayMinutes * 60 * 1000;

    const enrollmentId = await ctx.db.insert("dripCampaignEnrollments", {
      campaignId: args.campaignId,
      email: args.email,
      name: args.name,
      customerId: args.customerId,
      currentStepNumber: 1,
      status: "active",
      nextSendAt,
      enrolledAt: Date.now(),
      metadata: args.metadata,
    });

    await ctx.db.patch(args.campaignId, {
      totalEnrolled: (campaign.totalEnrolled || 0) + 1,
    });

    return enrollmentId;
  },
});

export const recoverStuckEnrollments = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const stuckEnrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .filter((q) =>
        q.and(q.eq(q.field("status"), "active"), q.lt(q.field("nextSendAt"), oneHourAgo))
      )
      .take(50);

    let recovered = 0;
    for (const enrollment of stuckEnrollments) {
      await ctx.db.patch(enrollment._id, {
        nextSendAt: Date.now(),
      });
      recovered++;
    }

    return recovered;
  },
});
