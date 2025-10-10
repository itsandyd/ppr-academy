"use node";

import { action, internalAction } from "./_generated/server";
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

// ============================================================================
// EMAIL ACTIONS (Node.js Runtime - Resend Integration)
// ============================================================================

/**
 * Process and send campaign emails (INTERNAL)
 */
export const processCampaign = internalAction({
  args: {
    campaignId: v.id("resendCampaigns"),
  },
  handler: async (ctx, args) => {
    try {
      const campaign = await ctx.runQuery(internal.emailQueries.getCampaignById, {
        campaignId: args.campaignId,
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Update status to sending
      await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "sending",
      });

      // Get recipients
      const recipients = await ctx.runQuery(internal.emailQueries.getCampaignRecipients, {
        campaignId: args.campaignId,
      });

      // Update recipient count
      await ctx.runMutation(internal.emailQueries.updateCampaignMetrics, {
        campaignId: args.campaignId,
        recipientCount: recipients.length,
      });

      const resend = getResendClient();
      if (!resend) {
        throw new Error("Resend not configured");
      }

      // Get connection for sender details
      const connection = await ctx.runQuery(internal.emailQueries.getConnectionById, {
        connectionId: campaign.connectionId,
      });

      if (!connection) {
        throw new Error("Connection not found");
      }

      // Get email content
      let htmlContent = campaign.htmlContent || "";
      let textContent = campaign.textContent || "";

      if (campaign.templateId) {
        const template = await ctx.runQuery(internal.emailQueries.getTemplateById, {
          templateId: campaign.templateId,
        });
        if (template) {
          htmlContent = template.htmlContent;
          textContent = template.textContent;
        }
      }

      // Send in batches of 50 to avoid rate limits
      const batchSize = 50;
      let sentCount = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (recipient) => {
            try {
              const result = await resend.emails.send({
                from: connection.fromName 
                  ? `${connection.fromName} <${connection.fromEmail}>` 
                  : connection.fromEmail,
                to: recipient.email,
                subject: campaign.subject,
                html: htmlContent,
                text: textContent,
                replyTo: connection.replyToEmail || connection.fromEmail,
              });

              // Log email send
              await ctx.runMutation(internal.emailQueries.logEmail, {
                connectionId: campaign.connectionId,
                resendEmailId: result.data?.id,
                recipientEmail: recipient.email,
                recipientUserId: recipient.userId,
                recipientName: recipient.name,
                campaignId: args.campaignId,
                templateId: campaign.templateId,
                subject: campaign.subject,
                fromEmail: connection.fromEmail,
                fromName: connection.fromName || "",
                status: result.error ? "failed" : "sent",
                errorMessage: result.error?.message,
              });

              return { success: !result.error };
            } catch (error: any) {
              // Log failed send
              await ctx.runMutation(internal.emailQueries.logEmail, {
                connectionId: campaign.connectionId,
                recipientEmail: recipient.email,
                recipientUserId: recipient.userId,
                recipientName: recipient.name,
                campaignId: args.campaignId,
                templateId: campaign.templateId,
                subject: campaign.subject,
                fromEmail: connection.fromEmail,
                fromName: connection.fromName || "",
                status: "failed",
                errorMessage: error.message,
              });
              return { success: false };
            }
          })
        );

        const successCount = results.filter(
          (r) => r.status === "fulfilled" && (r.value as any).success
        ).length;
        sentCount += successCount;

        // Update progress
        await ctx.runMutation(internal.emailQueries.updateCampaignMetrics, {
          campaignId: args.campaignId,
          sentCount,
        });

        // Delay between batches to respect rate limits
        if (i + batchSize < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Mark campaign as sent
      await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "sent",
        sentAt: Date.now(),
      });
    } catch (error) {
      console.error("Campaign processing failed:", error);
      await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "failed",
      });
    }
  },
});

/**
 * Process automation triggers (INTERNAL - called by cron)
 */
export const processAutomationTriggers = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active automations
    const automations = await ctx.runQuery(internal.emailQueries.getActiveAutomations);

    for (const automation of automations) {
      try {
        switch (automation.triggerType) {
          case "user_signup":
            // TODO: Implement trigger logic
            break;
          case "course_enrollment":
            // TODO: Implement trigger logic
            break;
          case "course_completion":
            // TODO: Implement trigger logic
            break;
          case "inactivity":
            // TODO: Implement trigger logic
            break;
          // Add more trigger types as needed
        }
      } catch (error) {
        console.error(`Automation ${automation._id} failed:`, error);
      }
    }
  },
});

/**
 * Process scheduled campaigns (INTERNAL - called by cron)
 */
