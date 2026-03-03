"use node";

// MARKETING: All drip campaign emails route through RESEND_MARKETING_API_KEY.
// These are automated nurture/promotional sequences, not user-initiated transactional emails.
// Emails are enqueued with source="drip" and sent via the marketing Resend client in the
// email send queue processor (emailSendQueueActions.ts).

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
          { emails: [enrollment.email] }
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
 * Replaces the old inline-send pattern for drip campaign emails.
 *
 * MARKETING: Enqueues with source="drip" which routes through the marketing
 * Resend client (RESEND_MARKETING_API_KEY). These are automated nurture/promo
 * sequences, not user-initiated transactional emails. Ensures contact exists
 * in the Resend marketing audience before enqueuing.
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
    const { ensureMarketingContact } = await import("./lib/resendClients");
    const crypto = await import("crypto");

    // MARKETING: Ensure contact exists in Resend marketing audience before sending
    const firstName = args.name.split(" ")[0] || "there";
    await ensureMarketingContact(args.email, firstName !== "there" ? firstName : undefined);

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

    const personalizedText = args.textContent
      ?.replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, args.name || "there")
      .replace(/\{\{email\}\}/g, args.email)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    // Enqueue instead of sending
    await ctx.runMutation(internal.emailSendQueue.enqueueEmail, {
      storeId: args.storeId,
      source: "drip",
      dripEnrollmentId: args.enrollmentId,
      toEmail: args.email,
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

/**
 * Send a drip email directly via Resend.
 * LEGACY: Kept for backwards compatibility. New code uses resolveAndEnqueueDripEmail.
 * MARKETING: Routes through RESEND_MARKETING_API_KEY for billing separation.
 */
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
    const { getMarketingResendClient } = await import("./lib/resendClients");
    const crypto = await import("crypto");

    // MARKETING: Use marketing Resend client for drip campaign sends
    const resend = getMarketingResendClient();

    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";
    const emailBase64 = Buffer.from(args.email).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.email).digest("base64url");
    const token = `${emailBase64}.${signature}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe/${token}`;
    const apiUnsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${token}`;

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
