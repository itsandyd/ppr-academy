"use node";

import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import crypto from "crypto";

let resendClient: Resend | null = null;
function getResendClient(apiKey?: string) {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) {
    return null;
  }
  if (!resendClient || apiKey) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

function generateUnsubscribeUrl(email: string): string {
  const secret =
    process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback-secret";
  const emailBase64 = Buffer.from(email).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(email).digest("base64url");
  const token = `${emailBase64}.${signature}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";
  return `${baseUrl}/unsubscribe/${token}`;
}

function getListUnsubscribeHeaders(email: string): Record<string, string> {
  const url = generateUnsubscribeUrl(email);
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function personalizeContent(
  content: string,
  recipient: {
    name: string;
    email: string;
    musicAlias?: string;
    daw?: string;
    studentLevel?: string;
    city?: string;
    state?: string;
    country?: string;
    unsubscribeUrl?: string;
  }
): string {
  const firstName = recipient.name.split(" ")[0] || recipient.name;
  const unsubscribeUrl = recipient.unsubscribeUrl || generateUnsubscribeUrl(recipient.email);

  return content
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{name\}\}/g, recipient.name)
    .replace(/\{\{fullName\}\}/g, recipient.name)
    .replace(/\{\{full_name\}\}/g, recipient.name)
    .replace(/\{\{email\}\}/g, recipient.email)
    .replace(/\{\{musicAlias\}\}/g, recipient.musicAlias || "")
    .replace(/\{\{daw\}\}/g, recipient.daw || "")
    .replace(/\{\{studentLevel\}\}/g, recipient.studentLevel || "")
    .replace(/\{\{city\}\}/g, recipient.city || "")
    .replace(/\{\{state\}\}/g, recipient.state || "")
    .replace(/\{\{country\}\}/g, recipient.country || "")
    .replace(/\{\{customer\.name\}\}/g, recipient.name)
    .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
    .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl)
    .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
}

// ============================================================================
// EMAIL ACTIONS (Node.js Runtime - Resend Integration)
// ============================================================================

/**
 * Process and send campaign emails in batches (INTERNAL)
 */
export const processCampaign = internalAction({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
  },
  handler: async (ctx, args) => {
    console.log("=== STARTING CAMPAIGN PROCESSING ===");
    console.log("Campaign ID:", args.campaignId);

    try {
      const campaign = await ctx.runQuery(internal.emailQueries.getCampaignById, {
        campaignId: args.campaignId,
      });

      if (!campaign) {
        console.error("❌ Campaign not found!");
        throw new Error("Campaign not found");
      }
      console.log("✅ Campaign found:", campaign.name);

      // Validate campaign has required fields
      if (!campaign.subject) {
        throw new Error("Campaign is missing a subject line");
      }

      // Update status to sending
      await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "sending",
      });
      console.log("✅ Status updated to 'sending'");

      // Process recipients in batches
      let totalSent = 0;
      let totalFailed = 0;
      let cursor: string | null = null;
      let isDone = false;

      while (!isDone) {
        // Get a batch of recipients
        const recipientBatch: {
          recipients: Array<{
            recipientId?: any;
            email: string;
            userId?: string;
            name?: string;
            musicAlias?: string;
            daw?: string;
            studentLevel?: string;
            city?: string;
            state?: string;
            country?: string;
          }>;
          isDone: boolean;
          continueCursor: string | null;
        } = await ctx.runQuery(internal.emailQueries.getCampaignRecipients, {
          campaignId: args.campaignId,
          cursor: cursor || undefined,
          batchSize: 100,
        });

        const recipients = recipientBatch.recipients;
        isDone = recipientBatch.isDone;
        cursor = recipientBatch.continueCursor || null;

        console.log(
          `📧 Processing batch of ${recipients.length} recipients (total sent so far: ${totalSent})`
        );

        if (recipients.length === 0) {
          console.log("✅ No more recipients to process");
          break;
        }

        // Send emails in this batch
        const batchResult = await ctx.runAction(internal.emails.sendCampaignBatch, {
          campaignId: args.campaignId,
          recipients: recipients as any,
        });

        totalSent += batchResult.sent;
        totalFailed += batchResult.failed;

        console.log(`✅ Batch complete: ${batchResult.sent} sent, ${batchResult.failed} failed`);
      }

      console.log(`✅ Campaign processing complete: ${totalSent} sent, ${totalFailed} failed`);

      // Update campaign status and metrics
      await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: totalFailed === 0 ? "sent" : "failed",
        sentAt: Date.now(),
      });

      await ctx.runMutation(internal.emailQueries.updateCampaignMetrics, {
        campaignId: args.campaignId,
        sentCount: totalSent,
      });

      console.log("=== CAMPAIGN PROCESSING COMPLETE ===");
    } catch (error) {
      console.error("❌ Campaign processing failed:", error);
      await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "failed",
      });
      throw error;
    }
  },
});

/**
 * Send a batch of campaign emails (INTERNAL)
 */
export const sendCampaignBatch = internalAction({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
    recipients: v.any(), // Array of recipient objects
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.runQuery(internal.emailQueries.getCampaignById, {
      campaignId: args.campaignId,
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const resend = getResendClient();
    if (!resend) {
      throw new Error("Resend not configured");
    }

    // Check if this is an emailCampaign
    const hasEmailCampaignRecipients = await ctx.runQuery(
      internal.emailQueries.checkEmailCampaignRecipients,
      { campaignId: args.campaignId }
    );
    const isEmailCampaign = hasEmailCampaignRecipients;

    // Get email settings
    let fromEmail, fromName, replyToEmail;
    if (isEmailCampaign) {
      const emailCampaign = campaign as any;
      fromEmail = emailCampaign.fromEmail;
      fromName = "PPR Academy";
      replyToEmail = emailCampaign.replyToEmail || emailCampaign.fromEmail;
    } else {
      fromEmail = process.env.FROM_EMAIL || "noreply@yourdomain.com";
      fromName = process.env.FROM_NAME || "PPR Academy";
      replyToEmail = process.env.REPLY_TO_EMAIL || fromEmail;
    }

    // Get email content
    let htmlContent = "";
    let textContent = "";

    if (isEmailCampaign) {
      htmlContent = (campaign as any).content || "";
      textContent = "";
    } else {
      htmlContent = (campaign as any).htmlContent || "";
      textContent = (campaign as any).textContent || "";
    }

    if (!htmlContent && !textContent) {
      throw new Error("Campaign has no email content");
    }

    if (!campaign.subject) {
      throw new Error("Campaign has no subject line");
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    const emails = args.recipients.map((r: any) => r.email);
    const suppressionResults: Array<{ email: string; suppressed: boolean; reason?: string }> =
      await ctx.runQuery(internal.emailUnsubscribe.checkSuppressionBatch, { emails });
    const suppressionMap = new Map<string, { email: string; suppressed: boolean; reason?: string }>(
      suppressionResults.map((r) => [r.email.toLowerCase(), r])
    );

    for (const recipient of args.recipients) {
      try {
        const suppression = suppressionMap.get(recipient.email.toLowerCase());
        if (suppression?.suppressed) {
          console.log(`Skipping ${recipient.email}: ${suppression.reason}`);
          skipped++;
          continue;
        }

        const unsubscribeUrl = generateUnsubscribeUrl(recipient.email);
        const listUnsubscribeHeaders = getListUnsubscribeHeaders(recipient.email);

        const personalizedHtml = personalizeContent(htmlContent, {
          name: recipient.name || "there",
          email: recipient.email,
          musicAlias: recipient.musicAlias,
          daw: recipient.daw,
          studentLevel: recipient.studentLevel,
          city: recipient.city,
          state: recipient.state,
          country: recipient.country,
          unsubscribeUrl,
        });

        const personalizedSubject = personalizeContent(campaign.subject, {
          name: recipient.name || "there",
          email: recipient.email,
          musicAlias: recipient.musicAlias,
          daw: recipient.daw,
          studentLevel: recipient.studentLevel,
          city: recipient.city,
          state: recipient.state,
          country: recipient.country,
        });

        await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: textContent,
          replyTo: replyToEmail,
          headers: listUnsubscribeHeaders,
        });

        if (recipient.recipientId) {
          await ctx.runMutation(internal.emailQueries.updateRecipientStatus, {
            recipientId: recipient.recipientId,
            status: "sent",
          });
        }

        sent++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);

        if (recipient.recipientId) {
          await ctx.runMutation(internal.emailQueries.updateRecipientStatus, {
            recipientId: recipient.recipientId,
            status: "failed",
          });
        }

        failed++;
      }
    }

    return { sent, failed, skipped };
  },
});

/**
 * Public action to send a campaign
 */
export const sendCampaign = action({
  args: {
    campaignId: v.union(v.id("resendCampaigns"), v.id("emailCampaigns")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Schedule the internal processing action
    await ctx.runAction(internal.emails.processCampaign, {
      campaignId: args.campaignId,
    });
    return null;
  },
});

/**
 * Test email configuration by sending a test email
 */
export const testStoreEmailConfig = action({
  args: {
    storeId: v.id("stores"),
    testEmail: v.string(),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const resend = getResendClient();
      if (!resend) {
        return {
          success: false,
          message: "Email service not configured. Please contact support.",
        };
      }

      // Send test email
      const result = await resend.emails.send({
        from: args.fromName ? `${args.fromName} <${args.fromEmail}>` : args.fromEmail,
        to: args.testEmail,
        replyTo: args.replyToEmail || args.fromEmail,
        subject: "✅ Email Configuration Test - Success!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">🎉 Email Setup Complete!</h1>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #059669; margin: 0 0 10px 0;">Configuration Test Successful</h2>
              <p style="color: #047857; margin: 0;">Your email configuration is working perfectly!</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0;">Verified Settings:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>From Email:</strong> ${args.fromEmail}</li>
                ${args.fromName ? `<li><strong>From Name:</strong> ${args.fromName}</li>` : ""}
                ${args.replyToEmail ? `<li><strong>Reply-to:</strong> ${args.replyToEmail}</li>` : ""}
              </ul>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px;">
              <p style="color: #1e40af; margin: 0;">
                Your store can now send professional email campaigns to your customers.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This test email was sent from your store's email configuration.
              </p>
            </div>
          </div>
        `,
      });

      if (result.data?.id) {
        return {
          success: true,
          message: "Test email sent successfully! Check your inbox.",
        };
      } else {
        return {
          success: false,
          message: "Failed to send test email. Please check your configuration.",
        };
      }
    } catch (error: any) {
      console.error("Email test failed:", error);

      let errorMessage = "Failed to send test email. ";

      if (error.message?.includes("from") || error.message?.includes("sender")) {
        errorMessage +=
          "Please verify your 'from' email address is from a verified domain in Resend.";
      } else if (error.message?.includes("domain")) {
        errorMessage += "Please verify your domain is configured in Resend.";
      } else {
        errorMessage += `Error: ${error.message}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },
});

/**
 * Send a broadcast email to selected contacts (one-time send, not a campaign)
 */
export const sendBroadcastEmail = action({
  args: {
    storeId: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    contactIds: v.array(v.id("emailContacts")),
    fromName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    sent: v.number(),
    failed: v.number(),
    skipped: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    if (!args.subject.trim()) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: "Subject line is required",
      };
    }

    if (!args.htmlContent.trim()) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: "Email content is required",
      };
    }

    if (args.contactIds.length === 0) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: "No recipients selected",
      };
    }

    const resend = getResendClient();
    if (!resend) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: "Email service not configured",
      };
    }

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = args.fromName || process.env.FROM_NAME || "PPR Academy";
    const replyToEmail = process.env.REPLY_TO_EMAIL || fromEmail;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // Get all contacts
    const contacts: Array<{
      _id: any;
      email: string;
      firstName?: string;
      lastName?: string;
      status: string;
    }> = await ctx.runMutation(internal.emails.getContactsByIds, {
      contactIds: args.contactIds,
    });

    // Check suppression for all emails
    const emails = contacts.map((c) => c.email);
    const suppressionResults: Array<{ email: string; suppressed: boolean; reason?: string }> =
      await ctx.runQuery(internal.emailUnsubscribe.checkSuppressionBatch, { emails });
    const suppressionMap = new Map(suppressionResults.map((r) => [r.email.toLowerCase(), r]));

    for (const contact of contacts) {
      try {
        // Skip unsubscribed contacts
        if (contact.status !== "subscribed") {
          skipped++;
          continue;
        }

        // Check suppression
        const suppression = suppressionMap.get(contact.email.toLowerCase());
        if (suppression?.suppressed) {
          skipped++;
          continue;
        }

        const recipientName =
          contact.firstName || contact.lastName
            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
            : "there";

        const unsubscribeUrl = generateUnsubscribeUrl(contact.email);
        const listUnsubscribeHeaders = getListUnsubscribeHeaders(contact.email);

        const personalizedHtml = personalizeContent(args.htmlContent, {
          name: recipientName,
          email: contact.email,
          unsubscribeUrl,
        });

        const personalizedSubject = personalizeContent(args.subject, {
          name: recipientName,
          email: contact.email,
        });

        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: contact.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          replyTo: replyToEmail,
          headers: listUnsubscribeHeaders,
        });

        // Update contact's email sent count
        await ctx.runMutation(internal.emails.incrementContactEmailsSent, {
          contactId: contact._id,
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send broadcast to ${contact.email}:`, error);
        failed++;
      }
    }

    return {
      success: sent > 0,
      sent,
      failed,
      skipped,
      message:
        sent > 0
          ? `Successfully sent ${sent} email${sent !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}${skipped > 0 ? `, ${skipped} skipped` : ""}`
          : "Failed to send emails",
    };
  },
});

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
