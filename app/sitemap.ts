import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

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
  ];

  try {
    // Fetch all published courses
    const courses = await fetchQuery(api.courses.getAllPublishedCourses, {});
    const courseSitemapEntries: MetadataRoute.Sitemap = (courses || []).map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: new Date(course._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Fetch all stores
    const stores = await fetchQuery(api.stores.getAllStores, {});
    const storefrontSitemapEntries: MetadataRoute.Sitemap = (stores || []).map((store) => ({
      url: `${baseUrl}/${store.slug}`,
      lastModified: new Date(store._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Fetch all published products (for marketplace)
    const products = await fetchQuery(api.digitalProducts.getAllPublishedProducts, {});
    const productSitemapEntries: MetadataRoute.Sitemap = (products || []).map((product) => ({
      url: `${baseUrl}/marketplace/products/${product._id}`,
      lastModified: new Date(product._creationTime),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Combine all sitemap entries
    return [
      ...staticPages,
      ...courseSitemapEntries,
      ...storefrontSitemapEntries,
      ...productSitemapEntries,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return at least the static pages if dynamic fetching fails
    return staticPages;
  }
}

