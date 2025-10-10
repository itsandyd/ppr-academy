import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Resend Email System Schema
 * Supports both admin-level (platform) and store-level (per-creator) email management
 */

// Resend Email API connections
export const resendConnectionsTable = defineTable({
  // Connection ownership
  type: v.union(v.literal("admin"), v.literal("store")),
  storeId: v.optional(v.id("stores")), // Only for store-level connections
  userId: v.string(), // Clerk ID of owner
  
  // Resend API key (encrypted in production)
  resendApiKey: v.string(),
  
  // Sender email configuration
  fromEmail: v.string(), // e.g., "noreply@ppracademy.com" or "andrew@creator.com"
  fromName: v.string(), // e.g., "PPR Academy" or "Andrew's Courses"
  replyToEmail: v.optional(v.string()),
  domain: v.optional(v.string()), // Domain extracted from fromEmail
  
  // Connection status
  isActive: v.boolean(),
  isVerified: v.boolean(), // Domain/email verified in Resend
  status: v.optional(v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error"))),
  
  // Domain Verification
  domainVerificationStatus: v.optional(
    v.union(
      v.literal("verified"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("not_verified")
    )
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
  domainLastChecked: v.optional(v.number()),
  
  // Settings
  enableAutomations: v.boolean(), // Enable automated emails
  enableCampaigns: v.boolean(), // Enable broadcast campaigns
  
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Resend email templates (reusable email designs)
export const resendTemplatesTable = defineTable({
  // Template ownership
  connectionId: v.id("resendConnections"),
  
  // Template details
  name: v.string(),
  subject: v.string(),
  type: v.union(
    v.literal("welcome"), // New user welcome
    v.literal("launch"), // Platform/course launch
    v.literal("enrollment"), // Course enrollment confirmation
    v.literal("progress_reminder"), // Course progress reminder
    v.literal("completion"), // Course completion celebration
    v.literal("certificate"), // Certificate issued
    v.literal("new_course"), // New course announcement
    v.literal("re_engagement"), // Re-engage inactive users
    v.literal("weekly_digest"), // Weekly activity digest
    v.literal("custom") // Custom template
  ),
  
  // Email content
  htmlContent: v.string(), // HTML email body
  textContent: v.string(), // Plain text version
  
  // Template variables
  variables: v.array(v.string()), // e.g., ["userName", "courseName", "progressPercent"]
  
  // Status
  isActive: v.boolean(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Resend email campaigns (broadcast emails)
export const resendCampaignsTable = defineTable({
  // Campaign ownership
  connectionId: v.id("resendConnections"),
  templateId: v.optional(v.id("resendTemplates")),
  
  // Campaign details
  name: v.string(),
  subject: v.string(),
  
  // Email content (if not using template)
  htmlContent: v.optional(v.string()),
  textContent: v.optional(v.string()),
  
  // Targeting
  targetAudience: v.union(
    v.literal("all_users"), // All platform users
    v.literal("course_students"), // Students of specific course
    v.literal("store_students"), // All students of a creator
    v.literal("inactive_users"), // Users inactive for X days
    v.literal("completed_course"), // Users who completed specific course
    v.literal("custom_list") // Custom recipient list
  ),
  targetCourseId: v.optional(v.id("courses")),
  targetStoreId: v.optional(v.id("stores")),
  customRecipients: v.optional(v.array(v.string())), // Array of user IDs
  
  // Filters
  inactiveDays: v.optional(v.number()), // For inactive_users targeting
  
  // Campaign status
  status: v.union(
    v.literal("draft"),
    v.literal("scheduled"),
    v.literal("sending"),
    v.literal("sent"),
    v.literal("failed")
  ),
  
  // Schedule
  scheduledFor: v.optional(v.number()),
  sentAt: v.optional(v.number()),
  
  // Results
  recipientCount: v.number(),
  sentCount: v.number(),
  deliveredCount: v.number(),
  openedCount: v.number(),
  clickedCount: v.number(),
  bouncedCount: v.number(),
  complainedCount: v.number(),
  
  errorMessage: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Resend email automation rules (trigger-based emails)
export const resendAutomationsTable = defineTable({
  // Automation ownership
  connectionId: v.id("resendConnections"),
  templateId: v.id("resendTemplates"),
  
  // Automation details
  name: v.string(),
  description: v.string(),
  isActive: v.boolean(),
  
  // Trigger configuration
  triggerType: v.union(
    v.literal("user_signup"), // New user registers
    v.literal("course_enrollment"), // User enrolls in course
    v.literal("course_progress"), // User reaches X% progress
    v.literal("course_completion"), // User completes course
    v.literal("certificate_issued"), // Certificate generated
    v.literal("purchase"), // User makes purchase
    v.literal("inactivity"), // User inactive for X days
    v.literal("quiz_completion"), // User completes quiz
    v.literal("milestone") // User reaches milestone
  ),
  
  // Trigger filters
  triggerCourseId: v.optional(v.id("courses")),
  triggerStoreId: v.optional(v.id("stores")),
  progressThreshold: v.optional(v.number()), // For course_progress trigger
  inactivityDays: v.optional(v.number()), // For inactivity trigger
  
  // Delay settings
  delayMinutes: v.number(), // How long to wait before sending (0 = immediate)
  
  // Statistics
  triggeredCount: v.number(),
  sentCount: v.number(),
  lastTriggeredAt: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Resend email log (track all emails sent)
export const resendLogsTable = defineTable({
  // Email identification
  connectionId: v.id("resendConnections"),
  resendEmailId: v.optional(v.string()), // Resend's email ID
  
  // Source
  campaignId: v.optional(v.id("resendCampaigns")),
  automationId: v.optional(v.id("resendAutomations")),
  templateId: v.optional(v.id("resendTemplates")),
  
  // Recipient
  recipientUserId: v.optional(v.string()), // Clerk ID
  recipientEmail: v.string(),
  recipientName: v.optional(v.string()),
  
  // Email details
  subject: v.string(),
  fromEmail: v.string(),
  fromName: v.string(),
  
  // Status
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
  
  // Timestamps
  sentAt: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),
  openedAt: v.optional(v.number()),
  clickedAt: v.optional(v.number()),
  bouncedAt: v.optional(v.number()),
  
  // Error tracking
  errorMessage: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_resend_id", ["resendEmailId"]);

// Resend audience lists (for targeted campaigns)
export const resendAudienceListsTable = defineTable({
  // List ownership
  connectionId: v.id("resendConnections"),
  
  // List details
  name: v.string(),
  description: v.string(),
  
  // Recipients
  userIds: v.array(v.string()), // Array of Clerk IDs
  
  // Metadata
  subscriberCount: v.number(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Resend email preferences (per-user email settings)
export const resendPreferencesTable = defineTable({
  userId: v.string(), // Clerk ID
  
  // Subscription preferences
  platformEmails: v.boolean(), // Platform announcements
  courseEmails: v.boolean(), // Course-related emails
  marketingEmails: v.boolean(), // Marketing/promotional emails
  weeklyDigest: v.boolean(), // Weekly digest emails
  
  // Unsubscribe tracking
  isUnsubscribed: v.boolean(),
  unsubscribedAt: v.optional(v.number()),
  unsubscribeReason: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Resend imported contacts (for one-time imports from external lists)
export const resendImportedContactsTable = defineTable({
  connectionId: v.id("resendConnections"),
  
  // Import details
  source: v.string(), // e.g., "csv", "mailchimp", "activecampaign", "convertkit", "manual"
  fileName: v.optional(v.string()),
  totalContacts: v.number(),
  processedContacts: v.number(),
  successCount: v.number(), // Successfully imported
  errorCount: v.number(), // Failed to import
  duplicateCount: v.number(), // Already existed
  
  // Status
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("completed_with_errors"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  
  // User creation
  newUsersCreated: v.optional(v.number()), // Users that didn't exist
  existingUsersLinked: v.optional(v.number()), // Users that already existed
  
  // Tags applied to imports
  tags: v.optional(v.array(v.string())),
  
  // Errors
  errors: v.optional(v.array(v.object({
    email: v.string(),
    error: v.string(),
  }))),
  
  // Metadata
  importedBy: v.string(), // Clerk ID of user who started import
  errorMessage: v.optional(v.string()),
  
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

