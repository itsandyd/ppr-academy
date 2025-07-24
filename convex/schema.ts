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
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    price: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    courseCategoryId: v.optional(v.string()),
    slug: v.optional(v.string()),
  })
  .index("by_instructorId", ["instructorId"])
  .index("by_slug", ["slug"])
  .index("by_categoryId", ["courseCategoryId"])
  .index("by_userId", ["userId"]),

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
    slug: v.optional(v.string()),
    userId: v.string(),
  })
  .index("by_userId", ["userId"])
  .index("by_slug", ["slug"]),

  // Digital Products
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
    style: v.optional(v.union(v.literal("button"), v.literal("card"), v.literal("minimal"))),
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

  // User Progress Tracking
  userProgress: defineTable({
    userId: v.string(),
    chapterId: v.string(),
    isCompleted: v.optional(v.boolean()),
  })
  .index("by_userId", ["userId"])
  .index("by_chapterId", ["chapterId"])
  .index("by_user_chapter", ["userId", "chapterId"]),

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

  // Purchase History
  purchases: defineTable({
    customerId: v.id("customers"),
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  })
  .index("by_customerId", ["customerId"])
  .index("by_productId", ["productId"])
  .index("by_storeId", ["storeId"])
  .index("by_adminUserId", ["adminUserId"])
  .index("by_status", ["status"]),

  // Subscriptions
  subscriptions: defineTable({
    customerId: v.id("customers"),
    planName: v.string(),
    storeId: v.string(),
    adminUserId: v.string(),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("paused"), v.literal("expired")),
    amount: v.number(),
    currency: v.optional(v.string()),
    billingInterval: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly")),
    nextBillingDate: v.optional(v.number()),
    subscriptionId: v.optional(v.string()), // Stripe subscription ID
    cancelledAt: v.optional(v.number()),
  })
  .index("by_customerId", ["customerId"])
  .index("by_storeId", ["storeId"])
  .index("by_adminUserId", ["adminUserId"])
  .index("by_status", ["status"]),
}); 