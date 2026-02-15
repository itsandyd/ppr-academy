/**
 * Creator Pipeline Queries - CRM-style tracking of creator journey
 * Used primarily in admin dashboard for managing creator relationships
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Get creators by pipeline stage
 * Derives stage from actual data: stores, courses, products, purchases
 */
export const getCreatorsByStage = query({
  args: {
    stage: v.optional(
      v.union(
        v.literal("prospect"),
        v.literal("invited"),
        v.literal("signed_up"),
        v.literal("drafting"),
        v.literal("published"),
        v.literal("first_sale"),
        v.literal("active"),
        v.literal("churn_risk")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.optional(v.id("creatorPipeline")),
      storeId: v.optional(v.id("stores")),
      userId: v.string(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
      stage: v.string(),
      daw: v.optional(v.string()),
      instagramHandle: v.optional(v.string()),
      tiktokHandle: v.optional(v.string()),
      audienceSize: v.optional(v.number()),
      niche: v.optional(v.string()),
      totalRevenue: v.optional(v.number()),
      productCount: v.optional(v.number()),
      lastTouchAt: v.optional(v.number()),
      lastTouchType: v.optional(v.string()),
      nextStepNote: v.optional(v.string()),
      assignedTo: v.optional(v.string()),
      daysSinceLastTouch: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { stage }) => {
    // For prospect/invited stages, use creatorPipeline table (manual entries)
    if (stage === "prospect" || stage === "invited") {
      const pipelineCreators = await ctx.db
        .query("creatorPipeline")
        .withIndex("by_stage_and_updatedAt", (q) => q.eq("stage", stage))
        .collect();

      return Promise.all(
        pipelineCreators.map(async (creator) => {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", creator.userId))
            .first();

          const daysSinceLastTouch = creator.lastTouchAt
            ? Math.floor((Date.now() - creator.lastTouchAt) / (24 * 60 * 60 * 1000))
            : undefined;

          return {
            _id: creator._id,
            storeId: creator.storeId,
            userId: creator.userId,
            userName: user?.name || user?.firstName || "Unknown",
            userEmail: user?.email,
            userAvatar: user?.imageUrl,
            stage: creator.stage,
            daw: creator.daw,
            instagramHandle: creator.instagramHandle,
            tiktokHandle: creator.tiktokHandle,
            audienceSize: creator.audienceSize,
            niche: creator.niche,
            totalRevenue: creator.totalRevenue,
            productCount: creator.productCount,
            lastTouchAt: creator.lastTouchAt,
            lastTouchType: creator.lastTouchType,
            nextStepNote: creator.nextStepNote,
            assignedTo: creator.assignedTo,
            daysSinceLastTouch,
          };
        })
      );
    }

    // For other stages, derive from actual data (bounded)
    const stores = await ctx.db.query("stores").take(500);
    const courses = await ctx.db.query("courses").take(1000);
    const products = await ctx.db.query("digitalProducts").take(1000);
    const purchases = await ctx.db.query("purchases").take(5000);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const results = [];

    for (const store of stores) {
      const creatorCourses = courses.filter((c) => c.userId === store.userId);
      const creatorProducts = products.filter((p) => p.storeId === store._id);
      const creatorPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );

      const hasPublished =
        creatorCourses.some((c) => c.isPublished) ||
        creatorProducts.some((p) => p.isPublished);
      const hasSales = creatorPurchases.length > 0;
      const hasRecentSales = creatorPurchases.some(
        (p) => p._creationTime > thirtyDaysAgo
      );
      const lastSale = creatorPurchases.sort(
        (a, b) => b._creationTime - a._creationTime
      )[0];
      const isChurnRisk =
        hasSales && lastSale && lastSale._creationTime < sixtyDaysAgo;

      // Determine stage
      let derivedStage: string;
      if (isChurnRisk) {
        derivedStage = "churn_risk";
      } else if (hasRecentSales) {
        derivedStage = "active";
      } else if (hasSales) {
        derivedStage = "first_sale";
      } else if (hasPublished) {
        derivedStage = "published";
      } else if (creatorCourses.length > 0 || creatorProducts.length > 0) {
        derivedStage = "drafting";
      } else {
        derivedStage = "signed_up";
      }

      // Skip if not matching requested stage
      if (stage && derivedStage !== stage) continue;

      // Get user and pipeline entry
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();

      const pipelineEntry = await ctx.db
        .query("creatorPipeline")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .first();

      const totalRevenue =
        creatorPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

      const daysSinceLastTouch = pipelineEntry?.lastTouchAt
        ? Math.floor((now - pipelineEntry.lastTouchAt) / (24 * 60 * 60 * 1000))
        : undefined;

      results.push({
        _id: pipelineEntry?._id,
        storeId: store._id,
        userId: store.userId,
        userName: user?.name || user?.firstName || "Unknown",
        userEmail: user?.email,
        userAvatar: user?.imageUrl,
        stage: derivedStage,
        daw: pipelineEntry?.daw,
        instagramHandle: pipelineEntry?.instagramHandle,
        tiktokHandle: pipelineEntry?.tiktokHandle,
        audienceSize: pipelineEntry?.audienceSize,
        niche: pipelineEntry?.niche,
        totalRevenue,
        productCount: creatorCourses.length + creatorProducts.length,
        lastTouchAt: pipelineEntry?.lastTouchAt,
        lastTouchType: pipelineEntry?.lastTouchType,
        nextStepNote: pipelineEntry?.nextStepNote,
        assignedTo: pipelineEntry?.assignedTo,
        daysSinceLastTouch,
      });
    }

    return results;
  },
});

/**
 * Get creators who are stuck (need outreach)
 */
export const getStuckCreators = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("creatorPipeline"),
      userId: v.string(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      stage: v.string(),
      daysSinceStep: v.number(),
      recommendedAction: v.string(),
    })
  ),
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    // Get creators in drafting stage for 3+ days
    const drafting = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_stage_and_updatedAt", (q) => q.eq("stage", "drafting"))
      .filter((q) => q.lt(q.field("draftingAt"), threeDaysAgo))
      .collect();
    
    // Get creators who haven't had first sale 14+ days after publishing
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const noSale = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_stage_and_updatedAt", (q) => q.eq("stage", "published"))
      .filter((q) => q.lt(q.field("publishedAt"), fourteenDaysAgo))
      .collect();
    
    const allStuck = [...drafting, ...noSale];
    
    // Enrich with user data
    const enriched = await Promise.all(
      allStuck.map(async (creator) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", creator.userId))
          .first();
        
        const daysSinceStep = creator.draftingAt
          ? Math.floor((Date.now() - creator.draftingAt) / (24 * 60 * 60 * 1000))
          : creator.publishedAt
          ? Math.floor((Date.now() - creator.publishedAt) / (24 * 60 * 60 * 1000))
          : 0;
        
        const recommendedAction =
          creator.stage === "drafting"
            ? "Send setup help email + scheduling link"
            : "Review marketing strategy + promotional tips";
        
        return {
          _id: creator._id,
          userId: creator.userId,
          userName: user?.name || user?.firstName || "Unknown",
          userEmail: user?.email,
          stage: creator.stage,
          daysSinceStep,
          recommendedAction,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Update creator pipeline stage
 */
export const updateCreatorStage = mutation({
  args: {
    creatorId: v.id("creatorPipeline"),
    newStage: v.union(
      v.literal("prospect"),
      v.literal("invited"),
      v.literal("signed_up"),
      v.literal("drafting"),
      v.literal("published"),
      v.literal("first_sale"),
      v.literal("active"),
      v.literal("churn_risk")
    ),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { creatorId, newStage, note }) => {
    const creator = await ctx.db.get(creatorId);
    
    if (!creator) {
      throw new Error("Creator not found");
    }
    
    // Update stage and timestamp
    const updates: Record<string, any> = {
      stage: newStage,
      updatedAt: Date.now(),
    };
    
    // Update stage-specific timestamp
    switch (newStage) {
      case "invited":
        updates.invitedAt = Date.now();
        break;
      case "signed_up":
        updates.signedUpAt = Date.now();
        break;
      case "drafting":
        updates.draftingAt = Date.now();
        break;
      case "published":
        updates.publishedAt = Date.now();
        break;
      case "first_sale":
        updates.firstSaleAt = Date.now();
        break;
    }
    
    if (note) {
      updates.nextStepNote = note;
    }
    
    await ctx.db.patch(creatorId, updates);
    
    return null;
  },
});

/**
 * Add touch point to creator record
 */
export const addCreatorTouch = mutation({
  args: {
    creatorId: v.id("creatorPipeline"),
    touchType: v.union(
      v.literal("dm"),
      v.literal("email"),
      v.literal("comment"),
      v.literal("call")
    ),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { creatorId, touchType, note }) => {
    await ctx.db.patch(creatorId, {
      lastTouchAt: Date.now(),
      lastTouchType: touchType,
      nextStepNote: note,
      updatedAt: Date.now(),
    });
    
    return null;
  },
});

/**
 * Create or update creator pipeline entry
 */
export const upsertCreatorPipeline = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.id("stores")),
    stage: v.union(
      v.literal("prospect"),
      v.literal("invited"),
      v.literal("signed_up"),
      v.literal("drafting"),
      v.literal("published"),
      v.literal("first_sale"),
      v.literal("active"),
      v.literal("churn_risk")
    ),
    metadata: v.optional(
      v.object({
        daw: v.optional(v.string()),
        instagramHandle: v.optional(v.string()),
        tiktokHandle: v.optional(v.string()),
        audienceSize: v.optional(v.number()),
        niche: v.optional(v.string()),
      })
    ),
  },
  returns: v.id("creatorPipeline"),
  handler: async (ctx, { userId, storeId, stage, metadata }) => {
    // Check if creator pipeline entry exists
    const existing = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        stage,
        updatedAt: Date.now(),
        ...metadata,
      });
      return existing._id;
    } else {
      // Create new
      const now = Date.now();
      return await ctx.db.insert("creatorPipeline", {
        userId,
        storeId,
        stage,
        createdAt: now,
        updatedAt: now,
        ...metadata,
      });
    }
  },
});