export const processScheduledCampaigns = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all scheduled campaigns that should be sent
    const campaigns = await ctx.runQuery(internal.emailQueries.getScheduledCampaigns, {
      beforeTimestamp: now,
    });

    for (const campaign of campaigns) {
      try {
        await ctx.runAction(internal.emails.processCampaign, {
          campaignId: campaign._id,
        });
      } catch (error) {
        console.error(`Failed to process campaign ${campaign._id}:`, error);
      }
    }
  },
});

/**
 * Cleanup old logs (INTERNAL - called by cron)
 */
export const cleanupOldLogs = internalAction({
  args: {},
  handler: async (ctx) => {
    // Delete logs older than 90 days
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    
    const oldLogs = await ctx.runQuery(internal.emailQueries.getOldLogs, {
      cutoffTime: ninetyDaysAgo,
    });

    for (const log of oldLogs) {
      await ctx.runMutation(internal.emailQueries.deleteLog, {
        logId: log._id,
      });
    }

    console.log(`Cleaned up ${oldLogs.length} old email logs`);
  },
});

// ============================================================================
// DOMAIN VERIFICATION ACTIONS
// ============================================================================

/**
 * Verify domain with Resend API
 * Checks domain DNS records and updates verification status
 */
export const verifyDomain = action({
  args: {
    connectionId: v.id("resendConnections"),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.union(
      v.literal("verified"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("not_verified")
    ),
    message: v.string(),
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
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    status: "verified" | "pending" | "failed" | "not_verified";
    message: string;
    dnsRecords?: {
      spf: { record: string; valid: boolean };
      dkim: { record: string; valid: boolean };
      dmarc?: { record: string; valid: boolean };
    };
  }> => {
    try {
      // Get connection details
      const connection: any = await ctx.runQuery(internal.emailQueries.getConnectionById, {
        connectionId: args.connectionId,
      });

      if (!connection) {
        return {
          success: false,
          status: "failed" as const,
          message: "Connection not found",
        };
      }

      // Initialize Resend with connection's API key
      const resend = getResendClient(connection.resendApiKey);
      if (!resend) {
        return {
          success: false,
          status: "failed" as const,
          message: "Resend client not initialized",
        };
      }

      // Extract domain from email
      const domain: string = connection.fromEmail.split("@")[1];
      if (!domain) {
        return {
          success: false,
          status: "failed" as const,
          message: "Invalid email format",
        };
      }

      try {
        // Check domain with Resend API
        const domainResponse = await resend.domains.get(domain);

        // Check if response is successful
        if (domainResponse.error) {
          throw new Error(domainResponse.error.message);
        }

        const domainInfo = domainResponse.data;

        // Parse DNS records from Resend response
        const records = domainInfo.records || [];
        const domainStatus = domainInfo.status || "not_found";

        // Type-safe DNS records parsing
        const dnsRecords: {
          spf: { record: string; valid: boolean };
          dkim: { record: string; valid: boolean };
          dmarc?: { record: string; valid: boolean };
        } = {
          spf: {
            record: "v=spf1 include:spf.resend.com ~all",
            valid: domainStatus === "verified",
          },
          dkim: {
            record: "resend._domainkey",
            valid: domainStatus === "verified",
          },
          dmarc: {
            record: `v=DMARC1; p=none; rua=mailto:postmaster@${domain}`,
            valid: domainStatus === "verified",
          },
        };

        const verificationStatus = domainStatus === "verified" 
          ? "verified" as const
          : domainStatus === "pending" 
          ? "pending" as const
          : domainStatus === "failed"
          ? "failed" as const
          : "not_verified" as const;

        // Update connection with verification status
        await ctx.runMutation(internal.emailQueries.updateDomainVerification, {
          connectionId: args.connectionId,
          status: verificationStatus,
          dnsRecords,
        });

        return {
          success: true,
          status: verificationStatus,
          message: domainStatus === "verified"
            ? "Domain verified successfully"
            : domainStatus === "pending"
            ? "Domain verification pending - please check DNS records"
            : "Domain verification failed",
          dnsRecords,
        };
      } catch (apiError: any) {
        // Resend API might not support domain verification yet
        // Return manual verification instructions
        console.error("Resend API domain check error:", apiError);

        const dnsRecords = {
          spf: {
            record: `v=spf1 include:spf.resend.com ~all`,
            valid: false,
          },
          dkim: {
            record: `resend._domainkey IN TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"`,
            valid: false,
          },
          dmarc: {
            record: `v=DMARC1; p=none; rua=mailto:postmaster@${domain}`,
            valid: false,
          },
        };

        await ctx.runMutation(internal.emailQueries.updateDomainVerification, {
          connectionId: args.connectionId,
          status: "not_verified" as const,
          dnsRecords,
        });

        return {
          success: false,
          status: "not_verified" as const,
          message: "Manual verification required - please add DNS records",
          dnsRecords,
        };
      }
    } catch (error: any) {
      console.error("Domain verification error:", error);
      return {
        success: false,
        status: "failed" as const,
        message: error.message || "Domain verification failed",
      };
    }
  },
});

// ============================================================================
// WEEKLY DIGEST ACTIONS
// ============================================================================

/**
 * Send weekly digest emails to all eligible users
 * Called by cron job
 */
export const sendWeeklyDigests = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("[Weekly Digest] Starting weekly digest send...");

    try {
      // Get users eligible for digest
      const users = await ctx.runQuery(internal.emailQueries.getUsersForWeeklyDigest);

      console.log(`[Weekly Digest] Found ${users.length} eligible users`);

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      // Get admin connection for platform-wide emails
      const connection = await ctx.runQuery(internal.emailQueries.getAdminConnectionInternal);

      if (!connection) {
        console.error("[Weekly Digest] No admin connection found");
        return null;
      }

      const resend = getResendClient(connection.resendApiKey);
      if (!resend) {
        console.error("[Weekly Digest] Resend client not initialized");
        return null;
      }

      // Process users in batches of 10
      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);

        for (const user of batch) {
          try {
            // Get digest data for this user
            const digestData = await ctx.runQuery(internal.emailQueries.getUserDigestData, {
              userId: user.userId,
            });

            // Skip if no meaningful data
            if (
              digestData.stats.activeCourses === 0 &&
              digestData.newCourses.length === 0 &&
              digestData.certificates.length === 0
            ) {
              skipped++;
              continue;
            }

            // Compose digest email
            const subject = `Your Weekly Summary - ${digestData.stats.completedThisWeek} certificates earned!`;
            const htmlContent = composeDigestHTML(user, digestData);
            const textContent = composeDigestText(user, digestData);

            // Send email
            const result = await resend.emails.send({
              from: connection.fromName
                ? `${connection.fromName} <${connection.fromEmail}>`
                : connection.fromEmail,
              to: user.email,
              subject,
              html: htmlContent,
              text: textContent,
              replyTo: connection.replyToEmail || connection.fromEmail,
            });

            if (result.error) {
              failed++;
              console.error(`[Weekly Digest] Failed for ${user.email}:`, result.error);
              continue;
            }

            // Log email
            const logId = await ctx.runMutation(internal.emailQueries.logEmail, {
              connectionId: connection._id,
              resendEmailId: result.data?.id,
              recipientEmail: user.email,
              recipientUserId: user.userId,
              recipientName: user.name,
              templateId: undefined,
              subject,
              fromEmail: connection.fromEmail,
              fromName: connection.fromName || "",
              status: "sent",
            });

            // Mark digest as sent
            await ctx.runMutation(internal.emailQueries.markDigestSent, {
              userId: user.userId,
              emailLogId: logId,
            });

            sent++;
          } catch (error: any) {
            failed++;
            console.error(`[Weekly Digest] Error for ${user.email}:`, error);
          }
        }

        // Small delay between batches to respect rate limits
        if (i + batchSize < users.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `[Weekly Digest] Complete! Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`
      );
      return null;
    } catch (error) {
      console.error("[Weekly Digest] Fatal error:", error);
      return null;
    }
  },
});

