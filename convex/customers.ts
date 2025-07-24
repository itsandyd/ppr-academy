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

// Get customers by store
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
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();
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
      customerId: args.customerId,
      productId: args.productId,
      storeId: args.storeId,
      adminUserId: args.adminUserId,
      amount: args.amount,
      currency: args.currency || "USD",
      status: "completed",
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
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

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    const totalCustomers = customers.length;
    const leads = customers.filter(c => c.type === "lead").length;
    const payingCustomers = customers.filter(c => c.type === "paying").length;
    const subscriptionCustomers = customers.filter(c => c.type === "subscription").length;
    
    const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0) +
                        subscriptions.reduce((sum, s) => sum + s.amount, 0);
    
    const averageOrderValue = purchases.length > 0 ? 
      purchases.reduce((sum, p) => sum + p.amount, 0) / purchases.length : 0;

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
    customerId: v.id("customers"),
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    adminUserId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("refunded")),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
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