/**
 * Get creator leaderboard with health scores
 */
export const getCreatorLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("revenue"),
        v.literal("healthScore"),
        v.literal("products"),
        v.literal("enrollments")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.optional(v.id("creatorPipeline")),
      rank: v.number(),
      userId: v.string(),
      userName: v.string(),
      userEmail: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
      storeName: v.optional(v.string()),
      storeSlug: v.optional(v.string()),
      healthScore: v.number(),
      healthStatus: v.string(),
      totalRevenue: v.number(),
      revenueThisMonth: v.number(),
      productCount: v.number(),
      courseCount: v.number(),
      totalEnrollments: v.number(),
      avgRating: v.number(),
      lastActiveAt: v.optional(v.number()),
      daysSinceLastSale: v.optional(v.number()),
      onboardingProgress: v.number(),
    })
  ),
  handler: async (ctx, { limit = 50, sortBy = "revenue" }) => {
    // Get all stores (creators) — bounded
    const stores = await ctx.db.query("stores").take(500);
    const courses = await ctx.db.query("courses").take(1000);
    const products = await ctx.db.query("digitalProducts").take(1000);
    const purchases = await ctx.db.query("purchases").take(5000);
    const enrollments = await ctx.db.query("enrollments").take(5000);
    const courseAnalytics = await ctx.db.query("courseAnalytics").take(1000);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const creatorData = [];

    for (const store of stores) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();

      if (!user) continue;

      // Get creator's courses and products
      const creatorCourses = courses.filter((c) => c.userId === store.userId);
      const creatorProducts = products.filter((p) => p.storeId === store._id);

      // Get creator's revenue
      const creatorPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );
      const totalRevenue = creatorPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      const revenueThisMonth = creatorPurchases
        .filter((p) => p._creationTime > thirtyDaysAgo)
        .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

      // Get enrollments
      const creatorEnrollments = enrollments.filter((e) =>
        creatorCourses.some((c) => c._id === e.courseId)
      );

      // Calculate average rating
      const courseRatings = creatorCourses.map((c) => {
        const analytics = courseAnalytics.find((ca) => ca.courseId === c._id);
        return analytics?.avgRating || 0;
      }).filter((r) => r > 0);
      const avgRating = courseRatings.length > 0
        ? courseRatings.reduce((a, b) => a + b, 0) / courseRatings.length
        : 0;

      // Find last sale
      const lastSale = creatorPurchases
        .sort((a, b) => b._creationTime - a._creationTime)[0];
      const daysSinceLastSale = lastSale
        ? Math.floor((now - lastSale._creationTime) / (24 * 60 * 60 * 1000))
        : undefined;

      // Calculate health score (0-100)
      let healthScore = 0;

      // Revenue component (30 points)
      if (totalRevenue >= 10000) healthScore += 30;
      else if (totalRevenue >= 1000) healthScore += 20;
      else if (totalRevenue >= 100) healthScore += 10;
      else if (totalRevenue > 0) healthScore += 5;

      // Recent activity (25 points)
      if (revenueThisMonth > 0) healthScore += 25;
      else if (daysSinceLastSale !== undefined && daysSinceLastSale < 30) healthScore += 15;
      else if (daysSinceLastSale !== undefined && daysSinceLastSale < 60) healthScore += 5;

      // Product diversity (20 points)
      const totalProducts = creatorCourses.length + creatorProducts.length;
      if (totalProducts >= 5) healthScore += 20;
      else if (totalProducts >= 3) healthScore += 15;
      else if (totalProducts >= 1) healthScore += 10;

      // Rating (15 points)
      if (avgRating >= 4.5) healthScore += 15;
      else if (avgRating >= 4.0) healthScore += 10;
      else if (avgRating >= 3.5) healthScore += 5;

      // Engagement (10 points)
      if (creatorEnrollments.length >= 100) healthScore += 10;
      else if (creatorEnrollments.length >= 50) healthScore += 7;
      else if (creatorEnrollments.length >= 10) healthScore += 4;

      // Determine health status
      let healthStatus = "critical";
      if (healthScore >= 80) healthStatus = "excellent";
      else if (healthScore >= 60) healthStatus = "good";
      else if (healthScore >= 40) healthStatus = "fair";
      else if (healthScore >= 20) healthStatus = "poor";

      // Calculate onboarding progress
      let onboardingProgress = 0;
      if (store.name) onboardingProgress += 20; // Store created
      if (creatorCourses.length > 0 || creatorProducts.length > 0) onboardingProgress += 20; // Has products
      if (creatorCourses.some((c) => c.isPublished) || creatorProducts.some((p) => p.isPublished)) onboardingProgress += 20; // Published
      if (totalRevenue > 0) onboardingProgress += 20; // First sale
      if (revenueThisMonth > 0) onboardingProgress += 20; // Recent revenue

      // Check pipeline entry
      const pipelineEntry = await ctx.db
        .query("creatorPipeline")
        .withIndex("by_userId", (q) => q.eq("userId", store.userId))
        .first();

      creatorData.push({
        _id: pipelineEntry?._id,
        rank: 0, // Will be set after sorting
        userId: store.userId,
        userName: user.name || user.firstName || user.email || "Unknown",
        userEmail: user.email,
        userAvatar: user.imageUrl,
        storeName: store.name,
        storeSlug: store.slug,
        healthScore,
        healthStatus,
        totalRevenue,
        revenueThisMonth,
        productCount: creatorProducts.length,
        courseCount: creatorCourses.length,
        totalEnrollments: creatorEnrollments.length,
        avgRating,
        lastActiveAt: lastSale?._creationTime,
        daysSinceLastSale,
        onboardingProgress,
      });
    }

    // Sort by specified field
    switch (sortBy) {
      case "revenue":
        creatorData.sort((a, b) => b.totalRevenue - a.totalRevenue);
        break;
      case "healthScore":
        creatorData.sort((a, b) => b.healthScore - a.healthScore);
        break;
      case "products":
        creatorData.sort((a, b) => (b.productCount + b.courseCount) - (a.productCount + a.courseCount));
        break;
      case "enrollments":
        creatorData.sort((a, b) => b.totalEnrollments - a.totalEnrollments);
        break;
    }

    // Assign ranks and limit
    return creatorData.slice(0, limit).map((creator, index) => ({
      ...creator,
      rank: index + 1,
    }));
  },
});

