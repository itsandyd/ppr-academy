import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireStoreOwner, requireAuth } from "./lib/auth";

// Tier type definition
const tierTypeValidator = v.union(
  v.literal("basic"),
  v.literal("premium"),
  v.literal("exclusive"),
  v.literal("unlimited")
);

// Determine which files are delivered based on tier
function getDeliveredFilesForTier(
  tierType: "basic" | "premium" | "exclusive" | "unlimited"
): string[] {
  switch (tierType) {
    case "basic":
      return ["mp3", "wav"];
    case "premium":
      return ["mp3", "wav", "stems"];
    case "exclusive":
    case "unlimited":
      return ["mp3", "wav", "stems", "trackouts"];
    default:
      return ["mp3", "wav"];
  }
}

/**
 * Create a beat license purchase
 * Called internally from Stripe webhook after successful payment
 */
export const createBeatLicensePurchase = internalMutation({
  args: {
    beatId: v.id("digitalProducts"),
    tierType: tierTypeValidator,
    tierName: v.string(),
    userId: v.string(),
    storeId: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    buyerEmail: v.string(),
    buyerName: v.optional(v.string()),
  },
  returns: v.object({
    purchaseId: v.id("purchases"),
    beatLicenseId: v.id("beatLicenses"),
  }),
  handler: async (ctx, args) => {
    // Get the beat
    const beat = await ctx.db.get(args.beatId);
    if (!beat) {
      throw new Error("Beat not found");
    }

    // Check if beat is exclusively sold
    if (beat.exclusiveSoldAt) {
      throw new Error("This beat has already been sold exclusively");
    }

    // Get the tier details from beatLeaseConfig
    const tier = beat.beatLeaseConfig?.tiers?.find(
      (t) => t.type === args.tierType && t.enabled
    );
    if (!tier) {
      throw new Error(`Tier ${args.tierType} not found or not enabled`);
    }

    // For exclusive purchases, check if user already has any license for this beat
    // For non-exclusive, check if user already has the same tier
    if (args.tierType === "exclusive") {
      const existingLicense = await ctx.db
        .query("beatLicenses")
        .withIndex("by_user_beat", (q) =>
          q.eq("userId", args.userId).eq("beatId", args.beatId)
        )
        .first();
      if (existingLicense) {
        throw new Error("You already own a license for this beat");
      }
    } else {
      const existingLicense = await ctx.db
        .query("beatLicenses")
        .withIndex("by_user_beat", (q) =>
          q.eq("userId", args.userId).eq("beatId", args.beatId)
        )
        .filter((q) => q.eq(q.field("tierType"), args.tierType))
        .first();
      if (existingLicense) {
        throw new Error(`You already own a ${args.tierType} license for this beat`);
      }
    }

    // Get store for storeId conversion
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("userId"), beat.userId))
      .first();
    if (!store) {
      throw new Error("Store not found");
    }

    // Get producer name
    const producer = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", beat.userId))
      .first();
    const producerName = producer?.name || producer?.firstName || "Unknown Producer";

    // Create purchase record
    const purchaseId = await ctx.db.insert("purchases", {
      userId: args.userId,
      productId: args.beatId,
      storeId: args.storeId,
      adminUserId: beat.userId,
      amount: args.amount,
      currency: args.currency || "USD",
      status: "completed",
      paymentMethod: args.paymentMethod || "stripe",
      transactionId: args.transactionId,
      productType: "beatLease",
      accessGranted: true,
      downloadCount: 0,
      lastAccessedAt: Date.now(),
    });

    // Create beat license record
    const beatLicenseId = await ctx.db.insert("beatLicenses", {
      purchaseId,
      beatId: args.beatId,
      userId: args.userId,
      storeId: store._id,
      tierType: args.tierType,
      tierName: args.tierName,
      price: args.amount,
      // Snapshot tier terms at purchase time
      distributionLimit: tier.distributionLimit,
      streamingLimit: tier.streamingLimit,
      commercialUse: tier.commercialUse,
      musicVideoUse: tier.musicVideoUse,
      radioBroadcasting: tier.radioBroadcasting,
      stemsIncluded: tier.stemsIncluded,
      creditRequired: tier.creditRequired,
      // Delivery
      deliveredFiles: getDeliveredFilesForTier(args.tierType),
      // Contract info
      buyerEmail: args.buyerEmail,
      buyerName: args.buyerName,
      beatTitle: beat.title,
      producerName,
      createdAt: Date.now(),
    });

    // Link beat license to purchase
    await ctx.db.patch(purchaseId, {
      beatLicenseId,
    });

    // Create/update customer record
    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
        .first();

      if (user) {
        const existingCustomer = await ctx.db
          .query("customers")
          .withIndex("by_email_and_store", (q) =>
            q.eq("email", user.email || "").eq("storeId", args.storeId)
          )
          .first();

        if (existingCustomer) {
          await ctx.db.patch(existingCustomer._id, {
            lastActivity: Date.now(),
            status: "active",
            type: args.amount > 0 ? "paying" : existingCustomer.type,
            totalSpent: (existingCustomer.totalSpent || 0) + args.amount,
          });
        } else {
          await ctx.db.insert("customers", {
            name: args.buyerName || user.name || user.email || "Unknown",
            email: user.email || args.buyerEmail,
            storeId: args.storeId,
            adminUserId: beat.userId,
            type: args.amount > 0 ? "paying" : "lead",
            status: "active",
            totalSpent: args.amount,
            lastActivity: Date.now(),
            source: `Beat License: ${beat.title}`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to create/update customer record:", error);
    }

    // Trigger email workflow
    try {
      await ctx.scheduler.runAfter(0, internal.emailWorkflows.triggerProductPurchaseWorkflows, {
        storeId: args.storeId,
        customerEmail: args.buyerEmail,
        customerName: args.buyerName || args.buyerEmail,
        productId: args.beatId,
        productName: `${beat.title} - ${args.tierName} License`,
        productType: "beatLease",
        orderId: purchaseId,
        amount: args.amount,
      });
    } catch (error) {
      console.error("Failed to trigger email workflow:", error);
    }

    return { purchaseId, beatLicenseId };
  },
});

/**
 * Mark a beat as exclusively sold - hides it from marketplace
 * Called after exclusive tier purchase
 */
export const markBeatAsExclusivelySold = internalMutation({
  args: {
    beatId: v.id("digitalProducts"),
    userId: v.string(),
    purchaseId: v.id("purchases"),
  },
  handler: async (ctx, args) => {
    const beat = await ctx.db.get(args.beatId);
    if (!beat) {
      throw new Error("Beat not found");
    }

    // Mark as exclusively sold and unpublish
    await ctx.db.patch(args.beatId, {
      exclusiveSoldAt: Date.now(),
      exclusiveSoldTo: args.userId,
      exclusivePurchaseId: args.purchaseId,
      isPublished: false, // Hide from marketplace
    });
  },
});

/**
 * Get a beat license by purchase ID
 */
export const getBeatLicenseByPurchase = query({
  args: {
    purchaseId: v.id("purchases"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("beatLicenses")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", args.purchaseId))
      .first();
  },
});

/**
 * Get all beat licenses for a user
 */
export const getUserBeatLicenses = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const licenses = await ctx.db
      .query("beatLicenses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Enrich with beat details
    const enrichedLicenses = await Promise.all(
      licenses.map(async (license) => {
        const beat = await ctx.db.get(license.beatId);
        const store = await ctx.db.get(license.storeId);

        return {
          ...license,
          beat: beat
            ? {
                _id: beat._id,
                title: beat.title,
                imageUrl: beat.imageUrl,
                audioUrl: beat.downloadUrl || beat.demoAudioUrl,
                bpm: beat.beatLeaseConfig?.bpm || beat.bpm,
                key: beat.beatLeaseConfig?.key || beat.musicalKey,
                genre: beat.beatLeaseConfig?.genre,
              }
            : null,
          store: store
            ? {
                _id: store._id,
                name: store.name,
                slug: store.slug,
              }
            : null,
        };
      })
    );

    return enrichedLicenses;
  },
});

