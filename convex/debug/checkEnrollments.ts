import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Debug utility to check enrollments and customer records
 * Use this to diagnose why students aren't showing up in the customers page
 */

// Check all course enrollments for a specific store
export const checkCourseEnrollments = internalQuery({
  args: { storeId: v.string() },
  returns: v.object({
    totalEnrollments: v.number(),
    totalCustomers: v.number(),
    enrollmentsWithoutCustomers: v.number(),
    sampleEnrollments: v.array(v.object({
      userId: v.string(),
      courseId: v.id("courses"),
      courseTitle: v.string(),
      hasCustomerRecord: v.boolean(),
      userEmail: v.optional(v.string()),
      purchaseAmount: v.optional(v.number()),
    })),
  }),
  handler: async (ctx, args) => {
    // Get all purchases for courses in this store
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => 
        q.and(
          q.eq(q.field("productType"), "course"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    console.log(`Found ${purchases.length} course purchases for store ${args.storeId}`);

    // Get all customers for this store
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    console.log(`Found ${customers.length} customer records for store ${args.storeId}`);

    // Check which enrollments don't have customer records
    let enrollmentsWithoutCustomers = 0;
    const sampleEnrollments = [];

    for (const purchase of purchases.slice(0, 10)) { // Sample first 10
      // Get user info
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
        .unique();

      const userEmail = user?.email || purchase.userId;

      // Check if customer record exists
      const customerRecord = await ctx.db
        .query("customers")
        .withIndex("by_email_and_store", (q) => 
          q.eq("email", userEmail).eq("storeId", args.storeId)
        )
        .unique();

      if (!customerRecord) {
        enrollmentsWithoutCustomers++;
      }

      // Get course info
      const course = purchase.courseId ? await ctx.db.get(purchase.courseId) : null;

      sampleEnrollments.push({
        userId: purchase.userId,
        courseId: purchase.courseId!,
        courseTitle: course?.title || "Unknown Course",
        hasCustomerRecord: !!customerRecord,
        userEmail: user?.email,
        purchaseAmount: purchase.amount,
      });
    }

    return {
      totalEnrollments: purchases.length,
      totalCustomers: customers.length,
      enrollmentsWithoutCustomers,
      sampleEnrollments,
    };
  },
});

// Check specific user's enrollments
export const checkUserEnrollments = internalQuery({
  args: { userId: v.string() },
  returns: v.object({
    userExists: v.boolean(),
    userEmail: v.optional(v.string()),
    totalEnrollments: v.number(),
    customerRecords: v.array(v.object({
      _id: v.id("customers"),
      storeId: v.string(),
      type: v.union(v.literal("lead"), v.literal("paying"), v.literal("subscription")),
      totalSpent: v.optional(v.number()),
    })),
    enrollments: v.array(v.object({
      courseId: v.id("courses"),
      courseTitle: v.string(),
      storeId: v.string(),
      amount: v.number(),
      purchaseDate: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (!user) {
      return {
        userExists: false,
        totalEnrollments: 0,
        customerRecords: [],
        enrollments: [],
      };
    }

    // Get all purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("productType"), "course"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    // Get customer records
    const customerRecords = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", user.email || ""))
      .collect();

    // Build enrollment details
    const enrollments = await Promise.all(
      purchases.map(async (purchase) => {
        const course = purchase.courseId ? await ctx.db.get(purchase.courseId) : null;
        return {
          courseId: purchase.courseId!,
          courseTitle: course?.title || "Unknown",
          storeId: purchase.storeId,
          amount: purchase.amount,
          purchaseDate: purchase._creationTime,
        };
      })
    );

    return {
      userExists: true,
      userEmail: user.email,
      totalEnrollments: purchases.length,
      customerRecords: customerRecords.map(c => ({
        _id: c._id,
        storeId: c.storeId,
        type: c.type,
        totalSpent: c.totalSpent,
      })),
      enrollments,
    };
  },
});

// Get summary of all stores and their customer counts
export const getStoreCustomerSummary = internalQuery({
  args: {},
  returns: v.array(v.object({
    storeId: v.string(),
    storeName: v.optional(v.string()),
    totalCustomers: v.number(),
    totalEnrollments: v.number(),
    leads: v.number(),
    paying: v.number(),
    subscriptions: v.number(),
  })),
  handler: async (ctx, args) => {
    // Get all stores
    const stores = await ctx.db.query("stores").collect();

    const summary = await Promise.all(
      stores.map(async (store) => {
        // Count customers
        const customers = await ctx.db
          .query("customers")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .collect();

        // Count enrollments
        const enrollments = await ctx.db
          .query("purchases")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("productType"), "course"),
              q.eq(q.field("status"), "completed")
            )
          )
          .collect();

        return {
          storeId: store._id,
          storeName: store.name,
          totalCustomers: customers.length,
          totalEnrollments: enrollments.length,
          leads: customers.filter(c => c.type === "lead").length,
          paying: customers.filter(c => c.type === "paying").length,
          subscriptions: customers.filter(c => c.type === "subscription").length,
        };
      })
    );

    return summary;
  },
});

