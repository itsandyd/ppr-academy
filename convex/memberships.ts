import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getMembershipTiersByStore = query({
  args: {
    storeId: v.string(),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tiers = await ctx.db
      .query("creatorSubscriptionTiers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(100);

    if (!args.includeInactive) {
      tiers = tiers.filter((t) => t.isActive);
    }

    const enrichedTiers = await Promise.all(
      tiers.map(async (tier) => {
        const accessRules = await ctx.db
          .query("contentAccess")
          .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
          .filter((q) => q.eq(q.field("requiredTierId"), tier._id))
          .take(5000);

        const courseIds = accessRules
          .filter((r) => r.resourceType === "course")
          .map((r) => r.resourceId);
        const productIds = accessRules
          .filter((r) => r.resourceType === "product")
          .map((r) => r.resourceId);

        return {
          ...tier,
          includedCourseIds: courseIds,
          includedProductIds: productIds,
        };
      })
    );

    return enrichedTiers.sort((a, b) => a.priceMonthly - b.priceMonthly);
  },
});

export const getMembershipTierDetails = query({
  args: { tierId: v.id("creatorSubscriptionTiers") },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) return null;

    const accessRules = await ctx.db
      .query("contentAccess")
      .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
      .filter((q) => q.eq(q.field("requiredTierId"), tier._id))
      .take(5000);

    const courseIds = accessRules
      .filter((r) => r.resourceType === "course")
      .map((r) => r.resourceId as Id<"courses">);
    const productIds = accessRules
      .filter((r) => r.resourceType === "product")
      .map((r) => r.resourceId as Id<"digitalProducts">);

    const courses = await Promise.all(courseIds.map((id) => ctx.db.get(id)));
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));

    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("userId"), tier.creatorId))
      .first();

    return {
      ...tier,
      courses: courses.filter(Boolean),
      products: products.filter(Boolean),
      store,
    };
  },
});

export const getUserMembership = query({
  args: {
    userId: v.string(),
    storeId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(q.eq(q.field("storeId"), args.storeId), q.eq(q.field("status"), "active"))
      )
      .first();

    if (!subscription) return null;

    const tier = await ctx.db.get(subscription.tierId);

    return {
      subscription,
      tier,
    };
  },
});

export const checkMembershipAccess = query({
  args: {
    userId: v.string(),
    storeId: v.string(),
    courseId: v.optional(v.string()),
    productId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(q.eq(q.field("storeId"), args.storeId), q.eq(q.field("status"), "active"))
      )
      .first();

    if (!subscription) {
      return { hasAccess: false, reason: "no_subscription" };
    }

    const tier = await ctx.db.get(subscription.tierId);
    if (!tier) {
      return { hasAccess: false, reason: "tier_not_found" };
    }

    if (tier.maxCourses === null || tier.maxCourses === undefined) {
      return { hasAccess: true, subscription, tier };
    }

    if (args.courseId) {
      const courseId = args.courseId;
      const accessRule = await ctx.db
        .query("contentAccess")
        .withIndex("by_resourceId", (q) => q.eq("resourceId", courseId))
        .filter((q) =>
          q.and(
            q.eq(q.field("resourceType"), "course"),
            q.eq(q.field("requiredTierId"), subscription.tierId)
          )
        )
        .first();

      if (accessRule) {
        return { hasAccess: true, subscription, tier };
      }
      return { hasAccess: false, reason: "course_not_included" };
    }

    if (args.productId) {
      const productId = args.productId;
      const accessRule = await ctx.db
        .query("contentAccess")
        .withIndex("by_resourceId", (q) => q.eq("resourceId", productId))
        .filter((q) =>
          q.and(
            q.eq(q.field("resourceType"), "product"),
            q.eq(q.field("requiredTierId"), subscription.tierId)
          )
        )
        .first();

      if (accessRule) {
        return { hasAccess: true, subscription, tier };
      }
      return { hasAccess: false, reason: "product_not_included" };
    }

    return { hasAccess: true, subscription, tier };
  },
});

export const getStoreSubscribers = query({
  args: {
    storeId: v.string(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("past_due"),
        v.literal("paused")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Find store by direct ID or userId
    let store: any = null;
    try {
      store = await ctx.db.get(args.storeId as Id<"stores">);
    } catch {
      // Not a valid Convex ID
    }
    if (!store) {
      store = await ctx.db
        .query("stores")
        .filter((q) => q.eq(q.field("userId"), args.storeId))
        .first();
    }

    if (!store) return [];

    let subscriptions = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", store.userId))
      .take(5000);

    if (args.status) {
      subscriptions = subscriptions.filter((s) => s.status === args.status);
    }

    const enriched = await Promise.all(
      subscriptions.map(async (sub) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", sub.userId))
          .unique();
        const tier = await ctx.db.get(sub.tierId);
        return { ...sub, user, tier };
      })
    );

    return enriched;
  },
});

