"use node";

// All drip campaign emails are enqueued with source="drip" and sent via AWS SES
// through the email send queue processor (emailSendQueueActions.ts).
// These are automated nurture/promotional sequences, not user-initiated transactional emails.

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const processDueDripEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const dueEnrollments = await ctx.runQuery(internal.dripCampaigns.getDueEnrollments, {
      limit: 50,
    });

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
          { emails: [enrollment.email], storeId: campaign.storeId }
        );
        const suppression = suppressionResults[0];

        if (suppression.suppressed) {
          await ctx.runMutation(internal.dripCampaigns.advanceEnrollment, {
            enrollmentId: enrollment._id,
            success: false,
          });
          continue;
        }

        await ctx.runAction(internal.dripCampaignActions.resolveAndEnqueueDripEmail, {
          enrollmentId: enrollment._id,
          storeId: campaign.storeId,
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

    return { sent, failed };
  },
});

/**
 * Resolve drip email content and enqueue for batch sending.
 * Enqueues with source="drip" for automated nurture/promo sequences.
 * Emails are sent via AWS SES through the email send queue.
 */
export const resolveAndEnqueueDripEmail = internalAction({
  args: {
    enrollmentId: v.id("dripCampaignEnrollments"),
    storeId: v.string(),
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const crypto = await import("crypto");

    const firstName = args.name.split(" ")[0] || "";

    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";
    const emailBase64 = Buffer.from(args.email).toString("base64url");
    const storeBase64 = Buffer.from(args.storeId).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(`${args.email}|${args.storeId}`).digest("base64url");
    const token = `${emailBase64}.${storeBase64}.${signature}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe/${token}`;
    const apiUnsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${token}`;
    const personalizedHtml = args.htmlContent
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, args.name || "")
      .replace(/\{\{email\}\}/g, args.email)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const personalizedSubject = args.subject
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, args.name || "");

    const fromEmail = process.env.FROM_EMAIL || "andrew@pauseplayrepeat.com";
    const fromName = process.env.FROM_NAME || "Andrew";

    const personalizedText = args.textContent
      ?.replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, args.name || "")
      .replace(/\{\{email\}\}/g, args.email)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    // Format "to" with recipient name if available
    const toEmail = args.name
      ? `${args.name} <${args.email}>`
      : args.email;

    // Enqueue instead of sending
    await ctx.runMutation(internal.emailSendQueue.enqueueEmail, {
      storeId: args.storeId,
      source: "drip",
      dripEnrollmentId: args.enrollmentId,
      toEmail,
      fromName,
      fromEmail,
      subject: personalizedSubject,
      htmlContent: personalizedHtml,
      textContent: personalizedText,
      headers: {
        "List-Unsubscribe": `<${apiUnsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

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
