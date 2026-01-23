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
        title: "Plugin Not Found - PPR Academy",
        description: "The plugin you're looking for could not be found.",
      };
    }

    const formatPrice = (price?: number, pricingType?: string) => {
      if (pricingType === "FREE") return "Free";
      if (!price) return "Free";
      return `$${price.toFixed(2)}`;
    };

    const pageUrl = `${baseUrl}/marketplace/plugins/${slug}`;
    const metaDescription = plugin.description
      ? stripHtml(plugin.description).substring(0, 155) + "..."
      : `${plugin.name} ${plugin.typeName ? `- ${plugin.typeName}` : ""} plugin for music production. ${plugin.pricingType === "FREE" ? "Free download" : `Available for ${formatPrice(plugin.price, plugin.pricingType)}`}.`;

    const metaTitle = `${plugin.name} ${plugin.author ? `by ${plugin.author}` : ""} - Music Production Plugin | PPR Academy`;

    const keywords = [
      plugin.name,
      plugin.author || "music production",
      plugin.typeName || "audio plugin",
      plugin.categoryName || "music software",
      "VST",
      "AU",
      "AAX",
      "music production",
      "audio effects",
      "audio processing",
      "music software",
      plugin.pricingType === "FREE" ? "free plugin" : "premium plugin",
      "music production tools",
      "audio plugin marketplace",
    ];

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: keywords.join(", "),
      authors: plugin.author ? [{ name: plugin.author }] : undefined,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: pageUrl,
        siteName: "PPR Academy",
        type: "website",
        images: plugin.image
          ? [
              {
                url: plugin.image,
                width: 1200,
                height: 630,
                alt: `${plugin.name} - Music Production Plugin`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
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
      title: "Music Production Plugin - PPR Academy",
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
  let structuredData = null;
  try {
    const plugin = await fetchQuery(api.plugins.getPluginBySlug, { slug });

    if (plugin) {
      const pageUrl = `${baseUrl}/marketplace/plugins/${slug}`;
      const description = plugin.description ? stripHtml(plugin.description).substring(0, 200) : "";

      // SoftwareApplication schema for plugins
      structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: plugin.name,
        applicationCategory: "MultimediaApplication",
        applicationSubCategory: "Music Production Plugin",
        operatingSystem: "Windows, macOS",
        offers: {
          "@type": "Offer",
          price: plugin.price || 0,
          priceCurrency: "USD",
          availability:
            plugin.pricingType === "FREE"
              ? "https://schema.org/InStock"
              : "https://schema.org/InStock",
          url: pageUrl,
        },
        ...(plugin.author && {
          author: {
            "@type": "Organization",
            name: plugin.author,
          },
        }),
        ...(description && { description }),
        ...(plugin.image && { image: plugin.image }),
        ...(plugin.categoryName && { genre: plugin.categoryName }),
        url: pageUrl,
      };
    }
  } catch (error) {
    console.error("Error generating plugin structured data:", error);
  }

  return (
    <>
      {structuredData && (
        <Script
          id="plugin-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
