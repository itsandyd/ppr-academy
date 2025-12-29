import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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
      .collect();

    const enrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

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
      .collect();
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
      .collect();

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    const enrollments = await ctx.db
      .query("dripCampaignEnrollments")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

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
      .collect();
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
      .collect();

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

export const processDueDripEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const dueEnrollments = await ctx.runQuery(internal.dripCampaigns.getDueEnrollments, {
      limit: 50,
    });

    console.log(`[Drip] Processing ${dueEnrollments.length} due enrollments`);

    let sent = 0;
    let failed = 0;

    for (const enrollment of dueEnrollments) {
      try {
        const campaign = await ctx.runQuery(internal.dripCampaigns.getCampaignInternal, {
          campaignId: enrollment.campaignId,
        });

        if (!campaign || !campaign.isActive) {
          await ctx.runMutation(internal.dripCampaigns.advanceEnrollment, {
            enrollmentId: enrollment._id,
            success: false,
          });
          continue;
        }

        const step = campaign.steps.find((s: any) => s.stepNumber === enrollment.currentStepNumber);

        if (!step || !step.isActive) {
          await ctx.runMutation(internal.dripCampaigns.advanceEnrollment, {
            enrollmentId: enrollment._id,
            success: false,
          });
          continue;
        }

        const suppressionResults = await ctx.runQuery(
          internal.emailUnsubscribe.checkSuppressionBatch,
          {
            emails: [enrollment.email],
          }
        );
        const suppression = suppressionResults[0];

        if (suppression.suppressed) {
          console.log(`[Drip] Skipping ${enrollment.email}: ${suppression.reason}`);
          await ctx.runMutation(internal.dripCampaigns.advanceEnrollment, {
            enrollmentId: enrollment._id,
            success: false,
          });
          continue;
        }

        await ctx.runAction(internal.dripCampaigns.sendDripEmail, {
          enrollmentId: enrollment._id,
          email: enrollment.email,
          name: enrollment.name || "",
          subject: step.subject,
          htmlContent: step.htmlContent,
          textContent: step.textContent,
        });

        await ctx.runMutation(internal.dripCampaigns.advanceEnrollment, {
          enrollmentId: enrollment._id,
          success: true,
        });

        sent++;
      } catch (error) {
        console.error(`[Drip] Failed to process enrollment ${enrollment._id}:`, error);
        failed++;
      }
    }

    console.log(`[Drip] Complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  },
});

export const sendDripEmail = internalAction({
  args: {
    enrollmentId: v.id("dripCampaignEnrollments"),
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    const resend = new Resend(process.env.RESEND_API_KEY);

    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.email).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.email).digest("base64url");
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com"}/unsubscribe/${emailBase64}.${signature}`;

    const firstName = args.name.split(" ")[0] || "there";
    const personalizedHtml = args.htmlContent
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, args.name || "there")
      .replace(/\{\{email\}\}/g, args.email)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const personalizedSubject = args.subject
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, args.name || "there");

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: args.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: args.textContent,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
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
      .collect();

    return {
      ...campaign,
      steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
    };
  },
});

export const triggerCampaignsForEvent = internalAction({
  args: {
    storeId: v.string(),
    triggerType: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    customerId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.runQuery(internal.dripCampaigns.getActiveCampaignsByTrigger, {
      storeId: args.storeId,
      triggerType: args.triggerType,
    });

    console.log(`[Drip] Found ${campaigns.length} campaigns for ${args.triggerType} trigger`);

    for (const campaign of campaigns) {
      await ctx.runMutation(internal.dripCampaigns.enrollContactInternal, {
        campaignId: campaign._id,
        email: args.email,
        name: args.name,
        customerId: args.customerId,
        metadata: args.metadata,
      });
    }
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
      .collect();

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

    if (recovered > 0) {
      console.log(`[Drip] Recovered ${recovered} stuck enrollments`);
    }

    return recovered;
  },
});
