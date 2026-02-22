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
    const service = await fetchQuery(api.mixingServices.getMixingServiceBySlug, { slug });

    if (!service) {
      return {
        title: "Mixing Service Not Found",
        description: "The mixing service you're looking for could not be found.",
      };
    }

    const pageUrl = `${baseUrl}/marketplace/mixing-services/${slug}`;
    const description = service.description
      ? stripHtml(service.description).substring(0, 155)
      : `Professional ${service.serviceType || "mixing"} service available on PausePlayRepeat.`;
    const startingPrice = service.tiers?.[0]?.price
      ? `$${(service.tiers[0].price / 100).toFixed(2)}`
      : undefined;

    return {
      title: `${service.title} | Mixing Service | PausePlayRepeat`,
      description,
      keywords: `mixing service, ${service.serviceType || "mixing"}, online mixing, professional mixing, mastering service`,
      openGraph: {
        title: `${service.title} | PausePlayRepeat`,
        description,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: service.imageUrl ? [{ url: service.imageUrl, width: 1200, height: 630, alt: service.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${service.title} | PausePlayRepeat`,
        description,
        images: service.imageUrl ? [service.imageUrl] : undefined,
      },
      alternates: { canonical: pageUrl },
      other: startingPrice
        ? { "product:price:amount": startingPrice, "product:price:currency": "USD" }
        : undefined,
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Mixing Service | PausePlayRepeat",
      description: "Professional mixing and mastering services on PausePlayRepeat.",
    };
  }
}

export default async function MixingServiceDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  let structuredData: object | null = null;

  try {
    const { slug } = await params;
    const service = await fetchQuery(api.mixingServices.getMixingServiceBySlug, { slug });

    if (service) {
      const pageUrl = `${baseUrl}/marketplace/mixing-services/${slug}`;
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.title,
        description: service.description ? stripHtml(service.description).substring(0, 200) : undefined,
        image: service.imageUrl || undefined,
        url: pageUrl,
        serviceType: service.serviceType || "Mixing",
        provider: {
          "@type": "Organization",
          name: "PausePlayRepeat",
        },
        ...(service.tiers?.[0]?.price && {
          offers: {
            "@type": "Offer",
            price: service.tiers[0].price / 100,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }),
      };
    }
  } catch { /* skip */ }

  return (
    <>
      {structuredData && (
        <Script
          id="mixing-service-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
