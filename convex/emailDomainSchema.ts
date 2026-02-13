import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Email Domain Management & Analytics Schema
 * 
 * This schema tracks:
 * - All sending domains used by the platform
 * - Per-domain analytics and health metrics
 * - Creator-level sending statistics
 * - Real-time monitoring data
 */

export const emailDomainTables = {
  // Platform sending domains (pauseplayrepeat.com, etc.)
  emailDomains: defineTable({
    domain: v.string(), // e.g., "pauseplayrepeat.com"
    type: v.union(
      v.literal("shared"),    // Shared by all creators
      v.literal("dedicated"), // Dedicated to specific creator(s)
      v.literal("custom")     // Creator's own domain
    ),
    status: v.union(
      v.literal("pending"),   // DNS not verified yet
      v.literal("verifying"), // Verification in progress
      v.literal("active"),    // Active and sending
      v.literal("suspended"), // Suspended due to issues
      v.literal("retired")    // No longer in use
    ),
    
    // DNS Configuration
    dnsRecords: v.object({
      spf: v.object({
        record: v.string(),
        verified: v.boolean(),
        lastChecked: v.optional(v.number()),
      }),
      dkim: v.array(v.object({
        name: v.string(),
        record: v.string(),
        verified: v.boolean(),
        lastChecked: v.optional(v.number()),
      })),
      dmarc: v.object({
        record: v.string(),
        verified: v.boolean(),
        lastChecked: v.optional(v.number()),
      }),
      mx: v.optional(v.object({
        record: v.string(),
        verified: v.boolean(),
        lastChecked: v.optional(v.number()),
      })),
    }),
    
    // Resend Integration
    resendDomainId: v.optional(v.string()),
    
    // Reputation Tracking
    reputation: v.object({
      score: v.number(), // 0-100
      status: v.union(
        v.literal("excellent"),  // 90-100
        v.literal("good"),       // 70-89
        v.literal("fair"),       // 50-69
        v.literal("poor"),       // 30-49
        v.literal("critical")    // 0-29
      ),
      lastUpdated: v.number(),
    }),
    
    // Rate Limits
    rateLimits: v.object({
      dailyLimit: v.number(),
      hourlyLimit: v.number(),
      currentDailyUsage: v.number(),
      currentHourlyUsage: v.number(),
      resetAt: v.number(),
    }),
    
    // Metadata
    createdBy: v.string(), // Admin user ID
    createdAt: v.number(),
    notes: v.optional(v.string()),
  })
  .index("by_domain", ["domain"])
  .index("by_status", ["status"])
  .index("by_type", ["type"]),

  // Daily analytics per domain
  emailDomainAnalytics: defineTable({
    domainId: v.id("emailDomains"),
    date: v.string(), // "2025-10-21"
    
    // Sending Volume
    totalSent: v.number(),
    totalDelivered: v.number(),
    totalBounced: v.number(),
    totalFailed: v.number(),
    
    // Engagement
    totalOpened: v.number(),
    totalClicked: v.number(),
    uniqueOpens: v.number(),
    uniqueClicks: v.number(),
    
    // Negative Signals
    spamComplaints: v.number(),
    unsubscribes: v.number(),
    
    // Bounce Breakdown
    hardBounces: v.number(),
    softBounces: v.number(),
    
    // Calculated Rates
    deliveryRate: v.number(),  // (delivered / sent) * 100
    bounceRate: v.number(),     // (bounced / sent) * 100
    openRate: v.number(),       // (opened / delivered) * 100
    clickRate: v.number(),      // (clicked / delivered) * 100
    spamRate: v.number(),       // (spam / sent) * 100
    
    // Hourly breakdown for detailed analysis
    hourlyStats: v.optional(v.array(v.object({
      hour: v.number(), // 0-23
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
    }))),
  })
  .index("by_domainId", ["domainId"])
  .index("by_date", ["date"])
  .index("by_domainId_and_date", ["domainId", "date"]),

  // Creator-level sending stats (per domain)
  emailCreatorStats: defineTable({
    storeId: v.id("stores"),
    domainId: v.id("emailDomains"),
    date: v.string(), // "2025-10-21"
    
    // Sending Volume
    sent: v.number(),
    delivered: v.number(),
    bounced: v.number(),
    
    // Engagement
    opened: v.number(),
    clicked: v.number(),
    
    // Issues
    spamComplaints: v.number(),
    unsubscribes: v.number(),
    
    // Rates
    bounceRate: v.number(),
    openRate: v.number(),
    spamRate: v.number(),
    
    // Reputation Score (0-100)
    reputationScore: v.number(),
    
    // Warnings/Flags
    warnings: v.optional(v.array(v.object({
      type: v.union(
        v.literal("high_bounce"),
        v.literal("spam_complaints"),
        v.literal("low_engagement"),
        v.literal("rate_limit")
      ),
      message: v.string(),
      timestamp: v.number(),
    }))),
    
    // Status
    sendingStatus: v.union(
      v.literal("active"),
      v.literal("warning"),
      v.literal("suspended")
    ),
  })
  .index("by_storeId", ["storeId"])
  .index("by_domainId", ["domainId"])
  .index("by_date", ["date"])
  .index("by_storeId_and_date", ["storeId", "date"])
  .index("by_sendingStatus", ["sendingStatus"]),

  // Real-time email events (recent activity)
  emailEvents: defineTable({
    domainId: v.id("emailDomains"),
    storeId: v.id("stores"),
    campaignId: v.optional(v.id("emailCampaigns")),
    
    // Event Details
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("spam_complaint"),
      v.literal("unsubscribed")
    ),
    recipientEmail: v.string(),
    timestamp: v.number(),
    
    // Additional Data
    bounceType: v.optional(v.union(v.literal("hard"), v.literal("soft"))),
    bounceReason: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    
    // Metadata
    messageId: v.optional(v.string()), // From email headers
  })
  .index("by_domainId", ["domainId"])
  .index("by_storeId", ["storeId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_eventType", ["eventType"]),

  // Domain health alerts
  emailDomainAlerts: defineTable({
    domainId: v.id("emailDomains"),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical")
    ),
    type: v.union(
      v.literal("high_bounce_rate"),
      v.literal("spam_complaints"),
      v.literal("dns_issue"),
      v.literal("rate_limit_reached"),
      v.literal("reputation_drop"),
      v.literal("blacklist_detected")
    ),
    message: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()), // Admin user ID
  })
  .index("by_domainId", ["domainId"])
  .index("by_severity", ["severity"])
  .index("by_resolved", ["resolved"])
  .index("by_createdAt", ["createdAt"]),
};