/**
 * Get beat sales for a creator
 */
export const getCreatorBeatSales = query({
  args: {
    storeId: v.id("stores"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStoreOwner(ctx, args.storeId);

    const limit = args.limit ?? 50;

    const licenses = await ctx.db
      .query("beatLicenses")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(limit);

    // Enrich with beat and buyer details
    const enrichedSales = await Promise.all(
      licenses.map(async (license) => {
        const beat = await ctx.db.get(license.beatId);

        return {
          _id: license._id,
          _creationTime: license._creationTime,
          beatId: license.beatId,
          beatTitle: license.beatTitle,
          beatImageUrl: beat?.imageUrl,
          tierType: license.tierType,
          tierName: license.tierName,
          price: license.price,
          buyerName: license.buyerName,
          buyerEmail: license.buyerEmail,
          createdAt: license.createdAt,
        };
      })
    );

    return enrichedSales;
  },
});

/**
 * Check if a beat is available for purchase (not exclusively sold)
 */
export const isBeatAvailable = query({
  args: {
    beatId: v.id("digitalProducts"),
  },
  returns: v.object({
    available: v.boolean(),
    exclusiveSoldAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const beat = await ctx.db.get(args.beatId);
    if (!beat) {
      return { available: false };
    }

    return {
      available: !beat.exclusiveSoldAt,
      exclusiveSoldAt: beat.exclusiveSoldAt,
    };
  },
});

/**
 * Get available license tiers for a beat
 */
export const getBeatLicenseTiers = query({
  args: {
    beatId: v.id("digitalProducts"),
  },
  handler: async (ctx, args) => {
    const beat = await ctx.db.get(args.beatId);
    if (!beat) {
      return null;
    }

    // Check if beat is exclusively sold
    if (beat.exclusiveSoldAt) {
      return {
        available: false,
        reason: "This beat has been sold exclusively",
        tiers: [],
      };
    }

    const tiers = beat.beatLeaseConfig?.tiers?.filter((t) => t.enabled) || [];

    return {
      available: true,
      tiers: tiers.map((tier) => ({
        type: tier.type,
        name: tier.name,
        price: tier.price,
        distributionLimit: tier.distributionLimit,
        streamingLimit: tier.streamingLimit,
        commercialUse: tier.commercialUse,
        musicVideoUse: tier.musicVideoUse,
        radioBroadcasting: tier.radioBroadcasting,
        stemsIncluded: tier.stemsIncluded,
        creditRequired: tier.creditRequired,
        includedFiles: getDeliveredFilesForTier(tier.type as "basic" | "premium" | "exclusive" | "unlimited"),
      })),
    };
  },
});

/**
 * Check if user already owns a specific tier for a beat
 */
export const checkUserBeatLicense = query({
  args: {
    userId: v.string(),
    beatId: v.id("digitalProducts"),
    tierType: v.optional(tierTypeValidator),
  },
  returns: v.object({
    hasLicense: v.boolean(),
    licenses: v.array(
      v.object({
        _id: v.id("beatLicenses"),
        tierType: tierTypeValidator,
        tierName: v.string(),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("beatLicenses")
      .withIndex("by_user_beat", (q) =>
        q.eq("userId", args.userId).eq("beatId", args.beatId)
      );

    if (args.tierType) {
      const licenses = await query
        .filter((q) => q.eq(q.field("tierType"), args.tierType))
        .collect();
      return {
        hasLicense: licenses.length > 0,
        licenses: licenses.map((l) => ({
          _id: l._id,
          tierType: l.tierType,
          tierName: l.tierName,
          createdAt: l.createdAt,
        })),
      };
    }

    const licenses = await query.collect();
    return {
      hasLicense: licenses.length > 0,
      licenses: licenses.map((l) => ({
        _id: l._id,
        tierType: l.tierType,
        tierName: l.tierName,
        createdAt: l.createdAt,
      })),
    };
  },
});

/**
 * Update contract generated timestamp
 */
export const markContractGenerated = mutation({
  args: {
    beatLicenseId: v.id("beatLicenses"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const license = await ctx.db.get(args.beatLicenseId);
    if (!license) {
      throw new Error("License not found");
    }

    // Verify the caller owns this license
    if (license.userId !== identity.subject) {
      throw new Error("Unauthorized: you don't own this license");
    }

    await ctx.db.patch(args.beatLicenseId, {
      contractGeneratedAt: Date.now(),
    });
  },
});
