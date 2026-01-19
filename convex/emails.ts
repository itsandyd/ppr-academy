"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import crypto from "crypto";
import { Id } from "./_generated/dataModel";

// ============================================================================
// API KEY ENCRYPTION/DECRYPTION (AES-256-GCM)
// ============================================================================

const ENCRYPTION_PREFIX = "enc:v1:";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM

/**
 * Derive a 256-bit key from the encryption secret using PBKDF2
 */
function deriveKeySync(secret: string): Buffer {
  const salt = Buffer.from("ppr-academy-api-key-encryption-v1");
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, "sha256");
}

/**
 * Encrypt an API key using AES-256-GCM
 * Returns format: "enc:v1:<base64(iv)>:<base64(ciphertext)>:<base64(authTag)>"
 */
export function encryptApiKey(plaintext: string): string {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!secret) {
    console.warn("API_KEY_ENCRYPTION_SECRET not set - storing API key unencrypted");
    return plaintext;
  }

  try {
    const key = deriveKeySync(secret);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let ciphertext = cipher.update(plaintext, "utf8", "base64");
    ciphertext += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    const ivBase64 = iv.toString("base64");
    const authTagBase64 = authTag.toString("base64");

    return `${ENCRYPTION_PREFIX}${ivBase64}:${ciphertext}:${authTagBase64}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt an encrypted API key using AES-256-GCM
 * Expects format: "enc:v1:<base64(iv)>:<base64(ciphertext)>:<base64(authTag)>"
 */
export function decryptApiKey(encryptedValue: string): string {
  // If not encrypted, return as-is (backward compatibility)
  if (!encryptedValue.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedValue;
  }

  const secret = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET not set - cannot decrypt API key");
  }

  try {
    const withoutPrefix = encryptedValue.slice(ENCRYPTION_PREFIX.length);
    const [ivBase64, ciphertext, authTagBase64] = withoutPrefix.split(":");

    if (!ivBase64 || !ciphertext || !authTagBase64) {
      throw new Error("Invalid encrypted format");
    }

    const key = deriveKeySync(secret);
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt API key");
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}

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
    storeName?: string;
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
    .replace(/\{\{storeName\}\}/g, recipient.storeName || "")
    .replace(/\{\{store_name\}\}/g, recipient.storeName || "")
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
          storeName: recipient.storeName,
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
          storeName: recipient.storeName,
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
    }> = await ctx.runMutation(internal.emailQueries.getContactsByIds, {
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
        await ctx.runMutation(internal.emailQueries.incrementContactEmailsSent, {
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

// getContactsByIds, incrementContactEmailsSent moved to emailQueries.ts

// ============================================================================
// SECURE RESEND CONNECTION ACTIONS (with API key encryption)
// ============================================================================

/**
 * Connect admin Resend account with encrypted API key storage
 * This is the recommended way to connect admin Resend accounts
 */
export const connectAdminResendSecure = action({
  args: {
    resendApiKey: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.id("resendConnections"),
  handler: async (ctx, args): Promise<Id<"resendConnections">> => {
    // Encrypt the API key before storing
    const encryptedApiKey = encryptApiKey(args.resendApiKey);

    // Store the connection with encrypted key
    const connectionId = await ctx.runMutation(internal.emailQueries.saveAdminResendConnection, {
      encryptedApiKey,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyToEmail: args.replyToEmail,
      userId: args.userId,
    });

    return connectionId;
  },
});

/**
 * Connect store Resend account with encrypted API key storage
 * This is the recommended way to connect store Resend accounts
 */
export const connectStoreResendSecure = action({
  args: {
    storeId: v.id("stores"),
    resendApiKey: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    replyToEmail: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.id("resendConnections"),
  handler: async (ctx, args): Promise<Id<"resendConnections">> => {
    // Encrypt the API key before storing
    const encryptedApiKey = encryptApiKey(args.resendApiKey);

    // Store the connection with encrypted key
    const connectionId = await ctx.runMutation(internal.emailQueries.saveStoreResendConnection, {
      storeId: args.storeId,
      encryptedApiKey,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyToEmail: args.replyToEmail,
      userId: args.userId,
    });

    return connectionId;
  },
});

/**
 * Get decrypted API key for a connection (internal use only)
 * Used when sending emails that require a custom API key
 */
export const getDecryptedApiKey = internalAction({
  args: {
    connectionId: v.id("resendConnections"),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const connection = await ctx.runQuery(internal.emailQueries.getConnectionById, {
      connectionId: args.connectionId,
    });

    if (!connection) {
      throw new Error("Connection not found");
    }

    return decryptApiKey(connection.resendApiKey);
  },
});

/**
 * Migrate existing unencrypted API keys to encrypted format
 * Run this once to encrypt all existing API keys
 */
export const migrateApiKeysToEncrypted = internalAction({
  args: {},
  handler: async (ctx) => {
    const adminConnection = await ctx.runQuery(
      internal.emailQueries.getAdminConnectionInternal,
      {}
    );

    let migratedCount = 0;
    const errors: string[] = [];

    // Check admin connection
    if (adminConnection && !isEncrypted(adminConnection.resendApiKey)) {
      try {
        const encryptedKey = encryptApiKey(adminConnection.resendApiKey);
        await ctx.runMutation(internal.emailQueries.updateConnectionApiKey, {
          connectionId: adminConnection._id,
          encryptedApiKey: encryptedKey,
        });
        migratedCount++;
        console.log("Migrated admin connection API key");
      } catch (error) {
        errors.push(`Failed to migrate admin connection: ${error}`);
      }
    }

    // Note: Store connections would need to be queried and migrated similarly
    // For now, we just handle the admin connection

    return {
      migratedCount,
      errors,
      message:
        errors.length > 0
          ? `Migrated ${migratedCount} connections with ${errors.length} errors`
          : `Successfully migrated ${migratedCount} connections`,
    };
  },
});

// updateConnectionApiKey moved to emailQueries.ts
