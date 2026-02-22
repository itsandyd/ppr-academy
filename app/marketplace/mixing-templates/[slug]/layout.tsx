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
    const template = await fetchQuery(api.mixingTemplates.getMixingTemplateBySlug, { slug });

    if (!template) {
      return {
        title: "Mixing Template Not Found",
        description: "The mixing template you're looking for could not be found.",
      };
    }

    const pageUrl = `${baseUrl}/marketplace/mixing-templates/${slug}`;
    const description = template.description
      ? stripHtml(template.description).substring(0, 155)
      : `Professional mixing template for ${template.dawType || "your DAW"} on PausePlayRepeat.`;

    return {
      title: `${template.title} | Mixing Template | PausePlayRepeat`,
      description,
      keywords: `mixing template, ${template.dawType || "DAW"} template, session template, production template`,
      openGraph: {
        title: `${template.title} | PausePlayRepeat`,
        description,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: template.imageUrl ? [{ url: template.imageUrl, width: 1200, height: 630, alt: template.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${template.title} | PausePlayRepeat`,
        description,
        images: template.imageUrl ? [template.imageUrl] : undefined,
      },
      alternates: { canonical: pageUrl },
      other: template.price != null
        ? { "product:price:amount": String(template.price / 100), "product:price:currency": "USD" }
        : undefined,
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Mixing Template | PausePlayRepeat",
      description: "Download professional mixing templates on PausePlayRepeat.",
    };
  }
}

export default async function MixingTemplateDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  let structuredData: object | null = null;

  try {
    const { slug } = await params;
    const template = await fetchQuery(api.mixingTemplates.getMixingTemplateBySlug, { slug });

    if (template) {
      const pageUrl = `${baseUrl}/marketplace/mixing-templates/${slug}`;
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: template.title,
        description: template.description ? stripHtml(template.description).substring(0, 200) : undefined,
        image: template.imageUrl || undefined,
        url: pageUrl,
        category: "Mixing Template",
        offers: {
          "@type": "Offer",
          price: (template.price || 0) / 100,
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
          id="mixing-template-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
