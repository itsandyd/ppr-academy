import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create or update a customer
export const upsertCustomer = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    storeId: v.string(),
    adminUserId: v.string(),
    type: v.union(v.literal("lead"), v.literal("paying"), v.literal("subscription")),
    source: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    // Check if customer already exists
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_email_and_store", (q) => 
        q.eq("email", args.email).eq("storeId", args.storeId)
      )
      .unique();

    if (existingCustomer) {
      // Update existing customer
      await ctx.db.patch(existingCustomer._id, {
        name: args.name,
        type: args.type,
        lastActivity: Date.now(),
        source: args.source || existingCustomer.source,
        status: "active",
      });
      return existingCustomer._id;
    } else {
      // Create new customer
      return await ctx.db.insert("customers", {
        name: args.name,
        email: args.email,
        storeId: args.storeId,
        adminUserId: args.adminUserId,
        type: args.type,
        status: "active",
        totalSpent: 0,
        lastActivity: Date.now(),
        source: args.source,
      });
    }
  },
});

// Get all customers for an admin
export const getCustomersForAdmin = query({
  args: { adminUserId: v.string() },
  returns: v.array(v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
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
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .order("desc")
      .collect();
  },
});

// Get customers by store with enrollment details
export const getCustomersForStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
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
    
    // ActiveCampaign / Fan fields
    phone: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    score: v.optional(v.number()),
    daw: v.optional(v.string()),
    typeOfMusic: v.optional(v.string()),
    goals: v.optional(v.string()),
    musicAlias: v.optional(v.string()),
    studentLevel: v.optional(v.string()),
    howLongProducing: v.optional(v.string()),
    whySignedUp: v.optional(v.string()),
    genreSpecialty: v.optional(v.string()),
    opensEmail: v.optional(v.boolean()),
    clicksLinks: v.optional(v.boolean()),
    lastOpenDate: v.optional(v.number()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    stateCode: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    activeCampaignId: v.optional(v.string()),
    
    enrolledCourses: v.optional(v.array(v.object({
      courseId: v.id("courses"),
      courseTitle: v.string(),
      enrolledAt: v.number(),
      progress: v.optional(v.number()),
    }))),
    purchasedProducts: v.optional(v.array(v.object({
      productId: v.id("digitalProducts"),
      productTitle: v.string(),
      purchasedAt: v.number(),
    }))),
  })),
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();

    // Enrich customers with enrollment and purchase details
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        // Get user by email to find their purchases
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", customer.email))
          .first();

        if (!user || !user.clerkId) {
          return { ...customer, enrolledCourses: [], purchasedProducts: [] };
        }

        // Get course enrollments
        const coursePurchases = await ctx.db
          .query("purchases")
          .withIndex("by_userId", (q) => q.eq("userId", user.clerkId!))
          .filter((q) => 
            q.and(
              q.eq(q.field("productType"), "course"),
              q.eq(q.field("status"), "completed")
            )
          )
          .collect();

        // Deduplicate courses (in case user has multiple purchases for same course)
        const uniqueCourseMap = new Map();
        for (const purchase of coursePurchases) {
          if (purchase.courseId && !uniqueCourseMap.has(purchase.courseId)) {
            uniqueCourseMap.set(purchase.courseId, purchase);
          }
        }
        
        const uniqueCoursePurchases = Array.from(uniqueCourseMap.values());

        const enrolledCourses = (await Promise.all(
          uniqueCoursePurchases
            .filter(p => p.courseId)
            .map(async (purchase) => {
              const course = await ctx.db.get(purchase.courseId!);
              if (!course || !('title' in course)) return null;

              // Get progress
              const enrollment = await ctx.db
                .query("enrollments")
                .withIndex("by_user_course", (q) => 
                  q.eq("userId", user.clerkId!).eq("courseId", purchase.courseId!)
                )
                .unique();

              return {
                courseId: purchase.courseId!,
                courseTitle: course.title,
                enrolledAt: purchase._creationTime,
                progress: enrollment?.progress || 0,
              };
            })
        )).filter(Boolean);

        // Get digital product purchases
        const productPurchases = await ctx.db
          .query("purchases")
          .withIndex("by_userId", (q) => q.eq("userId", user.clerkId!))
          .filter((q) => 
            q.and(
              q.eq(q.field("productType"), "digitalProduct"),
              q.eq(q.field("status"), "completed")
            )
          )
          .collect();

        // Deduplicate products
        const uniqueProductMap = new Map();
        for (const purchase of productPurchases) {
          if (purchase.productId && !uniqueProductMap.has(purchase.productId)) {
            uniqueProductMap.set(purchase.productId, purchase);
          }
        }
        
        const uniqueProductPurchases = Array.from(uniqueProductMap.values());

        const purchasedProducts = (await Promise.all(
          uniqueProductPurchases
            .filter(p => p.productId)
            .map(async (purchase) => {
              const product = await ctx.db.get(purchase.productId!);
              if (!product || !('title' in product)) return null;

              return {
                productId: purchase.productId!,
                productTitle: product.title,
                purchasedAt: purchase._creationTime,
              };
            })
        )).filter(Boolean);

        return {
          ...customer,
          enrolledCourses: enrolledCourses as any[],
          purchasedProducts: purchasedProducts as any[],
        };
      })
    );

    return enrichedCustomers;
  },
});

