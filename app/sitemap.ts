import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

// Revalidate the sitemap every 24 hours
export const revalidate = 86400; // 24 hours in seconds

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
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
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-creators`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
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
    {
      url: `${baseUrl}/leaderboards`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
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

    // Fetch all stores
    const stores = await fetchQuery(api.stores.getAllStores, {});
    const storefrontSitemapEntries: MetadataRoute.Sitemap = (stores || []).map((store: any) => ({
      url: `${baseUrl}/${store.slug}`,
      lastModified: new Date(store._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Fetch storefront products (digital products) - these go to /products/ path
    const storefrontProductEntries: MetadataRoute.Sitemap = [];
    for (const store of stores || []) {
      try {
        // Fetch digital products for this store
        const storeProducts = await fetchQuery(api.digitalProducts.getProductsByStore, {
          storeId: store._id,
        });

        for (const product of storeProducts || []) {
          if (!product.isPublished) continue;

          const productSlug = (product as any).slug || product._id;
          let productPath = "products"; // Default path

          // Map product type/category to specialized path
          // Note: productType can have runtime values not in the schema union type
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

        // Fetch courses for this store
        const storeCourses = await fetchQuery(api.courses.getPublishedCoursesByStore, {
          storeId: store._id,
        });

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
      changeFrequency: "weekly" as const,
      priority: 0.7,
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
