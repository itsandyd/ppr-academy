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
  // Template ownership (optional for admin templates)
  connectionId: v.optional(v.id("resendConnections")),
  
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
  // Campaign ownership (optional for admin campaigns)
  connectionId: v.optional(v.id("resendConnections")),
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
  // Automation ownership (optional for admin automations)
  connectionId: v.optional(v.id("resendConnections")),
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

// ============================================================================
// ADVANCED FEATURES - ActiveCampaign-Level Capabilities
// ============================================================================

// Note: Workflow system (emailWorkflows, workflowExecutions) already exists in main schema
// We're adding additional features here

// Lead Scoring System
export const leadScoresTable = defineTable({
  userId: v.string(), // Clerk ID
  
  // Scoring
  score: v.number(), // Current score (0-1000+)
  grade: v.union(
    v.literal("A"), // Hot leads (300+)
    v.literal("B"), // Warm leads (200-299)
    v.literal("C"), // Cold leads (100-199)
    v.literal("D")  // Inactive (0-99)
  ),
  
  // Score breakdown
  emailEngagement: v.number(), // Points from email interactions
  courseEngagement: v.number(), // Points from course activity
  purchaseActivity: v.number(), // Points from purchases
  
  // Engagement tracking
  lastActivity: v.number(),
  totalEmailsOpened: v.number(),
  totalEmailsClicked: v.number(),
  totalPurchases: v.number(),
  daysSinceLastActivity: v.number(),
  
  // Score history (last 10 changes)
  scoreHistory: v.array(v.object({
    score: v.number(),
    reason: v.string(),
    timestamp: v.number(),
  })),
  
  // Decay tracking
  lastDecayAt: v.number(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_score", ["score"])
  .index("by_grade", ["grade"]);

// Dynamic Email Segments
export const emailSegmentsTable = defineTable({
  connectionId: v.optional(v.id("resendConnections")),
  
  // Segment details
  name: v.string(),
  description: v.string(),
  
  // Conditions (composite AND/OR logic)
  conditions: v.array(v.object({
    field: v.string(), // e.g., "leadScore.score", "lastActivity", "emailsOpened"
    operator: v.union(
      v.literal("equals"),
      v.literal("not_equals"),
      v.literal("greater_than"),
      v.literal("less_than"),
      v.literal("contains"),
      v.literal("not_contains"),
      v.literal("in"),
      v.literal("not_in")
    ),
    value: v.any(),
    logic: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
  })),
  
  // Segment type
  isDynamic: v.boolean(), // Auto-update vs. static snapshot
  
  // Cache
  memberCount: v.number(),
  lastUpdated: v.number(),
  cachedUserIds: v.optional(v.array(v.string())), // Cache for performance
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_name", ["name"])
  .index("by_isDynamic", ["isDynamic"]);

// A/B Testing Framework
export const emailABTestsTable = defineTable({
  campaignId: v.id("resendCampaigns"),
  
  // Test configuration
  testType: v.union(
    v.literal("subject"),
    v.literal("content"),
    v.literal("send_time"),
    v.literal("from_name")
  ),
  
  // Variants
  variants: v.array(v.object({
    id: v.string(),
    name: v.string(),
    value: v.string(), // The variant value (subject line, content, etc.)
    percentage: v.number(), // % of sample size
    sent: v.number(),
    delivered: v.number(),
    opened: v.number(),
    clicked: v.number(),
    conversions: v.number(),
  })),
  
  // Test settings
  sampleSize: v.number(), // Number of recipients in test
  winnerMetric: v.union(
    v.literal("open_rate"),
    v.literal("click_rate"),
    v.literal("conversion_rate")
  ),
  
  // Results
  status: v.union(
    v.literal("draft"),
    v.literal("running"),
    v.literal("analyzing"),
    v.literal("completed")
  ),
  winner: v.optional(v.string()), // Variant ID
  winnerSentToRemaining: v.boolean(),
  
  // Statistical analysis
  isStatisticallySignificant: v.optional(v.boolean()),
  confidenceLevel: v.optional(v.number()), // 0-100%
  
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_campaignId", ["campaignId"])
  .index("by_status", ["status"]);

// Send Time Optimization
export const userEngagementPatternsTable = defineTable({
  userId: v.string(), // Clerk ID
  
  // Engagement patterns
  hourOfDay: v.array(v.number()), // 24 elements: engagement score per hour
  dayOfWeek: v.array(v.number()), // 7 elements: engagement score per day
  
  // Best send time
  bestSendTime: v.object({
    hour: v.number(), // 0-23
    day: v.number(), // 0-6 (Sunday=0)
    score: v.number(), // Confidence score
  }),
  
  // Timezone
  timezone: v.optional(v.string()), // e.g., "America/New_York"
  
  // Tracking
  totalEngagements: v.number(),
  lastEngagement: v.number(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"]);

// Email Health Metrics
export const emailHealthMetricsTable = defineTable({
  connectionId: v.optional(v.id("resendConnections")),
  
  // Time period
  date: v.number(), // Date timestamp (start of day)
  period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  
  // Health scores (0-100)
  listHealthScore: v.number(), // Overall list health
  engagementRate: v.number(), // % of active subscribers
  deliverabilityScore: v.number(), // Based on bounces, complaints
  
  // Metrics
  totalSubscribers: v.number(),
  activeSubscribers: v.number(), // Engaged in last 30 days
  inactiveSubscribers: v.number(),
  bounceRate: v.number(),
  spamComplaintRate: v.number(),
  unsubscribeRate: v.number(),
  
  // Trends
  subscriberGrowth: v.number(), // vs. previous period
  engagementTrend: v.union(v.literal("up"), v.literal("down"), v.literal("stable")),
  
  // Recommendations
  recommendations: v.array(v.object({
    type: v.union(
      v.literal("warning"),
      v.literal("alert"),
      v.literal("suggestion")
    ),
    message: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  })),
  
  createdAt: v.number(),
})
  .index("by_date", ["date"])
  .index("by_connectionId", ["connectionId"]);

// Campaign Goals and Tracking
export const campaignGoalsTable = defineTable({
  campaignId: v.id("resendCampaigns"),
  
  // Goal definition
  goalType: v.union(
    v.literal("open_rate"),
    v.literal("click_rate"),
    v.literal("conversions"),
    v.literal("revenue")
  ),
  goalName: v.string(),
  
  // Targets
  target: v.number(),
  targetUnit: v.string(), // "percentage", "count", "dollars"
  
  // Results
  actual: v.number(),
  achieved: v.boolean(),
  achievedAt: v.optional(v.number()),
  
  // Revenue tracking (if applicable)
  revenue: v.optional(v.number()),
  conversions: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_campaignId", ["campaignId"]);

// Spam Score Checks (pre-send analysis)
export const spamScoreChecksTable = defineTable({
  campaignId: v.optional(v.id("resendCampaigns")),
  templateId: v.optional(v.id("resendTemplates")),
  
  // Content being checked
  subject: v.string(),
  htmlContent: v.string(),
  
  // Overall score
  spamScore: v.number(), // 0-10 (0=excellent, 10=spam)
  riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  
  // Issues found
  issues: v.array(v.object({
    type: v.union(
      v.literal("subject"),
      v.literal("content"),
      v.literal("links"),
      v.literal("images"),
      v.literal("authentication")
    ),
    severity: v.union(v.literal("warning"), v.literal("error")),
    message: v.string(),
    suggestion: v.optional(v.string()),
  })),
  
  // Detailed checks
  checks: v.object({
    hasSpamWords: v.boolean(),
    hasExcessiveCaps: v.boolean(),
    hasExcessivePunctuation: v.boolean(),
    hasBrokenLinks: v.boolean(),
    hasUnsubscribeLink: v.boolean(),
    imageToTextRatio: v.number(),
    linkCount: v.number(),
  }),
  
  checkedAt: v.number(),
})
  .index("by_campaignId", ["campaignId"]);

// List Hygiene Tracking
export const listHygieneActionsTable = defineTable({
  connectionId: v.id("resendConnections"),
  
  // Action details
  actionType: v.union(
    v.literal("hard_bounce_removal"),
    v.literal("soft_bounce_suppression"),
    v.literal("complaint_removal"),
    v.literal("inactive_removal"),
    v.literal("duplicate_removal")
  ),
  
  // What was done
  affectedEmails: v.array(v.string()),
  affectedCount: v.number(),
  
  // Reason
  reason: v.string(),
  
  // Execution
  status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  executedBy: v.union(v.literal("automatic"), v.literal("manual")),
  
  executedAt: v.number(),
  createdAt: v.number(),
})
  .index("by_connectionId", ["connectionId"])
  .index("by_actionType", ["actionType"]);

// ============================================================================
// CONTACTS - ActiveCampaign-style Contact Management
// ============================================================================

export const contactsTable = defineTable({
  // Store/Connection ownership
  storeId: v.id("stores"),
  connectionId: v.optional(v.id("resendConnections")),
  
  // Core Identity
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  phone: v.optional(v.string()),
  
  // ActiveCampaign Import Fields
  activeCampaignId: v.optional(v.string()), // Original AC contact ID
  dateCreated: v.optional(v.number()),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  
  // Custom Fields - Sign Up Info
  whySignedUp: v.optional(v.string()),
  pricing: v.optional(v.string()),
  availability: v.optional(v.string()),
  
  // Student Fields
  studentLessonsAndGoals: v.optional(v.string()),
  studentLevel: v.optional(v.string()), // e.g., "beginner", "intermediate", "advanced"
  
  // Coach Fields
  genreSpecialty: v.optional(v.string()),
  coachStyle: v.optional(v.string()),
  coachBackground: v.optional(v.string()),
  
  // Email Preferences
  emailPreferences: v.optional(v.string()),
  opensEmail: v.optional(v.boolean()),
  clicksLinks: v.optional(v.boolean()),
  
  // Producer Profile
  howLongProducing: v.optional(v.string()),
  typeOfMusic: v.optional(v.string()),
  goals: v.optional(v.string()),
  musicAlias: v.optional(v.string()),
  daw: v.optional(v.string()), // Digital Audio Workstation
  whyGoalsNotReached: v.optional(v.string()),
  
  // Activity Tracking
  lastSignIn: v.optional(v.number()),
  lastActivity: v.optional(v.number()),
  lastOpenDate: v.optional(v.number()),
  
  // Location
  address: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  stateCode: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  country: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  
  // Engagement Scoring (ActiveCampaign-style)
  purchasePoints: v.optional(v.number()), // Points from purchases
  totalPoints: v.optional(v.number()), // Sum of all points
  score: v.optional(v.number()), // Overall engagement score (0-100+)
  replyPoints: v.optional(v.number()), // Points from email replies
  
  // Tags (flexible tagging system)
  tags: v.array(v.string()), // e.g., ["student", "hip-hop", "pro-tools", "engaged"]
  
  // List/Audience Assignment
  audienceListIds: v.optional(v.array(v.id("resendAudienceLists"))),
  
  // Status
  status: v.union(
    v.literal("active"),
    v.literal("unsubscribed"),
    v.literal("bounced"),
    v.literal("complained")
  ),
  unsubscribedAt: v.optional(v.number()),
  
  // Metadata
  source: v.optional(v.string()), // e.g., "activecampaign_import", "landing_page", "checkout"
  importBatchId: v.optional(v.id("resendImportedContacts")),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_storeId", ["storeId"])
  .index("by_email", ["email"])
  .index("by_storeId_and_email", ["storeId", "email"])
  .index("by_status", ["status"])
  .index("by_score", ["score"])
  .index("by_activeCampaignId", ["activeCampaignId"]);

// Contact Activity Log (track all interactions)
export const contactActivityTable = defineTable({
  contactId: v.id("contacts"),
  storeId: v.id("stores"),
  
  // Activity type
  activityType: v.union(
    v.literal("email_opened"),
    v.literal("email_clicked"),
    v.literal("email_replied"),
    v.literal("email_bounced"),
    v.literal("email_complained"),
    v.literal("purchase"),
    v.literal("course_enrolled"),
    v.literal("tag_added"),
    v.literal("tag_removed"),
    v.literal("score_updated"),
    v.literal("manual_note"),
    v.literal("form_submitted")
  ),
  
  // Context
  campaignId: v.optional(v.id("resendCampaigns")),
  automationId: v.optional(v.id("emailWorkflows")),
  
  // Activity details
  description: v.string(),
  metadata: v.optional(v.object({
    points: v.optional(v.number()),
    linkClicked: v.optional(v.string()),
    purchaseAmount: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
  })),
  
  // Scoring impact
  pointsAdded: v.optional(v.number()),
  
  createdAt: v.number(),
})
  .index("by_contactId", ["contactId"])
  .index("by_storeId", ["storeId"])
  .index("by_activityType", ["activityType"])
  .index("by_contactId_and_createdAt", ["contactId", "createdAt"]);

