import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Analytics & Reporting Schema
 * 
 * Tracks user events, course analytics, revenue, and provides insights
 * for both creators and students.
 */

// ==================== USER EVENTS ====================

export const userEventsTable = defineTable({
  // Who & What
  userId: v.string(), // Clerk user ID
  eventType: v.union(
    // Course Events
    v.literal("course_viewed"),
    v.literal("course_enrolled"),
    v.literal("chapter_started"),
    v.literal("chapter_completed"),
    v.literal("course_completed"),
    v.literal("video_played"),
    v.literal("video_paused"),
    v.literal("video_progress"),
    
    // Purchase Events
    v.literal("checkout_started"),
    v.literal("purchase_completed"),
    v.literal("refund_requested"),
    
    // Engagement Events
    v.literal("question_asked"),
    v.literal("answer_posted"),
    v.literal("comment_posted"),
    v.literal("content_liked"),
    
    // Social Events
    v.literal("certificate_shared"),
    v.literal("course_reviewed"),
    
    // Other
    v.literal("login"),
    v.literal("logout"),
    v.literal("profile_updated")
  ),
  
  // Context
  courseId: v.optional(v.id("courses")),
  chapterId: v.optional(v.string()),
  productId: v.optional(v.id("digitalProducts")),
  
  // Event Data
  metadata: v.optional(v.any()), // JSON object with event-specific data
  
  // Timestamp
  timestamp: v.number(),
  
  // Session Info
  sessionId: v.optional(v.string()),
  deviceType: v.optional(v.string()), // "desktop", "mobile", "tablet"
  browserInfo: v.optional(v.string()),
})
  .index("by_user", ["userId", "timestamp"])
  .index("by_course", ["courseId", "timestamp"])
  .index("by_event_type", ["eventType", "timestamp"])
  .index("by_user_and_event", ["userId", "eventType", "timestamp"])
  .index("by_session", ["sessionId", "timestamp"]);

// ==================== VIDEO ANALYTICS ====================

export const videoAnalyticsTable = defineTable({
  // Video Info
  chapterId: v.string(),
  courseId: v.id("courses"),
  
  // User Info
  userId: v.string(),
  
  // Watch Data
  watchDuration: v.number(), // Seconds watched
  videoDuration: v.number(), // Total video length
  percentWatched: v.number(), // 0-100
  
  // Engagement
  dropOffPoint: v.optional(v.number()), // Timestamp where user stopped
  completedWatch: v.boolean(), // Watched to end
  rewatches: v.number(), // How many times rewatched
  
  // Speed & Quality
  playbackSpeed: v.optional(v.number()), // 0.5, 1.0, 1.25, 1.5, 2.0
  qualitySetting: v.optional(v.string()), // "auto", "720p", "1080p"
  
  // Timestamp
  timestamp: v.number(),
  sessionId: v.optional(v.string()),
})
  .index("by_chapter", ["chapterId", "timestamp"])
  .index("by_course", ["courseId", "timestamp"])
  .index("by_user", ["userId", "timestamp"])
  .index("by_completion", ["completedWatch", "timestamp"]);

// ==================== COURSE ANALYTICS ====================

