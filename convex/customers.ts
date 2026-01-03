import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

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
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_email_and_store", (q) => q.eq("email", args.email).eq("storeId", args.storeId))
      .unique();

    const nameParts = args.name?.split(" ") || [];
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.slice(1).join(" ") || undefined;

    let customerId: Id<"customers">;

    if (existingCustomer) {
      await ctx.db.patch(existingCustomer._id, {
        name: args.name,
        type: args.type,
        lastActivity: Date.now(),
        source: args.source || existingCustomer.source,
        status: "active",
      });
      customerId = existingCustomer._id;
    } else {
      customerId = await ctx.db.insert("customers", {
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

    await ctx.scheduler.runAfter(0, internal.emailContacts.upsertFromCustomer, {
      storeId: args.storeId,
      email: args.email,
      firstName,
      lastName,
      source: args.source,
      customerId,
    });

    return customerId;
  },
});

export const getCustomersForAdmin = query({
  args: { adminUserId: v.string() },
  returns: v.array(
    v.object({
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
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .order("desc")
      .collect();
  },
});

// Get customer count for a store (uses cached count only)
export const getCustomerCount = query({
  args: { storeId: v.string() },
  returns: v.object({
    total: v.number(),
    showing: v.number(),
    exact: v.boolean(), // Whether this is the exact count or estimate
    lastUpdated: v.optional(v.number()), // When the count was last updated
  }),
  handler: async (ctx, args) => {
    // ONLY use cached count - never count in real-time to avoid exceeding limits
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

    // If no cache exists yet, return a safe estimate
    // The background job will update this soon
    return {
      total: 0,
      showing: 5000,
      exact: false,
    };
  },
});

// Get all fans (customers + users) for a store
export const getFansForStore = query({
  args: { storeId: v.string() },
  returns: v.array(
    v.object({
      _id: v.union(v.id("customers"), v.id("users")),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      storeId: v.optional(v.string()),
      adminUserId: v.optional(v.string()),
      type: v.union(
        v.literal("lead"),
        v.literal("paying"),
        v.literal("subscription"),
        v.literal("user")
      ),
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

      enrolledCourses: v.optional(
        v.array(
          v.object({
            courseId: v.id("courses"),
            courseTitle: v.string(),
            enrolledAt: v.number(),
            progress: v.optional(v.number()),
          })
        )
      ),
      purchasedProducts: v.optional(
        v.array(
          v.object({
            productId: v.id("digitalProducts"),
            productTitle: v.string(),
            purchasedAt: v.number(),
          })
        )
      ),
    })
  ),
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
    const allUsers = await ctx.db.query("users").order("desc").take(5000);

    // 3. Deduplicate by email (customers take priority over users)
    const customerEmails = new Set(customers.map((c) => c.email.toLowerCase()));

    // 4. Convert users to fan format (only if not already a customer)
    const usersAsFans = allUsers
      .filter((user) => !customerEmails.has(user.email?.toLowerCase() || ""))
      .map((user) => ({
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
      ...customers.map((c) => ({ ...c, enrolledCourses: [], purchasedProducts: [] })),
      ...usersAsFans,
    ];

    // Sort by creation time (most recent first)
    return fans.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Get customers by store with enrollment details
export const getCustomersForStore = query({
  args: { storeId: v.string() },
  returns: v.array(
    v.object({
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

      enrolledCourses: v.optional(
        v.array(
          v.object({
            courseId: v.id("courses"),
            courseTitle: v.string(),
            enrolledAt: v.number(),
            progress: v.optional(v.number()),
          })
        )
      ),
      purchasedProducts: v.optional(
        v.array(
          v.object({
            productId: v.id("digitalProducts"),
            productTitle: v.string(),
            purchasedAt: v.number(),
          })
        )
      ),
    })
  ),
  handler: async (ctx, args) => {
    // Convex has a hard limit of 8,192 items in array returns
    // For large datasets, return up to 5,000 customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(5000); // Limited to 5000 to stay well under 8192 limit

    // Return basic customer data without enrichment for performance
    return customers.map((customer) => ({
      ...customer,
      enrolledCourses: [],
      purchasedProducts: [],
    }));
  },
});

// Paginated version for very large datasets (50k+)
export const getCustomersForStorePaginated = query({
  args: {
    storeId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Search customers by name or email
export const searchCustomersForStore = query({
  args: {
    storeId: v.string(),
    searchTerm: v.string(),
  },
  returns: v.array(
    v.object({
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

      enrolledCourses: v.optional(
        v.array(
          v.object({
            courseId: v.id("courses"),
            courseTitle: v.string(),
            enrolledAt: v.number(),
            progress: v.optional(v.number()),
          })
        )
      ),
      purchasedProducts: v.optional(
        v.array(
          v.object({
            productId: v.id("digitalProducts"),
            productTitle: v.string(),
            purchasedAt: v.number(),
          })
        )
      ),
    })
  ),
  handler: async (ctx, args) => {
    if (!args.searchTerm || args.searchTerm.length < 2) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase().trim();

    // Get a large sample of customers to search through
    // We'll search both recent AND older customers to maximize coverage
    const recentCustomers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(4000); // Recent 4000

    const olderCustomers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("asc")
      .take(4000); // Oldest 4000

    // Combine for 8000 total coverage (mix of old and new)
    const allCustomers = [...recentCustomers, ...olderCustomers];

    // Deduplicate
    const uniqueCustomers = Array.from(new Map(allCustomers.map((c) => [c._id, c])).values());

    // Filter by search term - be very aggressive with matching
    const matches = uniqueCustomers.filter((customer) => {
      const nameMatch = customer.name?.toLowerCase().includes(searchLower);
      const emailMatch = customer.email?.toLowerCase().includes(searchLower);
      const sourceMatch = customer.source?.toLowerCase().includes(searchLower);

      return nameMatch || emailMatch || sourceMatch;
    });

    // Return top 200 matches
    return matches.slice(0, 200).map((customer) => ({
      ...customer,
      enrolledCourses: [],
      purchasedProducts: [],
    }));
  },
});

// Debug query to check email domains in database
export const debugEmailDomains = query({
  args: { storeId: v.string() },
  returns: v.object({
    totalChecked: v.number(),
    gmailCount: v.number(),
    sampleEmails: v.array(v.string()),
    domains: v.array(
      v.object({
        domain: v.string(),
        count: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1000);

    const gmailCustomers = customers.filter((c) => c.email?.toLowerCase().includes("@gmail.com"));

    // Count domains
    const domainCounts = new Map<string, number>();
    customers.forEach((c) => {
      if (c.email) {
        const domain = c.email.split("@")[1]?.toLowerCase();
        if (domain) {
          domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
        }
      }
    });

    const domains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalChecked: customers.length,
      gmailCount: gmailCustomers.length,
      sampleEmails: customers.slice(0, 20).map((c) => c.email),
      domains,
    };
  },
});

// Get customers by type
export const getCustomersByType = query({
  args: {
    adminUserId: v.string(),
    type: v.union(v.literal("lead"), v.literal("paying"), v.literal("subscription")),
  },
  returns: v.array(
    v.object({
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
    })
  ),
  handler: async (ctx, args) => {
    // Use filter directly in the query to avoid collecting all customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .take(5000); // Limit to 5000 to stay under read limits

    return customers;
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
    const nextBillingDate =
      Date.now() +
      (args.billingInterval === "monthly"
        ? 30 * 24 * 60 * 60 * 1000
        : args.billingInterval === "yearly"
          ? 365 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000); // weekly

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

// Get customer statistics (uses cached counts from fanCounts table)
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
    // Get user's stores first
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .collect();

    if (stores.length === 0) {
      return {
        totalCustomers: 0,
        leads: 0,
        payingCustomers: 0,
        subscriptionCustomers: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
    }

    // Aggregate counts from cached fanCounts for all stores
    let totalCustomers = 0;
    let leads = 0;
    let paying = 0;
    let subscription = 0;

    for (const store of stores) {
      const cachedCount = await ctx.db
        .query("fanCounts")
        .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
        .first();

      if (cachedCount) {
        totalCustomers += cachedCount.totalCount;
        leads += cachedCount.leads;
        paying += cachedCount.paying;
        subscription += cachedCount.subscriptions;
      }
    }

    // For revenue, sample recent purchases (much smaller dataset)
    const recentPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(500); // Small sample of recent purchases

    const totalRevenue = recentPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgOrderValue = recentPurchases.length > 0 ? totalRevenue / recentPurchases.length : 0;

    return {
      totalCustomers,
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
  returns: v.array(
    v.object({
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
      productType: v.union(
        v.literal("digitalProduct"),
        v.literal("course"),
        v.literal("coaching"),
        v.literal("bundle")
      ),
      accessGranted: v.optional(v.boolean()),
      accessExpiresAt: v.optional(v.number()),
      downloadCount: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
    })
  ),
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
