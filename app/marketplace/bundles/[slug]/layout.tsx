import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Script from "next/script";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const bundle = await fetchQuery(api.bundles.getBundleBySlug, { slug });

    if (!bundle) {
      return {
        title: "Bundle Not Found",
        description: "The bundle you're looking for could not be found.",
      };
    }

    const pageUrl = `${baseUrl}/marketplace/bundles/${slug}`;
    const description = bundle.description
      ? stripHtml(bundle.description).substring(0, 155)
      : `Get ${bundle.name} bundle on PausePlayRepeat. Save with curated music production content.`;
    const price = bundle.bundlePrice != null ? `$${(bundle.bundlePrice / 100).toFixed(2)}` : "Free";

    return {
      title: `${bundle.name} | Bundle | PausePlayRepeat`,
      description,
      openGraph: {
        title: `${bundle.name} - Bundle Deal | PausePlayRepeat`,
        description,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: bundle.imageUrl ? [{ url: bundle.imageUrl, width: 1200, height: 630, alt: bundle.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${bundle.name} | PausePlayRepeat`,
        description,
        images: bundle.imageUrl ? [bundle.imageUrl] : undefined,
      },
      alternates: { canonical: pageUrl },
      other: {
        "product:price:amount": String((bundle.bundlePrice || 0) / 100),
        "product:price:currency": "USD",
        "product:availability": "in stock",
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Bundle | PausePlayRepeat",
      description: "Save with curated bundles on PausePlayRepeat.",
    };
  }
}

export default async function BundleDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  let structuredData: object | null = null;

  try {
    const { slug } = await params;
    const bundle = await fetchQuery(api.bundles.getBundleBySlug, { slug });

    if (bundle) {
      const pageUrl = `${baseUrl}/marketplace/bundles/${slug}`;
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: bundle.name,
        description: bundle.description ? stripHtml(bundle.description).substring(0, 200) : undefined,
        image: bundle.imageUrl || undefined,
        url: pageUrl,
        offers: {
          "@type": "Offer",
          price: (bundle.bundlePrice || 0) / 100,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        },
      };
    }
  } catch { /* skip */ }

  return (
    <>
      {structuredData && (
        <Script
          id="bundle-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