/**
 * Get creators needing attention (no sales in 30 days, low health score)
 */
export const getCreatorsNeedingAttention = query({
  args: {},
  returns: v.array(
    v.object({
      userId: v.string(),
      userName: v.string(),
      userEmail: v.optional(v.string()),
      storeName: v.optional(v.string()),
      issue: v.string(),
      severity: v.string(),
      daysSinceLastSale: v.optional(v.number()),
      healthScore: v.number(),
      suggestedAction: v.string(),
    })
  ),
  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").take(500);
    const courses = await ctx.db.query("courses").take(1000);
    const purchases = await ctx.db.query("purchases").take(5000);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const needsAttention = [];

    for (const store of stores) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();

      if (!user) continue;

      const creatorCourses = courses.filter((c) => c.userId === store.userId);
      const creatorPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );

      const totalRevenue = creatorPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      const recentPurchases = creatorPurchases.filter((p) => p._creationTime > thirtyDaysAgo);
      const lastSale = creatorPurchases.sort((a, b) => b._creationTime - a._creationTime)[0];
      const daysSinceLastSale = lastSale
        ? Math.floor((now - lastSale._creationTime) / (24 * 60 * 60 * 1000))
        : undefined;

      // Calculate simple health score
      let healthScore = 0;
      if (totalRevenue > 0) healthScore += 30;
      if (recentPurchases.length > 0) healthScore += 40;
      if (creatorCourses.length > 0) healthScore += 30;

      // Check for issues
      if (totalRevenue > 0 && recentPurchases.length === 0 && daysSinceLastSale && daysSinceLastSale >= 30) {
        // Had sales but none recently
        const severity = daysSinceLastSale >= 60 ? "high" : "medium";
        needsAttention.push({
          userId: store.userId,
          userName: user.name || user.firstName || "Unknown",
          userEmail: user.email,
          storeName: store.name,
          issue: `No sales in ${daysSinceLastSale} days`,
          severity,
          daysSinceLastSale,
          healthScore,
          suggestedAction: "Send re-engagement email with promotional tips",
        });
      } else if (creatorCourses.length > 0 && totalRevenue === 0) {
        // Has courses but no sales ever
        const publishedCourses = creatorCourses.filter((c) => c.isPublished);
        if (publishedCourses.length > 0) {
          needsAttention.push({
            userId: store.userId,
            userName: user.name || user.firstName || "Unknown",
            userEmail: user.email,
            storeName: store.name,
            issue: "Published course(s) with no sales",
            severity: "medium",
            daysSinceLastSale: undefined,
            healthScore,
            suggestedAction: "Review pricing and marketing strategy",
          });
        }
      }
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return needsAttention.sort(
      (a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
    );
  },
});