export const createMembershipTier = mutation({
  args: {
    creatorId: v.string(),
    storeId: v.string(),
    tierName: v.string(),
    description: v.string(),
    priceMonthly: v.number(),
    priceYearly: v.optional(v.number()),
    benefits: v.array(v.string()),
    maxCourses: v.optional(v.number()),
    trialDays: v.optional(v.number()),
    includedCourseIds: v.optional(v.array(v.string())),
    includedProductIds: v.optional(v.array(v.string())),
    includeAllContent: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate slug from tier name
    let baseSlug = args.tierName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await ctx.db
        .query("creatorSubscriptionTiers")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const tierId = await ctx.db.insert("creatorSubscriptionTiers", {
      creatorId: args.creatorId,
      storeId: args.storeId,
      tierName: args.tierName,
      slug,
      description: args.description,
      priceMonthly: args.priceMonthly,
      priceYearly: args.priceYearly,
      stripePriceIdMonthly: "",
      stripePriceIdYearly: args.priceYearly ? "" : undefined,
      benefits: args.benefits,
      maxCourses: args.includeAllContent ? undefined : args.maxCourses,
      trialDays: args.trialDays,
      imageUrl: args.imageUrl,
      subscriberCount: 0,
      isActive: false,
    });

    if (args.includedCourseIds && args.includedCourseIds.length > 0) {
      for (const courseId of args.includedCourseIds) {
        await ctx.db.insert("contentAccess", {
          resourceId: courseId,
          resourceType: "course",
          accessType: "subscription",
          requiredTierId: tierId,
          creatorId: args.creatorId,
          storeId: args.storeId,
        });
      }
    }

    if (args.includedProductIds && args.includedProductIds.length > 0) {
      for (const productId of args.includedProductIds) {
        await ctx.db.insert("contentAccess", {
          resourceId: productId,
          resourceType: "product",
          accessType: "subscription",
          requiredTierId: tierId,
          creatorId: args.creatorId,
          storeId: args.storeId,
        });
      }
    }

    return { success: true, tierId };
  },
});

export const updateMembershipTier = mutation({
  args: {
    tierId: v.id("creatorSubscriptionTiers"),
    tierName: v.optional(v.string()),
    description: v.optional(v.string()),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    benefits: v.optional(v.array(v.string())),
    maxCourses: v.optional(v.number()),
    trialDays: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    includedCourseIds: v.optional(v.array(v.string())),
    includedProductIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tierId, includedCourseIds, includedProductIds, ...updates } = args;

    const tier = await ctx.db.get(tierId);
    if (!tier) {
      throw new Error("Tier not found");
    }

    // Regenerate slug if tierName changes
    if (updates.tierName && updates.tierName !== tier.tierName) {
      let baseSlug = updates.tierName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await ctx.db
          .query("creatorSubscriptionTiers")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();
        if (!existing || existing._id === tierId) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      (updates as any).slug = slug;
    }

    await ctx.db.patch(tierId, updates);

    if (includedCourseIds !== undefined) {
      const existingCourseAccess = await ctx.db
        .query("contentAccess")
        .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
        .filter((q) =>
          q.and(q.eq(q.field("requiredTierId"), tierId), q.eq(q.field("resourceType"), "course"))
        )
        .take(5000);

      for (const access of existingCourseAccess) {
        await ctx.db.delete(access._id);
      }

      for (const courseId of includedCourseIds) {
        await ctx.db.insert("contentAccess", {
          resourceId: courseId,
          resourceType: "course",
          accessType: "subscription",
          requiredTierId: tierId,
          creatorId: tier.creatorId,
          storeId: tier.storeId,
        });
      }
    }

    if (includedProductIds !== undefined) {
      const existingProductAccess = await ctx.db
        .query("contentAccess")
        .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
        .filter((q) =>
          q.and(q.eq(q.field("requiredTierId"), tierId), q.eq(q.field("resourceType"), "product"))
        )
        .take(5000);

      for (const access of existingProductAccess) {
        await ctx.db.delete(access._id);
      }

      for (const productId of includedProductIds) {
        await ctx.db.insert("contentAccess", {
          resourceId: productId,
          resourceType: "product",
          accessType: "subscription",
          requiredTierId: tierId,
          creatorId: tier.creatorId,
          storeId: tier.storeId,
        });
      }
    }

    return { success: true };
  },
});

export const publishMembershipTier = mutation({
  args: { tierId: v.id("creatorSubscriptionTiers") },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) {
      throw new Error("Tier not found");
    }

    await ctx.db.patch(args.tierId, { isActive: true });
    return { success: true };
  },
});

