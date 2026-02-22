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
    const membership = await fetchQuery(api.memberships.getMembershipBySlug, { slug });

    if (!membership) {
      return {
        title: "Membership Not Found",
        description: "The membership you're looking for could not be found.",
      };
    }

    const pageUrl = `${baseUrl}/marketplace/memberships/${slug}`;
    const description = membership.description
      ? stripHtml(membership.description).substring(0, 155)
      : `Join ${membership.tierName} membership for exclusive music production content on PausePlayRepeat.`;
    const price = membership.priceMonthly
      ? `$${(membership.priceMonthly / 100).toFixed(2)}/mo`
      : "Free";

    return {
      title: `${membership.tierName} Membership | PausePlayRepeat`,
      description,
      openGraph: {
        title: `${membership.tierName} Membership | PausePlayRepeat`,
        description,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: membership.imageUrl ? [{ url: membership.imageUrl, width: 1200, height: 630, alt: membership.tierName }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${membership.tierName} Membership | PausePlayRepeat`,
        description,
        images: membership.imageUrl ? [membership.imageUrl] : undefined,
      },
      alternates: { canonical: pageUrl },
      robots: { index: true, follow: true },
    };
  } catch {
    return {
      title: "Membership | PausePlayRepeat",
      description: "Join creator memberships on PausePlayRepeat.",
    };
  }
}

export default async function MembershipDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  let structuredData: object | null = null;

  try {
    const { slug } = await params;
    const membership = await fetchQuery(api.memberships.getMembershipBySlug, { slug });

    if (membership) {
      const pageUrl = `${baseUrl}/marketplace/memberships/${slug}`;
      structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${membership.tierName} Membership`,
        description: membership.description ? stripHtml(membership.description).substring(0, 200) : undefined,
        image: membership.imageUrl || undefined,
        url: pageUrl,
        offers: {
          "@type": "Offer",
          price: (membership.priceMonthly || 0) / 100,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: (membership.priceMonthly || 0) / 100,
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
      };
    }
  } catch { /* skip */ }

  return (
    <>
      {structuredData && (
        <Script
          id="membership-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
