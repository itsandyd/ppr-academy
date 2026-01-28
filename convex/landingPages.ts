import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * LANDING PAGE BUILDER
 * Competitor feature for creating high-converting landing pages
 *
 * Features:
 * - Drag-and-drop block editor
 * - Pre-built templates (course, product, webinar, ebook, music)
 * - A/B testing support
 * - Analytics tracking
 * - SEO optimization
 */

// Block type validator
const blockTypeValidator = v.union(
  v.literal("hero"),
  v.literal("features"),
  v.literal("testimonials"),
  v.literal("pricing"),
  v.literal("cta"),
  v.literal("faq"),
  v.literal("video"),
  v.literal("image"),
  v.literal("text"),
  v.literal("countdown"),
  v.literal("social_proof"),
  v.literal("product_showcase"),
  v.literal("custom_html")
);

const blockValidator = v.object({
  id: v.string(),
  type: blockTypeValidator,
  position: v.number(),
  settings: v.any(),
  isVisible: v.boolean(),
});

// ===== QUERIES =====

/**
 * Get all landing pages for a store
 */
export const getLandingPages = query({
  args: {
    storeId: v.string(),
    includeUnpublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let pages = await ctx.db
      .query("landingPages")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect();

    if (!args.includeUnpublished) {
      pages = pages.filter((p) => p.isPublished);
    }

    // Filter out variants from main list (they're shown under their parent)
    pages = pages.filter((p) => !p.isVariant);

    // Enrich with variant info
    const enrichedPages = await Promise.all(
      pages.map(async (page) => {
        const variants = await ctx.db
          .query("landingPages")
          .withIndex("by_parent", (q) => q.eq("parentPageId", page._id))
          .collect();

        return {
          ...page,
          variantCount: variants.length,
          variants: variants.map((v) => ({
            _id: v._id,
            variantName: v.variantName,
            trafficSplit: v.trafficSplit,
            views: v.views,
            conversions: v.conversions,
          })),
        };
      })
    );

    return enrichedPages.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a single landing page by ID
 */
export const getLandingPage = query({
  args: { pageId: v.id("landingPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return null;

    // Get linked product/course info
    let linkedProduct = null;
    let linkedCourse = null;

    if (page.linkedProductId) {
      linkedProduct = await ctx.db.get(page.linkedProductId);
    }
    if (page.linkedCourseId) {
      linkedCourse = await ctx.db.get(page.linkedCourseId);
    }

    // Get variants if this is a parent page
    const variants = page.isVariant
      ? []
      : await ctx.db
          .query("landingPages")
          .withIndex("by_parent", (q) => q.eq("parentPageId", page._id))
          .collect();

    return {
      ...page,
      linkedProduct: linkedProduct
        ? { _id: linkedProduct._id, title: linkedProduct.title, price: linkedProduct.price }
        : null,
      linkedCourse: linkedCourse
        ? { _id: linkedCourse._id, title: linkedCourse.title, price: linkedCourse.price }
        : null,
      variants,
    };
  },
});

/**
 * Get landing page by slug (for public access)
 */
export const getLandingPageBySlug = query({
  args: {
    storeId: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) =>
        q.eq("storeId", args.storeId).eq("slug", args.slug)
      )
      .first();

    if (!page || !page.isPublished) return null;

    // Handle A/B testing - return random variant based on traffic split
    if (!page.isVariant) {
      const variants = await ctx.db
        .query("landingPages")
        .withIndex("by_parent", (q) => q.eq("parentPageId", page._id))
        .filter((q) => q.eq(q.field("isPublished"), true))
        .collect();

      if (variants.length > 0) {
        // Calculate which page to show based on traffic split
        const random = Math.random() * 100;
        let cumulative = page.trafficSplit || (100 / (variants.length + 1));

        if (random < cumulative) {
          return page;
        }

        for (const variant of variants) {
          cumulative += variant.trafficSplit || (100 / (variants.length + 1));
          if (random < cumulative) {
            return variant;
          }
        }
      }
    }

    return page;
  },
});

/**
 * Get landing page analytics
 */
export const getLandingPageAnalytics = query({
  args: {
    pageId: v.id("landingPages"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let analytics = await ctx.db
      .query("landingPageAnalytics")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    if (args.startDate) {
      analytics = analytics.filter((a) => a.date >= args.startDate!);
    }
    if (args.endDate) {
      analytics = analytics.filter((a) => a.date <= args.endDate!);
    }

    // Calculate totals
    const totals = analytics.reduce(
      (acc, a) => ({
        views: acc.views + a.views,
        uniqueVisitors: acc.uniqueVisitors + a.uniqueVisitors,
        conversions: acc.conversions + a.conversions,
      }),
      { views: 0, uniqueVisitors: 0, conversions: 0 }
    );

    return {
      daily: analytics.sort((a, b) => a.date.localeCompare(b.date)),
      totals: {
        ...totals,
        conversionRate: totals.views > 0 ? (totals.conversions / totals.views) * 100 : 0,
      },
    };
  },
});

/**
 * Get available templates
 */
export const getTemplates = query({
  args: {
    category: v.optional(v.union(
      v.literal("course"),
      v.literal("product"),
      v.literal("webinar"),
      v.literal("ebook"),
      v.literal("music"),
      v.literal("general")
    )),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("landingPageTemplates").collect();

    if (args.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    return templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  },
});

// ===== MUTATIONS =====

/**
 * Create a new landing page
 */
export const createLandingPage = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    title: v.string(),
    slug: v.string(),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if slug is already taken
    const existing = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) =>
        q.eq("storeId", args.storeId).eq("slug", args.slug)
      )
      .first();

    if (existing) {
      throw new Error("A page with this URL already exists");
    }

    // Get template blocks if templateId provided
    let blocks: Array<{
      id: string;
      type: string;
      position: number;
      settings: any;
      isVisible: boolean;
    }> = [];
    let templateName: string | undefined;

    if (args.templateId) {
      const template = await ctx.db.get(args.templateId as Id<"landingPageTemplates">);
      if (template) {
        blocks = template.blocks.map((block, index) => ({
          ...block,
          id: `block_${Date.now()}_${index}`,
        }));
        templateName = template.name;

        // Increment template usage
        await ctx.db.patch(template._id, {
          usageCount: (template.usageCount || 0) + 1,
        });
      }
    } else {
      // Default blocks for new page
      blocks = [
        {
          id: `block_${now}_0`,
          type: "hero",
          position: 0,
          settings: {
            headline: "Your Amazing Product",
            subheadline: "Discover what makes it special",
            ctaText: "Get Started",
            ctaUrl: "#",
            backgroundType: "gradient",
            backgroundColor: "#4F46E5",
          },
          isVisible: true,
        },
        {
          id: `block_${now}_1`,
          type: "features",
          position: 1,
          settings: {
            headline: "Key Features",
            features: [
              { icon: "star", title: "Feature 1", description: "Description of feature 1" },
              { icon: "zap", title: "Feature 2", description: "Description of feature 2" },
              { icon: "shield", title: "Feature 3", description: "Description of feature 3" },
            ],
          },
          isVisible: true,
        },
        {
          id: `block_${now}_2`,
          type: "cta",
          position: 2,
          settings: {
            headline: "Ready to Get Started?",
            subheadline: "Join thousands of satisfied customers",
            ctaText: "Start Now",
            ctaUrl: "#",
          },
          isVisible: true,
        },
      ];
    }

    const pageId = await ctx.db.insert("landingPages", {
      storeId: args.storeId,
      userId: args.userId,
      title: args.title,
      slug: args.slug,
      templateId: args.templateId,
      templateName,
      blocks: blocks as any,
      isPublished: false,
      views: 0,
      conversions: 0,
      conversionRate: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { pageId };
  },
});

/**
 * Update landing page
 */
export const updateLandingPage = mutation({
  args: {
    pageId: v.id("landingPages"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    blocks: v.optional(v.array(blockValidator)),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    linkedProductId: v.optional(v.id("digitalProducts")),
    linkedCourseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const { pageId, ...updates } = args;

    const page = await ctx.db.get(pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    // Check slug uniqueness if changing
    if (updates.slug && updates.slug !== page.slug) {
      const existing = await ctx.db
        .query("landingPages")
        .withIndex("by_slug", (q) =>
          q.eq("storeId", page.storeId).eq("slug", updates.slug!)
        )
        .first();

      if (existing && existing._id !== pageId) {
        throw new Error("A page with this URL already exists");
      }
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(pageId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update a single block
 */
export const updateBlock = mutation({
  args: {
    pageId: v.id("landingPages"),
    blockId: v.string(),
    settings: v.any(),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const blocks = page.blocks.map((block) => {
      if (block.id === args.blockId) {
        return {
          ...block,
          settings: args.settings,
          isVisible: args.isVisible ?? block.isVisible,
        };
      }
      return block;
    });

    await ctx.db.patch(args.pageId, {
      blocks,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add a new block
 */
export const addBlock = mutation({
  args: {
    pageId: v.id("landingPages"),
    type: blockTypeValidator,
    position: v.number(),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const blockId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Default settings based on block type
    const defaultSettings = getDefaultBlockSettings(args.type);

    const newBlock = {
      id: blockId,
      type: args.type,
      position: args.position,
      settings: args.settings || defaultSettings,
      isVisible: true,
    };

    // Adjust positions of existing blocks
    const blocks = page.blocks.map((block) => {
      if (block.position >= args.position) {
        return { ...block, position: block.position + 1 };
      }
      return block;
    });

    blocks.push(newBlock);
    blocks.sort((a, b) => a.position - b.position);

    await ctx.db.patch(args.pageId, {
      blocks,
      updatedAt: Date.now(),
    });

    return { blockId };
  },
});

/**
 * Remove a block
 */
export const removeBlock = mutation({
  args: {
    pageId: v.id("landingPages"),
    blockId: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const blocks = page.blocks
      .filter((block) => block.id !== args.blockId)
      .map((block, index) => ({ ...block, position: index }));

    await ctx.db.patch(args.pageId, {
      blocks,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reorder blocks
 */
export const reorderBlocks = mutation({
  args: {
    pageId: v.id("landingPages"),
    blockIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const blockMap = new Map(page.blocks.map((b) => [b.id, b]));
    const reorderedBlocks = args.blockIds
      .map((id, index) => {
        const block = blockMap.get(id);
        if (!block) return null;
        return { ...block, position: index };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    await ctx.db.patch(args.pageId, {
      blocks: reorderedBlocks,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Publish/unpublish page
 */
export const togglePublish = mutation({
  args: { pageId: v.id("landingPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const now = Date.now();
    const newStatus = !page.isPublished;

    await ctx.db.patch(args.pageId, {
      isPublished: newStatus,
      publishedAt: newStatus ? now : page.publishedAt,
      updatedAt: now,
    });

    return { isPublished: newStatus };
  },
});

/**
 * Duplicate page
 */
export const duplicatePage = mutation({
  args: { pageId: v.id("landingPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    const now = Date.now();

    // Generate unique slug
    let newSlug = `${page.slug}-copy`;
    let counter = 1;
    while (true) {
      const existing = await ctx.db
        .query("landingPages")
        .withIndex("by_slug", (q) =>
          q.eq("storeId", page.storeId).eq("slug", newSlug)
        )
        .first();

      if (!existing) break;
      newSlug = `${page.slug}-copy-${counter}`;
      counter++;
    }

    const newPageId = await ctx.db.insert("landingPages", {
      storeId: page.storeId,
      userId: page.userId,
      title: `${page.title} (Copy)`,
      slug: newSlug,
      description: page.description,
      templateId: page.templateId,
      templateName: page.templateName,
      blocks: page.blocks,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImage: page.ogImage,
      linkedProductId: page.linkedProductId,
      linkedCourseId: page.linkedCourseId,
      isPublished: false,
      publishedAt: undefined,
      views: 0,
      conversions: 0,
      conversionRate: 0,
      isVariant: false,
      parentPageId: undefined,
      variantName: undefined,
      trafficSplit: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { pageId: newPageId };
  },
});

/**
 * Create A/B test variant
 */
export const createVariant = mutation({
  args: {
    parentPageId: v.id("landingPages"),
    variantName: v.string(),
    trafficSplit: v.number(),
  },
  handler: async (ctx, args) => {
    const parentPage = await ctx.db.get(args.parentPageId);
    if (!parentPage) {
      throw new Error("Parent page not found");
    }

    if (parentPage.isVariant) {
      throw new Error("Cannot create variant of a variant");
    }

    const now = Date.now();

    // Generate unique slug
    const variantSlug = `${parentPage.slug}-variant-${Date.now()}`;

    const variantId = await ctx.db.insert("landingPages", {
      storeId: parentPage.storeId,
      userId: parentPage.userId,
      title: `${parentPage.title} - ${args.variantName}`,
      slug: variantSlug,
      description: parentPage.description,
      templateId: parentPage.templateId,
      templateName: parentPage.templateName,
      blocks: parentPage.blocks,
      metaTitle: parentPage.metaTitle,
      metaDescription: parentPage.metaDescription,
      ogImage: parentPage.ogImage,
      linkedProductId: parentPage.linkedProductId,
      linkedCourseId: parentPage.linkedCourseId,
      isVariant: true,
      parentPageId: args.parentPageId,
      variantName: args.variantName,
      trafficSplit: args.trafficSplit,
      isPublished: false,
      publishedAt: undefined,
      views: 0,
      conversions: 0,
      conversionRate: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update parent's traffic split
    const variants = await ctx.db
      .query("landingPages")
      .withIndex("by_parent", (q) => q.eq("parentPageId", args.parentPageId))
      .collect();

    const totalVariantSplit = variants.reduce((sum, v) => sum + (v.trafficSplit || 0), 0) + args.trafficSplit;
    const parentSplit = Math.max(0, 100 - totalVariantSplit);

    await ctx.db.patch(args.parentPageId, {
      trafficSplit: parentSplit,
      updatedAt: now,
    });

    return { variantId };
  },
});

/**
 * Delete page
 */
export const deletePage = mutation({
  args: { pageId: v.id("landingPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }

    // Delete variants if this is a parent
    if (!page.isVariant) {
      const variants = await ctx.db
        .query("landingPages")
        .withIndex("by_parent", (q) => q.eq("parentPageId", args.pageId))
        .collect();

      for (const variant of variants) {
        await ctx.db.delete(variant._id);
      }
    }

    // Delete analytics
    const analytics = await ctx.db
      .query("landingPageAnalytics")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    for (const record of analytics) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.delete(args.pageId);

    return { success: true };
  },
});

/**
 * Track page view
 */
export const trackPageView = mutation({
  args: {
    pageId: v.id("landingPages"),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return;

    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    // Update page view count
    await ctx.db.patch(args.pageId, {
      views: (page.views || 0) + 1,
    });

    // Update/create daily analytics
    const existingAnalytics = await ctx.db
      .query("landingPageAnalytics")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId).eq("date", today))
      .first();

    if (existingAnalytics) {
      await ctx.db.patch(existingAnalytics._id, {
        views: existingAnalytics.views + 1,
        uniqueVisitors: args.visitorId
          ? existingAnalytics.uniqueVisitors + 1
          : existingAnalytics.uniqueVisitors,
      });
    } else {
      await ctx.db.insert("landingPageAnalytics", {
        pageId: args.pageId,
        storeId: page.storeId,
        date: today,
        views: 1,
        uniqueVisitors: 1,
        conversions: 0,
        conversionRate: 0,
        createdAt: now,
      });
    }
  },
});

/**
 * Track conversion
 */
export const trackConversion = mutation({
  args: { pageId: v.id("landingPages") },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) return;

    const today = new Date().toISOString().split("T")[0];

    // Update page conversion count
    const newConversions = (page.conversions || 0) + 1;
    const newRate = page.views ? (newConversions / page.views) * 100 : 0;

    await ctx.db.patch(args.pageId, {
      conversions: newConversions,
      conversionRate: newRate,
    });

    // Update daily analytics
    const existingAnalytics = await ctx.db
      .query("landingPageAnalytics")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId).eq("date", today))
      .first();

    if (existingAnalytics) {
      const newDailyConversions = existingAnalytics.conversions + 1;
      await ctx.db.patch(existingAnalytics._id, {
        conversions: newDailyConversions,
        conversionRate: existingAnalytics.views
          ? (newDailyConversions / existingAnalytics.views) * 100
          : 0,
      });
    }
  },
});

// ===== HELPER FUNCTIONS =====

function getDefaultBlockSettings(type: string): any {
  switch (type) {
    case "hero":
      return {
        headline: "Your Headline Here",
        subheadline: "Add a compelling subheadline",
        ctaText: "Get Started",
        ctaUrl: "#",
        backgroundType: "solid",
        backgroundColor: "#4F46E5",
      };
    case "features":
      return {
        headline: "Features",
        features: [
          { icon: "star", title: "Feature 1", description: "Description" },
          { icon: "zap", title: "Feature 2", description: "Description" },
          { icon: "shield", title: "Feature 3", description: "Description" },
        ],
      };
    case "testimonials":
      return {
        headline: "What People Say",
        testimonials: [
          { name: "John Doe", role: "Customer", text: "Great product!", avatar: "" },
        ],
      };
    case "pricing":
      return {
        headline: "Pricing",
        showPrice: true,
        price: 99,
        originalPrice: 149,
        currency: "$",
        ctaText: "Buy Now",
      };
    case "cta":
      return {
        headline: "Ready to Get Started?",
        subheadline: "Join now and transform your workflow",
        ctaText: "Start Now",
        ctaUrl: "#",
      };
    case "faq":
      return {
        headline: "Frequently Asked Questions",
        faqs: [
          { question: "Question 1?", answer: "Answer 1" },
          { question: "Question 2?", answer: "Answer 2" },
        ],
      };
    case "video":
      return {
        videoUrl: "",
        videoType: "youtube",
        autoplay: false,
      };
    case "image":
      return {
        imageUrl: "",
        alt: "",
        caption: "",
      };
    case "text":
      return {
        content: "Add your content here...",
        alignment: "left",
      };
    case "countdown":
      return {
        headline: "Limited Time Offer",
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
      };
    case "social_proof":
      return {
        headline: "Trusted by",
        stats: [
          { value: "10K+", label: "Customers" },
          { value: "4.9", label: "Rating" },
          { value: "99%", label: "Satisfaction" },
        ],
      };
    case "product_showcase":
      return {
        headline: "Featured Product",
        showImage: true,
        showPrice: true,
        showDescription: true,
      };
    case "custom_html":
      return {
        html: "<div>Custom HTML content</div>",
      };
    default:
      return {};
  }
}