export const unpublishMembershipTier = mutation({
  args: { tierId: v.id("creatorSubscriptionTiers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tierId, { isActive: false });
    return { success: true };
  },
});

export const deleteMembershipTier = mutation({
  args: { tierId: v.id("creatorSubscriptionTiers") },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) {
      throw new Error("Tier not found");
    }

    const activeSubscribers = await ctx.db
      .query("userCreatorSubscriptions")
      .filter((q) => q.and(q.eq(q.field("tierId"), args.tierId), q.eq(q.field("status"), "active")))
      .first();

    if (activeSubscribers) {
      await ctx.db.patch(args.tierId, { isActive: false });
      return { success: true, message: "Tier deactivated (has active subscribers)" };
    }

    const accessRules = await ctx.db
      .query("contentAccess")
      .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
      .filter((q) => q.eq(q.field("requiredTierId"), args.tierId))
      .take(5000);

    for (const rule of accessRules) {
      await ctx.db.delete(rule._id);
    }

    await ctx.db.delete(args.tierId);
    return { success: true, message: "Tier deleted" };
  },
});

export const createMembershipSubscription = mutation({
  args: {
    userId: v.string(),
    tierId: v.id("creatorSubscriptionTiers"),
    stripeSubscriptionId: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    trialEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) {
      throw new Error("Tier not found");
    }

    const existingSubscription = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_user_creator", (q) =>
        q.eq("userId", args.userId).eq("creatorId", tier.creatorId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingSubscription) {
      throw new Error("User already has an active subscription to this creator");
    }

    const now = Date.now();
    const periodEnd = args.trialEnd
      ? args.trialEnd
      : args.billingCycle === "monthly"
        ? now + 30 * 24 * 60 * 60 * 1000
        : now + 365 * 24 * 60 * 60 * 1000;

    const subscriptionId = await ctx.db.insert("userCreatorSubscriptions", {
      userId: args.userId,
      creatorId: tier.creatorId,
      tierId: args.tierId,
      storeId: tier.storeId,
      status: "active",
      stripeSubscriptionId: args.stripeSubscriptionId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    // Increment subscriber count on tier
    await ctx.db.patch(args.tierId, {
      subscriberCount: (tier.subscriberCount || 0) + 1,
    });

    return { success: true, subscriptionId };
  },
});

export const updateMembershipSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("paused")
    ),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_stripe_id", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .unique();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.cancelAtPeriodEnd !== undefined) {
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    }

    if (args.currentPeriodEnd !== undefined) {
      updates.currentPeriodEnd = args.currentPeriodEnd;
    }

    await ctx.db.patch(subscription._id, updates);

    return { success: true };
  },
});

export const cancelMembership = mutation({
  args: {
    subscriptionId: v.id("userCreatorSubscriptions"),
    cancelImmediately: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (args.cancelImmediately) {
      await ctx.db.patch(args.subscriptionId, {
        status: "canceled",
      });
    } else {
      await ctx.db.patch(args.subscriptionId, {
        cancelAtPeriodEnd: true,
      });
    }

    return { success: true, stripeSubscriptionId: subscription.stripeSubscriptionId };
  },
});

export const updateStripePriceIds = mutation({
  args: {
    tierId: v.id("creatorSubscriptionTiers"),
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tierId, ...updates } = args;

    await ctx.db.patch(tierId, updates);

    return { success: true };
  },
});

// ---- Marketplace & Store Queries ----

export const getAllPublishedMemberships = query({
  args: {
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tiers = await ctx.db
      .query("creatorSubscriptionTiers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(10000);

    if (args.searchQuery) {
      const search = args.searchQuery.toLowerCase();
      tiers = tiers.filter(
        (t) =>
          t.tierName.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      );
    }

    const enriched = await Promise.all(
      tiers.map(async (tier) => {
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), tier.creatorId))
          .first();

        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", tier.creatorId))
          .first();

        const accessRules = await ctx.db
          .query("contentAccess")
          .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
          .filter((q) => q.eq(q.field("requiredTierId"), tier._id))
          .take(5000);

        const courseCount = accessRules.filter((r) => r.resourceType === "course").length;
        const productCount = accessRules.filter((r) => r.resourceType === "product").length;

        return {
          ...tier,
          store: store ? { name: store.name, slug: store.slug, logoUrl: store.logoUrl } : null,
          creator: user ? { name: `${user.firstName || ""} ${user.lastName || ""}`.trim(), imageUrl: user.imageUrl } : null,
          courseCount,
          productCount,
          includesAllContent: tier.maxCourses === undefined || tier.maxCourses === null,
        };
      })
    );

    return enriched.sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0));
  },
});