/**
 * Get creator onboarding checklist status
 */
export const getCreatorOnboardingStatus = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    userId: v.string(),
    userName: v.optional(v.string()),
    overallProgress: v.number(),
    steps: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const courses = store
      ? await ctx.db
          .query("courses")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect()
      : [];

    const products = store
      ? await ctx.db
          .query("digitalProducts")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .collect()
      : [];

    const purchases = store
      ? await ctx.db
          .query("purchases")
          .withIndex("by_store_status", (q) => q.eq("storeId", store._id).eq("status", "completed"))
          .take(500)
      : [];

    const steps = [
      {
        id: "account",
        title: "Create Account",
        description: "Sign up and verify your email",
        completed: !!user,
        completedAt: user?._creationTime,
      },
      {
        id: "store",
        title: "Create Store",
        description: "Set up your creator storefront",
        completed: !!store,
        completedAt: store?._creationTime,
      },
      {
        id: "product",
        title: "Create First Product",
        description: "Add a course or digital product",
        completed: courses.length > 0 || products.length > 0,
        completedAt:
          courses.length > 0
            ? courses[0]._creationTime
            : products.length > 0
              ? products[0]._creationTime
              : undefined,
      },
      {
        id: "publish",
        title: "Publish Product",
        description: "Make your product live for customers",
        completed:
          courses.some((c) => c.isPublished) || products.some((p) => p.isPublished),
        completedAt: undefined, // Would need to track publish time
      },
      {
        id: "first_sale",
        title: "First Sale",
        description: "Get your first paying customer",
        completed: purchases.length > 0,
        completedAt: purchases.length > 0 ? purchases[0]._creationTime : undefined,
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const overallProgress = Math.round((completedCount / steps.length) * 100);

    return {
      userId,
      userName: user?.name || user?.firstName,
      overallProgress,
      steps,
    };
  },
});

