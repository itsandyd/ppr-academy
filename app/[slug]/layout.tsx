import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Storefront Not Found",
        description: "This creator storefront could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const title = `${store.name} - Creator Storefront`;
    const description = store.description || store.bio || `Explore courses, digital products, and more from ${store.name} on PausePlayRepeat`;
    const storefrontUrl = `${baseUrl}/${slug}`;

    return {
      title,
      description,
      keywords: [
        store.name,
        "creator storefront",
        "music production",
        "digital products",
        "online courses",
        "music education",
        ...(creator?.name ? [creator.name] : []),
      ],
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: storefrontUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: store.bannerImage || store.logoUrl
          ? [
              {
                url: store.bannerImage || store.logoUrl || "",
                width: 1200,
                height: 630,
                alt: store.name,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: store.bannerImage || store.logoUrl ? [store.bannerImage || store.logoUrl || ""] : undefined,
        creator: store.socialLinks?.twitter ? `@${store.socialLinks.twitter}` : undefined,
      },
      alternates: {
        canonical: storefrontUrl,
      },
    };
  } catch (error) {
    console.error("Error generating storefront metadata:", error);
    return {
      title: "Creator Storefront",
      description: "Discover amazing content from creators on PausePlayRepeat",
    };
  }
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

