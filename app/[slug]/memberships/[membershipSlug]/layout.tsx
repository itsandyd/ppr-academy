import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; membershipSlug: string }>;
}): Promise<Metadata> {
  try {
    const { slug, membershipSlug } = await params;

    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Membership Not Found",
        description: "This membership could not be found.",
      };
    }

    // Fetch membership by slug
    const membership = await fetchQuery(api.digitalProducts.getProductBySlug, {
      storeId: store._id,
      slug: membershipSlug,
    });

    if (!membership) {
      return {
        title: "Membership Not Found",
        description: "This membership could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const creatorName = creator?.name || store.name;
    const tierName = (membership as any).tierName || "Membership";
    const membershipUrl = `${baseUrl}/${slug}/memberships/${membershipSlug}`;
    const price = (membership as any).priceMonthly || membership.price || 0;
    const priceText = price === 0 ? "Free" : `$${price}/mo`;
    const title = `${membership.title} by ${creatorName} | ${tierName} Membership | PausePlayRepeat`;
    const description =
      membership.description ||
      `Join ${creatorName}'s ${tierName} membership (${priceText}). Get exclusive content, early access, and direct community access.`;

    return {
      title,
      description,
      keywords: [
        membership.title,
        tierName,
        "membership",
        "subscription",
        "exclusive content",
        store.name,
        creator?.name || "",
        "music production",
        "creator membership",
      ].filter(Boolean),
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: membershipUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: membership.imageUrl
          ? [
              {
                url: membership.imageUrl,
                width: 1200,
                height: 630,
                alt: membership.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: membership.imageUrl ? [membership.imageUrl] : undefined,
      },
      alternates: {
        canonical: membershipUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "USD",
        "product:availability": "in stock",
      },
    };
  } catch (error) {
    console.error("Error generating membership metadata:", error);
    return {
      title: "Membership",
      description: "Join exclusive memberships on PausePlayRepeat",
    };
  }
}

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
