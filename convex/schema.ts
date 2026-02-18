import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import * as monetizationSchema from "./monetizationSchema";
import * as emailSchema from "./emailSchema";
import { emailDomainTables } from "./emailDomainSchema";
import { emailRepliesTables } from "./emailRepliesSchema";

export default defineSchema({
  // User Management
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string()),
    hashedPassword: v.optional(v.string()),
    agencyId: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("AGENCY_OWNER"),
        v.literal("AGENCY_ADMIN"),
        v.literal("SUBACCOUNT_USER"),
        v.literal("SUBACCOUNT_GUEST")
      )
    ),
    avatarUrl: v.optional(v.string()),
    userRoleId: v.optional(v.string()),
    userTypeId: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    discordId: v.optional(v.string()),
    discordVerified: v.optional(v.boolean()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(
      v.union(v.literal("pending"), v.literal("restricted"), v.literal("enabled"))
    ),
    stripeOnboardingComplete: v.optional(v.boolean()),
    admin: v.optional(v.boolean()),
    clerkId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Profile fields
    bio: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    website: v.optional(v.string()),
    // Dashboard preference for unified dashboard
    dashboardPreference: v.optional(v.union(v.literal("learn"), v.literal("create"))),
    // Creator role fields
    isCreator: v.optional(v.boolean()), // Explicit creator flag (set when user creates store)
    creatorSince: v.optional(v.number()), // Timestamp when user became a creator
    creatorLevel: v.optional(v.number()), // Creator level (1-10+)
    creatorXP: v.optional(v.number()), // XP earned from creating content
    creatorBadges: v.optional(v.array(v.string())), // Creator-specific badges
  })
    .index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"])
    .index("by_discordId", ["discordId"])
    .index("by_isCreator", ["isCreator"]),

  // Learner Preferences (for onboarding and personalization)
  learnerPreferences: defineTable({
    userId: v.string(), // Clerk ID
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    interests: v.array(v.string()), // e.g., ["mixing", "mastering", "sound_design"]
    goal: v.union(
      v.literal("hobby"),
      v.literal("career"),
      v.literal("skills"),
      v.literal("certification")
    ),
    weeklyHours: v.optional(v.number()),
    onboardingCompletedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // Sync Metadata (for tracking sync operations)
  syncMetadata: defineTable({
    type: v.string(), // e.g., "clerk_sync"
    lastSyncTime: v.number(),
    totalClerkUsers: v.optional(v.number()),
    totalConvexUsers: v.optional(v.number()),
    usersAdded: v.optional(v.number()),
    usersUpdated: v.optional(v.number()),
    status: v.string(), // "completed", "failed", "in_progress"
  }).index("by_type", ["type"]),

  // User Notifications
  notifications: defineTable({
    userId: v.string(), // Clerk ID of the recipient
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    link: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
    createdAt: v.number(),
    emailSent: v.optional(v.boolean()),
    emailSentAt: v.optional(v.number()),
    // Sender information
    senderType: v.optional(
      v.union(
        v.literal("platform"), // From PPR Academy platform/admin
        v.literal("creator"), // From a course creator
        v.literal("system") // System-generated
      )
    ),
    senderId: v.optional(v.string()), // Clerk ID of sender (if creator)
    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  // Course Update Notifications (sent by course creators to enrolled students)
  courseNotifications: defineTable({
    courseId: v.id("courses"),
    creatorId: v.string(), // Clerk ID of course creator
    title: v.string(),
    message: v.string(),
    // What changed since last notification
    changes: v.object({
      newModules: v.number(),
      newLessons: v.number(),
      newChapters: v.number(),
      updatedContent: v.boolean(),
      modulesList: v.optional(v.array(v.string())), // List of new/updated module titles
    }),
    // Snapshot of course state when notification was sent
    courseSnapshot: v.object({
      totalModules: v.number(),
      totalLessons: v.number(),
      totalChapters: v.number(),
    }),
    sentAt: v.number(),
    recipientCount: v.number(), // How many students received this
    emailSent: v.optional(v.boolean()),
  })
    .index("by_courseId", ["courseId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_sentAt", ["sentAt"]),

  // User Notification Preferences
  notificationPreferences: defineTable({
    userId: v.string(), // Clerk ID
    // Email notification preferences by category
    emailNotifications: v.object({
      announcements: v.boolean(),
      courseUpdates: v.boolean(),
      newContent: v.boolean(),
      mentions: v.boolean(),
      replies: v.boolean(),
      purchases: v.boolean(),
      earnings: v.boolean(),
      systemAlerts: v.boolean(),
      marketing: v.boolean(),
    }),
    // In-app notification preferences by category
    inAppNotifications: v.object({
      announcements: v.boolean(),
      courseUpdates: v.boolean(),
      newContent: v.boolean(),
      mentions: v.boolean(),
      replies: v.boolean(),
      purchases: v.boolean(),
      earnings: v.boolean(),
      systemAlerts: v.boolean(),
      marketing: v.boolean(),
    }),
    // Digest settings
    emailDigest: v.union(
      v.literal("realtime"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("never")
    ),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Course Management
  courses: defineTable({
    userId: v.string(),
    instructorId: v.optional(v.string()),
    storeId: v.optional(v.string()), // Add storeId for consistency with digital products
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
    // Hierarchical categorization (Category → Subcategory → Tags)
    category: v.optional(v.string()), // Top-level category (e.g., "daw", "business", "genre")
    subcategory: v.optional(v.string()), // Specific subcategory (e.g., "Ableton Live", "Email Marketing & Funnels")
    tags: v.optional(v.array(v.string())), // 2-5 tags for search and discovery
    skillLevel: v.optional(v.string()),
    checkoutHeadline: v.optional(v.string()),
    checkoutDescription: v.optional(v.string()),
    paymentDescription: v.optional(v.string()),
    guaranteeText: v.optional(v.string()),
    showGuarantee: v.optional(v.boolean()),
    acceptsPayPal: v.optional(v.boolean()),
    acceptsStripe: v.optional(v.boolean()),
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    // Soft delete support
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),

    // Follow Gate Configuration (for free courses)
    followGateEnabled: v.optional(v.boolean()),
    followGateRequirements: v.optional(
      v.object({
        requireEmail: v.optional(v.boolean()),
        requireInstagram: v.optional(v.boolean()),
        requireTiktok: v.optional(v.boolean()),
        requireYoutube: v.optional(v.boolean()),
        requireSpotify: v.optional(v.boolean()),
        minFollowsRequired: v.optional(v.number()),
      })
    ),
    followGateSocialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
        soundcloud: v.optional(v.string()),
        appleMusic: v.optional(v.string()),
        deezer: v.optional(v.string()),
        twitch: v.optional(v.string()),
        mixcloud: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        bandcamp: v.optional(v.string()),
      })
    ),
    followGateMessage: v.optional(v.string()),
    followGateSteps: v.optional(
      v.array(
        v.object({
          platform: v.union(
            v.literal("email"),
            v.literal("instagram"),
            v.literal("tiktok"),
            v.literal("youtube"),
            v.literal("spotify"),
            v.literal("soundcloud"),
            v.literal("appleMusic"),
            v.literal("deezer"),
            v.literal("twitch"),
            v.literal("mixcloud"),
            v.literal("facebook"),
            v.literal("twitter"),
            v.literal("bandcamp")
          ),
          url: v.optional(v.string()),
          mandatory: v.boolean(),
          order: v.number(),
        })
      )
    ),

    // Pinned product - appears first in storefront
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()), // Timestamp for ordering multiple pinned products
  })
    .index("by_instructorId", ["instructorId"])
    .index("by_slug", ["slug"])
    .index("by_categoryId", ["courseCategoryId"])
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_published", ["isPublished"])
    .index("by_instructor_published", ["instructorId", "isPublished"])
    .index("by_category", ["category"]) // New index for category filtering
    .index("by_category_subcategory", ["category", "subcategory"]), // New index for precise filtering

  courseCategories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  courseModules: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    courseId: v.string(),
    // Drip Content Configuration (Teachable Parity)
    dripEnabled: v.optional(v.boolean()), // Whether drip is enabled for this module
    dripType: v.optional(v.union(
      v.literal("days_after_enrollment"), // Release X days after student enrolls
      v.literal("specific_date"), // Release on a specific date
      v.literal("after_previous") // Release after previous module is completed
    )),
    dripDaysAfterEnrollment: v.optional(v.number()), // Number of days after enrollment
    dripSpecificDate: v.optional(v.number()), // Timestamp for specific date release
    dripNotifyStudents: v.optional(v.boolean()), // Send email when content unlocks
  })
    .index("by_courseId", ["courseId"])
    .index("by_position", ["position"]),

  courseLessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    moduleId: v.string(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_position", ["position"]),

  courseChapters: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    position: v.number(),
    isPublished: v.optional(v.boolean()),
    isFree: v.optional(v.boolean()),
    courseId: v.string(),
    audioUrl: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    // Mux video fields
    muxAssetId: v.optional(v.string()),
    muxPlaybackId: v.optional(v.string()),
    muxUploadId: v.optional(v.string()),
    muxAssetStatus: v.optional(
      v.union(
        v.literal("waiting"),
        v.literal("preparing"),
        v.literal("ready"),
        v.literal("errored")
      )
    ),
    videoDuration: v.optional(v.number()), // Duration in seconds from Mux
    // AI-generated content fields
    generatedAudioUrl: v.optional(v.string()),
    generatedVideoUrl: v.optional(v.string()),
    audioGenerationStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("generating"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    videoGenerationStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("generating"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    audioGeneratedAt: v.optional(v.number()),
    videoGeneratedAt: v.optional(v.number()),
    audioGenerationError: v.optional(v.string()),
    videoGenerationError: v.optional(v.string()),
  })
    .index("by_courseId", ["courseId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_position", ["position"])
    .index("by_muxAssetId", ["muxAssetId"]),

  enrollments: defineTable({
    userId: v.string(),
    courseId: v.string(),
    progress: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_user_course", ["userId", "courseId"]),

  // Store & E-commerce
  stores: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    avatar: v.optional(v.string()),
    logoUrl: v.optional(v.string()), // Store logo URL
    bannerImage: v.optional(v.string()), // Store banner image
    customDomain: v.optional(v.string()), // Custom domain (e.g., beatsbymike.com)
    domainStatus: v.optional(v.string()), // pending, verified, active
    bio: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        website: v.optional(v.string()),
        twitter: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        youtube: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        spotify: v.optional(v.string()),
        soundcloud: v.optional(v.string()),
        appleMusic: v.optional(v.string()),
        bandcamp: v.optional(v.string()),
        threads: v.optional(v.string()),
        discord: v.optional(v.string()),
        twitch: v.optional(v.string()),
        beatport: v.optional(v.string()),
      })
    ),
    // New social links format: array that supports multiple links per platform with labels
    socialLinksV2: v.optional(
      v.array(
        v.object({
          platform: v.string(), // e.g., "instagram", "youtube", etc.
          url: v.string(),
          label: v.optional(v.string()), // Custom label like "Ableton Tips"
        })
      )
    ),
    // Creator Plan & Visibility Settings
    plan: v.optional(
      v.union(
        v.literal("free"), // Free - Basic link-in-bio only
        v.literal("starter"), // Starter - Entry tier ($12/mo)
        v.literal("creator"), // Creator - Most users ($29/mo)
        v.literal("creator_pro"), // Pro - Power users ($79/mo)
        v.literal("business"), // Business - Teams ($149/mo)
        v.literal("early_access") // Early Access - Grandfathered unlimited (free)
      )
    ),
    planStartedAt: v.optional(v.number()),
    isPublic: v.optional(v.boolean()), // Show on marketplace/public discovery
    isPublishedProfile: v.optional(v.boolean()), // Profile is complete and ready to show
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("incomplete")
      )
    ),
    trialEndsAt: v.optional(v.number()),
    earlyAccessExpiresAt: v.optional(v.number()), // When early access grandfathering ends
    // Copyright Strike System
    copyrightStrikes: v.optional(v.number()), // 0-3 strikes
    lastStrikeAt: v.optional(v.number()), // Timestamp of last strike
    strikeHistory: v.optional(
      v.array(
        v.object({
          strikeNumber: v.number(),
          reportId: v.string(),
          reason: v.string(),
          issuedAt: v.number(),
          issuedBy: v.string(), // Admin who issued
        })
      )
    ),
    suspendedAt: v.optional(v.number()), // Account suspension timestamp
    suspensionReason: v.optional(v.string()),
    suspensionEndsAt: v.optional(v.number()), // For temporary suspensions
    // Email Sender Configuration (API key handled centrally via environment variables)
    emailConfig: v.optional(
      v.object({
        fromEmail: v.string(),
        fromName: v.optional(v.string()),
        replyToEmail: v.optional(v.string()),
        isConfigured: v.optional(v.boolean()),
        lastTestedAt: v.optional(v.number()),
        emailsSentThisMonth: v.optional(v.number()),
        // Admin Notification Preferences
        adminNotifications: v.optional(
          v.object({
            enabled: v.optional(v.boolean()),
            emailOnNewLead: v.optional(v.boolean()),
            emailOnReturningUser: v.optional(v.boolean()),
            notificationEmail: v.optional(v.string()), // Override admin email
            customSubjectPrefix: v.optional(v.string()),
            includeLeadDetails: v.optional(v.boolean()),
            sendDigestInsteadOfInstant: v.optional(v.boolean()),
            digestFrequency: v.optional(
              v.union(v.literal("hourly"), v.literal("daily"), v.literal("weekly"))
            ),
          })
        ),
      })
    ),
    // Notification Integrations for Workflow Actions
    notificationIntegrations: v.optional(
      v.object({
        slackWebhookUrl: v.optional(v.string()), // Slack incoming webhook URL
        slackEnabled: v.optional(v.boolean()),
        discordWebhookUrl: v.optional(v.string()), // Discord webhook URL
        discordEnabled: v.optional(v.boolean()),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_plan", ["plan"])
    .index("by_public", ["isPublic"]),

  // Digital Products
  // Email Automation Workflows
  emailWorkflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isActive: v.optional(v.boolean()),
    // Admin workflow flag - when true, targets platform-wide users
    isAdminWorkflow: v.optional(v.boolean()),
    // Sequence type for categorization
    sequenceType: v.optional(v.union(
      v.literal("welcome"),
      v.literal("buyer"),
      v.literal("course_student"),
      v.literal("coaching_client"),
      v.literal("lead_nurture"),
      v.literal("product_launch"),
      v.literal("reengagement"),
      v.literal("winback"),
      v.literal("custom")
    )),
    trigger: v.object({
      type: v.union(
        v.literal("lead_signup"),
        v.literal("product_purchase"),
        v.literal("tag_added"),
        v.literal("segment_member"),
        v.literal("manual"),
        v.literal("time_delay"),
        v.literal("date_time"),
        v.literal("customer_action"),
        // Phase 8: Expanded triggers
        v.literal("webhook"),
        v.literal("page_visit"),
        v.literal("cart_abandon"),
        v.literal("birthday"),
        v.literal("anniversary"),
        v.literal("custom_event"),
        v.literal("api_call"),
        v.literal("form_submit"),
        v.literal("email_reply"),
        // Admin-specific triggers (platform-wide)
        v.literal("all_users"),
        v.literal("all_creators"),
        v.literal("all_learners"),
        v.literal("new_signup"),
        v.literal("user_inactivity"),
        v.literal("any_purchase"),
        v.literal("any_course_complete"),
        v.literal("learner_conversion") // Learner hits creator-readiness milestone
      ),
      config: v.any(), // Flexible config for different trigger types
    }),
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("trigger"),
          v.literal("email"),
          v.literal("delay"),
          v.literal("condition"),
          v.literal("action"),
          v.literal("stop"),
          v.literal("webhook"),
          v.literal("split"),
          v.literal("notify"),
          v.literal("goal"),
          // Course Cycle nodes (perpetual nurture system)
          v.literal("courseCycle"),
          v.literal("courseEmail"),
          v.literal("purchaseCheck"),
          v.literal("cycleLoop")
        ),
        position: v.object({
          x: v.number(),
          y: v.number(),
        }),
        data: v.any(),
      })
    ),
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),
      })
    ),
    // Execution tracking
    totalExecutions: v.optional(v.number()),
    lastExecuted: v.optional(v.number()),
    // Performance metrics
    avgOpenRate: v.optional(v.number()),
    avgClickRate: v.optional(v.number()),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_isAdminWorkflow", ["isAdminWorkflow"])
    .index("by_sequenceType", ["sequenceType"])
    .index("by_storeId_sequenceType", ["storeId", "sequenceType"]),

  // Workflow Templates (pre-built workflow templates)
  workflowTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("welcome"),
      v.literal("nurture"),
      v.literal("sales"),
      v.literal("re_engagement"),
      v.literal("onboarding"),
      v.literal("custom")
    ),
    thumbnail: v.optional(v.string()),
    trigger: v.object({
      type: v.string(),
      config: v.any(),
    }),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    isPublic: v.boolean(), // System templates vs user-created
    creatorId: v.optional(v.string()), // For user-created templates
    usageCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"])
    .index("by_creatorId", ["creatorId"]),

  // Workflow Goal Completions (track when contacts complete workflow goals)
  workflowGoalCompletions: defineTable({
    workflowId: v.id("emailWorkflows"),
    executionId: v.id("workflowExecutions"),
    contactId: v.id("emailContacts"),
    storeId: v.string(),
    goalNodeId: v.string(),
    goalType: v.string(), // e.g., "purchase", "signup", "link_click"
    goalValue: v.optional(v.any()), // e.g., product ID, link URL
    completedAt: v.number(),
    timeToComplete: v.number(), // Time from workflow start to goal completion (ms)
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_storeId", ["storeId"])
    .index("by_contactId", ["contactId"])
    .index("by_goalType", ["workflowId", "goalType"]),

  // Workflow Executions (tracking individual workflow runs)
  workflowExecutions: defineTable({
    workflowId: v.id("emailWorkflows"),
    storeId: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    customerId: v.optional(v.string()),
    customerEmail: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    currentNodeId: v.optional(v.string()),
    scheduledFor: v.optional(v.number()), // For delayed executions
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    // Tracking data through the workflow
    executionData: v.optional(v.any()),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_storeId", ["storeId"])
    .index("by_contactId", ["contactId"])
    .index("by_status", ["status"])
    .index("by_scheduledFor", ["scheduledFor"])
    .index("by_workflowId_status", ["workflowId", "status"])
    .index("by_status_scheduledFor", ["status", "scheduledFor"])
    .index("by_customerEmail", ["customerEmail"]),

  // Workflow Node A/B Tests (for testing email variants within workflows)
  workflowNodeABTests: defineTable({
    workflowId: v.id("emailWorkflows"),
    nodeId: v.string(), // The email node ID within the workflow
    isEnabled: v.boolean(),
    variants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        subject: v.string(),
        body: v.optional(v.string()),
        percentage: v.number(), // % of contacts to receive this variant
        sent: v.number(),
        delivered: v.number(),
        opened: v.number(),
        clicked: v.number(),
      })
    ),
    sampleSize: v.number(), // Min contacts before selecting winner
    winnerMetric: v.union(v.literal("open_rate"), v.literal("click_rate")),
    autoSelectWinner: v.boolean(),
    winnerThreshold: v.optional(v.number()), // Min % diff to declare winner
    status: v.union(v.literal("active"), v.literal("completed")),
    winner: v.optional(v.string()), // Winning variant ID
    confidence: v.optional(v.number()), // Statistical confidence level
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_workflowId_nodeId", ["workflowId", "nodeId"]),

  // Creator Email Segments (for targeting contacts in broadcasts/workflows)
  creatorEmailSegments: defineTable({
    storeId: v.string(),
    name: v.string(),
    description: v.string(),
    conditions: v.array(
      v.object({
        id: v.string(),
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("not_equals"),
          v.literal("greater_than"),
          v.literal("less_than"),
          v.literal("contains"),
          v.literal("not_contains"),
          v.literal("is_empty"),
          v.literal("is_not_empty"),
          v.literal("in_list"),
          v.literal("not_in_list"),
          v.literal("before"),
          v.literal("after"),
          v.literal("between")
        ),
        value: v.any(),
        logic: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
      })
    ),
    isDynamic: v.boolean(), // Auto-update vs static snapshot
    memberCount: v.number(),
    cachedContactIds: v.optional(v.array(v.id("emailContacts"))),
    lastUpdated: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_name", ["storeId", "name"]),

  // Course Cycle Configs (perpetual nurture/pitch automation)
  courseCycleConfigs: defineTable({
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    // Ordered list of courses to cycle through
    courseIds: v.array(v.id("courses")),
    // Per-course timing configuration
    courseTimings: v.array(
      v.object({
        courseId: v.id("courses"),
        timingMode: v.union(v.literal("fixed"), v.literal("engagement")),
        // Fixed timing settings
        nurtureEmailCount: v.number(),
        nurtureDelayDays: v.number(),
        pitchEmailCount: v.number(),
        pitchDelayDays: v.number(),
        purchaseCheckDelayDays: v.number(),
        // Engagement-based timing settings
        engagementWaitDays: v.optional(v.number()),
        minEngagementActions: v.optional(v.number()),
      })
    ),
    // Cycle behavior
    loopOnCompletion: v.boolean(),
    differentContentOnSecondCycle: v.boolean(),
    // Status
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_active", ["storeId", "isActive"]),

  // Course Cycle Emails (AI-generated nurture/pitch content)
  courseCycleEmails: defineTable({
    courseCycleConfigId: v.id("courseCycleConfigs"),
    courseId: v.id("courses"),
    emailType: v.union(v.literal("nurture"), v.literal("pitch")),
    emailIndex: v.number(), // 1, 2, 3... for ordering
    cycleNumber: v.number(), // 1 = first cycle, 2 = alternate content
    // Email content
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    // Source tracking
    generatedFromLesson: v.optional(v.string()),
    generatedAt: v.number(),
    // Performance tracking
    sentCount: v.number(),
    openedCount: v.number(),
    clickedCount: v.number(),
  })
    .index("by_courseCycleConfigId", ["courseCycleConfigId"])
    .index("by_courseId_type", ["courseId", "emailType"])
    .index("by_courseId_type_cycle", ["courseId", "emailType", "cycleNumber"]),

  // Email Deliverability Events (bounces, complaints, blocks)
  emailDeliverabilityEvents: defineTable({
    storeId: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    email: v.string(),
    eventType: v.union(
      v.literal("hard_bounce"),
      v.literal("soft_bounce"),
      v.literal("spam_complaint"),
      v.literal("blocked"),
      v.literal("unsubscribe"),
      v.literal("delivery_delay")
    ),
    reason: v.optional(v.string()), // Bounce reason code/message
    sourceIp: v.optional(v.string()),
    emailId: v.optional(v.string()), // Reference to the sent email
    workflowId: v.optional(v.id("emailWorkflows")),
    broadcastId: v.optional(v.string()),
    timestamp: v.number(),
    processed: v.boolean(), // Whether the event has been processed
  })
    .index("by_storeId", ["storeId"])
    .index("by_storeId_timestamp", ["storeId", "timestamp"])
    .index("by_email", ["email"])
    .index("by_eventType", ["storeId", "eventType"])
    .index("by_contactId", ["contactId"]),

  // Email Deliverability Stats (aggregated per store)
  emailDeliverabilityStats: defineTable({
    storeId: v.string(),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    periodStart: v.number(), // Start timestamp of the period
    totalSent: v.number(),
    delivered: v.number(),
    hardBounces: v.number(),
    softBounces: v.number(),
    spamComplaints: v.number(),
    blocks: v.number(),
    unsubscribes: v.number(),
    deliveryRate: v.number(), // Percentage
    bounceRate: v.number(),
    spamRate: v.number(),
    healthScore: v.number(), // 0-100 overall health score
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_storeId_period", ["storeId", "period"])
    .index("by_storeId_periodStart", ["storeId", "periodStart"]),

  // Domain Reputation Tracking
  emailDomainReputation: defineTable({
    storeId: v.string(),
    domain: v.string(), // Sending domain
    reputationScore: v.number(), // 0-100
    authenticationStatus: v.object({
      spf: v.union(v.literal("pass"), v.literal("fail"), v.literal("unknown")),
      dkim: v.union(v.literal("pass"), v.literal("fail"), v.literal("unknown")),
      dmarc: v.union(v.literal("pass"), v.literal("fail"), v.literal("unknown")),
    }),
    blacklistStatus: v.array(
      v.object({
        list: v.string(),
        listed: v.boolean(),
        lastChecked: v.number(),
      })
    ),
    lastChecked: v.number(),
    recommendations: v.array(v.string()),
  })
    .index("by_storeId", ["storeId"])
    .index("by_domain", ["domain"]),

  // Lead Scoring Rules (customizable scoring criteria)
  leadScoringRules: defineTable({
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    rules: v.array(
      v.object({
        id: v.string(),
        category: v.union(
          v.literal("engagement"),
          v.literal("demographic"),
          v.literal("behavior"),
          v.literal("recency")
        ),
        field: v.string(), // e.g., "emailsOpened", "daysSinceSignup", "purchaseCount"
        operator: v.union(
          v.literal("equals"),
          v.literal("greater_than"),
          v.literal("less_than"),
          v.literal("between"),
          v.literal("contains")
        ),
        value: v.any(),
        points: v.number(), // Points to add/subtract
        isNegative: v.optional(v.boolean()), // Whether to subtract points
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_active", ["storeId", "isActive"]),

  // Lead Score History (track score changes over time)
  leadScoreHistory: defineTable({
    storeId: v.string(),
    contactId: v.id("emailContacts"),
    previousScore: v.number(),
    newScore: v.number(),
    changeReason: v.string(), // e.g., "Email opened", "Purchase made"
    ruleId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_storeId_timestamp", ["storeId", "timestamp"]),

  // Lead Scoring Summary - Pre-aggregated metrics to avoid full-table scans
  // IMPORTANT: Convex has a 32k doc read limit per query. This table stores
  // pre-computed lead scoring metrics updated incrementally to avoid scanning
  // all contacts. See rebuildLeadScoringSummary mutation to rebuild.
  leadScoringSummary: defineTable({
    storeId: v.string(),
    // Distribution counts
    hotCount: v.number(), // score >= 70
    warmCount: v.number(), // score 40-69
    coldCount: v.number(), // score 10-39
    inactiveCount: v.number(), // score < 10
    // Aggregate metrics
    totalSubscribed: v.number(),
    totalScore: v.number(), // Sum of all scores for average calculation
    needsAttentionCount: v.number(), // Engaged contacts inactive for 14+ days
    // Median calculation support (store sorted score buckets)
    scoreBuckets: v.optional(v.array(v.number())), // [count at score 0, count at score 1, ..., count at score 100]
    // Timestamps
    lastRebuiltAt: v.number(),
    updatedAt: v.number(),
  }).index("by_storeId", ["storeId"]),

  // Email Test History (Phase 7)
  emailTestHistory: defineTable({
    storeId: v.string(),
    userId: v.string(),
    subject: v.string(),
    recipient: v.string(),
    templateId: v.optional(v.string()),
    sentAt: v.number(),
  }).index("by_storeId", ["storeId"]),

  // Phase 8: Webhook Endpoints (for external automation triggers)
  webhookEndpoints: defineTable({
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    endpointKey: v.string(), // Unique key for the webhook URL
    secretKey: v.string(), // For webhook signature validation
    isActive: v.boolean(),
    // Optional: Link to specific workflow
    workflowId: v.optional(v.id("emailWorkflows")),
    // Rate limiting
    rateLimitPerMinute: v.optional(v.number()),
    // Stats
    totalCalls: v.number(),
    lastCalledAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_endpointKey", ["endpointKey"])
    .index("by_active", ["storeId", "isActive"]),

  // Phase 8: Webhook Call Logs
  webhookCallLogs: defineTable({
    webhookEndpointId: v.id("webhookEndpoints"),
    storeId: v.string(),
    payload: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("rate_limited")),
    errorMessage: v.optional(v.string()),
    workflowTriggered: v.optional(v.boolean()),
    executionId: v.optional(v.id("workflowExecutions")),
    timestamp: v.number(),
  })
    .index("by_webhookEndpointId", ["webhookEndpointId"])
    .index("by_storeId_timestamp", ["storeId", "timestamp"]),

  // Phase 8: Custom Events (for custom_event trigger)
  customEvents: defineTable({
    storeId: v.string(),
    eventName: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    // Track how many workflows use this event
    workflowCount: v.number(),
    // Stats
    totalFires: v.number(),
    lastFiredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_storeId_eventName", ["storeId", "eventName"]),

  // Phase 8: Custom Event Logs
  customEventLogs: defineTable({
    customEventId: v.id("customEvents"),
    storeId: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    contactEmail: v.optional(v.string()),
    eventData: v.optional(v.any()),
    source: v.optional(v.string()), // "api", "webhook", "internal"
    workflowsTriggered: v.number(),
    timestamp: v.number(),
  })
    .index("by_customEventId", ["customEventId"])
    .index("by_storeId_timestamp", ["storeId", "timestamp"])
    .index("by_contactId", ["contactId"]),

  // Phase 8: Page Visit Tracking (for page_visit trigger)
  pageVisitEvents: defineTable({
    storeId: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    contactEmail: v.optional(v.string()),
    pageUrl: v.string(),
    pagePath: v.string(),
    pageTitle: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    workflowTriggered: v.optional(v.boolean()),
    timestamp: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_contactId", ["contactId"])
    .index("by_storeId_pagePath", ["storeId", "pagePath"])
    .index("by_storeId_timestamp", ["storeId", "timestamp"]),

  // Phase 8: Cart Abandon Events (for cart_abandon trigger)
  cartAbandonEvents: defineTable({
    storeId: v.string(),
    contactId: v.optional(v.id("emailContacts")),
    contactEmail: v.string(),
    cartId: v.optional(v.string()),
    cartValue: v.optional(v.number()),
    cartItems: v.optional(v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
    }))),
    abandonedAt: v.number(),
    recoveryEmailSent: v.boolean(),
    recoveryEmailSentAt: v.optional(v.number()),
    recovered: v.boolean(),
    recoveredAt: v.optional(v.number()),
    workflowTriggered: v.optional(v.boolean()),
    executionId: v.optional(v.id("workflowExecutions")),
  })
    .index("by_storeId", ["storeId"])
    .index("by_contactId", ["contactId"])
    .index("by_contactEmail", ["storeId", "contactEmail"])
    .index("by_recovered", ["storeId", "recovered"]),

  digitalProducts: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isPublished: v.optional(v.boolean()),
    category: v.optional(v.string()), // Product category for filtering
    buttonLabel: v.optional(v.string()),
    style: v.optional(
      v.union(
        v.literal("button"),
        v.literal("callout"),
        v.literal("preview"),
        v.literal("card"),
        v.literal("minimal")
      )
    ),
    // URL/Media specific fields
    productType: v.optional(
      v.union(
        v.literal("digital"),
        v.literal("urlMedia"),
        v.literal("coaching"),
        v.literal("effectChain"), // Renamed from abletonRack
        v.literal("abletonRack"), // Legacy - keep for backward compatibility
        v.literal("abletonPreset"),
        v.literal("playlistCuration") // NEW: Playlist curation as a product
      )
    ),

    // Product Category (more specific than productType)
    productCategory: v.optional(
      v.union(
        // Music Production
        v.literal("sample-pack"),
        v.literal("preset-pack"),
        v.literal("midi-pack"),
        v.literal("bundle"), // NEW: Bundle multiple products together
        v.literal("effect-chain"), // NEW: Multi-DAW effect chains
        v.literal("ableton-rack"), // Legacy - keep for backward compatibility
        v.literal("beat-lease"),
        v.literal("project-files"),
        v.literal("mixing-template"),
        // Services
        v.literal("coaching"),
        v.literal("mixing-service"),
        v.literal("mastering-service"),
        // Curation
        v.literal("playlist-curation"),
        // Education
        v.literal("course"),
        v.literal("workshop"),
        v.literal("masterclass"),
        // Digital Content
        v.literal("pdf"), // Consolidated: PDFs, cheat sheets, guides, ebooks
        v.literal("pdf-guide"), // Legacy
        v.literal("cheat-sheet"), // Legacy
        v.literal("template"), // Legacy
        v.literal("blog-post"),
        // Community
        v.literal("community"),
        // Support & Donations
        v.literal("tip-jar"),
        v.literal("donation"),
        // Music Releases (NEW: Release marketing module)
        v.literal("release"),
        // Legacy (for backward compatibility)
        v.literal("lead-magnet")
      )
    ),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(
      v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))
    ),
    // Coaching specific fields
    duration: v.optional(v.number()), // Session duration in minutes
    sessionType: v.optional(v.string()), // "video", "audio", "phone"
    customFields: v.optional(v.any()), // Custom info fields to collect
    availability: v.optional(v.any()), // Availability configuration
    thumbnailStyle: v.optional(v.string()), // Thumbnail display style
    discordRoleId: v.optional(v.string()), // Discord role for coaching access
    // Ableton Rack specific fields
    abletonVersion: v.optional(v.string()), // "Live 9", "Live 10", "Live 11", "Live 12"
    minAbletonVersion: v.optional(v.string()), // Minimum required version
    rackType: v.optional(
      v.union(
        v.literal("audioEffect"),
        v.literal("instrument"),
        v.literal("midiEffect"),
        v.literal("drumRack")
      )
    ),
    effectType: v.optional(v.array(v.string())), // ["Delay", "Reverb", "Distortion", etc.]
    macroCount: v.optional(v.number()), // Number of macro controls (typically 8)
    cpuLoad: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    genre: v.optional(v.array(v.string())), // ["Hip Hop", "House", "Techno", etc.]
    bpm: v.optional(v.number()), // Optimal BPM range
    musicalKey: v.optional(v.string()), // Musical key if applicable
    requiresMaxForLive: v.optional(v.boolean()),
    thirdPartyPlugins: v.optional(v.array(v.string())), // ["FabFilter Pro-Q", "Soundtoys", etc.]
    demoAudioUrl: v.optional(v.string()), // 30-second audio preview
    chainImageUrl: v.optional(v.string()), // Screenshot of device chain
    macroScreenshotUrls: v.optional(v.array(v.string())), // Screenshots of macro controls
    complexity: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    tags: v.optional(v.array(v.string())), // Additional searchable tags
    fileFormat: v.optional(v.union(v.literal("adg"), v.literal("adv"), v.literal("alp"))), // .adg = rack, .adv = preset, .alp = pack
    fileSize: v.optional(v.number()), // File size in MB
    installationNotes: v.optional(v.string()), // Special installation instructions
    // Order bump & affiliate fields
    orderBumpEnabled: v.optional(v.boolean()),
    orderBumpProductName: v.optional(v.string()),
    orderBumpDescription: v.optional(v.string()),
    orderBumpPrice: v.optional(v.number()),
    orderBumpImageUrl: v.optional(v.string()),
    affiliateEnabled: v.optional(v.boolean()),

    // Pack Files (for sample/midi/preset packs)
    packFiles: v.optional(v.string()), // JSON stringified array of file metadata

    // Effect Chain / DAW-specific fields
    dawType: v.optional(
      v.union(
        v.literal("ableton"),
        v.literal("fl-studio"),
        v.literal("logic"),
        v.literal("bitwig"),
        v.literal("studio-one"),
        v.literal("reason"),
        v.literal("cubase"),
        v.literal("multi-daw")
      )
    ),
    dawVersion: v.optional(v.string()), // e.g., "11.3" for Ableton, "21.0" for FL Studio

    // Preset Pack Target Plugin (for productCategory: "preset-pack")
    targetPlugin: v.optional(
      v.union(
        // Popular Synths
        v.literal("serum"),
        v.literal("vital"),
        v.literal("massive"),
        v.literal("massive-x"),
        v.literal("omnisphere"),
        v.literal("sylenth1"),
        v.literal("phase-plant"),
        v.literal("pigments"),
        v.literal("diva"),
        v.literal("ana-2"),
        v.literal("spire"),
        v.literal("zebra"),
        v.literal("hive"),
        // DAW Stock Plugins
        v.literal("ableton-wavetable"),
        v.literal("ableton-operator"),
        v.literal("ableton-analog"),
        v.literal("fl-sytrus"),
        v.literal("fl-harmor"),
        v.literal("fl-harmless"),
        v.literal("logic-alchemy"),
        v.literal("logic-retro-synth"),
        // Effects
        v.literal("fabfilter"),
        v.literal("soundtoys"),
        v.literal("valhalla"),
        // Other
        v.literal("other")
      )
    ),
    targetPluginVersion: v.optional(v.string()), // e.g., "1.36" for Serum version

    // Follow Gate Configuration
    followGateEnabled: v.optional(v.boolean()),
    // Legacy fields (kept for backward compatibility)
    followGateRequirements: v.optional(
      v.object({
        requireEmail: v.optional(v.boolean()), // Require email to unlock
        requireInstagram: v.optional(v.boolean()), // Require Instagram follow
        requireTiktok: v.optional(v.boolean()), // Require TikTok follow
        requireYoutube: v.optional(v.boolean()), // Require YouTube subscribe
        requireSpotify: v.optional(v.boolean()), // Require Spotify follow
        minFollowsRequired: v.optional(v.number()), // e.g., "Follow 2 out of 4" (0 = all required)
      })
    ),
    followGateSocialLinks: v.optional(
      v.object({
        instagram: v.optional(v.string()), // @username or full URL
        tiktok: v.optional(v.string()),
        youtube: v.optional(v.string()),
        spotify: v.optional(v.string()),
        // New platforms
        soundcloud: v.optional(v.string()),
        appleMusic: v.optional(v.string()),
        deezer: v.optional(v.string()),
        twitch: v.optional(v.string()),
        mixcloud: v.optional(v.string()),
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        bandcamp: v.optional(v.string()),
      })
    ),
    followGateMessage: v.optional(v.string()), // Custom message to show users
    // New: Multi-step follow gate with mandatory/optional per platform
    followGateSteps: v.optional(
      v.array(
        v.object({
          platform: v.union(
            v.literal("email"),
            v.literal("instagram"),
            v.literal("tiktok"),
            v.literal("youtube"),
            v.literal("spotify"),
            v.literal("soundcloud"),
            v.literal("appleMusic"),
            v.literal("deezer"),
            v.literal("twitch"),
            v.literal("mixcloud"),
            v.literal("facebook"),
            v.literal("twitter"),
            v.literal("bandcamp")
          ),
          url: v.optional(v.string()), // Not needed for email
          mandatory: v.boolean(), // true = required, false = optional
          order: v.number(), // Display order (0-indexed)
        })
      )
    ),
    affiliateCommissionRate: v.optional(v.number()),
    affiliateMinPayout: v.optional(v.number()),
    affiliateCookieDuration: v.optional(v.number()),
    confirmationEmailSubject: v.optional(v.string()),
    confirmationEmailBody: v.optional(v.string()),

    // Playlist Curation Configuration (for productCategory: "playlist-curation")
    playlistCurationConfig: v.optional(
      v.object({
        linkedPlaylistId: v.optional(v.id("curatorPlaylists")), // Link to existing playlist
        reviewTurnaroundDays: v.optional(v.number()), // SLA (e.g., 3-7 days)
        genresAccepted: v.optional(v.array(v.string())), // Genres curator accepts
        submissionGuidelines: v.optional(v.string()), // Custom guidelines
        maxSubmissionsPerMonth: v.optional(v.number()), // Rate limiting
      })
    ),

    // Beat Lease Configuration (for productCategory: "beat-lease")
    beatLeaseConfig: v.optional(
      v.object({
        tiers: v.optional(
          v.array(
            v.object({
              type: v.union(
                v.literal("basic"),
                v.literal("premium"),
                v.literal("exclusive"),
                v.literal("unlimited")
              ),
              enabled: v.boolean(),
              price: v.number(),
              name: v.string(),
              distributionLimit: v.optional(v.number()),
              streamingLimit: v.optional(v.number()),
              commercialUse: v.boolean(),
              musicVideoUse: v.boolean(),
              radioBroadcasting: v.boolean(),
              stemsIncluded: v.boolean(),
              creditRequired: v.boolean(),
            })
          )
        ),
        bpm: v.optional(v.number()),
        key: v.optional(v.string()),
        genre: v.optional(v.string()),
      })
    ),

    // Beat Lease File URLs (for tier-based file delivery)
    wavUrl: v.optional(v.string()), // High quality WAV file
    stemsUrl: v.optional(v.string()), // Stems (zip or folder URL)
    trackoutsUrl: v.optional(v.string()), // Trackouts (full project files)

    // Beat Lease Exclusive Sale Tracking
    exclusiveSoldAt: v.optional(v.number()),
    exclusiveSoldTo: v.optional(v.string()), // userId who bought exclusive
    exclusivePurchaseId: v.optional(v.id("purchases")),

    // Linked Samples (unified samples system)
    sampleIds: v.optional(v.array(v.id("audioSamples"))), // Individual samples included in this pack
    sampleCategories: v.optional(v.array(v.string())), // Sample categories: drums, bass, melodic, etc.

    // Release Marketing Configuration (for productCategory: "release")
    releaseConfig: v.optional(
      v.object({
        // Release Details
        releaseDate: v.optional(v.number()), // Timestamp of release date
        releaseTime: v.optional(v.string()), // Time of day for release (e.g., "00:00")
        timezone: v.optional(v.string()), // Timezone for release
        releaseType: v.optional(
          v.union(
            v.literal("single"),
            v.literal("ep"),
            v.literal("album"),
            v.literal("mixtape"),
            v.literal("remix")
          )
        ),
        // Streaming Platform Links
        spotifyUri: v.optional(v.string()), // Spotify URI for pre-save
        spotifyAlbumId: v.optional(v.string()), // Spotify album/track ID
        appleMusicUrl: v.optional(v.string()), // Apple Music pre-add URL
        appleMusicAlbumId: v.optional(v.string()), // Apple Music album ID
        soundcloudUrl: v.optional(v.string()),
        youtubeUrl: v.optional(v.string()),
        tidalUrl: v.optional(v.string()),
        deezerUrl: v.optional(v.string()),
        amazonMusicUrl: v.optional(v.string()),
        bandcampUrl: v.optional(v.string()),
        smartLinkUrl: v.optional(v.string()), // Consolidated smart link (e.g., linktr.ee, fanlink)
        // Pre-save Campaign Settings
        preSaveEnabled: v.optional(v.boolean()),
        preSaveStartDate: v.optional(v.number()),
        preSaveEndDate: v.optional(v.number()), // Usually the release date
        // Drip Campaign Settings
        dripCampaignEnabled: v.optional(v.boolean()),
        dripCampaignId: v.optional(v.id("dripCampaigns")),
        // Email Sequence Timing
        preSaveEmailSent: v.optional(v.boolean()),
        releaseDayEmailSent: v.optional(v.boolean()),
        followUp48hEmailSent: v.optional(v.boolean()),
        playlistPitchEmailSent: v.optional(v.boolean()),
        // Track Metadata
        trackTitle: v.optional(v.string()),
        artistName: v.optional(v.string()),
        featuredArtists: v.optional(v.array(v.string())),
        label: v.optional(v.string()),
        isrc: v.optional(v.string()), // International Standard Recording Code
        upc: v.optional(v.string()), // Universal Product Code for albums
        // Cover Art
        coverArtUrl: v.optional(v.string()),
        coverArtStorageId: v.optional(v.string()),
        // Playlist Pitching
        playlistPitchEnabled: v.optional(v.boolean()),
        playlistPitchMessage: v.optional(v.string()),
        targetPlaylistCurators: v.optional(v.array(v.string())), // Curator IDs to pitch to
      })
    ),

    // Pinned product - appears first in storefront
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()), // Timestamp for ordering multiple pinned products
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_productCategory", ["productCategory"])
    .index("by_storeId_and_slug", ["storeId", "slug"])
    .index("by_slug", ["slug"]),

  // Reviews for products
  productReviews: defineTable({
    productId: v.string(),
    reviewText: v.string(),
    rating: v.optional(v.number()),
    customerName: v.optional(v.string()),
  }).index("by_productId", ["productId"]),

  // Reviews for courses
  courseReviews: defineTable({
    courseId: v.id("courses"),
    userId: v.string(), // Clerk user ID
    rating: v.number(), // 1-5 stars
    title: v.optional(v.string()), // Review title
    reviewText: v.string(),
    isVerifiedPurchase: v.boolean(), // User actually enrolled
    isPublished: v.boolean(), // Visible to others
    helpfulCount: v.optional(v.number()), // Users who found this helpful
    reportCount: v.optional(v.number()), // Spam/abuse reports
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    // Optional instructor response
    instructorResponse: v.optional(v.string()),
    instructorResponseAt: v.optional(v.number()),
  })
    .index("by_courseId", ["courseId"])
    .index("by_userId", ["userId"])
    .index("by_courseId_rating", ["courseId", "rating"])
    .index("by_published", ["isPublished"]),

  // Email flows
  emailFlows: defineTable({
    productId: v.string(),
    flowName: v.string(),
    isActive: v.optional(v.boolean()),
  }).index("by_productId", ["productId"]),

  // Coach Management
  coachProfiles: defineTable({
    userId: v.string(),
    category: v.string(),
    location: v.string(),
    imageSrc: v.string(),
    basePrice: v.number(),
    title: v.string(),
    description: v.string(),
    discordUsername: v.string(),
    discordId: v.optional(v.string()),
    alternativeContact: v.optional(v.string()),
    professionalBackground: v.optional(v.string()),
    certifications: v.optional(v.string()),
    notableProjects: v.optional(v.string()),
    timezone: v.string(),
    availableDays: v.string(),
    availableHours: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    stripeAccountId: v.optional(v.string()),
    stripeConnectComplete: v.optional(v.boolean()),
    stripeAccountStatus: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  coachingSessions: defineTable({
    productId: v.id("digitalProducts"),
    coachId: v.string(),
    studentId: v.string(),
    scheduledDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    duration: v.number(),
    status: v.union(
      v.literal("SCHEDULED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
      v.literal("NO_SHOW")
    ),
    notes: v.optional(v.string()),
    sessionType: v.optional(v.string()),
    totalCost: v.number(),
    discordChannelId: v.optional(v.string()),
    discordRoleId: v.optional(v.string()),
    discordSetupComplete: v.optional(v.boolean()),
    discordCleanedUp: v.optional(v.boolean()),
    reminderSent: v.optional(v.boolean()),
  })
    .index("by_productId", ["productId"])
    .index("by_coachId", ["coachId"])
    .index("by_studentId", ["studentId"])
    .index("by_scheduledDate", ["scheduledDate"])
    .index("by_status", ["status"]),

  // User Progress Tracking - Enhanced for library
  userProgress: defineTable({
    userId: v.string(),
    courseId: v.optional(v.id("courses")),
    moduleId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    chapterId: v.string(),
    isCompleted: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()), // in seconds
    lastAccessedAt: v.optional(v.number()),
    progressPercentage: v.optional(v.number()), // 0-100
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_chapterId", ["chapterId"])
    .index("by_user_chapter", ["userId", "chapterId"])
    .index("by_user_course", ["userId", "courseId"])
    // NEW: Performance indexes for completion queries
    .index("by_user_completed", ["userId", "isCompleted"])
    .index("by_course_completed", ["courseId", "isCompleted"])
    // Additional composite index for filtering completed progress by user and course
    .index("by_user_course_completed", ["userId", "courseId", "isCompleted"]),

  // Live Viewer Tracking (Real-time presence)
  liveViewers: defineTable({
    courseId: v.id("courses"),
    chapterId: v.optional(v.id("courseChapters")),
    userId: v.string(), // Clerk user ID
    lastSeen: v.number(), // Timestamp of last heartbeat
    expiresAt: v.number(), // When this presence expires (60s after last heartbeat)
  })
    .index("by_course", ["courseId"])
    .index("by_course_user", ["courseId", "userId"])
    .index("by_expiresAt", ["expiresAt"]),

  // Library Sessions - Track user activity in library
  librarySessions: defineTable({
    userId: v.string(),
    sessionType: v.union(
      v.literal("course"),
      v.literal("download"),
      v.literal("coaching"),
      v.literal("browse")
    ),
    resourceId: v.optional(v.string()), // courseId, productId, etc.
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // in seconds
    deviceType: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_sessionType", ["sessionType"])
    .index("by_resourceId", ["resourceId"])
    .index("by_startedAt", ["startedAt"]),

  // Collaborative Timestamped Notes
  courseNotes: defineTable({
    courseId: v.id("courses"),
    chapterId: v.id("courseChapters"),
    userId: v.string(), // Clerk user ID
    content: v.string(),
    timestamp: v.number(), // Timestamp in seconds
    isPublic: v.boolean(), // Private by default, can be shared
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chapter", ["chapterId"])
    .index("by_chapter_user", ["chapterId", "userId"])
    .index("by_chapter_public", ["chapterId", "isPublic"])
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"]),

  // Lead Magnet Submissions
  leadSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    adminUserId: v.string(), // The admin who owns the lead magnet
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    hasDownloaded: v.optional(v.boolean()),
    downloadCount: v.optional(v.number()),
    lastDownloadAt: v.optional(v.number()),
    source: v.optional(v.string()), // tracking where they came from
  })
    .index("by_email", ["email"])
    .index("by_productId", ["productId"])
    .index("by_storeId", ["storeId"])
    .index("by_adminUserId", ["adminUserId"])
    .index("by_email_and_product", ["email", "productId"]),

  // Follow Gate Submissions (Track social follow gates)
  followGateSubmissions: defineTable({
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    creatorId: v.string(), // Creator who owns the product

    // User Information
    email: v.string(),
    name: v.optional(v.string()),

    // Follow Confirmations (self-reported by user)
    followedPlatforms: v.object({
      instagram: v.optional(v.boolean()),
      tiktok: v.optional(v.boolean()),
      youtube: v.optional(v.boolean()),
      spotify: v.optional(v.boolean()),
      soundcloud: v.optional(v.boolean()),
      appleMusic: v.optional(v.boolean()),
      deezer: v.optional(v.boolean()),
      twitch: v.optional(v.boolean()),
      mixcloud: v.optional(v.boolean()),
      facebook: v.optional(v.boolean()),
      twitter: v.optional(v.boolean()),
      bandcamp: v.optional(v.boolean()),
    }),

    // Metadata
    submittedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Download Tracking
    hasDownloaded: v.optional(v.boolean()),
    downloadCount: v.optional(v.number()),
    lastDownloadAt: v.optional(v.number()),
  })
    .index("by_product", ["productId"])
    .index("by_email", ["email"])
    .index("by_creator", ["creatorId"])
    .index("by_store", ["storeId"])
    .index("by_email_product", ["email", "productId"])
    .index("by_submitted_at", ["submittedAt"]),

  // Release Pre-Saves (Track pre-save submissions for music releases)
  releasePreSaves: defineTable({
    releaseId: v.id("digitalProducts"), // The release product
    storeId: v.string(),
    creatorId: v.string(), // Creator who owns the release

    // User Information
    email: v.string(),
    name: v.optional(v.string()),

    // Pre-save Platform Confirmations
    platforms: v.object({
      spotify: v.optional(v.boolean()), // Pre-saved on Spotify
      appleMusic: v.optional(v.boolean()), // Pre-added on Apple Music
      deezer: v.optional(v.boolean()),
      tidal: v.optional(v.boolean()),
      amazonMusic: v.optional(v.boolean()),
    }),

    // OAuth tokens for automatic pre-save (optional)
    spotifyAccessToken: v.optional(v.string()),
    spotifyRefreshToken: v.optional(v.string()),
    spotifyUserId: v.optional(v.string()),
    appleMusicUserToken: v.optional(v.string()),

    // Tracking
    preSavedAt: v.number(),
    source: v.optional(v.string()), // Where they came from (email, social, direct)
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Drip Campaign Enrollment
    enrolledInDripCampaign: v.optional(v.boolean()),
    dripCampaignEnrollmentId: v.optional(v.id("dripCampaignEnrollments")),

    // Email Sequence Tracking
    preSaveConfirmationSent: v.optional(v.boolean()),
    releaseDayEmailSent: v.optional(v.boolean()),
    followUp48hEmailSent: v.optional(v.boolean()),
    playlistPitchEmailSent: v.optional(v.boolean()),

    // Engagement After Release
    hasStreamed: v.optional(v.boolean()), // Did they actually listen after release
    addedToPlaylist: v.optional(v.boolean()), // Did they add to a playlist
  })
    .index("by_release", ["releaseId"])
    .index("by_email", ["email"])
    .index("by_creator", ["creatorId"])
    .index("by_store", ["storeId"])
    .index("by_email_release", ["email", "releaseId"])
    .index("by_presaved_at", ["preSavedAt"]),

  // Customer Management
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    storeId: v.string(),
    adminUserId: v.string(),
    type: v.union(v.literal("lead"), v.literal("paying"), v.literal("subscription")),
    status: v.union(v.literal("active"), v.literal("inactive")),
    totalSpent: v.optional(v.number()),
    lastActivity: v.optional(v.number()),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),

    // ActiveCampaign / Fan Management Fields
    phone: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // For segmentation

    // Producer Profile Fields
    daw: v.optional(v.string()), // Digital Audio Workstation (Ableton, FL Studio, etc.)
    typeOfMusic: v.optional(v.string()), // Genre preference
    goals: v.optional(v.string()), // Production goals
    musicAlias: v.optional(v.string()), // Artist name
    studentLevel: v.optional(v.string()), // Beginner, Intermediate, Advanced, Pro
    howLongProducing: v.optional(v.string()),
    whySignedUp: v.optional(v.string()),
    genreSpecialty: v.optional(v.string()),

    // Engagement Tracking
    score: v.optional(v.number()), // Engagement score (0-100)
    lastOpenDate: v.optional(v.number()), // Last email open
    opensEmail: v.optional(v.boolean()),
    clicksLinks: v.optional(v.boolean()),

    // Location
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    stateCode: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),

    // ActiveCampaign Import
    activeCampaignId: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_storeId", ["storeId"])
    .index("by_adminUserId", ["adminUserId"])
    .index("by_type", ["type"])
    .index("by_email_and_store", ["email", "storeId"]),

  // Fan Count Aggregation (for large datasets)
  fanCounts: defineTable({
    storeId: v.string(),
    totalCount: v.number(),
    leads: v.number(),
    paying: v.number(),
    subscriptions: v.number(),
    lastUpdated: v.number(), // Timestamp of last count
  }).index("by_storeId", ["storeId"]),

  // Purchase History - Enhanced for library system
  purchases: defineTable({
    userId: v.string(), // Direct user ID from Clerk for library access
    customerId: v.optional(v.id("customers")), // Keep for backward compatibility
    productId: v.optional(v.id("digitalProducts")), // Optional for course purchases
    courseId: v.optional(v.id("courses")), // For course purchases
    bundleId: v.optional(v.id("bundles")), // For bundle purchases
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    productType: v.union(
      v.literal("digitalProduct"),
      v.literal("course"),
      v.literal("coaching"),
      v.literal("bundle"),
      v.literal("beatLease")
    ),
    // Beat License reference (for beatLease purchases)
    beatLicenseId: v.optional(v.id("beatLicenses")),
    // Library access fields
    accessGranted: v.optional(v.boolean()),
    accessExpiresAt: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
    // Payout tracking
    isPaidOut: v.optional(v.boolean()),
    payoutId: v.optional(v.string()),
    paidOutAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_customerId", ["customerId"])
    .index("by_productId", ["productId"])
    .index("by_courseId", ["courseId"])
    .index("by_storeId", ["storeId"])
    .index("by_adminUserId", ["adminUserId"])
    .index("by_status", ["status"])
    .index("by_productType", ["productType"])
    .index("by_user_product", ["userId", "productId"])
    .index("by_user_course", ["userId", "courseId"])
    // NEW: Performance indexes for creator dashboard
    // Note: _creationTime is automatically added to all indexes by Convex
    .index("by_store_status", ["storeId", "status"])
    .index("by_user_status", ["userId", "status"]),

  // Beat Licenses - tracks sold beat licenses with tier info
  beatLicenses: defineTable({
    purchaseId: v.id("purchases"),
    beatId: v.id("digitalProducts"),
    userId: v.string(),
    storeId: v.id("stores"),
    tierType: v.union(
      v.literal("basic"),
      v.literal("premium"),
      v.literal("exclusive"),
      v.literal("unlimited")
    ),
    tierName: v.string(),
    price: v.number(),
    // License terms (snapshot at purchase time)
    distributionLimit: v.optional(v.number()),
    streamingLimit: v.optional(v.number()),
    commercialUse: v.boolean(),
    musicVideoUse: v.boolean(),
    radioBroadcasting: v.boolean(),
    stemsIncluded: v.boolean(),
    creditRequired: v.boolean(),
    // Delivery
    deliveredFiles: v.array(v.string()), // ["mp3", "wav", "stems", "trackouts"]
    // Contract
    contractGeneratedAt: v.optional(v.number()),
    buyerName: v.optional(v.string()),
    buyerEmail: v.string(),
    // Beat info snapshot (for contract generation)
    beatTitle: v.string(),
    producerName: v.string(),
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_purchase", ["purchaseId"])
    .index("by_user", ["userId"])
    .index("by_beat", ["beatId"])
    .index("by_store", ["storeId"])
    .index("by_user_beat", ["userId", "beatId"]),

  // Subscriptions (Legacy - keeping for backward compatibility)
  subscriptions: defineTable({
    customerId: v.id("customers"),
    planName: v.string(),
    storeId: v.string(),
    adminUserId: v.string(),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("paused")),
    amount: v.number(),
    currency: v.string(),
    billingInterval: v.union(v.literal("monthly"), v.literal("yearly")),
    nextBillingDate: v.optional(v.number()),
    subscriptionId: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_customerId", ["customerId"])
    .index("by_storeId", ["storeId"])
    .index("by_adminUserId", ["adminUserId"])
    .index("by_status", ["status"]),

  // Creator Subscription System - NEW
  // Per-creator subscription tiers (like Patreon/Teachable)
  creatorSubscriptionTiers: defineTable({
    creatorId: v.string(), // Creator's userId
    storeId: v.string(),
    tierName: v.string(), // "Basic", "Pro", "VIP"
    slug: v.optional(v.string()), // URL-friendly identifier
    description: v.string(),
    priceMonthly: v.number(),
    priceYearly: v.optional(v.number()),
    stripePriceIdMonthly: v.string(),
    stripePriceIdYearly: v.optional(v.string()),
    benefits: v.array(v.string()),
    maxCourses: v.optional(v.number()), // null = unlimited
    trialDays: v.optional(v.number()), // Free trial period in days
    imageUrl: v.optional(v.string()), // Tier thumbnail
    subscriberCount: v.optional(v.number()), // Cached count for marketplace
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_storeId", ["storeId"])
    .index("by_active", ["isActive"])
    .index("by_creator_active", ["creatorId", "isActive"])
    .index("by_slug", ["slug"]),

  // User subscriptions to creators
  userCreatorSubscriptions: defineTable({
    userId: v.string(), // Subscriber
    creatorId: v.string(), // Creator being subscribed to
    tierId: v.id("creatorSubscriptionTiers"),
    storeId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("paused")
    ),
    stripeSubscriptionId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_user_creator", ["userId", "creatorId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_creator_status", ["creatorId", "status"])
    .index("by_stripe_id", ["stripeSubscriptionId"]),

  // Content access control (granular permissions)
  contentAccess: defineTable({
    resourceId: v.string(), // courseId or productId
    resourceType: v.union(v.literal("course"), v.literal("product"), v.literal("coaching")),
    accessType: v.union(v.literal("free"), v.literal("purchase"), v.literal("subscription")),
    requiredTierId: v.optional(v.id("creatorSubscriptionTiers")), // For subscription-only
    creatorId: v.string(),
    storeId: v.string(),
  })
    .index("by_resourceId", ["resourceId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_storeId", ["storeId"])
    .index("by_resource_type", ["resourceId", "resourceType"]),

  // Creator Earnings Tracking
  creatorEarnings: defineTable({
    creatorId: v.string(),
    storeId: v.string(),
    transactionType: v.union(
      v.literal("course_sale"),
      v.literal("product_sale"),
      v.literal("subscription_payment"),
      v.literal("coaching_session")
    ),
    purchaseId: v.optional(v.id("purchases")),
    subscriptionId: v.optional(v.id("userCreatorSubscriptions")),
    grossAmount: v.number(),
    platformFee: v.number(), // 10%
    processingFee: v.number(), // Stripe fees
    netAmount: v.number(),
    currency: v.string(),
    payoutStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed")
    ),
    stripeTransferId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_storeId", ["storeId"])
    .index("by_payoutStatus", ["payoutStatus"])
    .index("by_creator_status", ["creatorId", "payoutStatus"])
    .index("by_transactionType", ["transactionType"]),
  // Note: _creationTime is automatically added to all indexes, so by_creatorId already supports time-based queries

  // Email Campaign System
  emailCampaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    content: v.string(), // HTML content
    previewText: v.optional(v.string()), // Email preview text
    storeId: v.string(),
    adminUserId: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("paused"),  // Can be resumed after error
      v.literal("partial")  // Some sent, some failed
    ),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    recipientCount: v.optional(v.number()),
    sentCount: v.optional(v.number()), // Number of emails successfully sent
    failedCount: v.optional(v.number()), // Number of emails that failed
    deliveredCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    templateId: v.optional(v.string()), // Template used to create this campaign
    updatedAt: v.optional(v.number()), // Last update timestamp
    targetTagIds: v.optional(v.array(v.id("emailTags"))), // Filter recipients by tags (AND logic)
    targetTagMode: v.optional(v.union(v.literal("all"), v.literal("any"))), // all=AND, any=OR
    excludeTagIds: v.optional(v.array(v.id("emailTags"))), // Exclude contacts with these tags
    lastProcessedCursor: v.optional(v.string()), // For resumability
    lastError: v.optional(v.string()), // Last error message
  })
    .index("by_storeId", ["storeId"])
    .index("by_adminUserId", ["adminUserId"])
    .index("by_status", ["status"]),

  emailCampaignRecipients: defineTable({
    campaignId: v.id("emailCampaigns"),
    customerId: v.id("customers"),
    customerEmail: v.string(),
    customerName: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    resendMessageId: v.optional(v.string()),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_customerId", ["customerId"])
    .index("by_status", ["status"])
    .index("by_campaignId_and_status", ["campaignId", "status"]),

  emailTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    content: v.string(), // HTML content
    storeId: v.string(),
    adminUserId: v.string(),
    category: v.optional(v.string()), // newsletter, promotion, announcement, etc.
    isDefault: v.optional(v.boolean()),
    thumbnail: v.optional(v.string()), // preview image URL
  })
    .index("by_storeId", ["storeId"])
    .index("by_adminUserId", ["adminUserId"])
    .index("by_category", ["category"]),

  // Marketing Campaigns - Multi-platform campaigns (email + social media)
  marketingCampaigns: defineTable({
    storeId: v.string(), // "admin" for admin campaigns
    userId: v.string(), // Clerk ID
    templateId: v.string(), // Reference to template
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
    campaignType: v.union(
      v.literal("product_launch"),
      v.literal("welcome_onboarding"),
      v.literal("flash_sale"),
      v.literal("reengagement"),
      v.literal("course_milestone"),
      v.literal("seasonal_holiday")
    ),
    // Product reference (if applicable)
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    // Variable values filled by user (productName, productUrl, etc.)
    variableValues: v.optional(v.any()),
    // Customized platform content (overrides template defaults)
    emailContent: v.optional(v.object({
      subject: v.string(),
      previewText: v.optional(v.string()),
      body: v.string(),
      ctaText: v.optional(v.string()),
    })),
    instagramContent: v.optional(v.object({
      caption: v.string(),
      hashtags: v.array(v.string()),
      suggestedImageStyle: v.optional(v.string()),
    })),
    twitterContent: v.optional(v.object({
      tweet: v.string(),
      threadPosts: v.optional(v.array(v.string())),
      hashtags: v.optional(v.array(v.string())),
    })),
    facebookContent: v.optional(v.object({
      post: v.string(),
      callToAction: v.optional(v.string()),
    })),
    linkedinContent: v.optional(v.object({
      post: v.string(),
      hashtags: v.array(v.string()),
    })),
    tiktokContent: v.optional(v.object({
      caption: v.string(),
      hashtags: v.array(v.string()),
      hookLine: v.optional(v.string()),
    })),
    // Platform scheduling
    scheduledPlatforms: v.optional(v.array(v.object({
      platform: v.union(
        v.literal("email"),
        v.literal("instagram"),
        v.literal("twitter"),
        v.literal("facebook"),
        v.literal("linkedin"),
        v.literal("tiktok")
      ),
      enabled: v.boolean(),
      scheduledAt: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("sent"),
        v.literal("failed"),
        v.literal("skipped")
      ),
      postId: v.optional(v.string()), // Reference to social post or email
      emailCampaignId: v.optional(v.id("emailCampaigns")),
      scheduledPostId: v.optional(v.id("scheduledPosts")),
      error: v.optional(v.string()),
    }))),
    // Analytics aggregated
    analytics: v.optional(v.object({
      emailOpens: v.optional(v.number()),
      emailClicks: v.optional(v.number()),
      socialImpressions: v.optional(v.number()),
      socialEngagement: v.optional(v.number()),
      conversions: v.optional(v.number()),
      revenue: v.optional(v.number()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_campaignType", ["campaignType"])
    .index("by_store_status", ["storeId", "status"]),

  // RAG System - Vector Embeddings
  embeddings: defineTable({
    content: v.string(),
    embedding: v.array(v.number()), // OpenAI embeddings are 1536 dimensions
    userId: v.string(),
    metadata: v.optional(v.any()), // Store any additional metadata (courseId, type, etc.)
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceType: v.optional(
      v.union(
        v.literal("course"),
        v.literal("chapter"),
        v.literal("lesson"),
        v.literal("document"),
        v.literal("note"),
        v.literal("custom"),
        v.literal("socialPost") // Instagram post captions + video transcriptions
      )
    ),
    sourceId: v.optional(v.string()), // ID of the source (courseId, chapterId, etc.)
  })
    .index("by_userId", ["userId"])
    .index("by_category", ["category"])
    .index("by_sourceType", ["sourceType"])
    .index("by_sourceId", ["sourceId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_sourceType", ["userId", "sourceType"]),

  // Notes System - Notion-style note taking
  noteFolders: defineTable({
    name: v.string(),
    userId: v.string(), // Clerk ID of the owner
    storeId: v.string(), // Store context
    parentId: v.optional(v.id("noteFolders")), // For nested folders
    description: v.optional(v.string()),
    color: v.optional(v.string()), // Hex color code for folder
    icon: v.optional(v.string()), // Emoji or icon name
    position: v.number(), // For ordering
    isArchived: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_parentId", ["parentId"])
    .index("by_user_and_store", ["userId", "storeId"])
    .index("by_user_and_parent", ["userId", "parentId"])
    .index("by_archived", ["isArchived"]),

  notes: defineTable({
    title: v.string(),
    content: v.string(), // Rich text HTML content
    userId: v.string(), // Clerk ID of the author
    storeId: v.string(), // Store context
    folderId: v.optional(v.id("noteFolders")), // Parent folder

    // Content metadata
    plainTextContent: v.optional(v.string()), // For search and RAG
    wordCount: v.optional(v.number()),
    readTimeMinutes: v.optional(v.number()),

    // Organization
    tags: v.array(v.string()), // User-defined tags
    category: v.optional(v.string()), // Course category context
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))
    ),

    // Status tracking
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("archived")
    ),

    // AI and course generation
    isProcessedForRAG: v.boolean(), // Whether embeddings were generated
    linkedCourseId: v.optional(v.id("courses")), // If note was used to generate course
    aiSummary: v.optional(v.string()), // AI-generated summary

    // Timestamps
    lastEditedAt: v.number(),
    lastViewedAt: v.optional(v.number()),

    // Collaboration
    isShared: v.boolean(),
    sharedWith: v.optional(v.array(v.string())), // Clerk IDs of collaborators

    // Template system
    isTemplate: v.boolean(),
    templateCategory: v.optional(v.string()),

    // Notion-like features
    icon: v.optional(v.string()), // Emoji or icon
    coverImage: v.optional(v.string()), // Cover image URL

    // Archival
    isArchived: v.boolean(),
    isFavorite: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_folderId", ["folderId"])
    .index("by_user_and_store", ["userId", "storeId"])
    .index("by_user_and_folder", ["userId", "folderId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_lastEditedAt", ["lastEditedAt"])
    .index("by_isTemplate", ["isTemplate"])
    .index("by_isArchived", ["isArchived"])
    .index("by_isFavorite", ["isFavorite"])
    .index("by_linkedCourseId", ["linkedCourseId"])
    .searchIndex("search_content", {
      searchField: "plainTextContent",
      filterFields: ["userId", "storeId", "status", "isArchived"],
    }),

  // Note Templates - Predefined note structures
  noteTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    content: v.string(), // Template HTML content with placeholders
    category: v.string(), // e.g., "Course Planning", "Research", "Meeting Notes"
    tags: v.array(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.boolean(), // Whether template is available to all users
    createdBy: v.string(), // Clerk ID of creator
    usageCount: v.number(), // Track popularity
  })
    .index("by_category", ["category"])
    .index("by_isPublic", ["isPublic"])
    .index("by_createdBy", ["createdBy"])
    .index("by_usageCount", ["usageCount"]),

  // Note Comments - For collaboration
  noteComments: defineTable({
    noteId: v.id("notes"),
    authorId: v.string(), // Clerk ID
    content: v.string(),
    parentCommentId: v.optional(v.id("noteComments")), // For threaded comments
    isResolved: v.boolean(),
    resolvedBy: v.optional(v.string()), // Clerk ID
    resolvedAt: v.optional(v.number()),
  })
    .index("by_noteId", ["noteId"])
    .index("by_authorId", ["authorId"])
    .index("by_parentCommentId", ["parentCommentId"])
    .index("by_isResolved", ["isResolved"]),

  // Note Sources - Track external content sources for AI note generation
  noteSources: defineTable({
    userId: v.string(), // Clerk ID
    storeId: v.string(),

    // Source type and identification
    sourceType: v.union(
      v.literal("pdf"),
      v.literal("youtube"),
      v.literal("website"),
      v.literal("audio"),
      v.literal("text")
    ),

    // Source metadata
    title: v.string(),
    url: v.optional(v.string()), // For YouTube/website
    storageId: v.optional(v.id("_storage")), // For uploaded PDFs/audio
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),

    // Extracted content
    rawContent: v.optional(v.string()), // Full extracted text
    contentChunks: v.optional(v.array(v.string())), // Split chunks for processing
    summary: v.optional(v.string()), // AI-generated summary
    keyPoints: v.optional(v.array(v.string())), // Extracted key points

    // Processing status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),

    // YouTube-specific metadata
    youtubeVideoId: v.optional(v.string()),
    youtubeDuration: v.optional(v.number()), // In seconds
    youtubeChannel: v.optional(v.string()),
    youtubeThumbnail: v.optional(v.string()),

    // Website-specific metadata
    websiteDomain: v.optional(v.string()),
    websiteAuthor: v.optional(v.string()),
    websitePublishedDate: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    processedAt: v.optional(v.number()),

    // Generated notes
    generatedNoteIds: v.optional(v.array(v.id("notes"))),

    // Tags for organization
    tags: v.optional(v.array(v.string())),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_user_and_store", ["userId", "storeId"])
    .index("by_sourceType", ["sourceType"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // Audio Files Storage
  audioFiles: defineTable({
    storageId: v.id("_storage"),
    chapterId: v.string(),
    filename: v.string(),
    size: v.number(),
    url: v.optional(v.string()),
    uploadedBy: v.optional(v.string()),
    uploadedAt: v.optional(v.number()),
  })
    .index("by_chapterId", ["chapterId"])
    .index("by_storageId", ["storageId"]),

  // Analytics Events - Track all user interactions
  analyticsEvents: defineTable({
    userId: v.string(), // Clerk user ID
    storeId: v.optional(v.string()),
    eventType: v.union(
      // Existing events
      v.literal("page_view"),
      v.literal("product_view"),
      v.literal("course_view"),
      v.literal("purchase"),
      v.literal("download"),
      v.literal("video_play"),
      v.literal("video_complete"),
      v.literal("lesson_complete"),
      v.literal("course_complete"),
      v.literal("search"),
      v.literal("click"),
      v.literal("signup"),
      v.literal("login"),
      // NEW: Creator funnel events
      v.literal("creator_started"),
      v.literal("creator_profile_completed"),
      v.literal("creator_published"),
      v.literal("first_sale"),
      // NEW: Learner activation events
      v.literal("enrollment"),
      v.literal("return_week_2"),
      // NEW: Email & campaign events
      v.literal("email_sent"),
      v.literal("email_delivered"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("email_bounced"),
      v.literal("email_complained"),
      // NEW: Campaign & outreach events
      v.literal("dm_sent"),
      v.literal("cta_clicked"),
      v.literal("campaign_view"),
      // NEW: System events
      v.literal("error"),
      v.literal("webhook_failed"),
      // Creator XP & nudge events
      v.literal("creator_xp_earned"),
      v.literal("creator_nudge_triggered"),
      // Conversion nudge tracking events
      v.literal("conversion_nudge_triggered"),
      v.literal("nudge_shown"),
      v.literal("nudge_dismissed"),
      v.literal("nudge_converted"),
      // Follow gate & creator funnel events
      v.literal("follow_gate_completed"), // Lead completed follow gate
      v.literal("product_published") // Creator published product
    ),
    resourceId: v.optional(v.string()), // courseId, productId, etc.
    resourceType: v.optional(
      v.union(
        v.literal("course"),
        v.literal("digitalProduct"),
        v.literal("lesson"),
        v.literal("chapter"),
        v.literal("page")
      )
    ),
    metadata: v.optional(
      v.object({
        // Existing metadata
        page: v.optional(v.string()),
        referrer: v.optional(v.string()),
        searchTerm: v.optional(v.string()),
        duration: v.optional(v.number()),
        progress: v.optional(v.number()),
        value: v.optional(v.number()),
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        device: v.optional(v.string()),
        browser: v.optional(v.string()),
        os: v.optional(v.string()),
        // NEW: Campaign tracking
        source: v.optional(v.string()),
        campaign_id: v.optional(v.string()),
        utm_source: v.optional(v.string()),
        utm_medium: v.optional(v.string()),
        utm_campaign: v.optional(v.string()),
        // NEW: Creator-specific
        daw: v.optional(v.string()),
        audience_size: v.optional(v.number()),
        // NEW: Product/revenue specific
        product_id: v.optional(v.string()),
        amount_cents: v.optional(v.number()),
        currency: v.optional(v.string()),
        // NEW: Experiment tracking
        experiment_id: v.optional(v.string()),
        variant: v.optional(v.string()),
        // NEW: Error tracking
        error_code: v.optional(v.string()),
        error_message: v.optional(v.string()),
        // Creator XP & nudge tracking
        action: v.optional(v.string()), // XP action type
        xpAwarded: v.optional(v.number()),
        newTotal: v.optional(v.number()),
        newLevel: v.optional(v.number()),
        leveledUp: v.optional(v.boolean()),
        nudgeContext: v.optional(v.string()),
        courseName: v.optional(v.string()),
        courseId: v.optional(v.string()),
        // Conversion nudge tracking
        nudgeType: v.optional(v.string()),
        lessonCount: v.optional(v.number()),
        certificateCount: v.optional(v.number()),
        level: v.optional(v.number()),
        viewCount: v.optional(v.number()),
        leaderboardType: v.optional(v.string()),
        lastNudgeContext: v.optional(v.string()),
      })
    ),
    sessionId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_eventType", ["eventType"])
    .index("by_resourceId", ["resourceId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_event", ["userId", "eventType"])
    .index("by_store_event", ["storeId", "eventType"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_store_timestamp", ["storeId", "timestamp"]),

  // Product Views - Track detailed product/course views
  productViews: defineTable({
    userId: v.optional(v.string()), // Optional for anonymous views
    storeId: v.string(),
    resourceId: v.string(), // courseId or productId
    resourceType: v.union(v.literal("course"), v.literal("digitalProduct")),
    viewDuration: v.optional(v.number()), // in seconds
    referrer: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_resourceId", ["resourceId"])
    .index("by_resourceType", ["resourceType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_store_resource", ["storeId", "resourceId"])
    .index("by_store_timestamp", ["storeId", "timestamp"]),

  // Revenue Tracking - Detailed revenue analytics
  revenueEvents: defineTable({
    userId: v.string(), // Buyer's user ID
    storeId: v.string(),
    creatorId: v.string(), // Creator's user ID
    purchaseId: v.id("purchases"),
    resourceId: v.string(), // courseId or productId
    resourceType: v.union(
      v.literal("course"),
      v.literal("digitalProduct"),
      v.literal("coaching"),
      v.literal("bundle")
    ),
    grossAmount: v.number(),
    platformFee: v.number(),
    processingFee: v.number(),
    netAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    country: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_purchaseId", ["purchaseId"])
    .index("by_resourceId", ["resourceId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_creator_timestamp", ["creatorId", "timestamp"])
    .index("by_store_timestamp", ["storeId", "timestamp"]),

  // User Sessions - Track user engagement sessions
  userSessions: defineTable({
    userId: v.string(),
    storeId: v.optional(v.string()),
    sessionId: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()), // in seconds
    pageViews: v.number(),
    events: v.number(),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    referrer: v.optional(v.string()),
    landingPage: v.optional(v.string()),
    exitPage: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_sessionId", ["sessionId"])
    .index("by_startTime", ["startTime"])
    .index("by_user_start", ["userId", "startTime"]),

  // Creator Pipeline - Track creator journey and status
  creatorPipeline: defineTable({
    userId: v.string(), // Clerk ID
    storeId: v.optional(v.id("stores")),
    stage: v.union(
      v.literal("prospect"),
      v.literal("invited"),
      v.literal("signed_up"),
      v.literal("drafting"),
      v.literal("published"),
      v.literal("first_sale"),
      v.literal("active"),
      v.literal("churn_risk")
    ),
    // Timestamps for funnel timing
    prospectAt: v.optional(v.number()),
    invitedAt: v.optional(v.number()),
    signedUpAt: v.optional(v.number()),
    draftingAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    firstSaleAt: v.optional(v.number()),
    // Outreach tracking
    lastTouchAt: v.optional(v.number()),
    lastTouchType: v.optional(
      v.union(v.literal("dm"), v.literal("email"), v.literal("comment"), v.literal("call"))
    ),
    nextStepNote: v.optional(v.string()),
    assignedTo: v.optional(v.string()), // Admin handling this creator
    // Creator metadata
    daw: v.optional(v.string()),
    instagramHandle: v.optional(v.string()),
    tiktokHandle: v.optional(v.string()),
    audienceSize: v.optional(v.number()),
    niche: v.optional(v.string()), // "mixing", "production", "mastering"
    // Stats
    totalRevenue: v.optional(v.number()),
    productCount: v.optional(v.number()),
    enrollmentCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stage_and_updatedAt", ["stage", "updatedAt"])
    .index("by_storeId", ["storeId"])
    .index("by_assignedTo_and_stage", ["assignedTo", "stage"]),

  // Campaigns - Track marketing campaigns
  campaigns: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("dm_batch")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
    // Targeting
    targetRole: v.optional(v.union(v.literal("learner"), v.literal("creator"), v.literal("both"))),
    targetSegment: v.optional(v.string()), // "stuck_creators", "new_signups", etc.
    // Content
    subject: v.optional(v.string()),
    body: v.string(),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    // Scheduling
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    // Results
    sentCount: v.optional(v.number()),
    deliveredCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    bouncedCount: v.optional(v.number()),
    convertedCount: v.optional(v.number()),
    createdBy: v.string(), // Admin user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status_and_scheduledAt", ["status", "scheduledAt"])
    .index("by_type_and_createdAt", ["type", "createdAt"]),

  // Experiments - Track A/B tests
  experiments: defineTable({
    name: v.string(),
    hypothesis: v.string(),
    metric: v.string(), // "conversion_rate", "signup_rate", etc.
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    // Variants
    variantA: v.object({
      name: v.string(),
      description: v.string(),
      ctaText: v.optional(v.string()),
      ctaUrl: v.optional(v.string()),
      assetUrl: v.optional(v.string()),
    }),
    variantB: v.object({
      name: v.string(),
      description: v.string(),
      ctaText: v.optional(v.string()),
      ctaUrl: v.optional(v.string()),
      assetUrl: v.optional(v.string()),
    }),
    // Results
    variantAViews: v.optional(v.number()),
    variantAConversions: v.optional(v.number()),
    variantBViews: v.optional(v.number()),
    variantBConversions: v.optional(v.number()),
    winner: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("tie"))),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status_and_startDate", ["status", "startDate"]),

  // Simplified Music Showcase - Artist Profiles
  artistProfiles: defineTable({
    userId: v.string(), // Clerk user ID
    storeId: v.optional(v.string()),
    // Basic Info
    artistName: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    // Profile Media
    profileImage: v.optional(v.string()),
    bannerImage: v.optional(v.string()),
    // Social Links (same as SoundPitch structure)
    socialLinks: v.optional(
      v.object({
        spotify: v.optional(v.string()),
        soundcloud: v.optional(v.string()),
        instagram: v.optional(v.string()),
        twitter: v.optional(v.string()),
        youtube: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        facebook: v.optional(v.string()),
        bandcamp: v.optional(v.string()),
        apple_music: v.optional(v.string()),
      })
    ),
    // Settings
    isPublic: v.optional(v.boolean()),
    // Stats
    totalViews: v.optional(v.number()),
    totalLikes: v.optional(v.number()),
    totalFollowers: v.optional(v.number()),
    totalPlays: v.optional(v.number()), // Added back for compatibility
    // SEO
    slug: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_slug", ["slug"])
    .index("by_isPublic", ["isPublic"]),

  // URL-Based Music Tracks (No file uploads)
  musicTracks: defineTable({
    userId: v.string(),
    artistProfileId: v.id("artistProfiles"),
    storeId: v.optional(v.string()),
    // Track Info
    title: v.string(),
    artist: v.optional(v.string()),
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // URL-Based Data (core feature)
    originalUrl: v.string(), // Spotify, SoundCloud, YouTube, etc.
    platform: v.union(
      v.literal("spotify"),
      v.literal("soundcloud"),
      v.literal("youtube"),
      v.literal("apple_music"),
      v.literal("bandcamp"),
      v.literal("other")
    ),
    embedUrl: v.optional(v.string()), // Processed embed URL
    // Extracted Metadata
    artworkUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    releaseDate: v.optional(v.string()),
    // Custom Fields (user can override)
    customGenre: v.optional(v.string()), // User can customize genre
    customTags: v.optional(v.array(v.string())),
    customDescription: v.optional(v.string()),
    // Settings
    isPublic: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    // Stats
    viewCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    playCount: v.optional(v.number()), // Added back for compatibility
    // SEO
    slug: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_artistProfileId", ["artistProfileId"])
    .index("by_storeId", ["storeId"])
    .index("by_platform", ["platform"])
    .index("by_genre", ["genre"])
    .index("by_isPublic", ["isPublic"])
    .index("by_isFeatured", ["isFeatured"]),

  // Track Plays - Analytics for music
  trackPlays: defineTable({
    trackId: v.id("musicTracks"),
    userId: v.optional(v.string()), // Optional for anonymous plays
    artistProfileId: v.id("artistProfiles"),
    // Play Details
    playDuration: v.optional(v.number()), // How long they listened (seconds)
    completionPercentage: v.optional(v.number()), // % of track completed
    // Context
    source: v.optional(
      v.union(
        v.literal("profile"),
        v.literal("embed"),
        v.literal("direct_link"),
        v.literal("search"),
        v.literal("playlist")
      )
    ),
    referrer: v.optional(v.string()),
    // Technical Info
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_trackId", ["trackId"])
    .index("by_userId", ["userId"])
    .index("by_artistProfileId", ["artistProfileId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_track_timestamp", ["trackId", "timestamp"]),

  // Track Likes/Hearts
  trackLikes: defineTable({
    trackId: v.id("musicTracks"),
    userId: v.string(),
    artistProfileId: v.id("artistProfiles"),
    timestamp: v.number(),
  })
    .index("by_trackId", ["trackId"])
    .index("by_userId", ["userId"])
    .index("by_user_track", ["userId", "trackId"])
    .index("by_artistProfileId", ["artistProfileId"]),

  // Track Comments
  trackComments: defineTable({
    trackId: v.id("musicTracks"),
    userId: v.string(),
    artistProfileId: v.id("artistProfiles"),
    // Comment Content
    content: v.string(),
    timestamp: v.number(),
    // Position in track (for waveform comments like SoundCloud)
    timePosition: v.optional(v.number()), // Position in seconds
    // Moderation
    isApproved: v.optional(v.boolean()),
    isReported: v.optional(v.boolean()),
    // Threading
    parentCommentId: v.optional(v.id("trackComments")), // For replies
  })
    .index("by_trackId", ["trackId"])
    .index("by_userId", ["userId"])
    .index("by_artistProfileId", ["artistProfileId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_timePosition", ["timePosition"])
    .index("by_parentCommentId", ["parentCommentId"]),

  // Artist Follows
  artistFollows: defineTable({
    followerId: v.string(), // User who is following
    artistProfileId: v.id("artistProfiles"), // Artist being followed
    artistUserId: v.string(), // Artist's user ID for notifications
    timestamp: v.number(),
    // Notification preferences
    notifyNewTracks: v.optional(v.boolean()),
    notifyLiveStreams: v.optional(v.boolean()),
  })
    .index("by_followerId", ["followerId"])
    .index("by_artistProfileId", ["artistProfileId"])
    .index("by_artistUserId", ["artistUserId"])
    .index("by_follower_artist", ["followerId", "artistProfileId"]),

  // Playlists (User-created collections)
  musicPlaylists: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    artworkUrl: v.optional(v.string()),
    // Settings
    isPublic: v.optional(v.boolean()),
    isCollaborative: v.optional(v.boolean()),
    // Stats
    trackCount: v.optional(v.number()),
    totalDuration: v.optional(v.number()), // Total duration in seconds
    playCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    // SEO
    slug: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_isPublic", ["isPublic"]),

  // Playlist Tracks (Many-to-many relationship)
  playlistTracks: defineTable({
    playlistId: v.id("musicPlaylists"),
    trackId: v.id("musicTracks"),
    addedBy: v.string(), // User who added the track
    position: v.number(), // Order in playlist
    timestamp: v.number(),
  })
    .index("by_playlistId", ["playlistId"])
    .index("by_trackId", ["trackId"])
    .index("by_position", ["position"])
    .index("by_playlist_position", ["playlistId", "position"]),

  // ============================================================================
  // SAMPLE MARKETPLACE - Splice-Clone System
  // ============================================================================

  // User Credit Balances
  userCredits: defineTable({
    userId: v.string(), // Clerk user ID
    balance: v.number(), // Current credit balance
    lifetimeEarned: v.number(), // Total credits earned (for creators)
    lifetimeSpent: v.number(), // Total credits spent
    lastUpdated: v.number(),
  }).index("by_userId", ["userId"]),

  // Credit Transactions
  creditTransactions: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("purchase"), // Bought credits with money
      v.literal("spend"), // Spent credits on samples
      v.literal("earn"), // Earned from selling samples
      v.literal("bonus"), // Promotional credits
      v.literal("refund") // Refunded transaction
    ),
    amount: v.number(), // Positive for earn/purchase, negative for spend
    balance: v.number(), // Balance after transaction
    description: v.string(),
    relatedResourceId: v.optional(v.string()), // Sample/pack ID if applicable
    relatedResourceType: v.optional(
      v.union(v.literal("sample"), v.literal("pack"), v.literal("credit_package"))
    ),
    metadata: v.optional(
      v.object({
        stripePaymentId: v.optional(v.string()),
        dollarAmount: v.optional(v.number()),
        packageName: v.optional(v.string()),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_user_type", ["userId", "type"]),

  wishlists: defineTable({
    userId: v.string(),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    itemType: v.union(v.literal("product"), v.literal("course")),
    productType: v.optional(v.string()),
    priceAtAdd: v.optional(v.number()),
    notifyOnPriceDrop: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_productId", ["productId"])
    .index("by_courseId", ["courseId"])
    .index("by_userId_and_productId", ["userId", "productId"])
    .index("by_userId_and_courseId", ["userId", "courseId"])
    .index("by_itemType", ["itemType"]),

  // Audio Samples
  audioSamples: defineTable({
    userId: v.string(), // Creator
    storeId: v.string(),

    // Basic Info
    title: v.string(),
    description: v.optional(v.string()),

    // Audio File
    storageId: v.id("_storage"), // Convex storage ID
    fileUrl: v.string(), // Public URL for streaming
    fileName: v.string(),
    fileSize: v.number(), // in bytes
    duration: v.number(), // in seconds
    format: v.string(), // "wav", "mp3", "aiff"

    // Metadata
    bpm: v.optional(v.number()),
    key: v.optional(v.string()), // "C", "Am", "D#", etc.
    genre: v.string(),
    subGenre: v.optional(v.string()),
    tags: v.array(v.string()),
    category: v.union(
      v.literal("drums"),
      v.literal("bass"),
      v.literal("synth"),
      v.literal("vocals"),
      v.literal("fx"),
      v.literal("melody"),
      v.literal("loops"),
      v.literal("one-shots")
    ),

    // Waveform data
    waveformData: v.optional(v.array(v.number())), // Peaks for visualization
    peakAmplitude: v.optional(v.number()),

    // Pricing & Status
    creditPrice: v.number(), // Cost in credits
    isPublished: v.boolean(),
    isFree: v.optional(v.boolean()),

    // Stats
    downloads: v.number(),
    plays: v.number(),
    favorites: v.number(),

    // License
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
    licenseTerms: v.optional(v.string()),

    // Pack membership (unified samples system)
    packIds: v.optional(v.array(v.id("digitalProducts"))), // Packs this sample belongs to
    individualPrice: v.optional(v.number()), // Price when sold separately (if different from creditPrice)
    isIndividuallySellable: v.optional(v.boolean()), // Can be purchased alone (default true)
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_genre", ["genre"])
    .index("by_category", ["category"])
    .index("by_published", ["isPublished"])
    .index("by_user_published", ["userId", "isPublished"])
    .index("by_genre_published", ["genre", "isPublished"])
    .index("by_category_published", ["category", "isPublished"]),

  // Sample Packs
  samplePacks: defineTable({
    userId: v.string(), // Creator
    storeId: v.string(),

    // Basic Info
    name: v.string(),
    description: v.string(),
    coverImageUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),

    // Pack Contents
    sampleIds: v.array(v.id("audioSamples")),
    totalSamples: v.number(),
    totalSize: v.number(), // in bytes
    totalDuration: v.number(), // in seconds

    // Metadata (aggregated from samples)
    genres: v.array(v.string()),
    categories: v.array(v.string()),
    tags: v.array(v.string()),
    bpmRange: v.optional(
      v.object({
        min: v.number(),
        max: v.number(),
      })
    ),

    // Pricing & Status
    creditPrice: v.number(),
    isPublished: v.boolean(),

    // Stats
    downloads: v.number(),
    favorites: v.number(),
    revenue: v.number(), // Total credits earned from this pack

    // License
    licenseType: v.union(
      v.literal("royalty-free"),
      v.literal("exclusive"),
      v.literal("commercial")
    ),
    licenseTerms: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_published", ["isPublished"])
    .index("by_user_published", ["userId", "isPublished"]),

  // Sample Downloads (Track who downloaded what)
  sampleDownloads: defineTable({
    userId: v.string(), // Downloader
    sampleId: v.optional(v.id("audioSamples")),
    packId: v.optional(v.id("samplePacks")),
    creatorId: v.string(), // Creator who uploaded

    // Transaction Info
    creditAmount: v.number(),
    transactionId: v.id("creditTransactions"),

    // Download Tracking
    downloadCount: v.number(), // Allow re-downloads
    lastDownloadAt: v.optional(v.number()),

    // License Info
    licenseType: v.string(),
    licenseKey: v.optional(v.string()), // Unique license identifier
  })
    .index("by_userId", ["userId"])
    .index("by_sampleId", ["sampleId"])
    .index("by_packId", ["packId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_user_sample", ["userId", "sampleId"])
    .index("by_user_pack", ["userId", "packId"]),

  // Sample Favorites
  sampleFavorites: defineTable({
    userId: v.string(),
    sampleId: v.optional(v.id("audioSamples")),
    packId: v.optional(v.id("samplePacks")),
  })
    .index("by_userId", ["userId"])
    .index("by_sampleId", ["sampleId"])
    .index("by_packId", ["packId"])
    .index("by_user_sample", ["userId", "sampleId"])
    .index("by_user_pack", ["userId", "packId"]),

  // Credit Packages (Different tiers for buying credits)
  creditPackages: defineTable({
    name: v.string(), // "Starter", "Pro", "Ultimate"
    credits: v.number(), // Number of credits
    priceUsd: v.number(), // Price in dollars
    bonusCredits: v.optional(v.number()), // Extra credits for bulk
    description: v.string(),
    isActive: v.boolean(),
    stripePriceId: v.string(),
    displayOrder: v.number(),

    // Badge/label
    badge: v.optional(v.string()), // "Most Popular", "Best Value"

    // Stats
    purchaseCount: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_displayOrder", ["displayOrder"]),

  // ============================================================================
  // SOCIAL MEDIA SCHEDULING SYSTEM
  // ============================================================================

  // Social Media Accounts - Connected platforms for each store
  socialAccounts: defineTable({
    storeId: v.string(),
    userId: v.string(), // Store owner

    // Platform Info
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(), // User ID from the platform
    platformUsername: v.optional(v.string()),
    platformDisplayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),

    // OAuth Tokens (encrypted in production)
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),

    // Account Status
    isActive: v.boolean(),
    isConnected: v.boolean(),
    lastVerified: v.optional(v.number()),
    connectionError: v.optional(v.string()),

    // Platform-specific data
    platformData: v.optional(
      v.object({
        // Instagram
        instagramBusinessAccountId: v.optional(v.string()),
        // Facebook
        facebookPageId: v.optional(v.string()),
        facebookPageAccessToken: v.optional(v.string()),
        // Platform-specific rate limits
        dailyPostLimit: v.optional(v.number()),
        postsToday: v.optional(v.number()),
      })
    ),

    // Permissions/Scopes granted
    grantedScopes: v.array(v.string()),

    // Account label (optional, for users to distinguish multiple accounts)
    accountLabel: v.optional(v.string()), // e.g., "Personal", "Business", "Brand Account"
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_store_platform", ["storeId", "platform"])
    .index("by_store_platform_user", ["storeId", "platform", "platformUserId"]) // Unique account identification
    .index("by_isActive", ["isActive"]),

  // Scheduled Posts - Posts scheduled for future publishing
  scheduledPosts: defineTable({
    storeId: v.string(),
    userId: v.string(),
    socialAccountId: v.id("socialAccounts"),

    // Post Content
    content: v.string(), // Text content
    mediaUrls: v.optional(v.array(v.string())), // Images/videos
    mediaStorageIds: v.optional(v.array(v.id("_storage"))), // Convex storage IDs

    // Scheduling
    scheduledFor: v.number(), // Unix timestamp
    timezone: v.string(), // User's timezone

    // Post Configuration
    postType: v.union(
      v.literal("post"),
      v.literal("story"),
      v.literal("reel"),
      v.literal("tweet"),
      v.literal("thread")
    ),

    // Hashtags and location (optional)
    hashtags: v.optional(v.array(v.string())),
    location: v.optional(v.string()),

    // Platform-specific options
    platformOptions: v.optional(
      v.object({
        // Instagram
        instagramLocation: v.optional(v.string()),
        instagramCaption: v.optional(v.string()),
        // Twitter
        twitterReplySettings: v.optional(v.string()),
        // Facebook
        facebookTargeting: v.optional(v.string()),
        // LinkedIn
        linkedinVisibility: v.optional(v.string()),
      })
    ),

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed"),
      v.literal("cancelled")
    ),

    // Publishing Info
    publishedAt: v.optional(v.number()),
    platformPostId: v.optional(v.string()), // ID from the platform
    platformPostUrl: v.optional(v.string()), // Direct link to post

    // Error Handling
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
    lastRetryAt: v.optional(v.number()),

    // Analytics (populated after publishing)
    initialMetrics: v.optional(
      v.object({
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
        views: v.optional(v.number()),
        clicks: v.optional(v.number()),
      })
    ),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_socialAccountId", ["socialAccountId"])
    .index("by_status", ["status"])
    .index("by_scheduledFor", ["scheduledFor"])
    .index("by_store_status", ["storeId", "status"])
    .index("by_store_scheduled", ["storeId", "scheduledFor"]),

  // Post Analytics - Track performance of published posts
  postAnalytics: defineTable({
    scheduledPostId: v.id("scheduledPosts"),
    socialAccountId: v.id("socialAccounts"),
    storeId: v.string(),

    // Platform Info
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformPostId: v.string(),

    // Engagement Metrics
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.optional(v.number()), // Instagram
    views: v.optional(v.number()),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    clicks: v.optional(v.number()),

    // Audience Metrics
    followerCount: v.optional(v.number()),
    engagementRate: v.optional(v.number()), // Percentage

    // Time-based tracking
    timestamp: v.number(), // When these metrics were captured
    hoursAfterPost: v.optional(v.number()), // 1h, 24h, 7d snapshots
  })
    .index("by_scheduledPostId", ["scheduledPostId"])
    .index("by_socialAccountId", ["socialAccountId"])
    .index("by_storeId", ["storeId"])
    .index("by_platform", ["platform"])
    .index("by_timestamp", ["timestamp"]),

  // Social Media Webhooks - Track incoming webhooks from platforms
  socialWebhooks: defineTable({
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),

    // Webhook Data
    eventType: v.string(), // "post.published", "comment.created", etc.
    payload: v.any(), // Full webhook payload
    signature: v.optional(v.string()), // Webhook signature for verification

    // Processing Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),

    // Related Resources
    socialAccountId: v.optional(v.id("socialAccounts")),
    scheduledPostId: v.optional(v.id("scheduledPosts")),
  })
    .index("by_platform", ["platform"])
    .index("by_status", ["status"])
    .index("by_eventType", ["eventType"]),

  // Post Templates - Reusable post templates
  postTemplates: defineTable({
    storeId: v.string(),
    userId: v.string(),

    // Template Info
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // "promotion", "announcement", "engagement"

    // Template Content
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),

    // Platform Targeting
    platforms: v.array(
      v.union(
        v.literal("instagram"),
        v.literal("twitter"),
        v.literal("facebook"),
        v.literal("tiktok"),
        v.literal("linkedin")
      )
    ),

    // Usage Stats
    useCount: v.number(),
    lastUsed: v.optional(v.number()),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_category", ["category"]),

  // ============================================================================
  // MANYCHAT-STYLE AUTOMATION SYSTEM
  // ============================================================================

  // Automation Flows - Define conversation flows and sequences
  automationFlows: defineTable({
    storeId: v.string(),
    userId: v.string(),

    // Flow Info
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),

    // Trigger Configuration
    triggerType: v.union(
      v.literal("keyword"), // Triggered by keyword in comments/messages
      v.literal("comment"), // Triggered by any comment
      v.literal("dm"), // Triggered by DM
      v.literal("mention"), // Triggered by mention
      v.literal("hashtag"), // Triggered by specific hashtag
      v.literal("manual") // Manually triggered
    ),

    // Trigger Conditions
    triggerConditions: v.object({
      keywords: v.optional(v.array(v.string())), // Keywords to match (case-insensitive)
      platforms: v.array(
        v.union(
          v.literal("instagram"),
          v.literal("twitter"),
          v.literal("facebook"),
          v.literal("tiktok"),
          v.literal("linkedin")
        )
      ),
      matchType: v.union(
        v.literal("exact"), // Exact match
        v.literal("contains"), // Contains keyword
        v.literal("starts_with"), // Starts with keyword
        v.literal("regex") // Regex match
      ),
      socialAccountIds: v.optional(v.array(v.id("socialAccounts"))), // Specific accounts
    }),

    // Flow Definition (nodes and connections)
    flowDefinition: v.object({
      nodes: v.array(
        v.object({
          id: v.string(),
          type: v.union(
            v.literal("trigger"), // Starting point
            v.literal("message"), // Send message
            v.literal("delay"), // Wait/delay
            v.literal("condition"), // Conditional branching
            v.literal("resource"), // Send resource/file
            v.literal("tag"), // Add user tag
            v.literal("webhook") // Send webhook
          ),
          position: v.object({ x: v.number(), y: v.number() }),
          data: v.object({
            // Message node data
            content: v.optional(v.string()),
            mediaUrls: v.optional(v.array(v.string())),

            // Delay node data
            delayMinutes: v.optional(v.number()),

            // Condition node data
            conditionType: v.optional(
              v.union(
                v.literal("keyword"),
                v.literal("user_response"),
                v.literal("time_based"),
                v.literal("tag_based")
              )
            ),
            conditionValue: v.optional(v.string()),

            // Resource node data
            resourceType: v.optional(
              v.union(
                v.literal("link"),
                v.literal("file"),
                v.literal("course"),
                v.literal("product")
              )
            ),
            resourceUrl: v.optional(v.string()),
            resourceId: v.optional(v.string()),

            // Tag node data
            tagName: v.optional(v.string()),

            // Webhook node data
            webhookUrl: v.optional(v.string()),
            webhookData: v.optional(v.any()),
          }),
        })
      ),
      connections: v.array(
        v.object({
          from: v.string(), // Node ID
          to: v.string(), // Node ID
          label: v.optional(v.string()), // Connection label (for conditions)
        })
      ),
    }),

    // Analytics
    totalTriggers: v.number(),
    totalCompletions: v.number(),
    lastTriggered: v.optional(v.number()),

    // Configuration
    settings: v.object({
      stopOnError: v.boolean(),
      allowMultipleRuns: v.boolean(), // Can same user trigger multiple times?
      timeoutMinutes: v.optional(v.number()), // Flow timeout
    }),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_isActive", ["isActive"])
    .index("by_triggerType", ["triggerType"])
    .index("by_store_active", ["storeId", "isActive"]),

  // User Automation States - Track user progress through flows
  userAutomationStates: defineTable({
    storeId: v.string(),
    automationFlowId: v.id("automationFlows"),

    // User Identity (from social platforms)
    platformUserId: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUsername: v.optional(v.string()),

    // Flow State
    currentNodeId: v.optional(v.string()), // Current position in flow
    status: v.union(
      v.literal("active"), // Currently in flow
      v.literal("completed"), // Flow completed
      v.literal("paused"), // Flow paused
      v.literal("error"), // Flow errored
      v.literal("timeout") // Flow timed out
    ),

    // Progress Tracking
    startedAt: v.number(),
    lastActivityAt: v.number(),
    completedAt: v.optional(v.number()),

    // Flow Data
    variables: v.optional(v.object({})), // Store user responses/data
    tags: v.optional(v.array(v.string())), // User tags collected
    lastUserResponse: v.optional(v.string()), // User's last message/response
    isPendingResponse: v.optional(v.boolean()), // Waiting for user response
    expectedResponse: v.optional(v.string()), // What response we're waiting for ("yes", "no", etc.)
    waitingNodeId: v.optional(v.string()), // Which node is waiting for response

    // Trigger Context
    triggerContext: v.object({
      triggerType: v.string(),
      originalCommentId: v.optional(v.string()),
      originalPostId: v.optional(v.string()),
      triggerMessage: v.optional(v.string()),
      socialAccountId: v.optional(v.id("socialAccounts")),
    }),

    // Error Handling
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_automationFlowId", ["automationFlowId"])
    .index("by_platformUser", ["platform", "platformUserId"])
    .index("by_status", ["status"])
    .index("by_store_platform_user", ["storeId", "platform", "platformUserId"])
    .index("by_lastActivity", ["lastActivityAt"]),

  // Automation Triggers - Track keyword/trigger events
  automationTriggers: defineTable({
    storeId: v.string(),
    automationFlowId: v.id("automationFlows"),
    userAutomationStateId: v.optional(v.id("userAutomationStates")),

    // Trigger Details
    triggerType: v.string(),
    keyword: v.optional(v.string()),
    matchedText: v.string(),

    // Social Context
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    socialAccountId: v.id("socialAccounts"),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),

    // Content Context
    commentId: v.optional(v.string()),
    postId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    fullContent: v.string(),

    // Processing
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("ignored")
    ),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),

    // Webhook data (if triggered by webhook)
    webhookId: v.optional(v.id("socialWebhooks")),
  })
    .index("by_storeId", ["storeId"])
    .index("by_automationFlowId", ["automationFlowId"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"])
    .index("by_keyword", ["keyword"])
    .index("by_platformUser", ["platform", "platformUserId"])
    .index("by_store_status", ["storeId", "status"]),

  // Automation Messages - Track messages sent through automation
  automationMessages: defineTable({
    storeId: v.string(),
    automationFlowId: v.id("automationFlows"),
    userAutomationStateId: v.id("userAutomationStates"),
    nodeId: v.string(), // Flow node that sent this message

    // Message Content
    messageType: v.union(
      v.literal("dm"), // Direct message
      v.literal("comment_reply"), // Reply to comment
      v.literal("story_reply") // Story reply
    ),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),

    // Recipient Info
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    platformUserId: v.string(),
    platformUsername: v.optional(v.string()),

    // Delivery Status
    status: v.union(
      v.literal("pending"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("rate_limited")
    ),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),

    // Platform Response
    platformMessageId: v.optional(v.string()),
    socialAccountId: v.id("socialAccounts"),

    // Retry Logic
    retryCount: v.number(),
    maxRetries: v.number(),
    nextRetryAt: v.optional(v.number()),
  })
    .index("by_storeId", ["storeId"])
    .index("by_automationFlowId", ["automationFlowId"])
    .index("by_userState", ["userAutomationStateId"])
    .index("by_status", ["status"])
    .index("by_platform", ["platform"])
    .index("by_platformUser", ["platform", "platformUserId"])
    .index("by_sentAt", ["sentAt"])
    .index("by_nextRetry", ["nextRetryAt"]),

  // Discord Integration
  discordIntegrations: defineTable({
    userId: v.string(), // Clerk user ID
    discordUserId: v.string(), // Discord user ID
    discordUsername: v.string(), // Discord username for display
    discordDiscriminator: v.optional(v.string()), // Discord #tag
    discordAvatar: v.optional(v.string()), // Discord avatar URL
    accessToken: v.string(), // Discord OAuth access token (encrypted)
    refreshToken: v.string(), // Discord OAuth refresh token (encrypted)
    expiresAt: v.number(), // Token expiration timestamp
    enrolledCourseIds: v.array(v.id("courses")), // Courses user is enrolled in
    assignedRoles: v.array(v.string()), // Discord role IDs assigned to user
    guildMemberStatus: v.optional(
      v.union(
        v.literal("invited"),
        v.literal("joined"),
        v.literal("left"),
        v.literal("kicked"),
        v.literal("banned")
      )
    ),
    lastSyncedAt: v.number(), // Last time roles were synced
    connectedAt: v.number(), // When user connected Discord
  })
    .index("by_userId", ["userId"])
    .index("by_discordUserId", ["discordUserId"])
    .index("by_lastSynced", ["lastSyncedAt"]),

  // Discord server/guild configuration per store
  discordGuilds: defineTable({
    storeId: v.id("stores"), // Which store this Discord server belongs to
    guildId: v.string(), // Discord server/guild ID
    guildName: v.string(), // Discord server name
    inviteCode: v.optional(v.string()), // Permanent invite code
    botToken: v.string(), // Bot token for this server (encrypted)

    // Role mapping (courseId -> Discord role ID)
    courseRoles: v.optional(v.any()), // JSON object: { "courseId": "roleId" }

    // General roles
    generalMemberRole: v.optional(v.string()), // Role for all members
    creatorRole: v.optional(v.string()), // Role for course creator

    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_guildId", ["guildId"]),

  // Discord webhook events (for tracking)
  discordEvents: defineTable({
    eventType: v.union(
      v.literal("member_joined"),
      v.literal("member_left"),
      v.literal("role_assigned"),
      v.literal("role_removed"),
      v.literal("invite_created"),
      v.literal("sync_completed")
    ),
    userId: v.optional(v.string()), // Clerk user ID
    discordUserId: v.optional(v.string()), // Discord user ID
    guildId: v.string(),
    metadata: v.optional(v.any()), // Additional event data
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventType", ["eventType"])
    .index("by_timestamp", ["timestamp"]),

  // Q&A System
  questions: defineTable({
    courseId: v.id("courses"),
    lessonId: v.string(),
    chapterIndex: v.optional(v.number()),
    lessonIndex: v.optional(v.number()),
    title: v.string(),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    isResolved: v.boolean(),
    acceptedAnswerId: v.optional(v.id("answers")),
    viewCount: v.number(),
    upvotes: v.number(),
    answerCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActivityAt: v.number(),
  })
    .index("by_course", ["courseId", "lastActivityAt"])
    .index("by_lesson", ["courseId", "lessonId", "lastActivityAt"])
    .index("by_author", ["authorId", "createdAt"])
    .index("by_resolved", ["courseId", "isResolved", "lastActivityAt"]),

  answers: defineTable({
    questionId: v.id("questions"),
    courseId: v.id("courses"),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    isInstructor: v.boolean(),
    isAccepted: v.boolean(),
    upvotes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_question", ["questionId", "createdAt"])
    .index("by_question_votes", ["questionId", "upvotes"])
    .index("by_author", ["authorId", "createdAt"]),

  qaVotes: defineTable({
    targetType: v.union(v.literal("question"), v.literal("answer")),
    targetId: v.string(),
    userId: v.string(),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
    createdAt: v.number(),
  })
    .index("by_user_and_target", ["userId", "targetType", "targetId"])
    .index("by_target", ["targetType", "targetId"]),

  // Course Completion Certificates
  certificates: defineTable({
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    instructorName: v.string(),
    instructorId: v.string(),
    certificateId: v.string(),
    completionDate: v.number(),
    issueDate: v.number(),
    totalChapters: v.number(),
    completedChapters: v.number(),
    completionPercentage: v.number(),
    timeSpent: v.optional(v.number()),
    pdfUrl: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    verificationCode: v.string(),
    isValid: v.boolean(),
    createdAt: v.number(),
    lastVerifiedAt: v.optional(v.number()),
    verificationCount: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_course", ["courseId", "issueDate"])
    .index("by_certificate_id", ["certificateId"])
    .index("by_verification_code", ["verificationCode"])
    .index("by_user_and_course", ["userId", "courseId"]),

  certificateVerifications: defineTable({
    certificateId: v.string(),
    verifierIp: v.optional(v.string()),
    verifierUserAgent: v.optional(v.string()),
    isValid: v.boolean(),
    verifiedAt: v.number(),
  })
    .index("by_certificate", ["certificateId", "verifiedAt"])
    .index("by_date", ["verifiedAt"]),

  // =============================================================================
  // COURSE DRIP CONTENT ACCESS TRACKING (Teachable Parity)
  // =============================================================================
  courseDripAccess: defineTable({
    userId: v.string(), // Clerk user ID
    courseId: v.id("courses"),
    moduleId: v.id("courseModules"),
    // Access status
    isUnlocked: v.boolean(),
    unlockedAt: v.optional(v.number()), // When the content was unlocked
    scheduledUnlockAt: v.number(), // When content is scheduled to unlock
    // Notification tracking
    unlockNotificationSent: v.optional(v.boolean()),
    notificationSentAt: v.optional(v.number()),
    // Manual override
    manuallyUnlocked: v.optional(v.boolean()), // Instructor manually unlocked
    manualUnlockReason: v.optional(v.string()),
    // Enrollment tracking
    enrolledAt: v.number(), // When user enrolled in course
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_module", ["userId", "moduleId"])
    .index("by_course_module", ["courseId", "moduleId"])
    .index("by_scheduled_unlock", ["isUnlocked", "scheduledUnlockAt"])
    .index("by_notification_pending", ["isUnlocked", "unlockNotificationSent"]),

  // =============================================================================
  // LANDING PAGE BUILDER (Competitor Feature)
  // =============================================================================
  landingPages: defineTable({
    storeId: v.string(),
    userId: v.string(), // Clerk ID
    // Page metadata
    title: v.string(),
    slug: v.string(), // URL slug
    description: v.optional(v.string()),
    // Template & Design
    templateId: v.optional(v.string()), // Reference to a template
    templateName: v.optional(v.string()),
    // Page content - array of blocks
    blocks: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("hero"),
        v.literal("features"),
        v.literal("testimonials"),
        v.literal("pricing"),
        v.literal("cta"),
        v.literal("faq"),
        v.literal("video"),
        v.literal("image"),
        v.literal("text"),
        v.literal("countdown"),
        v.literal("social_proof"),
        v.literal("product_showcase"),
        v.literal("custom_html")
      ),
      position: v.number(),
      settings: v.any(), // Block-specific settings (colors, text, images, etc.)
      isVisible: v.boolean(),
    })),
    // SEO
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    // Conversion tracking
    linkedProductId: v.optional(v.id("digitalProducts")),
    linkedCourseId: v.optional(v.id("courses")),
    // A/B Testing
    isVariant: v.optional(v.boolean()),
    parentPageId: v.optional(v.id("landingPages")),
    variantName: v.optional(v.string()),
    trafficSplit: v.optional(v.number()), // Percentage of traffic (0-100)
    // Analytics
    views: v.optional(v.number()),
    conversions: v.optional(v.number()),
    conversionRate: v.optional(v.number()),
    // Status
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_store", ["storeId", "isPublished"])
    .index("by_slug", ["storeId", "slug"])
    .index("by_user", ["userId", "createdAt"])
    .index("by_parent", ["parentPageId"]),

  // Landing Page Analytics
  landingPageAnalytics: defineTable({
    pageId: v.id("landingPages"),
    storeId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    // Metrics
    views: v.number(),
    uniqueVisitors: v.number(),
    conversions: v.number(),
    conversionRate: v.number(),
    avgTimeOnPage: v.optional(v.number()), // Seconds
    bounceRate: v.optional(v.number()),
    // Traffic sources
    trafficSources: v.optional(v.object({
      direct: v.number(),
      organic: v.number(),
      social: v.number(),
      referral: v.number(),
      paid: v.number(),
    })),
    // A/B test tracking
    variantViews: v.optional(v.any()), // { variantId: views }
    variantConversions: v.optional(v.any()), // { variantId: conversions }
    createdAt: v.number(),
  })
    .index("by_page", ["pageId", "date"])
    .index("by_store", ["storeId", "date"])
    .index("by_date", ["date"]),

  // Landing Page Templates (Pre-built starting points)
  landingPageTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    category: v.union(
      v.literal("course"),
      v.literal("product"),
      v.literal("webinar"),
      v.literal("ebook"),
      v.literal("music"),
      v.literal("general")
    ),
    // Template content
    blocks: v.array(v.object({
      id: v.string(),
      type: v.string(),
      position: v.number(),
      settings: v.any(),
      isVisible: v.boolean(),
    })),
    // Template styling
    colorScheme: v.optional(v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      background: v.string(),
      text: v.string(),
    })),
    // Metadata
    isDefault: v.optional(v.boolean()), // System template
    creatorId: v.optional(v.string()), // User-created template
    usageCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_creator", ["creatorId"]),

  // Analytics & Reporting
  userEvents: defineTable({
    userId: v.string(),
    eventType: v.union(
      v.literal("course_viewed"),
      v.literal("course_enrolled"),
      v.literal("chapter_started"),
      v.literal("chapter_completed"),
      v.literal("course_completed"),
      v.literal("video_played"),
      v.literal("video_paused"),
      v.literal("video_progress"),
      v.literal("checkout_started"),
      v.literal("purchase_completed"),
      v.literal("refund_requested"),
      v.literal("question_asked"),
      v.literal("answer_posted"),
      v.literal("comment_posted"),
      v.literal("content_liked"),
      v.literal("certificate_shared"),
      v.literal("course_reviewed"),
      v.literal("login"),
      v.literal("logout"),
      v.literal("profile_updated")
    ),
    courseId: v.optional(v.id("courses")),
    chapterId: v.optional(v.string()),
    productId: v.optional(v.id("digitalProducts")),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    browserInfo: v.optional(v.string()),
  })
    .index("by_user", ["userId", "timestamp"])
    .index("by_course", ["courseId", "timestamp"])
    .index("by_event_type", ["eventType", "timestamp"])
    .index("by_user_and_event", ["userId", "eventType", "timestamp"])
    .index("by_session", ["sessionId", "timestamp"]),

  videoAnalytics: defineTable({
    chapterId: v.string(),
    courseId: v.id("courses"),
    userId: v.string(),
    watchDuration: v.number(),
    videoDuration: v.number(),
    percentWatched: v.number(),
    dropOffPoint: v.optional(v.number()),
    completedWatch: v.boolean(),
    rewatches: v.number(),
    playbackSpeed: v.optional(v.number()),
    qualitySetting: v.optional(v.string()),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  })
    .index("by_chapter", ["chapterId", "timestamp"])
    .index("by_course", ["courseId", "timestamp"])
    .index("by_user", ["userId", "timestamp"])
    .index("by_completion", ["completedWatch", "timestamp"]),

  courseAnalytics: defineTable({
    courseId: v.id("courses"),
    creatorId: v.string(),
    date: v.string(),
    views: v.number(),
    enrollments: v.number(),
    conversionRate: v.number(),
    activeStudents: v.number(),
    avgTimeSpent: v.number(),
    completionRate: v.number(),
    chaptersStarted: v.number(),
    chaptersCompleted: v.number(),
    revenue: v.number(),
    refunds: v.number(),
    netRevenue: v.number(),
    avgRating: v.optional(v.number()),
    certificatesIssued: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId", "date"])
    .index("by_creator", ["creatorId", "date"])
    .index("by_date", ["date"]),

  revenueAnalytics: defineTable({
    creatorId: v.string(),
    storeId: v.id("stores"),
    date: v.string(),
    grossRevenue: v.number(),
    platformFee: v.number(),
    paymentProcessingFee: v.number(),
    netRevenue: v.number(),
    totalTransactions: v.number(),
    successfulTransactions: v.number(),
    refundedTransactions: v.number(),
    courseRevenue: v.number(),
    digitalProductRevenue: v.number(),
    newCustomers: v.number(),
    returningCustomers: v.number(),
    avgOrderValue: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId", "date"])
    .index("by_store", ["storeId", "date"])
    .index("by_date", ["date"]),

  // Vercel Web Analytics Drain Events
  webAnalyticsEvents: defineTable({
    // Vercel drain fields
    eventType: v.string(), // "pageview" | "event"
    eventName: v.optional(v.string()),
    path: v.string(),
    origin: v.optional(v.string()),
    referrer: v.optional(v.string()),
    queryParams: v.optional(v.string()),

    // Geo
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),

    // Device
    deviceType: v.optional(v.string()), // desktop/mobile/tablet
    osName: v.optional(v.string()),
    clientName: v.optional(v.string()), // browser

    // Session
    sessionId: v.optional(v.number()),
    deviceId: v.optional(v.number()),

    // Vercel metadata
    projectId: v.optional(v.string()),
    timestamp: v.number(),

    // Derived fields (for efficient queries)
    storeSlug: v.optional(v.string()), // extracted from path
    productSlug: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_path", ["path", "timestamp"])
    .index("by_store_slug", ["storeSlug", "timestamp"])
    .index("by_product_slug", ["productSlug", "timestamp"])
    .index("by_session", ["sessionId"])
    .index("by_country", ["country", "timestamp"])
    .index("by_device_type", ["deviceType", "timestamp"]),

  studentProgress: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    totalChapters: v.number(),
    completedChapters: v.number(),
    completionPercentage: v.number(),
    totalTimeSpent: v.number(),
    avgSessionDuration: v.number(),
    lastAccessedAt: v.number(),
    enrolledAt: v.number(),
    daysSinceEnrollment: v.number(),
    chaptersPerWeek: v.number(),
    estimatedCompletionDate: v.optional(v.number()),
    engagementScore: v.number(),
    performancePercentile: v.optional(v.number()),
    isAtRisk: v.boolean(),
    needsHelp: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "courseId"])
    .index("by_course", ["courseId", "completionPercentage"])
    .index("by_engagement", ["engagementScore"])
    .index("by_risk", ["isAtRisk", "updatedAt"]),

  chapterAnalytics: defineTable({
    chapterId: v.string(),
    courseId: v.id("courses"),
    chapterIndex: v.number(),
    totalViews: v.number(),
    uniqueStudents: v.number(),
    completionRate: v.number(),
    avgTimeToComplete: v.number(),
    avgWatchTime: v.number(),
    dropOffRate: v.number(),
    commonDropOffPoint: v.optional(v.number()),
    questionsAsked: v.number(),
    avgEngagementScore: v.number(),
    avgRewatches: v.number(),
    avgTimeSpent: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chapter", ["chapterId"])
    .index("by_course", ["courseId", "chapterIndex"])
    .index("by_drop_off", ["dropOffRate"])
    .index("by_difficulty", ["avgRewatches"]),

  learningStreaks: defineTable({
    userId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActivityDate: v.string(),
    totalDaysActive: v.number(),
    totalHoursLearned: v.number(),
    streakMilestones: v.array(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_current_streak", ["currentStreak"])
    .index("by_last_activity", ["lastActivityDate"]),

  recommendations: defineTable({
    userId: v.string(),
    recommendations: v.array(
      v.object({
        courseId: v.id("courses"),
        score: v.number(),
        reason: v.string(),
      })
    ),
    generatedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  // Quizzes & Assessments
  quizzes: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    courseId: v.id("courses"),
    chapterId: v.optional(v.string()),
    instructorId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("assessment"), v.literal("final_exam")),
    timeLimit: v.optional(v.number()),
    maxAttempts: v.optional(v.number()),
    passingScore: v.number(),
    requiredToPass: v.boolean(),
    totalPoints: v.number(),
    showCorrectAnswers: v.boolean(),
    showScoreImmediately: v.boolean(),
    shuffleQuestions: v.boolean(),
    shuffleAnswers: v.boolean(),
    isPublished: v.boolean(),
    availableFrom: v.optional(v.number()),
    availableUntil: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId", "isPublished"])
    .index("by_instructor", ["instructorId", "createdAt"])
    .index("by_chapter", ["chapterId"]),

  quizQuestions: defineTable({
    quizId: v.id("quizzes"),
    questionType: v.union(
      v.literal("multiple_choice"),
      v.literal("true_false"),
      v.literal("fill_blank"),
      v.literal("short_answer"),
      v.literal("essay"),
      v.literal("matching")
    ),
    questionText: v.string(),
    questionImage: v.optional(v.string()),
    explanation: v.optional(v.string()),
    order: v.number(),
    points: v.number(),
    answers: v.any(),
    caseSensitive: v.optional(v.boolean()),
    partialCredit: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_quiz", ["quizId", "order"]),

  quizAttempts: defineTable({
    quizId: v.id("quizzes"),
    userId: v.string(),
    courseId: v.id("courses"),
    attemptNumber: v.number(),
    status: v.union(
      v.literal("in_progress"),
      v.literal("submitted"),
      v.literal("graded"),
      v.literal("expired")
    ),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()),
    score: v.optional(v.number()),
    percentage: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    answers: v.array(
      v.object({
        questionId: v.id("quizQuestions"),
        answer: v.any(),
        isCorrect: v.optional(v.boolean()),
        pointsEarned: v.optional(v.number()),
        gradedAt: v.optional(v.number()),
        feedback: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_and_quiz", ["userId", "quizId", "attemptNumber"])
    .index("by_quiz", ["quizId", "status"])
    .index("by_user", ["userId", "submittedAt"]),

  quizResults: defineTable({
    quizId: v.id("quizzes"),
    userId: v.string(),
    courseId: v.id("courses"),
    bestAttemptId: v.id("quizAttempts"),
    bestScore: v.number(),
    bestPercentage: v.number(),
    totalAttempts: v.number(),
    averageScore: v.number(),
    averagePercentage: v.number(),
    hasPassed: v.boolean(),
    firstPassedAt: v.optional(v.number()),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "courseId"])
    .index("by_quiz", ["quizId", "hasPassed"])
    .index("by_user_and_quiz", ["userId", "quizId"]),

  questionBanks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    instructorId: v.string(),
    courseId: v.optional(v.id("courses")),
    tags: v.array(v.string()),
    questionIds: v.array(v.id("quizQuestions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_instructor", ["instructorId", "createdAt"])
    .index("by_course", ["courseId"]),

  // ===== MONETIZATION & PAYMENTS =====
  // Subscriptions & Memberships (renamed to avoid conflict with existing subscriptions table)
  membershipSubscriptions: monetizationSchema.subscriptionsTable,
  subscriptionPlans: monetizationSchema.subscriptionPlansTable,

  // Coupons & Discounts
  coupons: monetizationSchema.couponsTable,
  couponUsages: monetizationSchema.couponUsagesTable,

  // Affiliate Program
  affiliates: monetizationSchema.affiliatesTable,
  affiliateClicks: monetizationSchema.affiliateClicksTable,
  affiliateSales: monetizationSchema.affiliateSalesTable,
  affiliatePayouts: monetizationSchema.affiliatePayoutsTable,

  // Referral Program
  referrals: monetizationSchema.referralsTable,

  // Payment Plans (Installments)
  paymentPlans: monetizationSchema.paymentPlansTable,
  installmentPayments: monetizationSchema.installmentPaymentsTable,

  // Bundles
  bundles: monetizationSchema.bundlesTable,

  // Tax & Multi-Currency
  taxRates: monetizationSchema.taxRatesTable,
  currencyRates: monetizationSchema.currencyRatesTable,

  // Refunds
  refunds: monetizationSchema.refundsTable,

  // Creator Payouts
  creatorPayouts: monetizationSchema.creatorPayoutsTable,
  payoutSchedules: monetizationSchema.payoutSchedulesTable,

  // Free Trials & Upsells
  freeTrials: monetizationSchema.freeTrialsTable,
  upsells: monetizationSchema.upsellsTable,
  upsellInteractions: monetizationSchema.upsellInteractionsTable,

  // Content Moderation
  reports: defineTable({
    type: v.union(
      v.literal("course"),
      v.literal("comment"),
      v.literal("user"),
      v.literal("product"),
      v.literal("sample"),
      v.literal("copyright")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed"),
      v.literal("counter_notice")
    ),
    reportedBy: v.string(),
    reportedAt: v.number(),
    reason: v.string(),
    contentId: v.string(),
    contentTitle: v.string(),
    contentPreview: v.optional(v.string()),
    reporterName: v.string(),
    reportedUserName: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
    storeId: v.optional(v.string()),
    contentType: v.optional(v.string()),
    takenDownAt: v.optional(v.number()),
    restoredAt: v.optional(v.number()),
    copyrightClaim: v.optional(
      v.object({
        claimantName: v.string(),
        claimantEmail: v.string(),
        claimantAddress: v.optional(v.string()),
        claimantPhone: v.optional(v.string()),
        originalWorkDescription: v.string(),
        originalWorkUrl: v.optional(v.string()),
        infringementDescription: v.string(),
        goodFaithStatement: v.boolean(),
        accuracyStatement: v.boolean(),
        signatureDate: v.number(),
        digitalSignature: v.string(),
      })
    ),
    counterNotice: v.optional(
      v.object({
        respondentName: v.string(),
        respondentEmail: v.string(),
        respondentAddress: v.string(),
        explanation: v.string(),
        statementOfGoodFaith: v.boolean(),
        consentToJurisdiction: v.boolean(),
        signatureDate: v.number(),
        digitalSignature: v.string(),
      })
    ),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_reported_by", ["reportedBy"])
    .index("by_content_id", ["contentId"])
    .index("by_store_id", ["storeId"]),

  // Resend Email System (New comprehensive system)
  resendConnections: emailSchema.resendConnectionsTable
    .index("by_type", ["type"])
    .index("by_user", ["userId"])
    .index("by_store", ["storeId"]),

  resendTemplates: emailSchema.resendTemplatesTable
    .index("by_connection", ["connectionId"])
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  resendCampaigns: emailSchema.resendCampaignsTable
    .index("by_connection", ["connectionId"])
    .index("by_status", ["status"])
    .index("by_target", ["targetAudience"]),

  resendAutomations: emailSchema.resendAutomationsTable
    .index("by_connection", ["connectionId"])
    .index("by_trigger", ["triggerType"])
    .index("by_active", ["isActive"]),

  resendLogs: emailSchema.resendLogsTable
    .index("by_connection", ["connectionId"])
    .index("by_recipient", ["recipientEmail"])
    .index("by_user", ["recipientUserId"])
    .index("by_status", ["status"])
    .index("by_campaign", ["campaignId"]),

  resendAudienceLists: emailSchema.resendAudienceListsTable.index("by_connection", [
    "connectionId",
  ]),

  resendPreferences: emailSchema.resendPreferencesTable.index("by_user", ["userId"]),

  resendImportedContacts: emailSchema.resendImportedContactsTable
    .index("by_connection", ["connectionId"])
    .index("by_status", ["status"]),

  // Advanced Email Features (ActiveCampaign-Level)
  // Note: emailWorkflows and workflowExecutions already exist above

  leadScores: emailSchema.leadScoresTable,

  emailSegments: emailSchema.emailSegmentsTable.index("by_connection", ["connectionId"]),

  emailABTests: emailSchema.emailABTestsTable,

  userEngagementPatterns: emailSchema.userEngagementPatternsTable,

  emailHealthMetrics: emailSchema.emailHealthMetricsTable,

  campaignGoals: emailSchema.campaignGoalsTable,

  spamScoreChecks: emailSchema.spamScoreChecksTable.index("by_template", ["templateId"]),

  listHygieneActions: emailSchema.listHygieneActionsTable,

  // Email Analytics (raw webhook events & alerts)
  webhookEmailEvents: emailSchema.webhookEmailEventsTable,

  emailAlerts: emailSchema.emailAlertsTable,

  // Gamification - Achievements
  userAchievements: defineTable({
    userId: v.string(), // Clerk ID
    achievementId: v.string(), // Achievement identifier
    unlocked: v.boolean(),
    unlockedAt: v.optional(v.number()), // Timestamp when unlocked
    progress: v.optional(
      v.object({
        current: v.number(),
        target: v.number(),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_achievementId", ["userId", "achievementId"]),

  // Gamification - User XP
  userXP: defineTable({
    userId: v.string(), // Clerk ID
    totalXP: v.number(),
    lastXPGain: v.optional(v.number()), // Timestamp of last XP gain
  }).index("by_userId", ["userId"]),

  // User Nudges - Contextual prompts for user actions (e.g., becoming a creator)
  userNudges: defineTable({
    userId: v.string(), // Clerk ID
    nudgeType: v.union(
      v.literal("become_creator"),
      v.literal("upgrade_plan"),
      v.literal("complete_profile"),
      v.literal("first_product"),
      v.literal("first_sale")
    ),
    nudgeContext: v.union(
      v.literal("course_completed"),
      v.literal("milestone_xp"),
      v.literal("quiz_passed"),
      v.literal("certificate_earned"),
      v.literal("enrollment_count"),
      v.literal("first_login"),
      v.literal("returning_learner"),
      v.literal("first_enrollment"),
      v.literal("lessons_milestone"),
      v.literal("share_progress"),
      v.literal("expert_level"),
      v.literal("creator_profile_views"),
      v.literal("leaderboard_visit"),
      v.literal("default")
    ),
    contextData: v.optional(v.any()), // Course name, XP milestone, etc.
    dismissed: v.boolean(),
    dismissedAt: v.optional(v.number()),
    shown: v.optional(v.boolean()), // Whether nudge has been shown
    shownAt: v.optional(v.number()),
    converted: v.optional(v.boolean()), // Whether user took the action
    convertedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "nudgeType"])
    .index("by_userId_and_dismissed", ["userId", "dismissed"]),

  // Music Sharing - User Uploaded Tracks
  userTracks: defineTable({
    userId: v.string(), // Clerk ID
    title: v.string(),
    artist: v.optional(v.string()),
    genre: v.optional(v.string()),
    mood: v.optional(v.string()),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),

    // Track source
    sourceType: v.union(
      v.literal("upload"),
      v.literal("youtube"),
      v.literal("soundcloud"),
      v.literal("spotify")
    ),
    sourceUrl: v.optional(v.string()), // For URLs
    storageId: v.optional(v.id("_storage")), // For uploads

    // Metadata
    duration: v.optional(v.number()),
    releaseDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),

    // Stats
    plays: v.number(),
    likes: v.number(),
    shares: v.number(),

    // Visibility
    isPublic: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_isPublic", ["isPublic"])
    .index("by_genre", ["genre"]),

  // Music Sharing - Showcase Profiles
  showcaseProfiles: defineTable({
    userId: v.string(), // Clerk ID
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverUrl: v.optional(v.string()),

    // Social links
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    youtube: v.optional(v.string()),
    spotify: v.optional(v.string()),
    soundcloud: v.optional(v.string()),

    // Settings
    isPublic: v.boolean(),
    customSlug: v.optional(v.string()),

    // Stats
    totalPlays: v.number(),
    totalFollowers: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_customSlug", ["customSlug"])
    .index("by_isPublic", ["isPublic"]),

  // Curator Playlists - For submission system
  curatorPlaylists: defineTable({
    creatorId: v.string(), // Clerk ID
    name: v.string(),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),

    // Organization
    tags: v.optional(v.array(v.string())),
    genres: v.optional(v.array(v.string())),

    // Visibility
    isPublic: v.boolean(),
    customSlug: v.optional(v.string()),

    // Submissions
    acceptsSubmissions: v.boolean(),
    submissionRules: v.optional(
      v.object({
        allowedGenres: v.optional(v.array(v.string())),
        maxLengthSeconds: v.optional(v.number()),
        requiresMessage: v.boolean(),
        guidelines: v.optional(v.string()),
      })
    ),
    submissionPricing: v.object({
      isFree: v.boolean(),
      price: v.optional(v.number()),
      currency: v.string(),
    }),
    submissionSLA: v.optional(v.number()), // Days to review

    // Stats
    trackCount: v.number(),
    totalPlays: v.number(),
    totalSubmissions: v.number(),

    // Streaming Platform Links
    spotifyPlaylistUrl: v.optional(v.string()),
    applePlaylistUrl: v.optional(v.string()),
    soundcloudPlaylistUrl: v.optional(v.string()),

    // Product Integration (NEW)
    linkedProductId: v.optional(v.id("digitalProducts")), // Link to product listing
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_isPublic", ["isPublic"])
    .index("by_acceptsSubmissions", ["acceptsSubmissions"])
    .index("by_linkedProductId", ["linkedProductId"])
    .index("by_customSlug", ["customSlug"]),

  // Curator Playlist Tracks - Join table for new submission system
  curatorPlaylistTracks: defineTable({
    playlistId: v.id("curatorPlaylists"),
    trackId: v.id("userTracks"),
    addedBy: v.string(), // Clerk ID of curator
    position: v.number(), // For ordering
    addedAt: v.number(),
    featuredAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_playlistId", ["playlistId"])
    .index("by_trackId", ["trackId"])
    .index("by_playlistId_and_position", ["playlistId", "position"]),

  // Track Submissions - Track submissions to curator playlists
  trackSubmissions: defineTable({
    submitterId: v.string(), // Clerk ID
    creatorId: v.string(), // Playlist owner
    trackId: v.id("userTracks"),
    playlistId: v.optional(v.id("curatorPlaylists")), // Target playlist

    // Submission details
    message: v.optional(v.string()),
    submissionFee: v.number(),
    paymentId: v.optional(v.string()), // Stripe payment ID
    paymentStatus: v.optional(
      v.union(v.literal("pending"), v.literal("paid"), v.literal("refunded"))
    ),

    // Status
    status: v.union(
      v.literal("inbox"),
      v.literal("reviewed"),
      v.literal("accepted"),
      v.literal("declined")
    ),

    // Decision
    decidedAt: v.optional(v.number()),
    decisionNotes: v.optional(v.string()),
    feedback: v.optional(v.string()),
    addedToPlaylistId: v.optional(v.id("curatorPlaylists")),
  })
    .index("by_submitterId", ["submitterId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_status", ["status"])
    .index("by_creatorId_and_status", ["creatorId", "status"])
    .index("by_trackId", ["trackId"]),

  // AI Outreach Drafts
  aiOutreachDrafts: defineTable({
    userId: v.string(), // Clerk ID
    trackId: v.id("userTracks"),

    // Target
    targetType: v.union(
      v.literal("labels"),
      v.literal("playlists"),
      v.literal("blogs"),
      v.literal("ar"),
      v.literal("generic")
    ),

    // Generated content
    subject: v.string(),
    emailBody: v.string(),
    dmScript: v.optional(v.string()),
    followUpSuggestions: v.optional(v.array(v.string())),

    // Settings
    tone: v.string(), // professional, casual, enthusiastic
    style: v.optional(v.string()),

    // Metadata
    generatedAt: v.number(),
    exported: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_trackId", ["trackId"]),

  // ============================================================================
  // INSTAGRAM DM AUTOMATION - SLIDE-STYLE SYSTEM
  // ============================================================================

  // Instagram Integrations - OAuth connections
  integrations: defineTable({
    userId: v.id("users"),
    name: v.union(v.literal("INSTAGRAM"), v.literal("FACEBOOK")),

    // OAuth Tokens
    token: v.string(), // Access token
    expiresAt: v.optional(v.number()), // Token expiry (60 days for Instagram)

    // Instagram-specific data
    instagramId: v.optional(v.string()), // Instagram Business Account ID
    username: v.optional(v.string()),
    profilePicture: v.optional(v.string()),

    // Facebook Page (required for Instagram Business API)
    facebookPageId: v.optional(v.string()),
    facebookPageAccessToken: v.optional(v.string()),

    // Status
    isActive: v.boolean(),
    lastVerified: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_name", ["name"])
    .index("by_instagramId", ["instagramId"]),

  // Automations - Main automation container
  automations: defineTable({
    userId: v.id("users"),
    storeId: v.optional(v.id("stores")),

    // Basic Info
    name: v.string(),
    active: v.boolean(),

    // Instagram Account Association
    instagramAccountId: v.optional(v.string()), // Which Instagram account this automation uses

    // Stats (for analytics dashboard)
    totalTriggers: v.optional(v.number()),
    totalResponses: v.optional(v.number()),
    lastTriggered: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_active", ["active"])
    .index("by_user_active", ["userId", "active"]),

  // Triggers - When to fire automation
  triggers: defineTable({
    automationId: v.id("automations"),
    type: v.union(
      v.literal("COMMENT"), // Triggered by Instagram comment
      v.literal("DM") // Triggered by Instagram DM
    ),
  })
    .index("by_automationId", ["automationId"])
    .index("by_type", ["type"]),

  // Keywords - Trigger keywords for automations
  keywords: defineTable({
    automationId: v.id("automations"),
    word: v.string(), // Stored lowercase for case-insensitive matching
  })
    .index("by_automationId", ["automationId"])
    .index("by_word", ["word"]) // Critical for webhook keyword matching
    .searchIndex("search_keywords", {
      searchField: "word",
    }),

  // Listeners - What action to take when triggered
  listeners: defineTable({
    automationId: v.id("automations"),
    listener: v.union(
      v.literal("MESSAGE"), // Send single message
      v.literal("SMART_AI"), // AI chatbot conversation
      v.literal("SMARTAI") // Alternative spelling
    ),

    // Message content
    prompt: v.string(), // For SMART_AI: OpenAI system prompt. For MESSAGE: the message to send
    commentReply: v.optional(v.string()), // Optional reply to comment

    // Smart AI Configuration
    aiPersonality: v.optional(v.string()), // AI persona description (e.g., "friendly music producer assistant")
    aiKnowledge: v.optional(v.string()), // Knowledge context (products, pricing, FAQs)
    aiTemperature: v.optional(v.number()), // OpenAI temperature (0.0 - 1.0, default 0.7)
    maxConversationTurns: v.optional(v.number()), // Limit conversation length (default unlimited)
    conversationTimeout: v.optional(v.number()), // Minutes before conversation resets (default 30)

    // Analytics counters
    dmCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
  })
    .index("by_automationId", ["automationId"])
    .index("by_listener", ["listener"]),

  // Posts - Instagram posts attached to comment automations
  posts: defineTable({
    automationId: v.id("automations"),

    // Instagram post data
    postId: v.string(), // Instagram media ID
    caption: v.optional(v.string()),
    media: v.string(), // Media URL
    mediaType: v.union(
      v.literal("IMAGE"),
      v.literal("VIDEO"),
      v.literal("CAROUSEL_ALBUM"),
      v.literal("GLOBAL") // For global monitoring (ALL_POSTS_AND_FUTURE)
    ),

    // Metadata
    timestamp: v.optional(v.number()),
    permalink: v.optional(v.string()),
  })
    .index("by_automationId", ["automationId"])
    .index("by_postId", ["postId"]), // Critical for webhook post matching

  // Chat History - Conversation history for Smart AI
  chatHistory: defineTable({
    automationId: v.id("automations"),

    // Instagram user identity
    senderId: v.string(), // Instagram user ID who sent message
    receiverId: v.string(), // Business Instagram account ID

    // Message
    message: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),

    // Context
    conversationId: v.optional(v.string()), // Group messages by conversation

    // Timestamps for conversation management
    createdAt: v.optional(v.number()), // Unix timestamp
    turnNumber: v.optional(v.number()), // Track turn count in conversation
  })
    .index("by_automationId", ["automationId"])
    .index("by_senderId", ["senderId"])
    .index("by_automationId_and_sender", ["automationId", "senderId"])
    .index("by_conversationId", ["conversationId"]),

  // User Subscriptions - For Smart AI feature paywall
  userSubscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("FREE"), v.literal("PRO")),

    // Stripe info
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),

    // Billing
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),

    // Status
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("past_due"),
        v.literal("trialing")
      )
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_plan", ["plan"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  // ============================================
  // LINK-IN-BIO SYSTEM
  // ============================================
  linkInBioLinks: defineTable({
    storeId: v.id("stores"),
    userId: v.string(), // Clerk ID
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    icon: v.optional(v.string()), // lucide icon name or emoji
    order: v.number(), // For drag-and-drop ordering
    isActive: v.boolean(),
    clicks: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_storeId_order", ["storeId", "order"])
    .index("by_isActive", ["isActive"]),

  // Link Click Analytics - detailed tracking for each click
  linkClickAnalytics: defineTable({
    linkId: v.id("linkInBioLinks"),
    storeId: v.id("stores"),
    // Traffic source tracking
    source: v.optional(v.string()), // utm_source or detected source
    medium: v.optional(v.string()), // utm_medium
    campaign: v.optional(v.string()), // utm_campaign
    referrer: v.optional(v.string()), // HTTP referrer
    // Device info
    userAgent: v.optional(v.string()),
    deviceType: v.optional(v.union(v.literal("desktop"), v.literal("mobile"), v.literal("tablet"))),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),
    // Location (from IP geolocation)
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    // Timestamp
    clickedAt: v.number(),
  })
    .index("by_linkId", ["linkId"])
    .index("by_storeId", ["storeId"])
    .index("by_clickedAt", ["clickedAt"])
    .index("by_linkId_clickedAt", ["linkId", "clickedAt"])
    .index("by_storeId_clickedAt", ["storeId", "clickedAt"]),

  // ============================================
  // EMAIL DOMAIN MONITORING TABLES
  // ============================================
  ...emailDomainTables,

  // ============================================
  // EMAIL REPLIES SYSTEM (INBOX)
  // ============================================
  ...emailRepliesTables,

  // ============================================
  // PLUGIN DIRECTORY SYSTEM
  // ============================================

  // Plugin Types (e.g., "Effect", "Instrument", "Studio Tool")
  pluginTypes: defineTable({
    name: v.string(), // e.g., "Effect", "Instrument", "Studio Tool"
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  // Effect-specific categories (e.g., "Reverb", "Delay", "EQ")
  pluginEffectCategories: defineTable({
    name: v.string(),
    pluginTypeId: v.optional(v.id("pluginTypes")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pluginTypeId", ["pluginTypeId"])
    .index("by_name", ["name"]),

  // Instrument-specific categories (e.g., "Synth", "Sampler", "Drums")
  pluginInstrumentCategories: defineTable({
    name: v.string(),
    pluginTypeId: v.optional(v.id("pluginTypes")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pluginTypeId", ["pluginTypeId"])
    .index("by_name", ["name"]),

  // Studio Tool categories (e.g., "Utility", "Analyzer", "Metering")
  pluginStudioToolCategories: defineTable({
    name: v.string(),
    pluginTypeId: v.optional(v.id("pluginTypes")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pluginTypeId", ["pluginTypeId"])
    .index("by_name", ["name"]),

  // General plugin categories (e.g., "Mixing", "Mastering", "Sound Design")
  pluginCategories: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  // Main Plugin records
  plugins: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    author: v.optional(v.string()),
    description: v.optional(v.string()),
    videoScript: v.optional(v.string()),
    image: v.optional(v.string()), // Can be URL or Convex storage ID
    videoUrl: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    userId: v.optional(v.string()), // Admin Clerk ID who created it
    categoryId: v.optional(v.id("pluginCategories")), // General category (Effects, Synths, etc.)
    effectCategoryId: v.optional(v.id("pluginEffectCategories")), // Specific effect category (Reverb, Delay, etc.)
    instrumentCategoryId: v.optional(v.id("pluginInstrumentCategories")), // Specific instrument category (Synth, Sampler, etc.)
    studioToolCategoryId: v.optional(v.id("pluginStudioToolCategories")), // Specific studio tool category (Utility, Analyzer, etc.)
    pluginTypeId: v.optional(v.id("pluginTypes")),
    tags: v.optional(v.array(v.string())), // Array of tag strings for filtering
    optInFormUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    pricingType: v.union(v.literal("FREE"), v.literal("PAID"), v.literal("FREEMIUM")),
    purchaseUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()), // For marketplace visibility
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_effectCategoryId", ["effectCategoryId"])
    .index("by_instrumentCategoryId", ["instrumentCategoryId"])
    .index("by_studioToolCategoryId", ["studioToolCategoryId"])
    .index("by_pluginTypeId", ["pluginTypeId"])
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["isPublished", "pricingType"],
    }),

  // Blog System
  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(), // URL-friendly slug
    excerpt: v.optional(v.string()), // Short description for listings
    content: v.string(), // Full blog post content (rich text/markdown)
    coverImage: v.optional(v.string()), // Featured image URL
    authorId: v.string(), // Clerk ID of the creator
    authorName: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    storeId: v.optional(v.id("stores")), // Optional: associate with a store

    // SEO Fields
    metaTitle: v.optional(v.string()), // Custom SEO title
    metaDescription: v.optional(v.string()), // Meta description for search engines
    keywords: v.optional(v.array(v.string())), // SEO keywords
    canonicalUrl: v.optional(v.string()), // Canonical URL for duplicate content

    // Publishing
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    publishedAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()), // Future publishing date

    // Categories and Tags
    category: v.optional(v.string()), // Main category (e.g., "tutorials", "news", "tips")
    tags: v.optional(v.array(v.string())), // Tags for filtering

    // Engagement
    views: v.optional(v.number()),
    readTimeMinutes: v.optional(v.number()), // Estimated reading time

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_authorId", ["authorId"])
    .index("by_status", ["status"])
    .index("by_storeId", ["storeId"])
    .index("by_category", ["category"])
    .index("by_publishedAt", ["publishedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["status", "authorId"],
    }),

  // Blog Comments (optional feature for engagement)
  blogComments: defineTable({
    postId: v.id("blogPosts"),
    authorId: v.string(), // Clerk ID
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    content: v.string(),
    approved: v.boolean(), // Moderation flag
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_authorId", ["authorId"])
    .index("by_approved", ["approved"]),

  // ============================================================================
  // AI ASSISTANT - Conversations, Messages, and Memories
  // ============================================================================

  // AI Conversations - stores conversation metadata
  aiConversations: defineTable({
    userId: v.string(), // Clerk ID of the user
    title: v.string(), // Auto-generated or user-edited title
    preview: v.optional(v.string()), // First message preview
    lastMessageAt: v.number(), // Timestamp of last message
    messageCount: v.number(), // Total messages in conversation
    // CONVERSATION GOAL ANCHOR - Prevents context drift in long conversations
    // Extracted from the first message and injected into every AI call
    conversationGoal: v.optional(
      v.object({
        originalIntent: v.string(), // "Create a course about Tourist's production style"
        deliverableType: v.optional(v.string()), // "course", "outline", "lesson", etc.
        keyConstraints: v.optional(v.array(v.string())), // ["Tourist style", "Ableton Live 12", "UKG"]
        extractedAt: v.number(), // When the goal was extracted
      })
    ),
    // Agent reference - which AI agent/GPT is this conversation with
    agentId: v.optional(v.id("aiAgents")), // Optional - null means default assistant
    agentSlug: v.optional(v.string()), // Cached for display without joins
    agentName: v.optional(v.string()), // Cached agent name
    // Settings used for this conversation (legacy - single values)
    preset: v.optional(v.string()),
    responseStyle: v.optional(v.string()),
    // Full settings object (new - complete settings persistence)
    settings: v.optional(
      v.object({
        preset: v.string(),
        maxFacets: v.number(),
        chunksPerFacet: v.number(),
        similarityThreshold: v.number(),
        enableCritic: v.boolean(),
        enableCreativeMode: v.boolean(),
        enableWebResearch: v.boolean(),
        enableFactVerification: v.boolean(),
        autoSaveWebResearch: v.boolean(),
        qualityThreshold: v.optional(v.number()),
        maxRetries: v.optional(v.number()),
        webSearchMaxResults: v.optional(v.number()),
        responseStyle: v.string(),
        agenticMode: v.optional(v.boolean()),
      })
    ),
    // Metadata
    archived: v.optional(v.boolean()),
    starred: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_lastMessageAt", ["userId", "lastMessageAt"])
    .index("by_userId_archived", ["userId", "archived"])
    .index("by_userId_starred", ["userId", "starred"])
    .index("by_userId_agentId", ["userId", "agentId"]),

  // AI Messages - stores individual messages within conversations
  aiMessages: defineTable({
    conversationId: v.id("aiConversations"),
    userId: v.string(), // Clerk ID
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    // Assistant-specific fields
    citations: v.optional(
      v.array(
        v.object({
          id: v.number(),
          title: v.string(),
          sourceType: v.string(),
          sourceId: v.optional(v.string()),
        })
      )
    ),
    facetsUsed: v.optional(v.array(v.string())),
    // Pipeline metadata for assistant messages
    pipelineMetadata: v.optional(
      v.object({
        processingTimeMs: v.number(),
        totalChunksProcessed: v.number(),
        plannerModel: v.optional(v.string()),
        summarizerModel: v.optional(v.string()),
        finalWriterModel: v.optional(v.string()),
      })
    ),
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"])
    .index("by_userId", ["userId"]),

  // AI Memories - stores long-term memories extracted from conversations
  aiMemories: defineTable({
    userId: v.string(), // Clerk ID
    // Memory content
    content: v.string(), // The actual memory/fact
    summary: v.optional(v.string()), // Short summary for display
    // Memory type
    type: v.union(
      v.literal("preference"), // User preferences (e.g., "prefers conversational responses")
      v.literal("fact"), // Facts about the user (e.g., "uses Ableton Live")
      v.literal("skill_level"), // Skill assessments (e.g., "intermediate at mixing")
      v.literal("context"), // Contextual info (e.g., "working on melodic techno track")
      v.literal("correction") // Corrections made by user
    ),
    // Source tracking
    sourceConversationId: v.optional(v.id("aiConversations")),
    sourceMessageId: v.optional(v.id("aiMessages")),
    // For vector similarity search (optional)
    embedding: v.optional(v.array(v.number())),
    // Importance and recency scoring
    importance: v.number(), // 1-10 scale
    accessCount: v.number(), // How often this memory is retrieved
    lastAccessedAt: v.optional(v.number()),
    // Lifecycle
    expiresAt: v.optional(v.number()), // For temporary memories
    archived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"])
    .index("by_userId_importance", ["userId", "importance"])
    .index("by_sourceConversationId", ["sourceConversationId"]),

  // AI Agents - Custom GPT-like agents for specialized conversations
  aiAgents: defineTable({
    // Basic info
    name: v.string(), // e.g., "Brand Marketing Agent", "Mixing & Mastering Pro"
    slug: v.string(), // URL-friendly identifier
    description: v.string(), // Short description for the picker
    longDescription: v.optional(v.string()), // Detailed description

    // Visual identity
    icon: v.string(), // Emoji or icon name (e.g., "📣", "🎛️", "sparkles")
    color: v.optional(v.string()), // Gradient or color theme (e.g., "violet", "amber", "emerald")
    avatarUrl: v.optional(v.string()), // Custom avatar image

    // Behavior configuration
    systemPrompt: v.string(), // The main system prompt that defines the agent's behavior
    welcomeMessage: v.optional(v.string()), // First message shown when starting a chat
    suggestedQuestions: v.optional(v.array(v.string())), // Starter questions for users

    // Knowledge & Capabilities
    knowledgeFilters: v.optional(
      v.object({
        categories: v.optional(v.array(v.string())), // Filter embeddings by category
        sourceTypes: v.optional(v.array(v.string())), // Filter by source type
        tags: v.optional(v.array(v.string())), // Custom tags for knowledge filtering
      })
    ),

    // External integrations/tools
    enabledTools: v.optional(v.array(v.string())), // e.g., ["blotato", "course_creator", "stripe"]
    toolConfigs: v.optional(v.any()), // Tool-specific configuration

    // Default settings overrides
    defaultSettings: v.optional(
      v.object({
        preset: v.optional(v.string()),
        responseStyle: v.optional(v.string()),
        maxFacets: v.optional(v.number()),
        chunksPerFacet: v.optional(v.number()),
        enableWebResearch: v.optional(v.boolean()),
        enableCreativeMode: v.optional(v.boolean()),
      })
    ),

    // Access control
    visibility: v.union(
      v.literal("public"), // Available to all users
      v.literal("subscribers"), // Only for subscribed users
      v.literal("private") // Only for owner/admins
    ),
    creatorId: v.optional(v.string()), // Clerk ID of creator (for user-created agents)

    // Categorization
    category: v.union(
      v.literal("marketing"),
      v.literal("audio"),
      v.literal("business"),
      v.literal("social"),
      v.literal("creative"),
      v.literal("productivity"),
      v.literal("learning"),
      v.literal("custom")
    ),
    tags: v.optional(v.array(v.string())),

    // Analytics
    conversationCount: v.number(), // How many conversations used this agent
    rating: v.optional(v.number()), // Average rating 1-5
    ratingCount: v.optional(v.number()),

    // Status
    isActive: v.boolean(),
    isBuiltIn: v.boolean(), // System-provided vs user-created
    isFeatured: v.optional(v.boolean()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_visibility", ["visibility"])
    .index("by_category", ["category"])
    .index("by_creatorId", ["creatorId"])
    .index("by_isActive", ["isActive"])
    .index("by_isFeatured", ["isFeatured"])
    .index("by_conversationCount", ["conversationCount"]),

  // AI Message Feedback - upvotes/downvotes on responses
  aiMessageFeedback: defineTable({
    messageId: v.id("aiMessages"),
    conversationId: v.id("aiConversations"),
    userId: v.string(), // Clerk ID
    vote: v.union(v.literal("up"), v.literal("down")),
    // Optional detailed feedback
    reason: v.optional(v.string()), // Why they voted this way
    tags: v.optional(
      v.array(
        v.union(
          v.literal("accurate"),
          v.literal("helpful"),
          v.literal("creative"),
          v.literal("well_written"),
          v.literal("inaccurate"),
          v.literal("unhelpful"),
          v.literal("off_topic"),
          v.literal("too_long"),
          v.literal("too_short")
        )
      )
    ),
    createdAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_userId", ["userId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_vote", ["vote"]),

  // Web Research Results - cached Tavily searches that can be added to embeddings
  webResearch: defineTable({
    userId: v.string(), // Who triggered the search
    query: v.string(), // The search query
    // Results from Tavily
    results: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        content: v.string(),
        score: v.number(),
        publishedDate: v.optional(v.string()),
      })
    ),
    // Whether this has been added to embeddings
    addedToEmbeddings: v.boolean(),
    embeddingIds: v.optional(v.array(v.id("embeddings"))),
    // Context
    sourceConversationId: v.optional(v.id("aiConversations")),
    sourceMessageId: v.optional(v.id("aiMessages")),
    // Metadata
    resultCount: v.number(),
    searchDuration: v.optional(v.number()), // ms
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_query", ["query"])
    .index("by_addedToEmbeddings", ["addedToEmbeddings"])
    .index("by_sourceConversationId", ["sourceConversationId"]),

  // =============================================================================
  // Feature Discovery - AI-identified features from course content
  // =============================================================================
  suggestedFeatures: defineTable({
    // Feature details
    name: v.string(),
    description: v.string(),
    category: v.string(), // marketing, automation, content, monetization, engagement, analytics, social, audio, workflow, other

    // Source tracking
    sourceCourses: v.array(v.string()), // Course titles
    sourceChapters: v.array(v.string()), // Chapter titles

    // Priority and reasoning
    priority: v.string(), // high, medium, low
    reasoning: v.string(),
    existsPartially: v.optional(v.string()), // Name of existing similar feature
    implementationHint: v.optional(v.string()),
    cursorPrompt: v.optional(v.string()), // Pre-built prompt for Cursor

    // Status tracking
    status: v.string(), // new, reviewing, planned, building, completed, rejected
    notes: v.optional(v.string()), // Admin notes
    linkedTaskUrl: v.optional(v.string()), // Link to Linear/GitHub issue

    // Metadata
    analysisRunId: v.optional(v.string()), // Which analysis run created this
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_priority", ["priority"])
    .index("by_analysisRunId", ["analysisRunId"]),

  // =============================================================================
  // Script Illustrations - AI-generated images from script content
  // =============================================================================
  scriptIllustrations: defineTable({
    // Source script information
    scriptId: v.optional(v.string()), // Reference to parent script/course/lesson
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),

    // Text content
    sentence: v.string(), // The original sentence from the script
    sentenceIndex: v.number(), // Position in the script
    illustrationPrompt: v.string(), // The AI-generated prompt used for image generation

    // Image data
    imageUrl: v.string(), // URL to the generated image (Convex storage)
    imageStorageId: v.optional(v.id("_storage")), // Convex storage ID

    // Embeddings for semantic search
    embedding: v.optional(v.array(v.number())), // Image embedding vector (512 or 1024 dims)
    embeddingModel: v.optional(v.string()), // Model used for embedding (e.g., "clip-vit-base-patch32")

    // Generation metadata
    generationModel: v.string(), // FAL model used (e.g., "fal-ai/flux/schnell")
    generationParams: v.optional(
      v.object({
        seed: v.optional(v.number()),
        steps: v.optional(v.number()),
        guidance: v.optional(v.number()),
      })
    ),
    generationStatus: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    generationError: v.optional(v.string()),

    // Ownership
    userId: v.string(), // Clerk ID
    storeId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    generatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_scriptId", ["scriptId"])
    .index("by_sourceType", ["sourceType"])
    .index("by_status", ["generationStatus"])
    .index("by_user_and_script", ["userId", "scriptId"])
    .index("by_sentenceIndex", ["sentenceIndex"])
    .index("by_scriptId_and_sentenceIndex", ["scriptId", "sentenceIndex"]), // For ordered retrieval

  // Script generation jobs - track batch illustration generation
  scriptIllustrationJobs: defineTable({
    userId: v.string(),
    storeId: v.optional(v.string()),

    // Script content
    scriptText: v.string(),
    scriptTitle: v.optional(v.string()),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("script"),
      v.literal("custom")
    ),
    sourceId: v.optional(v.string()),

    // Processing status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // Progress tracking
    totalSentences: v.number(),
    processedSentences: v.number(),
    failedSentences: v.number(),

    // Results
    illustrationIds: v.array(v.id("scriptIllustrations")),

    // Error tracking
    errors: v.optional(v.array(v.string())),

    // Timestamps
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_sourceId", ["sourceId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]), // For ordered retrieval (newest first)

  // =============================================================================
  // Lead Magnet Analyses - Saved visual idea analyses for courses
  // =============================================================================
  leadMagnetAnalyses: defineTable({
    userId: v.string(), // Clerk ID
    courseId: v.id("courses"),
    courseTitle: v.string(),

    // Analysis metadata
    name: v.string(), // User-given name for this analysis

    // Full analysis results (stored as JSON)
    totalChapters: v.number(),
    totalVisualIdeas: v.number(),
    avgLeadMagnetScore: v.number(),

    // Serialized chapter analyses
    chapters: v.array(
      v.object({
        chapterId: v.string(),
        chapterTitle: v.string(),
        lessonId: v.optional(v.string()),
        lessonTitle: v.optional(v.string()),
        moduleTitle: v.optional(v.string()),
        wordCount: v.optional(v.number()),
        overallLeadMagnetScore: v.number(),
        keyTopics: v.array(v.string()),
        leadMagnetSuggestions: v.array(v.string()),
        visualIdeas: v.array(
          v.object({
            sentenceOrConcept: v.string(),
            visualDescription: v.string(),
            illustrationPrompt: v.string(),
            importance: v.union(v.literal("critical"), v.literal("helpful"), v.literal("optional")),
            category: v.union(
              v.literal("concept_diagram"),
              v.literal("process_flow"),
              v.literal("comparison"),
              v.literal("equipment_setup"),
              v.literal("waveform_visual"),
              v.literal("ui_screenshot"),
              v.literal("metaphor"),
              v.literal("example")
            ),
            leadMagnetPotential: v.number(),
            estimatedPosition: v.number(),
            embedding: v.optional(v.array(v.number())),
            embeddingText: v.optional(v.string()),
          })
        ),
      })
    ),

    // Bundle ideas
    bundleIdeas: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          chapterIds: v.array(v.string()),
          estimatedVisuals: v.number(),
        })
      )
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_userId_and_courseId", ["userId", "courseId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  // =============================================================================
  // Cheat Sheet Generator - AI-powered PDF cheat sheets from course content
  // =============================================================================

  cheatSheets: defineTable({
    userId: v.string(), // Clerk ID of admin who created it

    // Source course
    courseId: v.id("courses"),
    courseTitle: v.string(),
    selectedChapterIds: v.array(v.string()), // IDs of chapters used as source

    // Editable outline structure (AI-generated, then user-refined)
    outline: v.object({
      title: v.string(),
      subtitle: v.optional(v.string()),
      sections: v.array(
        v.object({
          heading: v.string(),
          type: v.union(
            v.literal("key_takeaways"),
            v.literal("quick_reference"),
            v.literal("step_by_step"),
            v.literal("tips"),
            v.literal("comparison"),
            v.literal("glossary"),
            v.literal("custom")
          ),
          items: v.array(
            v.object({
              text: v.string(),
              subItems: v.optional(v.array(v.string())),
              isTip: v.optional(v.boolean()),
              isWarning: v.optional(v.boolean()),
            })
          ),
        })
      ),
      footer: v.optional(v.string()),
    }),

    // Generation metadata
    aiModel: v.optional(v.string()),
    generatedAt: v.optional(v.number()),

    // PDF output
    pdfStorageId: v.optional(v.id("_storage")),
    pdfUrl: v.optional(v.string()),
    pdfGeneratedAt: v.optional(v.number()),

    // Link to digitalProducts (if published as lead magnet)
    digitalProductId: v.optional(v.id("digitalProducts")),

    // Lifecycle status
    status: v.union(
      v.literal("draft"),      // Outline created, not yet PDF'd
      v.literal("generated"),  // PDF generated
      v.literal("published")   // Published as digitalProduct
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_status", ["status"]),

  // =============================================================================
  // AI Course Builder - Batch course generation queue and outlines
  // =============================================================================

  // Queue for batch course creation requests
  aiCourseQueue: defineTable({
    userId: v.string(), // Clerk ID
    storeId: v.string(),

    // Course request details
    prompt: v.string(), // e.g., "Create me a course on how to make a tour style track in Ableton Live 12"
    topic: v.optional(v.string()), // Extracted topic
    skillLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    targetModules: v.optional(v.number()), // Default 4
    targetLessonsPerModule: v.optional(v.number()), // Default 3

    // Processing status
    status: v.union(
      v.literal("queued"), // Waiting to be processed
      v.literal("generating_outline"), // AI is generating the outline
      v.literal("outline_ready"), // Outline generated, ready for review
      v.literal("expanding_content"), // Detailed content being generated
      v.literal("reformatting"), // Reformatting chapter content with markdown
      v.literal("ready_to_create"), // All content ready, waiting to create course
      v.literal("creating_course"), // Creating the actual course
      v.literal("completed"), // Course created successfully
      v.literal("failed") // Something went wrong
    ),

    // Progress tracking
    progress: v.optional(
      v.object({
        currentStep: v.string(),
        totalSteps: v.number(),
        completedSteps: v.number(),
        currentChapter: v.optional(v.string()),
      })
    ),

    // Results
    outlineId: v.optional(v.id("aiCourseOutlines")), // Link to generated outline
    courseId: v.optional(v.id("courses")), // Link to created course

    // Error tracking
    error: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    // Priority for queue processing
    priority: v.optional(v.number()), // Higher = processed first
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_status", ["status"])
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_priority_and_createdAt", ["priority", "createdAt"]),

  // Generated course outlines (JSON structure)
  aiCourseOutlines: defineTable({
    queueId: v.id("aiCourseQueue"), // Reference to queue item
    userId: v.string(),
    storeId: v.string(),

    // Course metadata
    title: v.string(),
    description: v.string(),
    topic: v.string(),
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedDuration: v.optional(v.number()), // In minutes

    // The full outline structure as JSON
    outline: v.any(), // Full course structure with modules, lessons, chapters

    // Content expansion tracking
    totalChapters: v.number(),
    expandedChapters: v.number(), // How many chapters have detailed content

    // Chapter content status - tracks which chapters need expansion
    chapterStatus: v.optional(
      v.array(
        v.object({
          moduleIndex: v.number(),
          lessonIndex: v.number(),
          chapterIndex: v.number(),
          title: v.string(),
          hasDetailedContent: v.boolean(),
          wordCount: v.optional(v.number()),
        })
      )
    ),

    // Generation metadata
    generationModel: v.optional(v.string()),
    generationTimeMs: v.optional(v.number()),

    // User edits
    isEdited: v.boolean(), // Has user manually edited the outline?
    lastEditedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_queueId", ["queueId"])
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),

  dripCampaigns: defineTable({
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("lead_signup"),
      v.literal("product_purchase"),
      v.literal("tag_added"),
      v.literal("manual")
    ),
    triggerConfig: v.optional(v.any()),
    isActive: v.boolean(),
    totalEnrolled: v.number(),
    totalCompleted: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_triggerType", ["triggerType"])
    .index("by_active", ["isActive"]),

  dripCampaignSteps: defineTable({
    campaignId: v.id("dripCampaigns"),
    stepNumber: v.number(),
    delayMinutes: v.number(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    isActive: v.boolean(),
    sentCount: v.number(),
    openCount: v.number(),
    clickCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_stepNumber", ["campaignId", "stepNumber"]),

  dripCampaignEnrollments: defineTable({
    campaignId: v.id("dripCampaigns"),
    email: v.string(),
    name: v.optional(v.string()),
    customerId: v.optional(v.string()),
    currentStepNumber: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("paused")
    ),
    nextSendAt: v.optional(v.number()),
    lastSentAt: v.optional(v.number()),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_email", ["email"])
    .index("by_campaignId_and_email", ["campaignId", "email"])
    .index("by_status", ["status"])
    .index("by_status_and_nextSendAt", ["status", "nextSendAt"]),

  // ============================================================================
  // EMAIL MARKETING CONTACTS & TAGS (ActiveCampaign-style)
  // ============================================================================

  // Email Tags - For segmentation and automation triggers
  emailTags: defineTable({
    storeId: v.string(),
    name: v.string(),
    color: v.optional(v.string()), // Hex color for UI display
    description: v.optional(v.string()),
    contactCount: v.number(), // Denormalized count for performance
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_storeId_and_name", ["storeId", "name"]),

  // Email Contacts - Subscribers for email marketing
  emailContacts: defineTable({
    storeId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    // Subscription status
    status: v.union(
      v.literal("subscribed"),
      v.literal("unsubscribed"),
      v.literal("bounced"),
      v.literal("complained")
    ),
    subscribedAt: v.number(),
    unsubscribedAt: v.optional(v.number()),

    // Tags for segmentation (array of tag IDs)
    tagIds: v.array(v.id("emailTags")),

    // Source tracking
    source: v.optional(v.string()), // "lead_magnet", "checkout", "manual", "import"
    sourceProductId: v.optional(v.id("digitalProducts")),
    sourceCourseId: v.optional(v.id("courses")),

    // Engagement metrics
    emailsSent: v.number(),
    emailsOpened: v.number(),
    emailsClicked: v.number(),
    lastOpenedAt: v.optional(v.number()),
    lastClickedAt: v.optional(v.number()),
    engagementScore: v.optional(v.number()), // 0-100 calculated score

    // Custom fields (flexible JSON for user-defined fields)
    customFields: v.optional(v.any()),

    // Link to existing customer record (if any)
    customerId: v.optional(v.id("customers")),

    // Link to user record (for enrolled users)
    userId: v.optional(v.id("users")),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_email", ["email"])
    .index("by_storeId_and_email", ["storeId", "email"])
    .index("by_status", ["status"])
    .index("by_storeId_and_status", ["storeId", "status"])
    .index("by_subscribedAt", ["subscribedAt"])
    .index("by_engagementScore", ["engagementScore"])
    // Compound index for efficient lead scoring queries (top leads, needs attention)
    // IMPORTANT: This index enables getTopLeads and getLeadsNeedingAttention to fetch
    // contacts sorted by engagement score without full-table scans (32k doc limit).
    .index("by_storeId_status_engagementScore", ["storeId", "status", "engagementScore"])
    .searchIndex("search_email", {
      searchField: "email",
      filterFields: ["storeId"],
    }),

  // Email Contact Stats - Aggregated counts maintained separately for performance
  emailContactStats: defineTable({
    storeId: v.string(),
    totalContacts: v.number(),
    subscribedCount: v.number(),
    unsubscribedCount: v.number(),
    bouncedCount: v.number(),
    complainedCount: v.number(),
    updatedAt: v.number(),
  }).index("by_storeId", ["storeId"]),

  // Junction table for contact-tag relationships (enables efficient tag filtering)
  emailContactTags: defineTable({
    contactId: v.id("emailContacts"),
    tagId: v.id("emailTags"),
    storeId: v.string(), // Denormalized for efficient queries
    createdAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_tagId", ["tagId"])
    .index("by_storeId_and_tagId", ["storeId", "tagId"])
    .index("by_contactId_and_tagId", ["contactId", "tagId"]),

  // Contact Activity Log - Track all contact interactions
  emailContactActivity: defineTable({
    contactId: v.id("emailContacts"),
    storeId: v.string(),
    activityType: v.union(
      v.literal("subscribed"),
      v.literal("unsubscribed"),
      v.literal("email_sent"),
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("email_bounced"),
      v.literal("tag_added"),
      v.literal("tag_removed"),
      v.literal("campaign_enrolled"),
      v.literal("campaign_completed"),
      v.literal("custom_field_updated")
    ),
    // Activity details
    metadata: v.optional(
      v.object({
        campaignId: v.optional(v.id("dripCampaigns")),
        emailSubject: v.optional(v.string()),
        tagId: v.optional(v.id("emailTags")),
        tagName: v.optional(v.string()),
        linkClicked: v.optional(v.string()),
        fieldName: v.optional(v.string()),
        oldValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
        emailId: v.optional(v.string()),
        timestamp: v.optional(v.number()),
      })
    ),
    timestamp: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_storeId", ["storeId"])
    .index("by_activityType", ["activityType"])
    .index("by_contactId_and_timestamp", ["contactId", "timestamp"])
    .index("by_storeId_and_timestamp", ["storeId", "timestamp"]),

  // ============================================================================
  // SOCIAL MEDIA POST GENERATOR
  // ============================================================================

  // Generated Social Media Posts - Store AI-generated posts from course content
  socialMediaPosts: defineTable({
    userId: v.string(), // Clerk ID
    storeId: v.optional(v.string()), // Store ID

    // Source content reference
    courseId: v.optional(v.id("courses")), // Source course
    chapterId: v.optional(v.id("courseChapters")), // Source chapter

    // Source content details
    sourceContent: v.string(), // Raw text used for generation
    sourceType: v.union(
      v.literal("chapter"), // Entire chapter
      v.literal("section"), // Section by heading
      v.literal("custom") // Custom text input
    ),
    selectedHeadings: v.optional(v.array(v.string())), // Which headings were selected (if sourceType is "section")

    // Generated platform-specific scripts
    tiktokScript: v.optional(v.string()),
    youtubeScript: v.optional(v.string()),
    instagramScript: v.optional(v.string()),
    combinedScript: v.optional(v.string()), // Final combined/edited script

    // CTA configuration
    ctaTemplateId: v.optional(v.id("ctaTemplates")),
    ctaText: v.optional(v.string()), // Actual CTA text used (may be edited)
    ctaKeyword: v.optional(v.string()), // e.g., "COMPRESSION", "KICK"
    ctaProductId: v.optional(v.id("digitalProducts")), // Linked product for CTA
    ctaCourseId: v.optional(v.id("courses")), // Or linked course for CTA

    // Generated images
    images: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          url: v.string(),
          aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
          prompt: v.string(), // The prompt used to generate this image
          sentence: v.optional(v.string()), // The sentence/concept this image illustrates
          embedding: v.optional(v.array(v.number())), // For semantic search
          // Prompt editing fields
          originalPrompt: v.optional(v.string()), // Original AI-generated prompt for reset
          isPromptEdited: v.optional(v.boolean()), // Track if user modified prompt
          // Source image for image-to-image generation
          sourceImageUrl: v.optional(v.string()), // URL of uploaded source image
          sourceStorageId: v.optional(v.id("_storage")), // Storage ID of uploaded source
        })
      )
    ),

    // Generated audio (ElevenLabs TTS)
    audioStorageId: v.optional(v.id("_storage")),
    audioUrl: v.optional(v.string()),
    audioVoiceId: v.optional(v.string()), // ElevenLabs voice ID (default: Andrew 1)
    audioDuration: v.optional(v.number()), // Duration in seconds
    audioScript: v.optional(v.string()), // The exact text sent to TTS (may differ from combinedScript)

    // Generated captions with hashtags
    instagramCaption: v.optional(v.string()), // Caption with hashtags for Instagram
    tiktokCaption: v.optional(v.string()), // Caption with hashtags for TikTok

    // Generation status tracking
    status: v.union(
      v.literal("draft"), // Initial state
      v.literal("scripts_generated"), // Platform scripts ready
      v.literal("combined"), // Scripts combined with CTA
      v.literal("images_generated"), // Images generated
      v.literal("audio_generated"), // Audio generated
      v.literal("completed"), // All assets ready
      v.literal("published") // Published to social (future)
    ),

    // Metadata
    title: v.optional(v.string()), // User-given title for organization
    tags: v.optional(v.array(v.string())), // User tags for filtering

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),

    // Future: Instagram automation integration
    automationId: v.optional(v.id("automations")),
    scheduledPostId: v.optional(v.id("scheduledPosts")),
    publishedAt: v.optional(v.number()),

    // Link to pre-generated script from AI agent
    generatedScriptId: v.optional(v.id("generatedScripts")),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_courseId", ["courseId"])
    .index("by_chapterId", ["chapterId"])
    .index("by_status", ["status"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_generatedScriptId", ["generatedScriptId"]),

  // CTA Templates - Reusable call-to-action templates
  ctaTemplates: defineTable({
    userId: v.string(), // Clerk ID
    storeId: v.optional(v.string()), // Store ID

    // Template details
    name: v.string(), // e.g., "Compression Course CTA"
    template: v.string(), // The full CTA text with {{KEYWORD}} placeholder
    keyword: v.string(), // e.g., "COMPRESSION"
    description: v.optional(v.string()), // Optional description for organization

    // Linked product/course (optional)
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    productName: v.optional(v.string()), // Cached name for display

    // Usage tracking
    usageCount: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_keyword", ["keyword"])
    .index("by_userId_keyword", ["userId", "keyword"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================================================
  // SERVICE ORDERS (Mixing/Mastering Services)
  // ============================================================================

  // Service Orders - Track mixing/mastering service orders with full workflow
  serviceOrders: defineTable({
    // Core relationships
    customerId: v.string(), // Clerk ID of customer
    creatorId: v.string(), // Clerk ID of creator/mixer
    productId: v.id("digitalProducts"), // The mixing service product
    storeId: v.string(),
    purchaseId: v.optional(v.id("purchases")), // Link to purchase record

    // Order details
    orderNumber: v.string(), // Human-readable order number (e.g., "MIX-2024-001")
    serviceType: v.union(
      v.literal("mixing"),
      v.literal("mastering"),
      v.literal("mix-and-master"),
      v.literal("stem-mixing")
    ),
    selectedTier: v.object({
      id: v.string(),
      name: v.string(),
      stemCount: v.string(),
      price: v.number(),
      turnaroundDays: v.number(),
      revisions: v.number(),
    }),

    // Pricing
    basePrice: v.number(),
    rushFee: v.optional(v.number()),
    totalPrice: v.number(),
    isRush: v.optional(v.boolean()),

    // Status workflow
    status: v.union(
      v.literal("pending_payment"), // Awaiting Stripe payment
      v.literal("pending_upload"), // Paid, waiting for customer files
      v.literal("files_received"), // Customer uploaded files
      v.literal("in_progress"), // Creator working on it
      v.literal("pending_review"), // Creator delivered, awaiting customer review
      v.literal("revision_requested"), // Customer requested changes
      v.literal("completed"), // Customer approved
      v.literal("cancelled"), // Order cancelled
      v.literal("refunded") // Refund issued
    ),

    // Customer files (uploaded by customer)
    customerFiles: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          storageId: v.string(),
          url: v.optional(v.string()),
          size: v.number(),
          type: v.string(),
          uploadedAt: v.number(),
        })
      )
    ),
    customerNotes: v.optional(v.string()),
    referenceTrackUrl: v.optional(v.string()),

    // Delivered files (uploaded by creator)
    deliveredFiles: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          storageId: v.string(),
          url: v.optional(v.string()),
          size: v.number(),
          type: v.string(),
          uploadedAt: v.number(),
          version: v.number(), // 1 = initial, 2+ = revisions
          notes: v.optional(v.string()),
        })
      )
    ),

    // Revision tracking
    revisionsUsed: v.number(),
    revisionsAllowed: v.number(),

    // Timestamps
    paidAt: v.optional(v.number()),
    filesUploadedAt: v.optional(v.number()),
    workStartedAt: v.optional(v.number()),
    firstDeliveryAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    dueDate: v.optional(v.number()), // Based on turnaround time

    // Communication
    lastMessageAt: v.optional(v.number()),
    unreadByCustomer: v.optional(v.number()),
    unreadByCreator: v.optional(v.number()),
  })
    .index("by_customerId", ["customerId"])
    .index("by_creatorId", ["creatorId"])
    .index("by_productId", ["productId"])
    .index("by_status", ["status"])
    .index("by_storeId", ["storeId"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_customer_status", ["customerId", "status"])
    .index("by_creator_status", ["creatorId", "status"]),

  // Service Order Messages - In-order messaging between customer and creator
  serviceOrderMessages: defineTable({
    orderId: v.id("serviceOrders"),
    senderId: v.string(), // Clerk ID
    senderType: v.union(v.literal("customer"), v.literal("creator")),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          storageId: v.string(),
          url: v.optional(v.string()),
          size: v.number(),
          type: v.string(),
        })
      )
    ),
    isSystemMessage: v.optional(v.boolean()), // For automated status updates
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_senderId", ["senderId"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================================================
  // AI CONTENT PLANNING SYSTEM
  // ============================================================================

  // Social Account Profiles - Define social pages for content planning (not OAuth-linked)
  socialAccountProfiles: defineTable({
    storeId: v.string(),
    userId: v.string(), // Clerk ID

    // Profile info
    name: v.string(), // e.g., "Vocal Production IG"
    description: v.string(), // What topics/niche this account covers
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("youtube"),
      v.literal("linkedin")
    ),

    // Optional link to authenticated account
    socialAccountId: v.optional(v.id("socialAccounts")),

    // Content niche/topics for AI matching
    topics: v.array(v.string()), // ["compression", "mixing", "vocal processing"]
    targetAudience: v.optional(v.string()), // "bedroom producers", "beginners"

    // Posting preferences
    preferredPostDays: v.optional(v.array(v.number())), // 0=Sunday, 1=Monday, etc.
    postsPerWeek: v.optional(v.number()),

    // Stats
    totalScheduledScripts: v.optional(v.number()),
    totalPublishedScripts: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_socialAccountId", ["socialAccountId"]),

  // Generated Scripts - Pre-generated script library from AI agent
  generatedScripts: defineTable({
    storeId: v.string(),
    userId: v.string(), // Clerk ID

    // Source reference
    courseId: v.id("courses"),
    chapterId: v.id("courseChapters"),
    moduleId: v.optional(v.string()),
    lessonId: v.optional(v.string()),

    // Source content metadata
    courseTitle: v.string(),
    chapterTitle: v.string(),
    chapterPosition: v.number(), // For progression tracking (1.1, 1.2, etc.)
    sourceContentSnippet: v.string(), // First 500 chars for preview

    // Generated scripts
    tiktokScript: v.string(),
    youtubeScript: v.string(),
    instagramScript: v.string(),
    combinedScript: v.string(),

    // AI-generated CTA
    suggestedCta: v.optional(v.string()),
    suggestedKeyword: v.optional(v.string()),

    // Virality scoring (1-10)
    viralityScore: v.number(),
    viralityAnalysis: v.object({
      engagementPotential: v.number(), // Viral hooks, controversy, pain points
      educationalValue: v.number(), // Actionable tips, clear outcomes
      trendAlignment: v.number(), // Current social media formats
      reasoning: v.string(), // AI explanation of score
    }),

    // Account matching
    suggestedAccountProfileId: v.optional(v.id("socialAccountProfiles")),
    topicMatch: v.optional(v.array(v.string())), // Topics that matched
    accountMatchScore: v.optional(v.number()), // How well it matches the account (1-100)

    // Status
    status: v.union(
      v.literal("generated"), // Just created by agent
      v.literal("reviewed"), // User reviewed
      v.literal("scheduled"), // Added to calendar
      v.literal("in_progress"), // Being edited in generator
      v.literal("completed"), // Fully processed through generator
      v.literal("archived") // User archived
    ),

    // Link to social media post if used
    socialMediaPostId: v.optional(v.id("socialMediaPosts")),

    // Generation metadata
    generatedAt: v.number(),
    generationBatchId: v.optional(v.string()), // For tracking batch runs

    // Performance feedback (added after script is published)
    actualPerformance: v.optional(
      v.object({
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
        saves: v.optional(v.number()),
        engagementRate: v.optional(v.number()),
        performanceScore: v.optional(v.number()), // 1-10 based on actual metrics
        capturedAt: v.number(),
      })
    ),
    userFeedback: v.optional(
      v.object({
        rating: v.optional(v.number()), // 1-5 user rating
        notes: v.optional(v.string()), // "Got comments about sounding AI-generated"
        audienceReaction: v.optional(
          v.union(v.literal("positive"), v.literal("mixed"), v.literal("negative"))
        ),
        whatWorked: v.optional(v.array(v.string())), // ["hook was great", "CTA converted well"]
        whatDidntWork: v.optional(v.array(v.string())), // ["too long", "sounded robotic"]
        submittedAt: v.number(),
      })
    ),
    predictionAccuracy: v.optional(v.number()), // How close viralityScore was to performanceScore

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_courseId", ["courseId"])
    .index("by_chapterId", ["chapterId"])
    .index("by_status", ["status"])
    .index("by_viralityScore", ["viralityScore"])
    .index("by_suggestedAccountProfileId", ["suggestedAccountProfileId"])
    .index("by_generatedAt", ["generatedAt"])
    .index("by_user_status", ["userId", "status"])
    .index("by_store_account_status", ["storeId", "suggestedAccountProfileId", "status"]),

  // Script Calendar Entries - Per-account scheduling
  scriptCalendarEntries: defineTable({
    storeId: v.string(),
    userId: v.string(), // Clerk ID

    // References
    accountProfileId: v.id("socialAccountProfiles"),
    generatedScriptId: v.id("generatedScripts"),

    // Scheduling
    scheduledDate: v.number(), // Unix timestamp for the day
    scheduledTime: v.optional(v.number()), // Optional specific time
    timezone: v.string(),

    // Order for progression tracking
    dayOfWeek: v.optional(v.number()), // 0-6 for calendar display
    sequenceOrder: v.number(), // 1, 2, 3... for chapter progression

    // Status
    status: v.union(
      v.literal("planned"), // Placed on calendar
      v.literal("in_progress"), // User is working on it
      v.literal("ready"), // Fully generated through flow
      v.literal("published"), // Posted
      v.literal("skipped") // User decided not to use
    ),

    // Notes
    userNotes: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_accountProfileId", ["accountProfileId"])
    .index("by_generatedScriptId", ["generatedScriptId"])
    .index("by_scheduledDate", ["scheduledDate"])
    .index("by_account_date", ["accountProfileId", "scheduledDate"])
    .index("by_status", ["status"]),

  // Script Generation Jobs - Background job tracking
  scriptGenerationJobs: defineTable({
    storeId: v.string(),
    userId: v.string(), // Clerk ID

    // Job configuration
    jobType: v.union(
      v.literal("full_scan"), // Process all courses
      v.literal("course_scan"), // Process specific course
      v.literal("incremental") // Process only new content
    ),
    courseId: v.optional(v.id("courses")), // For course_scan

    // Progress tracking
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),

    // Batch processing state
    currentBatchId: v.optional(v.string()),
    totalChapters: v.optional(v.number()),
    processedChapters: v.optional(v.number()),
    failedChapters: v.optional(v.number()),

    // Results
    scriptsGenerated: v.optional(v.number()),
    averageViralityScore: v.optional(v.number()),

    // Timing
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    estimatedCompletionAt: v.optional(v.number()),

    // Error tracking
    lastError: v.optional(v.string()),
    errorCount: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // ============================================================================
  // DIRECT MESSAGING SYSTEM
  // ============================================================================

  // DM Conversations - Stores metadata for 1:1 conversations
  dmConversations: defineTable({
    // Participants (always 2 users, sorted alphabetically for uniqueness)
    participant1Id: v.string(), // Clerk ID (alphabetically first)
    participant2Id: v.string(), // Clerk ID (alphabetically second)

    // Conversation state
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()), // First 100 chars of last message

    // Unread tracking (per participant)
    unreadByParticipant1: v.optional(v.number()), // Count for participant1
    unreadByParticipant2: v.optional(v.number()), // Count for participant2

    // Metadata
    createdAt: v.number(),
  })
    .index("by_participant1", ["participant1Id"])
    .index("by_participant2", ["participant2Id"])
    .index("by_participants", ["participant1Id", "participant2Id"]) // Unique lookup
    .index("by_lastMessage", ["lastMessageAt"]),

  // DM Messages - Individual messages within conversations
  dmMessages: defineTable({
    conversationId: v.id("dmConversations"),
    senderId: v.string(), // Clerk ID
    content: v.string(),

    // Attachments (following serviceOrderMessages pattern)
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          storageId: v.string(),
          url: v.optional(v.string()),
          size: v.number(),
          type: v.string(), // MIME type
        })
      )
    ),

    // Read tracking
    readAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_senderId", ["senderId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_conversation_created", ["conversationId", "createdAt"]),

  // ============================================================================
  // CHANGELOG SYSTEM - GitHub Integration for Release Notes
  // ============================================================================

  // GitHub Repository Configuration
  githubConfig: defineTable({
    repository: v.string(), // "owner/repo" format
    branch: v.string(), // Default branch to track
    // Token is stored in env vars, not in DB for security
    isConnected: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    lastSyncCommitSha: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_repository", ["repository"]),

  // Changelog Entries - Generated from commits
  changelogEntries: defineTable({
    // Git info
    commitSha: v.string(),
    commitMessage: v.string(),
    commitUrl: v.string(),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    committedAt: v.number(), // Git commit timestamp

    // Categorization
    category: v.union(
      v.literal("feature"), // New features
      v.literal("improvement"), // Enhancements
      v.literal("fix"), // Bug fixes
      v.literal("breaking"), // Breaking changes
      v.literal("internal") // Internal changes (not shown to users)
    ),

    // User-facing content (editable)
    title: v.string(), // Short title for the change
    description: v.optional(v.string()), // Longer description
    isPublished: v.boolean(), // Whether to include in public changelog

    // Notification tracking
    notificationSent: v.optional(v.boolean()),
    notificationSentAt: v.optional(v.number()),
    notificationId: v.optional(v.id("notifications")),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_commitSha", ["commitSha"])
    .index("by_committedAt", ["committedAt"])
    .index("by_category", ["category"])
    .index("by_isPublished", ["isPublished"])
    .index("by_published_date", ["isPublished", "committedAt"]),

  // Changelog Releases - Group entries into releases
  changelogReleases: defineTable({
    version: v.string(), // Semantic version or date-based
    title: v.string(),
    description: v.optional(v.string()),
    entryIds: v.array(v.id("changelogEntries")),
    publishedAt: v.optional(v.number()),
    isPublished: v.boolean(),

    // Notification
    notificationSent: v.optional(v.boolean()),
    notificationSentAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_version", ["version"])
    .index("by_publishedAt", ["publishedAt"])
    .index("by_isPublished", ["isPublished"]),

  // Admin Activity Logs (for audit trail)
  adminActivityLogs: defineTable({
    adminId: v.string(), // Clerk ID of the admin
    adminEmail: v.optional(v.string()),
    adminName: v.optional(v.string()),
    action: v.string(), // e.g., "user_role_change", "coach_approval", "content_moderation"
    actionType: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("approve"),
      v.literal("reject"),
      v.literal("export"),
      v.literal("view")
    ),
    resourceType: v.string(), // e.g., "user", "course", "product", "coach"
    resourceId: v.optional(v.string()), // ID of the affected resource
    resourceName: v.optional(v.string()), // Name/title of the affected resource
    details: v.optional(v.string()), // JSON string with additional details
    previousValue: v.optional(v.string()), // JSON string of previous state
    newValue: v.optional(v.string()), // JSON string of new state
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_adminId", ["adminId"])
    .index("by_action", ["action"])
    .index("by_actionType", ["actionType"])
    .index("by_resourceType", ["resourceType"])
    .index("by_timestamp", ["timestamp"]),

  // Platform Settings (admin configurable)
  platformSettings: defineTable({
    key: v.string(), // Unique key like "general", "branding", "email", etc.
    // Platform Identity
    platformName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    // Branding
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    // Platform Settings
    maintenanceMode: v.optional(v.boolean()),
    allowRegistration: v.optional(v.boolean()),
    requireEmailVerification: v.optional(v.boolean()),
    defaultUserRole: v.optional(v.string()),
    // Localization
    timezone: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
    currency: v.optional(v.string()),
    // Metadata
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()), // Clerk ID of admin who made the change
  }).index("by_key", ["key"]),

  // ============================================================================
  // EMAIL SEND QUEUE (Fair multi-tenant email sending with Resend batch API)
  // ============================================================================
  emailSendQueue: defineTable({
    storeId: v.string(),
    // Source tracking - which system enqueued this email
    source: v.union(
      v.literal("workflow"),
      v.literal("drip"),
      v.literal("broadcast"),
      v.literal("transactional")
    ),
    workflowExecutionId: v.optional(v.id("workflowExecutions")),
    dripEnrollmentId: v.optional(v.id("dripCampaignEnrollments")),
    // Fully resolved email content (ready to send via Resend)
    toEmail: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    headers: v.optional(v.any()),
    // Queue management
    status: v.union(
      v.literal("queued"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    priority: v.number(), // 1=transactional, 5=workflow/drip, 10=bulk broadcast
    attempts: v.number(),
    maxAttempts: v.number(),
    lastError: v.optional(v.string()),
    // Timestamps
    queuedAt: v.number(),
    sentAt: v.optional(v.number()),
    nextRetryAt: v.optional(v.number()),
  })
    .index("by_status_priority_queuedAt", ["status", "priority", "queuedAt"])
    .index("by_storeId_status", ["storeId", "status"])
    .index("by_workflowExecutionId", ["workflowExecutionId"])
    .index("by_dripEnrollmentId", ["dripEnrollmentId"])
    .index("by_status_nextRetryAt", ["status", "nextRetryAt"]),

  // ===== PPR PRO CONSUMER MEMBERSHIP =====
  // Platform-level plan configuration (prices, Stripe IDs created on-the-fly)
  pprProPlans: defineTable({
    name: v.string(), // "PPR Pro Monthly", "PPR Pro Yearly"
    interval: v.union(v.literal("month"), v.literal("year")),
    price: v.number(), // in cents (1200 = $12, 10800 = $108)
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_interval", ["interval"])
    .index("by_isActive", ["isActive"]),

  // Platform-level "PPR Pro" subscriptions for learners (separate from creator plans)
  pprProSubscriptions: defineTable({
    userId: v.string(), // Clerk ID
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("expired"),
      v.literal("trialing")
    ),
    plan: v.union(v.literal("monthly"), v.literal("yearly")),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_status", ["status"]),

  // ===== VIDEO GENERATION PIPELINE =====
  // Video generation jobs (queue + status tracking)
  videoJobs: defineTable({
    creatorId: v.id("users"),
    storeId: v.optional(v.id("stores")),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),

    // Input
    prompt: v.string(),
    style: v.optional(v.string()),
    targetDuration: v.number(), // seconds
    aspectRatio: v.string(), // "9:16", "16:9", "1:1"
    voiceId: v.optional(v.string()),

    // Pipeline status
    status: v.union(
      v.literal("queued"),
      v.literal("gathering_context"),
      v.literal("generating_script"),
      v.literal("generating_assets"),
      v.literal("generating_voice"),
      v.literal("generating_code"),
      v.literal("rendering"),
      v.literal("post_processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.number(), // 0-100

    // Generated artifacts
    scriptId: v.optional(v.id("videoScripts")),
    generatedCode: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id("_storage"))),
    audioId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    thumbnailId: v.optional(v.id("_storage")),
    srtContent: v.optional(v.string()),
    caption: v.optional(v.string()),

    // Metadata
    renderDuration: v.optional(v.number()), // seconds to render
    videoDuration: v.optional(v.number()), // duration of output video
    fileSize: v.optional(v.number()), // bytes

    // Iteration
    parentJobId: v.optional(v.id("videoJobs")), // previous version
    iterationPrompt: v.optional(v.string()),
    version: v.number(),

    // Error handling
    error: v.optional(v.string()),
    retryCount: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_store", ["storeId"])
    .index("by_status", ["status"])
    .index("by_course", ["courseId"]),

  // Structured video scripts (scene-by-scene)
  videoScripts: defineTable({
    jobId: v.id("videoJobs"),
    totalDuration: v.number(),
    voiceoverScript: v.string(),
    scenes: v.array(
      v.object({
        id: v.string(),
        duration: v.number(),
        voiceover: v.optional(v.string()),
        onScreenText: v.object({
          headline: v.optional(v.string()),
          subhead: v.optional(v.string()),
          bulletPoints: v.optional(v.array(v.string())),
          emphasis: v.optional(v.array(v.string())),
        }),
        visualDirection: v.string(),
        mood: v.string(),
      })
    ),
    colorPalette: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      background: v.string(),
    }),
    imagePrompts: v.array(v.string()),
  }).index("by_job", ["jobId"]),

  // Creator video library (finished videos)
  videoLibrary: defineTable({
    creatorId: v.id("users"),
    storeId: v.optional(v.id("stores")),
    jobId: v.id("videoJobs"),

    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.string(),
    thumbnailUrl: v.string(),
    duration: v.number(),
    aspectRatio: v.string(),

    // Social media
    caption: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    srtUrl: v.optional(v.string()),

    // Publishing
    publishedTo: v.optional(v.array(v.string())),
    scheduledAt: v.optional(v.number()),

    // Analytics
    views: v.optional(v.number()),
    shares: v.optional(v.number()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_store", ["storeId"]),

  // Webhook Idempotency - tracks processed Stripe events to prevent duplicates
  webhookEvents: defineTable({
    stripeEventId: v.string(),
    eventType: v.string(),
    productType: v.optional(v.string()),
    status: v.union(v.literal("processed"), v.literal("failed")),
    processedAt: v.number(),
    error: v.optional(v.string()),
  }).index("by_stripeEventId", ["stripeEventId"]),

  // Admin Dashboard Metrics (pre-aggregated hourly)
  adminMetrics: defineTable({
    // Counts
    totalUsers: v.number(),
    totalCreators: v.number(),
    totalCourses: v.number(),
    totalPublishedCourses: v.number(),
    totalProducts: v.number(),
    totalStores: v.number(),
    totalEnrollments: v.number(),
    totalPurchases: v.number(),

    // Financial (in cents)
    totalRevenue: v.number(),
    monthlyRevenue: v.number(),
    platformFees: v.number(),

    // Active users (last 30 days)
    activeUsers: v.number(),
    newUsersThisMonth: v.number(),

    // Growth data (JSON objects: { "YYYY-MM-DD": number })
    dailySignups: v.optional(v.any()),
    dailyRevenue: v.optional(v.any()),
    dailyPurchaseCounts: v.optional(v.any()),
    dailyEnrollments: v.optional(v.any()),

    // Conversion metrics
    averageOrderValue: v.number(),
    repeatPurchaseRate: v.number(),
    cartAbandonmentRate: v.number(),

    // Metadata
    lastUpdated: v.number(),
  }),
});