// Helper function to compose digest HTML
function composeDigestHTML(
  user: { name: string; email: string },
  data: any
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Summary</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Your Weekly Summary 📊</h1>
  <p>Hi ${user.name},</p>
  <p>Here's what happened in your learning journey this week:</p>
  
  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0;">Your Stats</h2>
    <p><strong>Active Courses:</strong> ${data.stats.activeCourses}</p>
    <p><strong>Certificates Earned:</strong> ${data.stats.completedThisWeek}</p>
    <p><strong>Average Progress:</strong> ${Math.round(data.stats.totalProgress)}%</p>
  </div>

  ${
    data.courseProgress.length > 0
      ? `
  <h2>Courses In Progress</h2>
  ${data.courseProgress
    .map(
      (course: any) => `
    <div style="border-left: 4px solid #2563eb; padding-left: 15px; margin: 15px 0;">
      <h3 style="margin: 0 0 5px 0;">${course.courseTitle}</h3>
      <p style="margin: 0; color: #666;">Progress: ${course.progress}% (${course.completedLessons}/${course.totalLessons} lessons)</p>
    </div>
  `
    )
    .join("")}
  `
      : ""
  }

  ${
    data.newCourses.length > 0
      ? `
  <h2>New Courses This Week</h2>
  ${data.newCourses
    .map(
      (course: any) => `
    <div style="margin: 15px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
      <p style="margin: 0; color: #666;">${course.description || "No description"}</p>
    </div>
  `
    )
    .join("")}
  `
      : ""
  }

  ${
    data.certificates.length > 0
      ? `
  <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #065f46;">🎉 Congratulations!</h2>
    <p>You earned ${data.certificates.length} certificate${data.certificates.length > 1 ? "s" : ""} this week!</p>
  </div>
  `
      : ""
  }

  <p style="margin-top: 30px;">Keep up the great work! 🚀</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #999;">
    You're receiving this because you're subscribed to weekly digest emails.
    <a href="#" style="color: #2563eb;">Manage preferences</a>
  </p>
</body>
</html>
  `;
}

// Helper function to compose digest text
function composeDigestText(
  user: { name: string; email: string },
  data: any
): string {
  let text = `Your Weekly Summary\n\n`;
  text += `Hi ${user.name},\n\n`;
  text += `Here's what happened in your learning journey this week:\n\n`;
  text += `Your Stats:\n`;
  text += `- Active Courses: ${data.stats.activeCourses}\n`;
  text += `- Certificates Earned: ${data.stats.completedThisWeek}\n`;
  text += `- Average Progress: ${Math.round(data.stats.totalProgress)}%\n\n`;

  if (data.courseProgress.length > 0) {
    text += `Courses In Progress:\n`;
    data.courseProgress.forEach((course: any) => {
      text += `- ${course.courseTitle}: ${course.progress}% (${course.completedLessons}/${course.totalLessons} lessons)\n`;
    });
    text += `\n`;
  }

  if (data.newCourses.length > 0) {
    text += `New Courses This Week:\n`;
    data.newCourses.forEach((course: any) => {
      text += `- ${course.title}\n`;
    });
    text += `\n`;
  }

  if (data.certificates.length > 0) {
    text += `🎉 Congratulations! You earned ${data.certificates.length} certificate${data.certificates.length > 1 ? "s" : ""} this week!\n\n`;
  }

  text += `Keep up the great work! 🚀\n\n`;
  text += `---\n`;
  text += `You're receiving this because you're subscribed to weekly digest emails.`;

  return text;
}