/**
 * Get bulk creator data for email campaigns
 */
export const getCreatorsForBulkEmail = query({
  args: {
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("no_sales_30d"),
        v.literal("low_health"),
        v.literal("new_creators"),
        v.literal("top_performers")
      )
    ),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      userName: v.string(),
      email: v.string(),
      storeName: v.optional(v.string()),
      totalRevenue: v.number(),
      productCount: v.number(),
      lastSaleAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { filter = "all" }) => {
    const stores = await ctx.db.query("stores").take(500);
    const courses = await ctx.db.query("courses").take(1000);
    const products = await ctx.db.query("digitalProducts").take(1000);
    const purchases = await ctx.db.query("purchases").take(5000);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const creators = [];

    for (const store of stores) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", store.userId))
        .first();

      if (!user?.email) continue;

      const creatorCourses = courses.filter((c) => c.userId === store.userId);
      const creatorProducts = products.filter((p) => p.storeId === store._id);
      const creatorPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );

      const totalRevenue = creatorPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      const recentPurchases = creatorPurchases.filter((p) => p._creationTime > thirtyDaysAgo);
      const lastSale = creatorPurchases.sort((a, b) => b._creationTime - a._creationTime)[0];

      const creatorData = {
        userId: store.userId,
        userName: user.name || user.firstName || "Creator",
        email: user.email,
        storeName: store.name,
        totalRevenue,
        productCount: creatorCourses.length + creatorProducts.length,
        lastSaleAt: lastSale?._creationTime,
      };

      // Apply filter
      switch (filter) {
        case "no_sales_30d":
          if (totalRevenue > 0 && recentPurchases.length === 0) {
            creators.push(creatorData);
          }
          break;
        case "low_health":
          if (totalRevenue === 0 && (creatorCourses.length > 0 || creatorProducts.length > 0)) {
            creators.push(creatorData);
          }
          break;
        case "new_creators":
          if (store._creationTime > thirtyDaysAgo) {
            creators.push(creatorData);
          }
          break;
        case "top_performers":
          if (totalRevenue >= 1000) {
            creators.push(creatorData);
          }
          break;
        default:
          creators.push(creatorData);
      }
    }

    return creators.sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
});

