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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await fetchQuery(api.digitalProducts.getProductByGlobalSlug, { slug });

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The product you're looking for could not be found.",
      };
    }

    const pageUrl = `${baseUrl}/marketplace/products/${slug}`;
    const description = product.description
      ? stripHtml(product.description).substring(0, 155)
      : `Digital product available on PausePlayRepeat.`;
    const price = product.price != null ? `$${(product.price / 100).toFixed(2)}` : "Free";

    return {
      title: `${product.title} | PausePlayRepeat`,
      description,
      openGraph: {
        title: `${product.title} | PausePlayRepeat`,
        description,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: product.imageUrl ? [{ url: product.imageUrl, width: 1200, height: 630, alt: product.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description,
        images: product.imageUrl ? [product.imageUrl] : undefined,
      },
      alternates: { canonical: pageUrl },
      other: {
        "product:price:amount": String((product.price || 0) / 100),
        "product:price:currency": "USD",
        "product:availability": "in stock",
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Digital Product | PausePlayRepeat",
      description: "Browse digital products on PausePlayRepeat.",
    };
  }
}

export default async function ProductDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  let structuredData: object | null = null;

  try {
    const { slug } = await params;
    const product = await fetchQuery(api.digitalProducts.getProductByGlobalSlug, { slug });

    if (product) {
      const pageUrl = `${baseUrl}/marketplace/products/${slug}`;
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description ? stripHtml(product.description).substring(0, 200) : undefined,
        image: product.imageUrl || undefined,
        url: pageUrl,
        offers: {
          "@type": "Offer",
          price: (product.price || 0) / 100,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl,
        },
        brand: {
          "@type": "Organization",
          name: "PausePlayRepeat",
        },
      };
    }
  } catch { /* skip structured data on error */ }

  return (
    <>
      {structuredData && (
        <Script
          id="product-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
