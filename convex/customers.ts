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

// Get customer count for a store (optimized for large datasets)
export const getCustomerCount = query({
  args: { storeId: v.string() },
  returns: v.object({
    total: v.number(),
    showing: v.number(),
    exact: v.boolean(), // Whether this is the exact count or estimate
    lastUpdated: v.optional(v.number()), // When the count was last updated
  }),
  handler: async (ctx, args) => {
    // First, check if we have a cached exact count
    const cachedCount = await ctx.db
      .query("fanCounts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .first();

    if (cachedCount) {
      // Return exact count from cache
      return {
        total: cachedCount.totalCount,
        showing: 5000, // Updated to match getFansForStore limit
        exact: true,
        lastUpdated: cachedCount.lastUpdated,
      };
    }

    // Fall back to sampling if no cached count yet
    const sample = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);
    
    // If we got 1000, there are likely more
    if (sample.length === 1000) {
      return {
        total: 1000, // We know there are at least 1000
        showing: 5000, // Updated to match getFansForStore limit
        exact: false,
      };
    }
    
    return {
      total: sample.length,
      showing: Math.min(5000, sample.length), // Updated to match getFansForStore limit
      exact: sample.length < 1000, // If < 1000, we got all of them
    };
  },
});

// Get all fans (customers + users) for a store
export const getFansForStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.object({
    _id: v.union(v.id("customers"), v.id("users")),
    _creationTime: v.number(),
    name: v.string(),
    email: v.string(),
    storeId: v.optional(v.string()),
    adminUserId: v.optional(v.string()),
    type: v.union(v.literal("lead"), v.literal("paying"), v.literal("subscription"), v.literal("user")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    totalSpent: v.optional(v.number()),
    lastActivity: v.optional(v.number()),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    
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
    // Get store to find the admin user
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("_id"), args.storeId))
      .first();
    
    if (!store) {
      return [];
    }

    // 1. Get customers for this store (up to 5000 to stay under 32k read limit)
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(5000);

    // 2. Get all users (registered accounts) - up to 5000
    const allUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(5000);

    // 3. Deduplicate by email (customers take priority over users)
    const customerEmails = new Set(customers.map(c => c.email.toLowerCase()));
    
    // 4. Convert users to fan format (only if not already a customer)
    const usersAsFans = allUsers
      .filter(user => !customerEmails.has(user.email?.toLowerCase() || ""))
      .map(user => ({
        _id: user._id as Id<"customers"> | Id<"users">,
        _creationTime: user._creationTime,
        name: user.name || "Unknown",
        email: user.email || "",
        storeId: args.storeId,
        adminUserId: store.userId,
        type: "user" as const,
        status: "active" as const,
        totalSpent: 0,
        lastActivity: user._creationTime,
        source: "registered_user",
        imageUrl: user.imageUrl,
        enrolledCourses: [],
        purchasedProducts: [],
      }));

    // 5. Combine and return (max ~10,000 total)
    const fans = [
      ...customers.map(c => ({ ...c, enrolledCourses: [], purchasedProducts: [] })),
      ...usersAsFans
    ];

    // Sort by creation time (most recent first)
    return fans.sort((a, b) => b._creationTime - a._creationTime);
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
    // For large datasets (>1000 customers), just return basic data without enrichment
    // Use getCustomerDetails for individual customer lookups
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(100); // Limit to 100 most recent customers

    // Return basic customer data without enrichment for performance
    return customers.map(customer => ({
      ...customer,
      enrolledCourses: [],
      purchasedProducts: [],
    }));
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
    // For large datasets, use sampling to avoid read limits
    const customersSample = await ctx.db
      .query("customers")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .take(1000); // Sample first 1000 customers

    const purchasesSample = await ctx.db
      .query("purchases")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .filter(q => q.eq(q.field("status"), "completed"))
      .take(1000); // Sample first 1000 purchases

    // Count customers by type from sample
    const leads = customersSample.filter(c => c.type === "lead").length;
    const paying = customersSample.filter(c => c.type === "paying").length;
    const subscription = customersSample.filter(c => c.type === "subscription").length;

    // Calculate revenue from sample
    const totalRevenue = purchasesSample.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgOrderValue = purchasesSample.length > 0 ? totalRevenue / purchasesSample.length : 0;

    return {
      totalCustomers: customersSample.length, // Will be 1000 if there are more
      leads,
      payingCustomers: paying,
      subscriptionCustomers: subscription,
      totalRevenue,
      averageOrderValue: avgOrderValue,
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