export const courseAnalyticsTable = defineTable({
  // Course Info
  courseId: v.id("courses"),
  creatorId: v.string(), // Course creator's Clerk ID
  
  // Date (for aggregation)
  date: v.string(), // ISO date string (YYYY-MM-DD)
  
  // Views & Enrollments
  views: v.number(),
  enrollments: v.number(),
  conversionRate: v.number(), // enrollments / views
  
  // Engagement
  activeStudents: v.number(), // Students who accessed course today
  avgTimeSpent: v.number(), // Average minutes per student
  completionRate: v.number(), // % of enrolled students who completed
  
  // Progress
  chaptersStarted: v.number(),
  chaptersCompleted: v.number(),
  
  // Revenue
  revenue: v.number(), // Total revenue for this day
  refunds: v.number(),
  netRevenue: v.number(),
  
  // Quality Metrics
  avgRating: v.optional(v.number()),
  certificatesIssued: v.number(),
  
  // Timestamp
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_course", ["courseId", "date"])
  .index("by_creator", ["creatorId", "date"])
  .index("by_date", ["date"]);

// ==================== REVENUE ANALYTICS ====================

export const revenueAnalyticsTable = defineTable({
  // Creator Info
  creatorId: v.string(),
  storeId: v.id("stores"),
  
  // Date
  date: v.string(), // ISO date string (YYYY-MM-DD)
  
  // Revenue Breakdown
  grossRevenue: v.number(),
  platformFee: v.number(),
  paymentProcessingFee: v.number(),
  netRevenue: v.number(),
  
  // Transaction Counts
  totalTransactions: v.number(),
  successfulTransactions: v.number(),
  refundedTransactions: v.number(),
  
  // Product Breakdown
  courseRevenue: v.number(),
  digitalProductRevenue: v.number(),
  
  // Customer Metrics
  newCustomers: v.number(),
  returningCustomers: v.number(),
  avgOrderValue: v.number(),
  
  // Timestamp
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_creator", ["creatorId", "date"])
  .index("by_store", ["storeId", "date"])
  .index("by_date", ["date"]);

// ==================== STUDENT PROGRESS ====================

export const studentProgressTable = defineTable({
  // Student Info
  userId: v.string(),
  courseId: v.id("courses"),
  
  // Progress Metrics
  totalChapters: v.number(),
  completedChapters: v.number(),
  completionPercentage: v.number(),
  
  // Time Tracking
  totalTimeSpent: v.number(), // Minutes
  avgSessionDuration: v.number(), // Minutes
  lastAccessedAt: v.number(),
  enrolledAt: v.number(),
  
  // Pace
  daysSinceEnrollment: v.number(),
  chaptersPerWeek: v.number(),
  estimatedCompletionDate: v.optional(v.number()),
  
  // Engagement Score (0-100)
  engagementScore: v.number(),
  
  // Performance vs Peers
  performancePercentile: v.optional(v.number()), // 0-100 (higher = faster)
  
  // Flags
  isAtRisk: v.boolean(), // Not accessing course regularly
  needsHelp: v.boolean(), // Stuck on same chapter
  
  // Timestamp
  updatedAt: v.number(),
})
  .index("by_user", ["userId", "courseId"])
  .index("by_course", ["courseId", "completionPercentage"])
  .index("by_engagement", ["engagementScore"])
  .index("by_risk", ["isAtRisk", "updatedAt"]);

// ==================== CHAPTER ANALYTICS ====================

export const chapterAnalyticsTable = defineTable({
  // Chapter Info
  chapterId: v.string(),
  courseId: v.id("courses"),
  chapterIndex: v.number(),
  
  // Aggregated Metrics
  totalViews: v.number(),
  uniqueStudents: v.number(),
  completionRate: v.number(), // % who completed after starting
  
  // Time Metrics
  avgTimeToComplete: v.number(), // Minutes
  avgWatchTime: v.number(), // For video chapters
  
  // Drop-off Analysis
  dropOffRate: v.number(), // % who stopped at this chapter
  commonDropOffPoint: v.optional(v.number()), // Timestamp in video
  
  // Engagement
  questionsAsked: v.number(),
  avgEngagementScore: v.number(),
  
  // Difficulty Signal
  avgRewatches: v.number(), // Higher = more difficult
  avgTimeSpent: v.number(), // Much higher than expected = difficult
  
  // Last Updated
  updatedAt: v.number(),
})
  .index("by_chapter", ["chapterId"])
  .index("by_course", ["courseId", "chapterIndex"])
  .index("by_drop_off", ["dropOffRate"])
  .index("by_difficulty", ["avgRewatches"]);

// ==================== LEARNING STREAKS ====================

export const learningStreaksTable = defineTable({
  userId: v.string(),
  
  // Streak Data
  currentStreak: v.number(), // Days
  longestStreak: v.number(), // Days
  lastActivityDate: v.string(), // ISO date (YYYY-MM-DD)
  
  // Activity Count
  totalDaysActive: v.number(),
  totalHoursLearned: v.number(),
  
  // Milestones
  streakMilestones: v.array(v.number()), // [7, 30, 100, 365]
  
  // Timestamp
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_current_streak", ["currentStreak"])
  .index("by_last_activity", ["lastActivityDate"]);

// ==================== RECOMMENDATIONS ====================

export const recommendationsTable = defineTable({
  userId: v.string(),
  
  // Recommended Items
  recommendations: v.array(v.object({
    courseId: v.id("courses"),
    score: v.number(), // 0-100 (confidence)
    reason: v.string(), // "similar_to_completed", "trending", "skill_gap"
  })),
  
  // Metadata
  generatedAt: v.number(),
  expiresAt: v.number(), // Regenerate after this time
})
  .index("by_user", ["userId"])
  .index("by_expiry", ["expiresAt"]);