// ============================================================================
// EMAIL STATUS SYNC ACTIONS
// ============================================================================

/**
 * Sync email statuses with Resend API
 * Backup for missed webhooks
 */
export const syncEmailStatuses = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("[Email Sync] Starting email status sync...");

    try {
      // Get emails that need syncing
      const emailsToSync = await ctx.runQuery(
        internal.emailQueries.getEmailsNeedingSync,
        { limit: 50 }
      );

      if (emailsToSync.length === 0) {
        console.log("[Email Sync] No emails need syncing");
        return null;
      }

      console.log(`[Email Sync] Syncing ${emailsToSync.length} emails`);

      // Get connection (assumes admin connection for now)
      const connection = await ctx.runQuery(internal.emailQueries.getAdminConnectionInternal);

      if (!connection) {
        console.error("[Email Sync] No admin connection found");
        return null;
      }

      const resend = getResendClient(connection.resendApiKey);
      if (!resend) {
        console.error("[Email Sync] Resend client not initialized");
        return null;
      }

      let updated = 0;
      let failed = 0;

      for (const emailLog of emailsToSync) {
        try {
          if (!emailLog.resendEmailId) continue;

          // Fetch email status from Resend API
          const emailInfo = await resend.emails.get(emailLog.resendEmailId);

          if (emailInfo.error) {
            failed++;
            console.error(
              `[Email Sync] Failed to fetch ${emailLog.resendEmailId}:`,
              emailInfo.error
            );
            continue;
          }

          const data = emailInfo.data;

          // Determine status from Resend response
          let status: "sent" | "delivered" | "bounced" | "failed" = "sent";
          let deliveredAt: number | undefined;
          let bouncedAt: number | undefined;
          let bounceReason: string | undefined;

          // Resend email status mapping
          if (data.last_event === "delivered") {
            status = "delivered";
            deliveredAt = data.created_at ? new Date(data.created_at).getTime() : Date.now();
          } else if (data.last_event === "bounced") {
            status = "bounced";
            bouncedAt = data.created_at ? new Date(data.created_at).getTime() : Date.now();
            bounceReason = "Email bounced";
          } else if (data.last_event === "failed") {
            status = "failed";
          }

          // Only update if status changed
          if (status !== emailLog.status) {
            await ctx.runMutation(internal.emailQueries.updateEmailStatusFromSync, {
              emailLogId: emailLog._id,
              status,
              deliveredAt,
              bouncedAt,
              bounceReason,
            });
            updated++;
          }
        } catch (error: any) {
          failed++;
          console.error(`[Email Sync] Error syncing ${emailLog._id}:`, error);
        }

        // Small delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`[Email Sync] Complete! Updated: ${updated}, Failed: ${failed}`);
      return null;
    } catch (error) {
      console.error("[Email Sync] Fatal error:", error);
      return null;
    }
  },
});
