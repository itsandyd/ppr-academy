import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Project Files Management
 * Handles querying of project file products for marketplace
 * Project files are complete DAW projects for learning how tracks are built
 */

// Get published Project Files for marketplace
export const getPublishedProjectFiles = query({
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
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let projects = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("productCategory"), "project-files"),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(500);

    // Apply filters
    if (args.dawType) {
      projects = projects.filter((p) => p.dawType === args.dawType);
    }

    if (args.genre) {
      projects = projects.filter((p) => p.genre?.includes(args.genre!));
    }

    if (args.minPrice !== undefined) {
      projects = projects.filter((p) => (p.price || 0) >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      projects = projects.filter((p) => (p.price || 0) <= args.maxPrice!);
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some((tag: string) => tag.toLowerCase().includes(query))
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
    const projectsWithCreator = await Promise.all(
      projects.map(async (project) => {
        let creatorName = "Creator";
        let creatorAvatar: string | undefined = undefined;

        const stores = await ctx.db.query("stores").take(500);
        const store = stores.find((s) => s._id === project.storeId);

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
        const imageUrl = await getImageUrl(project.imageUrl);
        const downloadUrl = await getImageUrl(project.downloadUrl);
        const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

        return {
          ...project,
          imageUrl,
          downloadUrl,
          creatorName,
          creatorAvatar: convertedCreatorAvatar,
        };
      })
    );

    return projectsWithCreator;
  },
});

// Get single Project File by slug
export const getProjectFileBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("slug"), args.slug),
          q.eq(q.field("productCategory"), "project-files")
        )
      )
      .first();

    if (!project) return null;

    // Get creator info
    let creatorName = "Creator";
    let creatorAvatar: string | undefined = undefined;
    let creatorBio: string | undefined = undefined;

    const stores = await ctx.db.query("stores").take(500);
    const store = stores.find((s) => s._id === project.storeId);

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

    const imageUrl = await getImageUrl(project.imageUrl);
    const downloadUrl = await getImageUrl(project.downloadUrl);
    const convertedCreatorAvatar = await getImageUrl(creatorAvatar);

    // Parse packFiles if it's a JSON string
    let parsedPackFiles: any[] = [];
    const packFilesRaw = (project as any).packFiles;
    if (typeof packFilesRaw === "string") {
      try {
        parsedPackFiles = JSON.parse(packFilesRaw);
      } catch {
        parsedPackFiles = [];
      }
    } else if (Array.isArray(packFilesRaw)) {
      parsedPackFiles = packFilesRaw;
    }

    return {
      ...project,
      imageUrl,
      downloadUrl,
      packFiles: parsedPackFiles,
      creatorName,
      creatorAvatar: convertedCreatorAvatar,
      creatorBio,
      storeSlug: store?.slug,
    };
  },
});

// Get creator's project files (for dashboard)
export const getCreatorProjectFiles = query({
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

    let projects = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("storeId"), store._id),
          q.eq(q.field("productCategory"), "project-files")
        )
      )
      .take(500);

    // Filter by published status if needed
    if (!args.includeUnpublished) {
      projects = projects.filter((p) => p.isPublished);
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

    const projectsWithUrls = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        imageUrl: await getImageUrl(project.imageUrl),
        downloadUrl: await getImageUrl(project.downloadUrl),
      }))
    );

    return projectsWithUrls;
  },
});

// Get available genres for filtering
export const getProjectFileGenres = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("productCategory"), "project-files"),
          q.eq(q.field("isPublished"), true)
        )
      )
      .take(500);

    const genreSet = new Set<string>();
    projects.forEach((p) => {
      if (p.genre) {
        if (Array.isArray(p.genre)) {
          p.genre.forEach((g: string) => genreSet.add(g));
        } else if (typeof p.genre === "string") {
          genreSet.add(p.genre);
        }
      }
    });

    return Array.from(genreSet).sort();
  },
});