export const getMembershipBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Try slug first, then fall back to _id lookup
    let tier = await ctx.db
      .query("creatorSubscriptionTiers")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!tier) {
      try {
        tier = await ctx.db.get(args.slug as Id<"creatorSubscriptionTiers">);
      } catch {
        // Not a valid ID
      }
    }

    if (!tier) return null;

    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("userId"), tier.creatorId))
      .first();

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", tier.creatorId))
      .first();

    const includesAllContent = tier.maxCourses === undefined || tier.maxCourses === null;

    let courses: any[] = [];
    let products: any[] = [];

    if (includesAllContent) {
      // Fetch ALL published courses and products from this store
      const allCourses = await ctx.db
        .query("courses")
        .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
        .take(5000);
      courses = allCourses.filter((c) => c.isPublished);

      const allProducts = await ctx.db
        .query("digitalProducts")
        .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
        .take(5000);
      products = allProducts.filter((p) => p.isPublished);
    } else {
      // Fetch only content linked via contentAccess rules
      const accessRules = await ctx.db
        .query("contentAccess")
        .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
        .filter((q) => q.eq(q.field("requiredTierId"), tier._id))
        .take(5000);

      const courseIds = accessRules
        .filter((r) => r.resourceType === "course")
        .map((r) => r.resourceId as Id<"courses">);
      const productIds = accessRules
        .filter((r) => r.resourceType === "product")
        .map((r) => r.resourceId as Id<"digitalProducts">);

      courses = (await Promise.all(courseIds.map((id) => ctx.db.get(id)))).filter(Boolean);
      products = (await Promise.all(productIds.map((id) => ctx.db.get(id)))).filter(Boolean);
    }

    // Get all tiers for this store (for tier comparison)
    const allStoreTiers = await ctx.db
      .query("creatorSubscriptionTiers")
      .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(100);

    return {
      ...tier,
      courses,
      products,
      store: store ? { _id: store._id, name: store.name, slug: store.slug, logoUrl: store.logoUrl, bio: store.bio } : null,
      creator: user ? { name: `${user.firstName || ""} ${user.lastName || ""}`.trim(), imageUrl: user.imageUrl, stripeConnectAccountId: user.stripeConnectAccountId } : null,
      allStoreTiers: allStoreTiers.sort((a, b) => a.priceMonthly - b.priceMonthly),
      includesAllContent,
    };
  },
});

export const getStoreMemberships = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    // Query tiers using the storeId index
    let tiers = await ctx.db
      .query("creatorSubscriptionTiers")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(100);

    // Filter to active only
    tiers = tiers.filter((t) => t.isActive);

    const enriched = await Promise.all(
      tiers.map(async (tier) => {
        const accessRules = await ctx.db
          .query("contentAccess")
          .withIndex("by_storeId", (q) => q.eq("storeId", tier.storeId))
          .filter((q) => q.eq(q.field("requiredTierId"), tier._id))
          .take(5000);

        return {
          ...tier,
          courseCount: accessRules.filter((r) => r.resourceType === "course").length,
          productCount: accessRules.filter((r) => r.resourceType === "product").length,
          includesAllContent: tier.maxCourses === undefined || tier.maxCourses === null,
        };
      })
    );

    return enriched.sort((a, b) => a.priceMonthly - b.priceMonthly);
  },
});

export const getUserMemberships = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("userCreatorSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      subscriptions.map(async (sub) => {
        const tier = await ctx.db.get(sub.tierId);
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), sub.creatorId))
          .first();
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", sub.creatorId))
          .first();

        return {
          ...sub,
          tier: tier ? { tierName: tier.tierName, slug: tier.slug, priceMonthly: tier.priceMonthly, priceYearly: tier.priceYearly, benefits: tier.benefits, imageUrl: tier.imageUrl } : null,
          store: store ? { name: store.name, slug: store.slug, logoUrl: store.logoUrl } : null,
          creator: creator ? { name: `${creator.firstName || ""} ${creator.lastName || ""}`.trim(), imageUrl: creator.imageUrl } : null,
        };
      })
    );

    return enriched;
  },
});

export const getCreatorCoursesAndProducts = query({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    let store: any = null;
    try {
      store = await ctx.db.get(args.storeId as Id<"stores">);
    } catch {
      // Not a valid Convex ID
    }
    if (!store) {
      store = await ctx.db
        .query("stores")
        .filter((q) => q.eq(q.field("userId"), args.storeId))
        .first();
    }

    if (!store) return { courses: [], products: [] };

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", store.userId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const products = await ctx.db
      .query("digitalProducts")
      .withIndex("by_userId", (q) => q.eq("userId", store.userId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    return { courses, products };
  },
});

export const updateMembershipTierPin = mutation({
  args: {
    tierId: v.id("creatorSubscriptionTiers"),
    isPinned: v.boolean(),
    pinnedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) {
      throw new Error("Tier not found");
    }
    await ctx.db.patch(args.tierId, {
      isPinned: args.isPinned,
      pinnedAt: args.pinnedAt,
    });
    return { success: true };
  },
});
