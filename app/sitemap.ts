import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

// Revalidate the sitemap every 24 hours
export const revalidate = 86400; // 24 hours in seconds

// Slugs that are known test/junk storefronts
const BLOCKED_SLUGS = new Set(["this-is-my-store", "my-store"]);

function isTestSlug(slug: string): boolean {
  if (BLOCKED_SLUGS.has(slug)) return true;
  // Matches "test", "test-1", "test-store", "testdawdwa", etc.
  return /^test($|[-_\d])/i.test(slug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages — only canonical URLs (no redirect aliases)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/samples`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/creators`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/plugins`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/beats`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/preset-packs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/ableton-racks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/guides`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/bundles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/marketplace/memberships`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/marketplace/coaching`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/marketplace/mixing-services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/marketplace/mixing-templates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/marketplace/project-files`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-creators`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/leaderboards`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    // Fetch all published courses
    const courses = await fetchQuery(api.courses.getAllPublishedCourses, {});
    const courseSitemapEntries: MetadataRoute.Sitemap = (courses || []).map((course: any) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: new Date(course._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Fetch all stores, then filter to only those with real content
    const stores = await fetchQuery(api.stores.getAllStores, {});
    const storefrontSitemapEntries: MetadataRoute.Sitemap = [];
    const storefrontProductEntries: MetadataRoute.Sitemap = [];

    for (const store of stores || []) {
      // Skip test/junk slugs
      if (isTestSlug(store.slug)) continue;

      try {
        // Fetch published digital products for this store
        const storeProducts = await fetchQuery(api.digitalProducts.getProductsByStore, {
          storeId: store._id,
        });
        const publishedProducts = (storeProducts || []).filter(
          (p: any) => p.isPublished
        );

        // Fetch published courses for this store
        const storeCourses = await fetchQuery(api.courses.getPublishedCoursesByStore, {
          storeId: store._id,
        });

        const totalContent = publishedProducts.length + (storeCourses || []).length;

        // Only include the storefront page if it has at least 1 piece of content
        if (totalContent === 0) continue;

        storefrontSitemapEntries.push({
          url: `${baseUrl}/${store.slug}`,
          lastModified: new Date(store._creationTime),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });

        // Add product pages
        for (const product of publishedProducts) {
          const productSlug = (product as any).slug || product._id;
          let productPath = "products";

          const productType = (product as any).productType as string | undefined;
          const productCategory = (product as any).productCategory?.toLowerCase() || "";

          if (productType === "coaching") {
            productPath = "coaching";
          } else if (productType === "beat-lease" || productCategory.includes("beat") || productCategory.includes("instrumental")) {
            productPath = "beats";
          } else if (productType === "membership" || productCategory.includes("membership") || productCategory.includes("subscription")) {
            productPath = "memberships";
          } else if (productType === "tip-jar" || productCategory.includes("tip") || productCategory.includes("donation")) {
            productPath = "tips";
          }

          storefrontProductEntries.push({
            url: `${baseUrl}/${store.slug}/${productPath}/${productSlug}`,
            lastModified: new Date(product._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
        }

        // Add course pages
        for (const course of storeCourses || []) {
          const courseSlug = (course as any).slug || course._id;
          storefrontProductEntries.push({
            url: `${baseUrl}/${store.slug}/courses/${courseSlug}`,
            lastModified: new Date(course._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          });
        }
      } catch {
        // Skip if fetching products fails for a store
      }
    }

    // Fetch all published products (for marketplace)
    const products = await fetchQuery(api.digitalProducts.getAllPublishedProducts, {});
    const productSitemapEntries: MetadataRoute.Sitemap = (products || []).map((product: any) => ({
      url: `${baseUrl}/marketplace/products/${product._id}`,
      lastModified: new Date(product._creationTime),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Fetch all published blog posts
    const blogPosts = await fetchQuery(api.blog.getPublishedPosts, {});
    const blogSitemapEntries: MetadataRoute.Sitemap = (blogPosts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    // Fetch all published plugins
    const plugins = await fetchQuery(api.plugins.getAllPublishedPlugins, {});
    const pluginSitemapEntries: MetadataRoute.Sitemap = (plugins || []).map((plugin: any) => ({
      url: `${baseUrl}/marketplace/plugins/${plugin.slug || plugin._id}`,
      lastModified: new Date(plugin.updatedAt || plugin._creationTime),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    // Fetch marketplace-level entries for each product category
    const marketplaceCategoryEntries: MetadataRoute.Sitemap = [];

    // Preset packs
    try {
      const presetPacks = await fetchQuery(api.presetPacks.listPublished, {});
      for (const pack of (presetPacks as any)?.presetPacks || presetPacks || []) {
        if (pack.slug) {
          marketplaceCategoryEntries.push({
            url: `${baseUrl}/marketplace/preset-packs/${pack.slug}`,
            lastModified: new Date(pack.updatedAt || pack._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
        }
      }
    } catch { /* skip if query fails */ }

    // Bundles
    try {
      const bundles = await fetchQuery(api.bundles.getAllPublishedBundles, {});
      for (const bundle of bundles || []) {
        if ((bundle as any).slug) {
          marketplaceCategoryEntries.push({
            url: `${baseUrl}/marketplace/bundles/${(bundle as any).slug}`,
            lastModified: new Date(bundle._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
        }
      }
    } catch { /* skip if query fails */ }

    // Ableton racks
    try {
      const abletonRacks = await fetchQuery(api.abletonRacks.getPublishedAbletonRacks, {});
      for (const rack of abletonRacks || []) {
        if ((rack as any).slug) {
          marketplaceCategoryEntries.push({
            url: `${baseUrl}/marketplace/ableton-racks/${(rack as any).slug}`,
            lastModified: new Date(rack._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.6,
          });
        }
      }
    } catch { /* skip if query fails */ }

    // Mixing services
    try {
      const mixingServices = await fetchQuery(api.mixingServices.getPublishedMixingServices, {});
      for (const service of mixingServices || []) {
        if ((service as any).slug) {
          marketplaceCategoryEntries.push({
            url: `${baseUrl}/marketplace/mixing-services/${(service as any).slug}`,
            lastModified: new Date(service._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          });
        }
      }
    } catch { /* skip if query fails */ }

    // Mixing templates
    try {
      const mixingTemplates = await fetchQuery(api.mixingTemplates.getPublishedMixingTemplates, {});
      for (const template of mixingTemplates || []) {
        if ((template as any).slug) {
          marketplaceCategoryEntries.push({
            url: `${baseUrl}/marketplace/mixing-templates/${(template as any).slug}`,
            lastModified: new Date(template._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          });
        }
      }
    } catch { /* skip if query fails */ }

    // Project files
    try {
      const projectFiles = await fetchQuery(api.projectFiles.getPublishedProjectFiles, {});
      for (const file of projectFiles || []) {
        if ((file as any).slug) {
          marketplaceCategoryEntries.push({
            url: `${baseUrl}/marketplace/project-files/${(file as any).slug}`,
            lastModified: new Date(file._creationTime),
            changeFrequency: "monthly" as const,
            priority: 0.5,
          });
        }
      }
    } catch { /* skip if query fails */ }

    // Combine all sitemap entries
    return [
      ...staticPages,
      ...courseSitemapEntries,
      ...storefrontSitemapEntries,
      ...storefrontProductEntries,
      ...productSitemapEntries,
      ...blogSitemapEntries,
      ...pluginSitemapEntries,
      ...marketplaceCategoryEntries,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the static pages if dynamic fetching fails
    return staticPages;
  }
}
