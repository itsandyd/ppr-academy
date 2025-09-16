import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    // Additional fields for course creation form
    category: v.optional(v.string()),
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
  })
  .index("by_instructorId", ["instructorId"])
  .index("by_slug", ["slug"])
  .index("by_categoryId", ["courseCategoryId"])
  .index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"]), // Add index for storeId filtering

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
    buttonLabel: v.optional(v.string()),
    style: v.optional(v.union(v.literal("button"), v.literal("callout"), v.literal("preview"), v.literal("card"), v.literal("minimal"))),
    // URL/Media specific fields
    productType: v.optional(v.union(v.literal("digital"), v.literal("urlMedia"))),
    url: v.optional(v.string()),
    displayStyle: v.optional(v.union(v.literal("embed"), v.literal("card"), v.literal("button"))),
    mediaType: v.optional(v.union(v.literal("youtube"), v.literal("spotify"), v.literal("website"), v.literal("social"))),
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
    reminderSent: v.optional(v.boolean()),
  })
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
  .index("by_user_course", ["userId", "courseId"]),

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
  })
  .index("by_email", ["email"])
  .index("by_storeId", ["storeId"])
  .index("by_adminUserId", ["adminUserId"])
  .index("by_type", ["type"])
  .index("by_email_and_store", ["email", "storeId"]),

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
  .index("by_user_course", ["userId", "courseId"]),

  // Subscriptions
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

  // Email Campaign System
  emailCampaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    content: v.string(), // HTML content
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
    deliveredCount: v.optional(v.number()),
    openedCount: v.optional(v.number()),
    clickedCount: v.optional(v.number()),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
}); 