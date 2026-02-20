import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; tipSlug: string }>;
}): Promise<Metadata> {
  try {
    const { slug, tipSlug } = await params;

    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Tip Jar Not Found",
        description: "This tip jar could not be found.",
      };
    }

    // Fetch tip jar by slug
    const tipJar = await fetchQuery(api.digitalProducts.getProductBySlug, {
      storeId: store._id,
      slug: tipSlug,
    });

    if (!tipJar) {
      return {
        title: "Tip Jar Not Found",
        description: "This tip jar could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const title = `Support ${creator?.name || store.name} | ${tipJar.title}`;
    const description =
      tipJar.description ||
      `Support ${creator?.name || store.name}'s work with a tip. Your support helps creators continue making amazing content.`;
    const tipUrl = `${baseUrl}/${slug}/tips/${tipSlug}`;

    return {
      title,
      description,
      keywords: [
        tipJar.title,
        "tip jar",
        "support creator",
        "donate",
        store.name,
        creator?.name || "",
        "music production",
        "creator support",
      ].filter(Boolean),
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: tipUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: tipJar.imageUrl
          ? [
              {
                url: tipJar.imageUrl,
                width: 1200,
                height: 630,
                alt: tipJar.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: tipJar.imageUrl ? [tipJar.imageUrl] : undefined,
      },
      alternates: {
        canonical: tipUrl,
      },
    };
  } catch (error) {
    console.error("Error generating tip jar metadata:", error);
    return {
      title: "Support Creator",
      description: "Support your favorite creators on PausePlayRepeat",
    };
  }
}

export default function TipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
