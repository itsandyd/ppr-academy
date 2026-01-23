import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Script from "next/script";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

// Helper to strip HTML for meta descriptions
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Fetch plugin by slug
    const plugin = await fetchQuery(api.plugins.getPluginBySlug, { slug });

    if (!plugin) {
      return {
        title: "Plugin Not Found",
        description: "The plugin you're looking for could not be found.",
      };
    }

    const formatPrice = (price?: number, pricingType?: string) => {
      if (pricingType === "FREE") return "Free";
      if (!price) return "Free";
      return `$${price.toFixed(2)}`;
    };

    const pageUrl = `${baseUrl}/marketplace/plugins/${slug}`;

    // Build description from multiple sources
    let metaDescription = "";
    if (plugin.description) {
      metaDescription = stripHtml(plugin.description);
    } else if (plugin.videoScript) {
      metaDescription = stripHtml(plugin.videoScript);
    }

    // If description is too short, enrich it
    if (metaDescription.length < 100) {
      const parts = [metaDescription];
      if (plugin.typeName) parts.push(`${plugin.typeName} plugin`);
      if (plugin.categoryName) parts.push(`for ${plugin.categoryName}`);
      if (plugin.author) parts.push(`by ${plugin.author}`);
      parts.push(
        plugin.pricingType === "FREE"
          ? "Free download available."
          : `Available for ${formatPrice(plugin.price, plugin.pricingType)}.`
      );
      metaDescription = parts.filter(Boolean).join(" ");
    }

    // Truncate to 155 chars for meta description
    if (metaDescription.length > 155) {
      metaDescription = metaDescription.substring(0, 152) + "...";
    }

    // Build title
    const titleParts = [plugin.name];
    if (plugin.author) titleParts.push(`by ${plugin.author}`);
    if (plugin.typeName) titleParts.push(`- ${plugin.typeName}`);
    const metaTitle = titleParts.join(" ");

    // Build keywords from multiple sources
    const keywords = new Set<string>();

    // Add plugin name and author
    keywords.add(plugin.name);
    if (plugin.author) keywords.add(plugin.author);

    // Add type and category
    if (plugin.typeName) keywords.add(plugin.typeName);
    if (plugin.categoryName) keywords.add(plugin.categoryName);

    // Add all tags
    if (plugin.tags && plugin.tags.length > 0) {
      plugin.tags.forEach((tag: string) => keywords.add(tag));
    }

    // Add standard keywords
    const standardKeywords = [
      "VST plugin",
      "AU plugin",
      "AAX plugin",
      "music production",
      "audio plugin",
      "DAW plugin",
      plugin.pricingType === "FREE" ? "free plugin" : "premium plugin",
      plugin.pricingType === "FREEMIUM" ? "freemium plugin" : null,
    ].filter(Boolean) as string[];

    standardKeywords.forEach((kw) => keywords.add(kw));

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: Array.from(keywords).join(", "),
      authors: plugin.author ? [{ name: plugin.author }] : undefined,
      openGraph: {
        title: `${plugin.name}${plugin.author ? ` by ${plugin.author}` : ""} - Music Production Plugin`,
        description: metaDescription,
        url: pageUrl,
        siteName: "PPR Academy",
        type: "article",
        images: plugin.image
          ? [
              {
                url: plugin.image,
                width: 1200,
                height: 630,
                alt: `${plugin.name} - ${plugin.typeName || "Music Production"} Plugin`,
              },
            ]
          : undefined,
        modifiedTime: plugin.updatedAt ? new Date(plugin.updatedAt).toISOString() : undefined,
        publishedTime: plugin.createdAt ? new Date(plugin.createdAt).toISOString() : undefined,
        authors: plugin.author ? [plugin.author] : undefined,
        tags: plugin.tags && plugin.tags.length > 0 ? plugin.tags : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${plugin.name}${plugin.author ? ` by ${plugin.author}` : ""}`,
        description: metaDescription,
        images: plugin.image ? [plugin.image] : undefined,
      },
      alternates: {
        canonical: pageUrl,
      },
      other: {
        "product:price:amount": String(plugin.price || 0),
        "product:price:currency": "USD",
        "product:availability": "in stock",
        "product:brand": plugin.author || "PPR Academy",
        "product:category": plugin.typeName || "Audio Plugin",
        ...(plugin.tags && plugin.tags.length > 0 && {
          "article:tag": plugin.tags.join(", "),
        }),
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch (error) {
    console.error("Error generating plugin metadata:", error);
    return {
      title: "Music Production Plugin",
      description: "Discover professional music production plugins at PPR Academy",
    };
  }
}

interface PluginLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function PluginLayout({ children, params }: PluginLayoutProps) {
  const { slug } = await params;

  // Fetch plugin data for JSON-LD structured data
  const structuredDataScripts: object[] = [];

  try {
    const plugin = await fetchQuery(api.plugins.getPluginBySlug, { slug });

    if (plugin) {
      const pageUrl = `${baseUrl}/marketplace/plugins/${slug}`;
      const description = plugin.description
        ? stripHtml(plugin.description).substring(0, 200)
        : plugin.videoScript
          ? stripHtml(plugin.videoScript).substring(0, 200)
          : "";

      // Main SoftwareApplication schema
      const softwareSchema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: plugin.name,
        applicationCategory: "MultimediaApplication",
        applicationSubCategory: plugin.typeName || "Music Production Plugin",
        operatingSystem: "Windows, macOS",
        url: pageUrl,
        datePublished: plugin.createdAt ? new Date(plugin.createdAt).toISOString() : undefined,
        dateModified: plugin.updatedAt ? new Date(plugin.updatedAt).toISOString() : undefined,
        offers: {
          "@type": "Offer",
          price: plugin.price || 0,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: plugin.purchaseUrl || pageUrl,
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      };

      // Add optional fields
      if (plugin.author) {
        softwareSchema.author = {
          "@type": "Organization",
          name: plugin.author,
        };
        softwareSchema.publisher = {
          "@type": "Organization",
          name: plugin.author,
        };
      }
      if (description) softwareSchema.description = description;
      if (plugin.image) {
        softwareSchema.image = plugin.image;
        softwareSchema.screenshot = plugin.image;
      }
      if (plugin.categoryName) softwareSchema.genre = plugin.categoryName;
      if (plugin.tags && plugin.tags.length > 0) {
        softwareSchema.keywords = plugin.tags.join(", ");
      }

      structuredDataScripts.push(softwareSchema);

      // Add VideoObject schema if video exists
      if (plugin.videoUrl) {
        const videoSchema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: `${plugin.name} - Demo Video`,
          description: `Video demonstration of ${plugin.name}${plugin.typeName ? ` ${plugin.typeName}` : ""} plugin${plugin.author ? ` by ${plugin.author}` : ""}`,
          contentUrl: plugin.videoUrl,
          embedUrl: plugin.videoUrl.includes("youtube.com") || plugin.videoUrl.includes("youtu.be")
            ? plugin.videoUrl.replace("watch?v=", "embed/")
            : plugin.videoUrl,
          uploadDate: plugin.createdAt ? new Date(plugin.createdAt).toISOString() : undefined,
        };
        if (plugin.image) videoSchema.thumbnailUrl = plugin.image;
        structuredDataScripts.push(videoSchema);
      }

      // Add AudioObject schema if audio exists
      if (plugin.audioUrl) {
        const audioSchema: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "AudioObject",
          name: `${plugin.name} - Audio Demo`,
          description: `Audio demonstration of ${plugin.name}${plugin.typeName ? ` ${plugin.typeName}` : ""} plugin`,
          contentUrl: plugin.audioUrl,
          uploadDate: plugin.createdAt ? new Date(plugin.createdAt).toISOString() : undefined,
        };
        if (plugin.author) {
          audioSchema.creator = {
            "@type": "Organization",
            name: plugin.author,
          };
        }
        structuredDataScripts.push(audioSchema);
      }

      // Add BreadcrumbList schema
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Marketplace",
            item: `${baseUrl}/marketplace`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Plugins",
            item: `${baseUrl}/marketplace/plugins`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: plugin.name,
            item: pageUrl,
          },
        ],
      };
      structuredDataScripts.push(breadcrumbSchema);
    }
  } catch (error) {
    console.error("Error generating plugin structured data:", error);
  }

  return (
    <>
      {structuredDataScripts.map((schema, index) => (
        <Script
          key={`structured-data-${index}`}
          id={`plugin-structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
          strategy="afterInteractive"
        />
      ))}
      {children}
    </>
  );
}
