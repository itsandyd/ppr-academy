import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Mixing Services Management
 * Handles querying of mixing service products for marketplace
 */

// Get published Mixing Services for marketplace
export const getPublishedMixingServices = query({
  args: {
    serviceType: v.optional(
      v.union(
        v.literal("mixing"),
        v.literal("mastering"),
        v.literal("mix-and-master"),
        v.literal("stem-mixing")
      )
    ),
    searchQuery: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let services = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("productCategory"), "mixing-service"),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(500);

    // Apply filters
    if (args.serviceType) {
      services = services.filter((s) => {
        const service = s as any;
        // Check if service has tiers with matching type
        if (service.mixingServiceConfig?.tiers) {
          return service.mixingServiceConfig.serviceType === args.serviceType;
        }
        // Fallback to title/description matching
        const title = service.title?.toLowerCase() || "";
        const desc = service.description?.toLowerCase() || "";
        const typeStr = args.serviceType!.replace("-", " ");
        return title.includes(typeStr) || desc.includes(typeStr);
      });
    }

    if (args.minPrice !== undefined) {
      services = services.filter((s) => (s.price || 0) >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      services = services.filter((s) => (s.price || 0) <= args.maxPrice!);
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      services = services.filter(
        (s) =>
          s.title?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          (s as any).tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Helper function to convert storage ID to URL
    const getImageUrl = async (
      imageUrl: string | undefined
    ): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    // Enrich with creator info and convert storage IDs to URLs
    const servicesWithCreator = await Promise.all(
      services.map(async (service) => {
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;
        let creatorBio: string | undefined = undefined;

        const stores = await ctx.db.query("stores").take(500);
        const store = stores.find((s) => s._id === service.storeId);

        if (store) {
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("clerkId"), store.userId))
            .first();
          if (user) {
            creatorName = user.name || store.name || "Creator";
            creatorAvatar = user.imageUrl;
            creatorBio = user.bio;
          } else {
            creatorName = store.name || "Creator";
          }
        }

        // Convert all storage IDs to URLs
        const imageUrl = await getImageUrl(service.imageUrl);
        const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

        // Get minimum price from tiers if available
        const serviceAny = service as any;
        let minTierPrice = service.price || 0;
        if (serviceAny.mixingServiceConfig?.tiers) {
          const tierPrices = serviceAny.mixingServiceConfig.tiers.map(
            (t: any) => t.price || 0
          );
          minTierPrice = Math.min(...tierPrices);
        }

        return {
          ...service,
          imageUrl,
          creatorName,
          creatorAvatar: convertedCreatorAvatar,
          creatorBio,
          storeSlug: store?.slug,
          minPrice: minTierPrice,
          serviceType: serviceAny.mixingServiceConfig?.serviceType || "mixing",
        };
      })
    );

    return servicesWithCreator;
  },
});

// Get single Mixing Service by slug
export const getMixingServiceBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const service = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("slug"), args.slug),
          q.eq(q.field("productCategory"), "mixing-service")
        )
      )
      .first();

    if (!service) return null;

    // Get creator info
    let creatorName = "Creator";
    let creatorAvatar: string | undefined = undefined;
    let creatorBio: string | undefined = undefined;
    let creatorId: string | undefined = undefined;
    let creatorStripeAccountId: string | undefined = undefined;

    const stores = await ctx.db.query("stores").take(500);
    const store = stores.find((s) => s._id === service.storeId);

    if (store) {
      creatorId = store.userId;
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), store.userId))
        .first();
      if (user) {
        creatorName = user.name || store.name || "Creator";
        creatorAvatar = user.imageUrl;
        creatorBio = user.bio;
        creatorStripeAccountId = user.stripeConnectAccountId;
      } else {
        creatorName = store.name || "Creator";
      }
    }

    // Convert storage IDs to URLs
    const getImageUrl = async (
      imageUrl: string | undefined
    ): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    const imageUrl = await getImageUrl(service.imageUrl);
    const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

    // Parse tiers from mixingServiceConfig or create default tiers
    const serviceAny = service as any;
    let tiers = [];
    if (serviceAny.mixingServiceConfig?.tiers) {
      tiers = serviceAny.mixingServiceConfig.tiers;
    } else {
      // Create default tier from base price
      tiers = [
        {
          id: "basic",
          name: "Basic Mix",
          stemCount: "Up to 30 stems",
          price: service.price || 99,
          turnaroundDays: 7,
          revisions: 2,
          features: ["Professional mixing", "2 revisions included"],
        },
      ];
    }

    return {
      ...service,
      imageUrl,
      creatorName,
      creatorAvatar: convertedCreatorAvatar,
      creatorBio,
      creatorId,
      creatorStripeAccountId,
      storeSlug: store?.slug,
      tiers,
      serviceType: serviceAny.mixingServiceConfig?.serviceType || "mixing",
      turnaroundDays: serviceAny.mixingServiceConfig?.turnaroundDays || 7,
      rushAvailable: serviceAny.mixingServiceConfig?.rushAvailable || false,
      rushFee: serviceAny.mixingServiceConfig?.rushFee || 50,
    };
  },
});

// Get creator's mixing services (for dashboard)
export const getCreatorServices = query({
  args: {
    userId: v.string(),
    includeUnpublished: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // Get creator's store
    const store = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!store) return [];

    let services = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("storeId"), store._id),
          q.eq(q.field("productCategory"), "mixing-service")
        )
      )
      .take(500);

    // Filter by published status if needed
    if (!args.includeUnpublished) {
      services = services.filter((s) => s.isPublished);
    }

    // Convert storage IDs to URLs
    const getImageUrl = async (
      imageUrl: string | undefined
    ): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    const servicesWithUrls = await Promise.all(
      services.map(async (service) => ({
        ...service,
        imageUrl: await getImageUrl(service.imageUrl),
      }))
    );

    return servicesWithUrls;
  },
});

// Get service types for filtering
export const getServiceTypes = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      label: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx) => {
    const services = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("productCategory"), "mixing-service"),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(500);

    const typeCounts: Record<string, number> = {
      mixing: 0,
      mastering: 0,
      "mix-and-master": 0,
      "stem-mixing": 0,
    };

    services.forEach((s) => {
      const type = (s as any).mixingServiceConfig?.serviceType || "mixing";
      if (typeCounts[type] !== undefined) {
        typeCounts[type]++;
      }
    });

    return [
      { id: "mixing", label: "Mixing", count: typeCounts.mixing },
      { id: "mastering", label: "Mastering", count: typeCounts.mastering },
      { id: "mix-and-master", label: "Mix & Master", count: typeCounts["mix-and-master"] },
      { id: "stem-mixing", label: "Stem Mixing", count: typeCounts["stem-mixing"] },
    ];
  },
});
