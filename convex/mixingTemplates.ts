import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Mixing Templates Management
 * Handles querying of mixing template products for marketplace
 */

// Get published Mixing Templates for marketplace
export const getPublishedMixingTemplates = query({
  args: {
    dawType: v.optional(
      v.union(
        v.literal("ableton"),
        v.literal("fl-studio"),
        v.literal("logic"),
        v.literal("bitwig"),
        v.literal("studio-one"),
        v.literal("reason"),
        v.literal("cubase"),
        v.literal("multi-daw")
      )
    ),
    genre: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let templates = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("productCategory"), "mixing-template"),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(500);

    // Apply filters
    if (args.dawType) {
      templates = templates.filter((t) => t.dawType === args.dawType);
    }

    if (args.genre) {
      templates = templates.filter((t) => t.genre?.includes(args.genre!));
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Helper function to convert storage ID to URL
    const getImageUrl = async (imageUrl: string | undefined): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    // Enrich with creator info and convert storage IDs to URLs
    const templatesWithCreator = await Promise.all(
      templates.map(async (template) => {
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        const stores = await ctx.db.query("stores").take(500);
        const store = stores.find((s) => s._id === template.storeId);

        if (store) {
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("clerkId"), store.userId))
            .first();
          if (user) {
            creatorName = user.name || store.name || "Creator";
            creatorAvatar = user.imageUrl;
          } else {
            creatorName = store.name || "Creator";
          }
        }

        // Convert all storage IDs to URLs
        const imageUrl = await getImageUrl(template.imageUrl);
        const downloadUrl = await getImageUrl(template.downloadUrl);
        const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

        return {
          ...template,
          imageUrl,
          downloadUrl,
          creatorName,
          creatorAvatar: convertedCreatorAvatar,
        };
      })
    );

    return templatesWithCreator;
  },
});

// Get single Mixing Template by slug
export const getMixingTemplateBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("slug"), args.slug),
          q.eq(q.field("productCategory"), "mixing-template")
        )
      )
      .first();

    if (!template) return null;

    // Get creator info
    let creatorName = "Creator";
    let creatorAvatar: string | undefined = undefined;

    const stores = await ctx.db.query("stores").take(500);
    const store = stores.find((s) => s._id === template.storeId);

    if (store) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), store.userId))
        .first();
      if (user) {
        creatorName = user.name || store.name || "Creator";
        creatorAvatar = user.imageUrl;
      } else {
        creatorName = store.name || "Creator";
      }
    }

    // Convert storage IDs to URLs
    const getImageUrl = async (imageUrl: string | undefined): Promise<string | undefined> => {
      if (!imageUrl) return undefined;
      if (imageUrl.startsWith("http")) return imageUrl;
      try {
        return (await ctx.storage.getUrl(imageUrl as any)) || imageUrl;
      } catch {
        return imageUrl;
      }
    };

    const imageUrl = await getImageUrl(template.imageUrl);
    const downloadUrl = await getImageUrl(template.downloadUrl);
    const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

    return {
      ...template,
      imageUrl,
      downloadUrl,
      creatorName,
      creatorAvatar: convertedCreatorAvatar,
    };
  },
});
