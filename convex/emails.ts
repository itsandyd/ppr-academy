"use node";

import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";

// Initialize Resend with environment variable or API key
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

/**
 * Replace personalization tokens in content
 */
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
  }
): string {
  // Extract first name from full name
  const firstName = recipient.name.split(' ')[0] || recipient.name;
  
  return content
    // {{firstName}} or {{first_name}}
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{first_name\}\}/g, firstName)
    // {{name}} or {{fullName}}
    .replace(/\{\{name\}\}/g, recipient.name)
    .replace(/\{\{fullName\}\}/g, recipient.name)
    .replace(/\{\{full_name\}\}/g, recipient.name)
    // {{email}}
    .replace(/\{\{email\}\}/g, recipient.email)
    // Producer/Fan specific fields
    .replace(/\{\{musicAlias\}\}/g, recipient.musicAlias || '')
    .replace(/\{\{daw\}\}/g, recipient.daw || '')
    .replace(/\{\{studentLevel\}\}/g, recipient.studentLevel || '')
    // Location fields
    .replace(/\{\{city\}\}/g, recipient.city || '')
    .replace(/\{\{state\}\}/g, recipient.state || '')
    .replace(/\{\{country\}\}/g, recipient.country || '')
    // Legacy support for {{customer.name}}
    .replace(/\{\{customer\.name\}\}/g, recipient.name);
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
        
        console.log(`📧 Processing batch of ${recipients.length} recipients (total sent so far: ${totalSent})`);
        
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

    // Send emails in this batch
    for (const recipient of args.recipients) {
      try {
        // Personalize content
        const personalizedHtml = personalizeContent(htmlContent, {
          name: recipient.name || 'there',
          email: recipient.email,
          musicAlias: recipient.musicAlias,
          daw: recipient.daw,
          studentLevel: recipient.studentLevel,
          city: recipient.city,
          state: recipient.state,
          country: recipient.country,
        });

        const personalizedSubject = personalizeContent(campaign.subject, {
          name: recipient.name || 'there',
          email: recipient.email,
          musicAlias: recipient.musicAlias,
          daw: recipient.daw,
          studentLevel: recipient.studentLevel,
          city: recipient.city,
          state: recipient.state,
          country: recipient.country,
        });

        // Send email
        await resend.emails.send({
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: textContent,
          replyTo: replyToEmail,
        });

        // Update recipient status
        if (recipient.recipientId) {
          await ctx.runMutation(internal.emailQueries.updateRecipientStatus, {
            recipientId: recipient.recipientId,
            status: "sent",
          });
        }

        sent++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        
        // Update recipient status to failed
        if (recipient.recipientId) {
          await ctx.runMutation(internal.emailQueries.updateRecipientStatus, {
            recipientId: recipient.recipientId,
            status: "failed",
          });
        }
        
        failed++;
      }
    }

    return { sent, failed };
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
                ${args.fromName ? `<li><strong>From Name:</strong> ${args.fromName}</li>` : ''}
                ${args.replyToEmail ? `<li><strong>Reply-to:</strong> ${args.replyToEmail}</li>` : ''}
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
        errorMessage += "Please verify your 'from' email address is from a verified domain in Resend.";
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

