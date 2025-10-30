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
    role: v.optional(v.union(
      v.literal("AGENCY_OWNER"),
      v.literal("AGENCY_ADMIN"), 
      v.literal("SUBACCOUNT_USER"),
      v.literal("SUBACCOUNT_GUEST")
    )),
    avatarUrl: v.optional(v.string()),
    userRoleId: v.optional(v.string()),
    userTypeId: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    discordId: v.optional(v.string()),
    discordVerified: v.optional(v.boolean()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("restricted"),
      v.literal("enabled")
    )),
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
  })
  .index("by_email", ["email"])
  .index("by_clerkId", ["clerkId"])
  .index("by_discordId", ["discordId"]),

  // Sync Metadata (for tracking sync operations)
  syncMetadata: defineTable({
    type: v.string(), // e.g., "clerk_sync"
    lastSyncTime: v.number(),
    totalClerkUsers: v.optional(v.number()),
    totalConvexUsers: v.optional(v.number()),
    usersAdded: v.optional(v.number()),
    usersUpdated: v.optional(v.number()),
    status: v.string(), // "completed", "failed", "in_progress"
  })
  .index("by_type", ["type"]),

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
    senderType: v.optional(v.union(
      v.literal("platform"), // From PPR Academy platform/admin
      v.literal("creator"),  // From a course creator
      v.literal("system")    // System-generated
    )),
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
  })
  .index("by_userId", ["userId"]),

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
  })
  .index("by_name", ["name"]),

  courseModules: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    position: v.number(),
    courseId: v.string(),
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
    // AI-generated content fields
    generatedAudioUrl: v.optional(v.string()),
    generatedVideoUrl: v.optional(v.string()),
    audioGenerationStatus: v.optional(v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed"))),
    videoGenerationStatus: v.optional(v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed"))),
    audioGeneratedAt: v.optional(v.number()),
    videoGeneratedAt: v.optional(v.number()),
    audioGenerationError: v.optional(v.string()),
    videoGenerationError: v.optional(v.string()),
  })
  .index("by_courseId", ["courseId"])
  .index("by_lessonId", ["lessonId"])
  .index("by_position", ["position"]),

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
    socialLinks: v.optional(v.object({
      website: v.optional(v.string()),
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      youtube: v.optional(v.string()),
    })),
    // Email Sender Configuration (API key handled centrally via environment variables)
    emailConfig: v.optional(v.object({
      fromEmail: v.string(),
      fromName: v.optional(v.string()),
      replyToEmail: v.optional(v.string()),
      isConfigured: v.optional(v.boolean()),
      lastTestedAt: v.optional(v.number()),
      emailsSentThisMonth: v.optional(v.number()),
      // Admin Notification Preferences
      adminNotifications: v.optional(v.object({
        enabled: v.optional(v.boolean()),
        emailOnNewLead: v.optional(v.boolean()),
        emailOnReturningUser: v.optional(v.boolean()),
        notificationEmail: v.optional(v.string()), // Override admin email
        customSubjectPrefix: v.optional(v.string()),
        includeLeadDetails: v.optional(v.boolean()),
        sendDigestInsteadOfInstant: v.optional(v.boolean()),
        digestFrequency: v.optional(v.union(
          v.literal("hourly"),
          v.literal("daily"),
          v.literal("weekly")
        )),
      })),
    })),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"]),

  // Digital Products
  // Email Automation Workflows
  emailWorkflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isActive: v.optional(v.boolean()),
    trigger: v.object({
      type: v.union(
        v.literal("lead_signup"),
        v.literal("product_purchase"),
        v.literal("time_delay"),
        v.literal("date_time"),
        v.literal("customer_action")
      ),
      config: v.any(), // Flexible config for different trigger types
    }),
    nodes: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("trigger"),
        v.literal("email"),
        v.literal("delay"),
        v.literal("condition"),
        v.literal("action")
      ),
      position: v.object({
        x: v.number(),
        y: v.number(),
      }),
      data: v.any(), // Node-specific data
    })),
    edges: v.array(v.object({
      id: v.string(),
      source: v.string(),
      target: v.string(),
      sourceHandle: v.optional(v.string()),
      targetHandle: v.optional(v.string()),
    })),
    // Execution tracking
    totalExecutions: v.optional(v.number()),
    lastExecuted: v.optional(v.number()),
    // Performance metrics
    avgOpenRate: v.optional(v.number()),
    avgClickRate: v.optional(v.number()),
  })
    .index("by_storeId", ["storeId"])
    .index("by_userId", ["userId"])
    .index("by_active", ["isActive"]),

  // Workflow Executions (tracking individual workflow runs)
  workflowExecutions: defineTable({
    workflowId: v.id("emailWorkflows"),
    storeId: v.string(),
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
    .index("by_status", ["status"])
    .index("by_scheduledFor", ["scheduledFor"]),

  digitalProducts: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storeId: v.string(),
    userId: v.string(),
    isPublished: v.optional(v.boolean()),
    category: v.optional(v.string()), // Product category for filtering
    buttonLabel: v.optional(v.string()),
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"), v.literal("coaching"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
    // Coaching specific fields
    duration: v.optional(v.number()), // Session duration in minutes
    sessionType: v.optional(v.string()), // "video", "audio", "phone"
    customFields: v.optional(v.any()), // Custom info fields to collect
    availability: v.optional(v.any()), // Availability configuration
    thumbnailStyle: v.optional(v.string()), // Thumbnail display style
    discordRoleId: v.optional(v.string()), // Discord role for coaching access
    // Order bump & affiliate fields
    orderBumpEnabled: v.optional(v.boolean()),
    orderBumpProductName: v.optional(v.string()),
    orderBumpDescription: v.optional(v.string()),
    orderBumpPrice: v.optional(v.number()),
    orderBumpImageUrl: v.optional(v.string()),
    affiliateEnabled: v.optional(v.boolean()),
    affiliateCommissionRate: v.optional(v.number()),
    affiliateMinPayout: v.optional(v.number()),
    affiliateCookieDuration: v.optional(v.number()),
    confirmationEmailSubject: v.optional(v.string()),
    confirmationEmailBody: v.optional(v.string()),
  })
  .index("by_storeId", ["storeId"])
  .index("by_userId", ["userId"]),

  // Reviews for products
  productReviews: defineTable({
    productId: v.string(),
    reviewText: v.string(),
    rating: v.optional(v.number()),
    customerName: v.optional(v.string()),
  })
  .index("by_productId", ["productId"]),

  // Email flows
  emailFlows: defineTable({
    productId: v.string(),
    flowName: v.string(),
    isActive: v.optional(v.boolean()),
  })
  .index("by_productId", ["productId"]),

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
  })
  .index("by_userId", ["userId"]),

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
    sessionType: v.union(v.literal("course"), v.literal("download"), v.literal("coaching"), v.literal("browse")),
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
  })
  .index("by_storeId", ["storeId"]),

  // Purchase History - Enhanced for library system
  purchases: defineTable({
    userId: v.string(), // Direct user ID from Clerk for library access
    customerId: v.optional(v.id("customers")), // Keep for backward compatibility
    productId: v.optional(v.id("digitalProducts")), // Optional for course purchases
    courseId: v.optional(v.id("courses")), // For course purchases
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    productType: v.union(v.literal("digitalProduct"), v.literal("course"), v.literal("coaching"), v.literal("bundle")),
    // Library access fields
    accessGranted: v.optional(v.boolean()),
    accessExpiresAt: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
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
    description: v.string(),
    priceMonthly: v.number(),
    priceYearly: v.optional(v.number()),
    stripePriceIdMonthly: v.string(),
    stripePriceIdYearly: v.optional(v.string()),
    benefits: v.array(v.string()),
    maxCourses: v.optional(v.number()), // null = unlimited
    isActive: v.boolean(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_storeId", ["storeId"])
    .index("by_active", ["isActive"])
    .index("by_creator_active", ["creatorId", "isActive"]),

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
    accessType: v.union(
      v.literal("free"), 
      v.literal("purchase"), 
      v.literal("subscription")
    ),
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
      v.literal("failed")
    ),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    recipientCount: v.optional(v.number()),
    sentCount: v.optional(v.number()), // Number of emails successfully sent
    deliveredCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    templateId: v.optional(v.string()), // Template used to create this campaign
    updatedAt: v.optional(v.number()), // Last update timestamp
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

  // RAG System - Vector Embeddings
  embeddings: defineTable({
    content: v.string(),
    embedding: v.array(v.number()), // OpenAI embeddings are 1536 dimensions
    userId: v.string(),
    metadata: v.optional(v.any()), // Store any additional metadata (courseId, type, etc.)
    title: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("chapter"), 
      v.literal("lesson"),
      v.literal("document"),
      v.literal("note"),
      v.literal("custom")
    )),
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
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"), 
      v.literal("high"),
      v.literal("urgent")
    )),
    
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
      filterFields: ["userId", "storeId", "status", "isArchived"]
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
      v.literal("login")
    ),
    resourceId: v.optional(v.string()), // courseId, productId, etc.
    resourceType: v.optional(v.union(
      v.literal("course"),
      v.literal("digitalProduct"),
      v.literal("lesson"),
      v.literal("chapter"),
      v.literal("page")
    )),
    metadata: v.optional(v.object({
      // Flexible metadata for different event types
      page: v.optional(v.string()),
      referrer: v.optional(v.string()),
      searchTerm: v.optional(v.string()),
      duration: v.optional(v.number()),
      progress: v.optional(v.number()),
      value: v.optional(v.number()), // for purchase events
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      device: v.optional(v.string()),
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
    })),
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
    resourceType: v.union(v.literal("course"), v.literal("digitalProduct"), v.literal("coaching"), v.literal("bundle")),
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
    socialLinks: v.optional(v.object({
      spotify: v.optional(v.string()),
      soundcloud: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      youtube: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      facebook: v.optional(v.string()),
      bandcamp: v.optional(v.string()),
      apple_music: v.optional(v.string()),
    })),
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
    source: v.optional(v.union(
      v.literal("profile"),
      v.literal("embed"),
      v.literal("direct_link"),
      v.literal("search"),
      v.literal("playlist")
    )),
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
  })
    .index("by_userId", ["userId"]),

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
    relatedResourceType: v.optional(v.union(
      v.literal("sample"),
      v.literal("pack"),
      v.literal("credit_package")
    )),
    metadata: v.optional(v.object({
      stripePaymentId: v.optional(v.string()),
      dollarAmount: v.optional(v.number()),
      packageName: v.optional(v.string()),
    })),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_user_type", ["userId", "type"]),

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
    bpmRange: v.optional(v.object({
      min: v.number(),
      max: v.number(),
    })),
    
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
    platformData: v.optional(v.object({
      // Instagram
      instagramBusinessAccountId: v.optional(v.string()),
      // Facebook
      facebookPageId: v.optional(v.string()),
      facebookPageAccessToken: v.optional(v.string()),
      // Platform-specific rate limits
      dailyPostLimit: v.optional(v.number()),
      postsToday: v.optional(v.number()),
    })),
    
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
    
    // Platform-specific options
    platformOptions: v.optional(v.object({
      // Instagram
      instagramLocation: v.optional(v.string()),
      instagramCaption: v.optional(v.string()),
      // Twitter
      twitterReplySettings: v.optional(v.string()),
      // Facebook
      facebookTargeting: v.optional(v.string()),
      // LinkedIn
      linkedinVisibility: v.optional(v.string()),
    })),
    
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
    initialMetrics: v.optional(v.object({
      likes: v.optional(v.number()),
      comments: v.optional(v.number()),
      shares: v.optional(v.number()),
      views: v.optional(v.number()),
      clicks: v.optional(v.number()),
    })),
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
    platforms: v.array(v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    )),
    
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
      v.literal("keyword"),          // Triggered by keyword in comments/messages
      v.literal("comment"),          // Triggered by any comment
      v.literal("dm"),              // Triggered by DM
      v.literal("mention"),         // Triggered by mention
      v.literal("hashtag"),         // Triggered by specific hashtag
      v.literal("manual"),          // Manually triggered
    ),
    
    // Trigger Conditions
    triggerConditions: v.object({
      keywords: v.optional(v.array(v.string())), // Keywords to match (case-insensitive)
      platforms: v.array(v.union(
        v.literal("instagram"),
        v.literal("twitter"),
        v.literal("facebook"),
        v.literal("tiktok"),
        v.literal("linkedin")
      )),
      matchType: v.union(
        v.literal("exact"),           // Exact match
        v.literal("contains"),        // Contains keyword
        v.literal("starts_with"),     // Starts with keyword
        v.literal("regex"),           // Regex match
      ),
      socialAccountIds: v.optional(v.array(v.id("socialAccounts"))), // Specific accounts
    }),
    
    // Flow Definition (nodes and connections)
    flowDefinition: v.object({
      nodes: v.array(v.object({
        id: v.string(),
        type: v.union(
          v.literal("trigger"),       // Starting point
          v.literal("message"),       // Send message
          v.literal("delay"),         // Wait/delay
          v.literal("condition"),     // Conditional branching  
          v.literal("resource"),      // Send resource/file
          v.literal("tag"),           // Add user tag
          v.literal("webhook"),       // Send webhook
        ),
        position: v.object({ x: v.number(), y: v.number() }),
        data: v.object({
          // Message node data
          content: v.optional(v.string()),
          mediaUrls: v.optional(v.array(v.string())),
          
          // Delay node data
          delayMinutes: v.optional(v.number()),
          
          // Condition node data
          conditionType: v.optional(v.union(
            v.literal("keyword"),
            v.literal("user_response"),
            v.literal("time_based"),
            v.literal("tag_based"),
          )),
          conditionValue: v.optional(v.string()),
          
          // Resource node data
          resourceType: v.optional(v.union(
            v.literal("link"),
            v.literal("file"),
            v.literal("course"),
            v.literal("product"),
          )),
          resourceUrl: v.optional(v.string()),
          resourceId: v.optional(v.string()),
          
          // Tag node data
          tagName: v.optional(v.string()),
          
          // Webhook node data
          webhookUrl: v.optional(v.string()),
          webhookData: v.optional(v.any()),
        }),
      })),
      connections: v.array(v.object({
        from: v.string(), // Node ID
        to: v.string(),   // Node ID
        label: v.optional(v.string()), // Connection label (for conditions)
      })),
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
      v.literal("active"),           // Currently in flow
      v.literal("completed"),        // Flow completed
      v.literal("paused"),           // Flow paused
      v.literal("error"),            // Flow errored
      v.literal("timeout"),          // Flow timed out
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
      v.literal("ignored"),
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
      v.literal("dm"),              // Direct message
      v.literal("comment_reply"),   // Reply to comment  
      v.literal("story_reply"),     // Story reply
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
      v.literal("rate_limited"),
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
    guildMemberStatus: v.optional(v.union(
      v.literal("invited"),
      v.literal("joined"),
      v.literal("left"),
      v.literal("kicked"),
      v.literal("banned")
    )),
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
    recommendations: v.array(v.object({
      courseId: v.id("courses"),
      score: v.number(),
      reason: v.string(),
    })),
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
  })
    .index("by_quiz", ["quizId", "order"]),

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
    answers: v.array(v.object({
      questionId: v.id("quizQuestions"),
      answer: v.any(),
      isCorrect: v.optional(v.boolean()),
      pointsEarned: v.optional(v.number()),
      gradedAt: v.optional(v.number()),
      feedback: v.optional(v.string()),
    })),
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
      v.literal("product")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    reportedBy: v.string(), // Clerk ID of reporter
    reportedAt: v.number(),
    reason: v.string(),
    contentId: v.string(), // ID of the reported content
    contentTitle: v.string(),
    contentPreview: v.optional(v.string()),
    reporterName: v.string(),
    reportedUserName: v.optional(v.string()),
    reviewedBy: v.optional(v.string()), // Admin who reviewed
    reviewedAt: v.optional(v.number()),
    resolution: v.optional(v.string()), // Notes about resolution
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_reported_by", ["reportedBy"])
    .index("by_content_id", ["contentId"]),

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
  
  resendAudienceLists: emailSchema.resendAudienceListsTable
    .index("by_connection", ["connectionId"]),
  
  resendPreferences: emailSchema.resendPreferencesTable
    .index("by_user", ["userId"]),
  
  resendImportedContacts: emailSchema.resendImportedContactsTable
    .index("by_connection", ["connectionId"])
    .index("by_status", ["status"]),

  // Advanced Email Features (ActiveCampaign-Level)
  // Note: emailWorkflows and workflowExecutions already exist above
  
  leadScores: emailSchema.leadScoresTable,
  
  emailSegments: emailSchema.emailSegmentsTable
    .index("by_connection", ["connectionId"]),
  
  emailABTests: emailSchema.emailABTestsTable,
  
  userEngagementPatterns: emailSchema.userEngagementPatternsTable,
  
  emailHealthMetrics: emailSchema.emailHealthMetricsTable,
  
  campaignGoals: emailSchema.campaignGoalsTable,
  
  spamScoreChecks: emailSchema.spamScoreChecksTable
    .index("by_template", ["templateId"]),
  
  listHygieneActions: emailSchema.listHygieneActionsTable,

  // Gamification - Achievements
  userAchievements: defineTable({
    userId: v.string(), // Clerk ID
    achievementId: v.string(), // Achievement identifier
    unlocked: v.boolean(),
    unlockedAt: v.optional(v.number()), // Timestamp when unlocked
    progress: v.optional(v.object({
      current: v.number(),
      target: v.number()
    })),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_achievementId", ["userId", "achievementId"]),

  // Gamification - User XP
  userXP: defineTable({
    userId: v.string(), // Clerk ID
    totalXP: v.number(),
    lastXPGain: v.optional(v.number()), // Timestamp of last XP gain
  })
    .index("by_userId", ["userId"]),

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
    submissionRules: v.optional(v.object({
      allowedGenres: v.optional(v.array(v.string())),
      maxLengthSeconds: v.optional(v.number()),
      requiresMessage: v.boolean(),
      guidelines: v.optional(v.string()),
    })),
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
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_isPublic", ["isPublic"])
    .index("by_acceptsSubmissions", ["acceptsSubmissions"]),

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
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded")
    )),
    
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
      v.literal("COMMENT"),  // Triggered by Instagram comment
      v.literal("DM")         // Triggered by Instagram DM
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
      v.literal("MESSAGE"),    // Send single message
      v.literal("SMART_AI")     // AI chatbot conversation
    ),
    
    // Message content
    prompt: v.string(), // For SMART_AI: OpenAI system prompt. For MESSAGE: the message to send
    commentReply: v.optional(v.string()), // Optional reply to comment
    
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
      v.literal("CAROUSEL_ALBUM")
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
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    )),
  })
    .index("by_userId", ["userId"])
    .index("by_plan", ["plan"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),
  
  // ============================================
  // EMAIL DOMAIN MONITORING TABLES
  // ============================================
  ...emailDomainTables,
  
  // ============================================
  // EMAIL REPLIES SYSTEM (INBOX)
  // ============================================
  ...emailRepliesTables,
}); 