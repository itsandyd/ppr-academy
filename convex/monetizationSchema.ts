import { defineTable } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * SUBSCRIPTIONS & MEMBERSHIPS
 * Handles recurring payments and tiered access
 */
export const subscriptionsTable = defineTable({
  userId: v.string(), // Clerk user ID
  storeId: v.id("stores"), // Which creator's store
  planId: v.id("subscriptionPlans"),
  status: v.union(
    v.literal("active"),
    v.literal("canceled"),
    v.literal("past_due"),
    v.literal("expired"),
    v.literal("trialing"),
    v.literal("paused")
  ),
  stripeSubscriptionId: v.optional(v.string()),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  canceledAt: v.optional(v.number()),
  trialStart: v.optional(v.number()),
  trialEnd: v.optional(v.number()),
  billingCycle: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("lifetime")),
  amountPaid: v.number(), // In cents
  currency: v.string(), // USD, EUR, GBP, etc.
  nextBillingDate: v.optional(v.number()),
  failedPaymentAttempts: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId", "status"])
  .index("by_store", ["storeId", "status"])
  .index("by_plan", ["planId", "status"])
  .index("by_stripe_id", ["stripeSubscriptionId"])
  .index("by_next_billing", ["nextBillingDate", "status"]);

export const subscriptionPlansTable = defineTable({
  storeId: v.id("stores"),
  name: v.string(), // e.g., "Basic", "Pro", "VIP"
  description: v.string(),
  tier: v.number(), // 1 = Basic, 2 = Pro, 3 = VIP
  monthlyPrice: v.number(), // In cents
  yearlyPrice: v.number(), // In cents
  currency: v.string(),
  features: v.array(v.string()), // List of features
  courseAccess: v.array(v.id("courses")), // Specific courses included
  hasAllCourses: v.boolean(), // Access to all creator's courses
  digitalProductAccess: v.array(v.id("digitalProducts")),
  hasAllProducts: v.boolean(),
  discountPercentage: v.optional(v.number()), // Discount on additional purchases
  trialDays: v.optional(v.number()),
  isActive: v.boolean(),
  stripePriceIdMonthly: v.optional(v.string()),
  stripePriceIdYearly: v.optional(v.string()),
  maxStudents: v.optional(v.number()), // Limit for creator
  currentStudents: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_store", ["storeId", "isActive"])
  .index("by_tier", ["tier"]);

/**
 * COUPONS & DISCOUNTS
 */
export const couponsTable = defineTable({
  code: v.string(), // Unique code like "SAVE20"
  storeId: v.id("stores"),
  creatorId: v.string(),
  discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
  discountValue: v.number(), // 20 for 20%, or 1000 for $10.00 off
  currency: v.optional(v.string()), // For fixed amount discounts
  applicableTo: v.union(
    v.literal("all"),
    v.literal("courses"),
    v.literal("products"),
    v.literal("subscriptions"),
    v.literal("specific_items")
  ),
  specificCourseIds: v.optional(v.array(v.id("courses"))),
  specificProductIds: v.optional(v.array(v.id("digitalProducts"))),
  specificPlanIds: v.optional(v.array(v.id("subscriptionPlans"))),
  maxUses: v.optional(v.number()), // null = unlimited
  currentUses: v.number(),
  maxUsesPerUser: v.optional(v.number()),
  minPurchaseAmount: v.optional(v.number()), // In cents
  validFrom: v.number(),
  validUntil: v.optional(v.number()),
  isActive: v.boolean(),
  firstTimeOnly: v.boolean(), // Only for first-time customers
  stackable: v.boolean(), // Can be combined with other coupons
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_code", ["code"])
  .index("by_store", ["storeId", "isActive"])
  .index("by_creator", ["creatorId", "isActive"])
  .index("by_validity", ["validFrom", "validUntil"]);

export const couponUsagesTable = defineTable({
  couponId: v.id("coupons"),
  userId: v.string(),
  orderId: v.optional(v.string()), // Reference to purchase
  discountApplied: v.number(), // Actual discount in cents
  usedAt: v.number(),
})
  .index("by_coupon", ["couponId", "usedAt"])
  .index("by_user", ["userId", "couponId"]);

/**
 * AFFILIATE PROGRAM
 */
export const affiliatesTable = defineTable({
  affiliateUserId: v.string(), // Clerk user ID of affiliate
  storeId: v.id("stores"), // Which creator they're affiliated with
  creatorId: v.string(),
  affiliateCode: v.string(), // Unique code like "JOHN20"
  commissionRate: v.number(), // Percentage (e.g., 20 for 20%)
  commissionType: v.union(v.literal("percentage"), v.literal("fixed_per_sale")),
  fixedCommissionAmount: v.optional(v.number()), // In cents
  status: v.union(
    v.literal("active"),
    v.literal("pending"),
    v.literal("suspended"),
    v.literal("rejected")
  ),
  totalClicks: v.number(),
  totalSales: v.number(),
  totalRevenue: v.number(), // In cents
  totalCommissionEarned: v.number(), // In cents
  totalCommissionPaid: v.number(), // In cents
  payoutMethod: v.optional(v.union(v.literal("stripe"), v.literal("paypal"), v.literal("manual"))),
  payoutEmail: v.optional(v.string()),
  stripeConnectId: v.optional(v.string()),
  cookieDuration: v.number(), // Days (default 30)
  applicationNote: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),
  appliedAt: v.number(),
  approvedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_affiliate_user", ["affiliateUserId"])
  .index("by_store", ["storeId", "status"])
  .index("by_creator", ["creatorId", "status"])
  .index("by_code", ["affiliateCode"]);

export const affiliateClicksTable = defineTable({
  affiliateId: v.id("affiliates"),
  affiliateCode: v.string(),
  visitorId: v.optional(v.string()), // Anonymous tracking
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  referrerUrl: v.optional(v.string()),
  landingPage: v.string(),
  converted: v.boolean(), // Did they make a purchase?
  orderId: v.optional(v.string()),
  clickedAt: v.number(),
})
  .index("by_affiliate", ["affiliateId", "clickedAt"])
  .index("by_code", ["affiliateCode", "clickedAt"])
  .index("by_conversion", ["converted", "clickedAt"]);

export const affiliateSalesTable = defineTable({
  affiliateId: v.id("affiliates"),
  affiliateUserId: v.string(),
  customerId: v.string(), // Buyer's user ID
  storeId: v.id("stores"),
  orderId: v.string(), // Reference to purchase
  orderAmount: v.number(), // In cents
  commissionRate: v.number(),
  commissionAmount: v.number(), // In cents
  commissionStatus: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("paid"),
    v.literal("reversed")
  ),
  isPaid: v.boolean(),
  paidAt: v.optional(v.number()),
  payoutId: v.optional(v.id("affiliatePayouts")),
  itemType: v.union(v.literal("course"), v.literal("product"), v.literal("subscription")),
  itemId: v.string(),
  saleDate: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_affiliate", ["affiliateId", "saleDate"])
  .index("by_customer", ["customerId", "saleDate"])
  .index("by_store", ["storeId", "saleDate"])
  .index("by_status", ["commissionStatus", "saleDate"])
  .index("by_payout", ["payoutId"]);

export const affiliatePayoutsTable = defineTable({
  affiliateId: v.id("affiliates"),
  affiliateUserId: v.string(),
  storeId: v.id("stores"),
  creatorId: v.string(),
  amount: v.number(), // In cents
  currency: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  payoutMethod: v.string(), // stripe, paypal, manual
  transactionId: v.optional(v.string()),
  salesIncluded: v.array(v.id("affiliateSales")),
  totalSales: v.number(),
  payoutDate: v.optional(v.number()),
  failureReason: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_affiliate", ["affiliateId", "createdAt"])
  .index("by_store", ["storeId", "status"])
  .index("by_status", ["status", "createdAt"]);

/**
 * REFERRAL PROGRAM (User-to-User)
 */
export const referralsTable = defineTable({
  referrerUserId: v.string(), // Who referred
  referredUserId: v.string(), // Who was referred
  referralCode: v.string(), // Unique code
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("rewarded"),
    v.literal("expired")
  ),
  rewardType: v.union(v.literal("credits"), v.literal("discount"), v.literal("cash")),
  rewardAmount: v.number(), // In cents or credit points
  rewardReferrer: v.number(), // What referrer gets
  rewardReferred: v.number(), // What referred user gets
  hasReferredMadePurchase: v.boolean(),
  firstPurchaseAt: v.optional(v.number()),
  rewardedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_referrer", ["referrerUserId", "status"])
  .index("by_referred", ["referredUserId"])
  .index("by_code", ["referralCode"]);

/**
 * PAYMENT PLANS (Installments)
 */
export const paymentPlansTable = defineTable({
  userId: v.string(),
  courseId: v.optional(v.id("courses")),
  productId: v.optional(v.id("digitalProducts")),
  bundleId: v.optional(v.id("bundles")),
  totalAmount: v.number(), // In cents
  downPayment: v.number(), // Initial payment
  remainingAmount: v.number(),
  numberOfInstallments: v.number(),
  installmentAmount: v.number(),
  frequency: v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly")),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("defaulted"),
    v.literal("canceled")
  ),
  nextPaymentDate: v.number(),
  installmentsPaid: v.number(),
  installmentsMissed: v.number(),
  stripeSubscriptionId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId", "status"])
  .index("by_course", ["courseId", "status"])
  .index("by_next_payment", ["nextPaymentDate", "status"]);

export const installmentPaymentsTable = defineTable({
  paymentPlanId: v.id("paymentPlans"),
  userId: v.string(),
  installmentNumber: v.number(),
  amount: v.number(), // In cents
  status: v.union(
    v.literal("pending"),
    v.literal("paid"),
    v.literal("failed"),
    v.literal("refunded")
  ),
  dueDate: v.number(),
  paidAt: v.optional(v.number()),
  stripePaymentIntentId: v.optional(v.string()),
  failureReason: v.optional(v.string()),
  retryAttempts: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_plan", ["paymentPlanId", "installmentNumber"])
  .index("by_user", ["userId", "dueDate"])
  .index("by_status", ["status", "dueDate"]);

/**
 * BUNDLES
 */
export const bundlesTable = defineTable({
  storeId: v.id("stores"),
  creatorId: v.string(),
  name: v.string(),
  slug: v.optional(v.string()), // URL-friendly slug for marketplace
  description: v.string(),
  bundleType: v.union(v.literal("course_bundle"), v.literal("mixed"), v.literal("product_bundle")),
  courseIds: v.array(v.id("courses")),
  productIds: v.array(v.id("digitalProducts")),
  originalPrice: v.number(), // Sum of individual prices
  bundlePrice: v.number(), // Discounted price (can be 0 for free bundles)
  discountPercentage: v.number(),
  savings: v.number(),
  imageUrl: v.optional(v.string()),
  isActive: v.boolean(),
  isPublished: v.boolean(),
  totalPurchases: v.number(),
  totalRevenue: v.number(),
  stripePriceId: v.optional(v.string()),
  availableFrom: v.optional(v.number()),
  availableUntil: v.optional(v.number()),
  maxPurchases: v.optional(v.number()), // Limited quantity

  // Follow Gate Configuration (for free bundles with email capture)
  followGateEnabled: v.optional(v.boolean()),
  followGateRequirements: v.optional(
    v.object({
      requireEmail: v.optional(v.boolean()),
      requireInstagram: v.optional(v.boolean()),
      requireTiktok: v.optional(v.boolean()),
      requireYoutube: v.optional(v.boolean()),
      requireSpotify: v.optional(v.boolean()),
      minFollowsRequired: v.optional(v.number()), // 0 = all required
    })
  ),
  followGateSocialLinks: v.optional(
    v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
      spotify: v.optional(v.string()),
      twitter: v.optional(v.string()),
      soundcloud: v.optional(v.string()),
    })
  ),
  followGateMessage: v.optional(v.string()), // Custom message to show users

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_store", ["storeId", "isPublished"])
  .index("by_creator", ["creatorId", "isActive"])
  .index("by_slug", ["slug"]);

/**
 * TAX & MULTI-CURRENCY
 */
export const taxRatesTable = defineTable({
  country: v.string(), // ISO country code
  state: v.optional(v.string()), // For US/Canada
  taxName: v.string(), // VAT, GST, Sales Tax
  taxRate: v.number(), // Percentage (e.g., 20 for 20%)
  taxType: v.union(v.literal("vat"), v.literal("gst"), v.literal("sales_tax")),
  isActive: v.boolean(),
  effectiveFrom: v.number(),
  effectiveUntil: v.optional(v.number()),
  stripeTaxCodeId: v.optional(v.string()),
})
  .index("by_country", ["country", "isActive"])
  .index("by_country_state", ["country", "state", "isActive"]);

export const currencyRatesTable = defineTable({
  baseCurrency: v.string(), // USD
  targetCurrency: v.string(), // EUR, GBP, etc.
  rate: v.number(), // Exchange rate
  lastUpdated: v.number(),
  source: v.string(), // API source
})
  .index("by_pair", ["baseCurrency", "targetCurrency"])
  .index("by_updated", ["lastUpdated"]);

/**
 * REFUNDS
 */
export const refundsTable = defineTable({
  orderId: v.string(),
  userId: v.string(),
  storeId: v.id("stores"),
  creatorId: v.string(),
  itemType: v.union(
    v.literal("course"),
    v.literal("product"),
    v.literal("subscription"),
    v.literal("bundle")
  ),
  itemId: v.string(),
  originalAmount: v.number(), // In cents
  refundAmount: v.number(), // Can be partial
  refundType: v.union(v.literal("full"), v.literal("partial")),
  reason: v.string(),
  status: v.union(
    v.literal("requested"),
    v.literal("approved"),
    v.literal("processed"),
    v.literal("denied"),
    v.literal("canceled")
  ),
  requestedBy: v.string(), // User or creator
  approvedBy: v.optional(v.string()),
  denialReason: v.optional(v.string()),
  stripeRefundId: v.optional(v.string()),
  revokeAccess: v.boolean(),
  requestedAt: v.number(),
  processedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_order", ["orderId"])
  .index("by_user", ["userId", "status"])
  .index("by_store", ["storeId", "status"])
  .index("by_status", ["status", "requestedAt"]);

/**
 * CREATOR PAYOUTS
 */
export const creatorPayoutsTable = defineTable({
  creatorId: v.string(),
  storeId: v.id("stores"),
  amount: v.number(), // In cents
  currency: v.string(),
  periodStart: v.number(),
  periodEnd: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("on_hold")
  ),
  payoutMethod: v.string(), // stripe_connect, paypal, bank_transfer
  stripeTransferId: v.optional(v.string()),
  stripeConnectAccountId: v.optional(v.string()),
  totalSales: v.number(), // Number of transactions
  grossRevenue: v.number(),
  platformFee: v.number(), // Your cut
  paymentProcessingFee: v.number(),
  refunds: v.number(),
  netPayout: v.number(),
  taxWithheld: v.optional(v.number()),
  payoutDate: v.optional(v.number()),
  failureReason: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_creator", ["creatorId", "status"])
  .index("by_store", ["storeId", "status"])
  .index("by_period", ["periodStart", "periodEnd"])
  .index("by_status", ["status", "createdAt"]);

export const payoutSchedulesTable = defineTable({
  creatorId: v.string(),
  storeId: v.id("stores"),
  frequency: v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly")),
  dayOfWeek: v.optional(v.number()), // 0-6 for weekly
  dayOfMonth: v.optional(v.number()), // 1-31 for monthly
  minimumPayout: v.number(), // Don't pay out unless above this threshold
  isActive: v.boolean(),
  nextPayoutDate: v.number(),
  lastPayoutDate: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_creator", ["creatorId"])
  .index("by_next_payout", ["nextPayoutDate", "isActive"]);

/**
 * FREE TRIALS & UPSELLS
 */
export const freeTrialsTable = defineTable({
  userId: v.string(),
  planId: v.id("subscriptionPlans"),
  storeId: v.id("stores"),
  status: v.union(v.literal("active"), v.literal("converted"), v.literal("expired"), v.literal("canceled")),
  trialStart: v.number(),
  trialEnd: v.number(),
  convertedAt: v.optional(v.number()),
  subscriptionId: v.optional(v.id("subscriptions")),
  createdAt: v.number(),
})
  .index("by_user", ["userId", "status"])
  .index("by_plan", ["planId", "status"])
  .index("by_expiry", ["trialEnd", "status"]);

export const upsellsTable = defineTable({
  name: v.string(),
  description: v.string(),
  storeId: v.id("stores"),
  triggerType: v.union(
    v.literal("course_purchase"),
    v.literal("product_purchase"),
    v.literal("course_completion"),
    v.literal("cart_checkout")
  ),
  triggerItemId: v.optional(v.string()), // Specific course/product that triggers this
  offerType: v.union(v.literal("upgrade"), v.literal("related"), v.literal("bundle"), v.literal("subscription")),
  offeredItemType: v.union(v.literal("course"), v.literal("product"), v.literal("bundle"), v.literal("subscription")),
  offeredItemId: v.string(),
  discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed"))),
  discountValue: v.optional(v.number()),
  isActive: v.boolean(),
  timesShown: v.number(),
  timesAccepted: v.number(),
  conversionRate: v.number(),
  revenueGenerated: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_store", ["storeId", "isActive"])
  .index("by_trigger", ["triggerType", "triggerItemId"]);

export const upsellInteractionsTable = defineTable({
  upsellId: v.id("upsells"),
  userId: v.string(),
  action: v.union(v.literal("shown"), v.literal("accepted"), v.literal("declined")),
  orderId: v.optional(v.string()), // If they accepted and purchased
  timestamp: v.number(),
})
  .index("by_upsell", ["upsellId", "action"])
  .index("by_user", ["userId", "timestamp"]);