/**
 * Get pipeline stats (counts by stage)
 * Derives stage from actual data: stores, courses, products, purchases
 */
export const getPipelineStats = query({
  args: {},
  returns: v.object({
    prospect: v.number(),
    invited: v.number(),
    signed_up: v.number(),
    drafting: v.number(),
    published: v.number(),
    first_sale: v.number(),
    active: v.number(),
    churn_risk: v.number(),
  }),
  handler: async (ctx) => {
    // Get all relevant data (bounded)
    const stores = await ctx.db.query("stores").take(500);
    const courses = await ctx.db.query("courses").take(1000);
    const products = await ctx.db.query("digitalProducts").take(1000);
    const purchases = await ctx.db.query("purchases").take(5000);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const stats = {
      prospect: 0,
      invited: 0,
      signed_up: 0,
      drafting: 0,
      published: 0,
      first_sale: 0,
      active: 0,
      churn_risk: 0,
    };

    // Determine stage for each creator (store)
    for (const store of stores) {
      const creatorCourses = courses.filter((c) => c.userId === store.userId);
      const creatorProducts = products.filter((p) => p.storeId === store._id);
      const creatorPurchases = purchases.filter(
        (p) => p.status === "completed" && p.storeId === store._id
      );

      const hasPublished =
        creatorCourses.some((c) => c.isPublished) ||
        creatorProducts.some((p) => p.isPublished);
      const hasSales = creatorPurchases.length > 0;
      const hasRecentSales = creatorPurchases.some(
        (p) => p._creationTime > thirtyDaysAgo
      );
      const lastSale = creatorPurchases.sort(
        (a, b) => b._creationTime - a._creationTime
      )[0];
      const isChurnRisk =
        hasSales && lastSale && lastSale._creationTime < sixtyDaysAgo;

      // Determine stage based on journey
      if (isChurnRisk) {
        stats.churn_risk++;
      } else if (hasRecentSales) {
        stats.active++;
      } else if (hasSales) {
        stats.first_sale++;
      } else if (hasPublished) {
        stats.published++;
      } else if (creatorCourses.length > 0 || creatorProducts.length > 0) {
        stats.drafting++;
      } else {
        stats.signed_up++;
      }
    }

    // Prospect and invited are manual stages (from creatorPipeline table if exists)
    const pipelineEntries = await ctx.db.query("creatorPipeline").take(500);
    for (const entry of pipelineEntries) {
      if (entry.stage === "prospect") stats.prospect++;
      if (entry.stage === "invited") stats.invited++;
    }

    return stats;
  },
});

