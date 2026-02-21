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

    // Fetch all published plugins — these are directory-style pages with
    // name, description, author, category, pricing, and tags but no
    // user reviews or long-form content, so use moderate priority.
    const plugins = await fetchQuery(api.plugins.getAllPublishedPlugins, {});
    const pluginSitemapEntries: MetadataRoute.Sitemap = (plugins || []).map((plugin: any) => ({
      url: `${baseUrl}/marketplace/plugins/${plugin.slug || plugin._id}`,
      lastModified: new Date(plugin.updatedAt || plugin._creationTime),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    // Combine all sitemap entries
    return [
      ...staticPages,
      ...courseSitemapEntries,
      ...storefrontSitemapEntries,
      ...storefrontProductEntries,
      ...productSitemapEntries,
      ...blogSitemapEntries,
      ...pluginSitemapEntries,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the static pages if dynamic fetching fails
    return staticPages;
  }
}