// Get customers by type
export const getCustomersByType = query({
  args: { 
    adminUserId: v.string(),
    type: v.union(v.literal("lead"), v.literal("paying"), v.literal("subscription"))
  },
  returns: v.array(v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
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
  })),
  handler: async (ctx, args) => {
    const allCustomers = await ctx.db
      .query("customers")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .collect();
    
    return allCustomers.filter(customer => customer.type === args.type);
  },
});

// Create a purchase record
export const createPurchase = mutation({
  args: {
    userId: v.string(), // Required for library access
    customerId: v.id("customers"),
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  returns: v.id("purchases"),
  handler: async (ctx, args) => {
    const purchaseId = await ctx.db.insert("purchases", {
      userId: args.userId,
      customerId: args.customerId,
      productId: args.productId,
      storeId: args.storeId,
      adminUserId: args.adminUserId,
      amount: args.amount,
      currency: args.currency || "USD",
      status: "completed",
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
      productType: "digitalProduct", // Default to digital product
      accessGranted: true,
    });

    // Update customer's total spent and type
    const customer = await ctx.db.get(args.customerId);
    if (customer) {
      await ctx.db.patch(args.customerId, {
        type: "paying",
        totalSpent: (customer.totalSpent || 0) + args.amount,
        lastActivity: Date.now(),
        status: "active",
      });
    }

    return purchaseId;
  },
});

// Create a subscription
export const createSubscription = mutation({
  args: {
    customerId: v.id("customers"),
    planName: v.string(),
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    billingInterval: v.union(v.literal("monthly"), v.literal("yearly")),
    subscriptionId: v.optional(v.string()),
  },
  returns: v.id("subscriptions"),
  handler: async (ctx, args) => {
    const nextBillingDate = Date.now() + (
      args.billingInterval === "monthly" ? 30 * 24 * 60 * 60 * 1000 :
      args.billingInterval === "yearly" ? 365 * 24 * 60 * 60 * 1000 :
      7 * 24 * 60 * 60 * 1000 // weekly
    );

    const subscriptionDbId = await ctx.db.insert("subscriptions", {
      customerId: args.customerId,
      planName: args.planName,
      storeId: args.storeId,
      adminUserId: args.adminUserId,
      status: "active",
      amount: args.amount,
      currency: args.currency || "USD",
      billingInterval: args.billingInterval,
      nextBillingDate,
      subscriptionId: args.subscriptionId,
    });

    // Update customer type to subscription
    const customer = await ctx.db.get(args.customerId);
    if (customer) {
      await ctx.db.patch(args.customerId, {
        type: "subscription",
        lastActivity: Date.now(),
        status: "active",
      });
    }

    return subscriptionDbId;
  },
});

// Get customer statistics
export const getCustomerStats = query({
  args: { adminUserId: v.string() },
  returns: v.object({
    totalCustomers: v.number(),
    leads: v.number(),
    payingCustomers: v.number(),
    subscriptionCustomers: v.number(),
    totalRevenue: v.number(),
    averageOrderValue: v.number(),
  }),
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .collect();

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .filter(q => q.eq(q.field("status"), "completed"))
      .collect();

    // Use the newer membershipSubscriptions table instead of legacy subscriptions
    const membershipSubscriptions = await ctx.db
      .query("membershipSubscriptions")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    // Filter membership subscriptions by matching storeId to adminUserId
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .collect();
    
    const storeIds = stores.map(s => s._id);
    const relevantSubscriptions = membershipSubscriptions.filter(sub => 
      storeIds.includes(sub.storeId)
    );

    const totalCustomers = customers.length;
    const leads = customers.filter(c => c.type === "lead").length;
    const payingCustomers = customers.filter(c => c.type === "paying").length;
    const subscriptionCustomers = customers.filter(c => c.type === "subscription").length;
    
    // Calculate total revenue from purchases
    const purchaseRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate subscription revenue from membership subscriptions
    const subscriptionRevenue = relevantSubscriptions.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    
    // Alternative: Sum up totalSpent from all customers (more accurate)
    const totalRevenueFromCustomers = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    
    // Use the customer-based revenue as it's more accurate and comprehensive
    const totalRevenue = totalRevenueFromCustomers;
    
    const averageOrderValue = purchases.length > 0 ? 
      purchaseRevenue / purchases.length : 0;

    return {
      totalCustomers,
      leads,
      payingCustomers,
      subscriptionCustomers,
      totalRevenue,
      averageOrderValue,
    };
  },
});

// Get purchases for a customer
export const getPurchasesForCustomer = query({
  args: { customerId: v.id("customers") },
  returns: v.array(v.object({
    _id: v.id("purchases"),
    _creationTime: v.number(),
    userId: v.string(),
    customerId: v.optional(v.id("customers")),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    productType: v.union(v.literal("digitalProduct"), v.literal("course"), v.literal("coaching"), v.literal("bundle")),
    accessGranted: v.optional(v.boolean()),
    accessExpiresAt: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchases")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

// Update customer notes
export const updateCustomerNotes = mutation({
  args: {
    customerId: v.id("customers"),
    notes: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.customerId, {
      notes: args.notes,
    });
    return null;
  },
}); 