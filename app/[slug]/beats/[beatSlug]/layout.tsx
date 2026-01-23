import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; beatSlug: string }>;
}): Promise<Metadata> {
  try {
    const { slug, beatSlug } = await params;

    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Beat Not Found",
        description: "This beat could not be found.",
      };
    }

    // Fetch beat by slug
    const beat = await fetchQuery(api.digitalProducts.getProductBySlug, {
      storeId: store._id,
      slug: beatSlug,
    });

    if (!beat) {
      return {
        title: "Beat Not Found",
        description: "This beat could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const title = `${beat.title} | ${store.name} - Beat Lease`;
    const description =
      beat.description ||
      `License "${beat.title}" beat from ${creator?.name || store.name}${beat.bpm ? ` - ${beat.bpm} BPM` : ""}${beat.genre ? ` - ${beat.genre}` : ""}`;
    const beatUrl = `${baseUrl}/${slug}/beats/${beatSlug}`;
    const price = beat.price || 0;

    return {
      title,
      description,
      keywords: [
        beat.title,
        "beat lease",
        "instrumental",
        beat.genre || "hip hop",
        beat.musicalKey || "",
        beat.bpm ? `${beat.bpm} bpm` : "",
        store.name,
        creator?.name || "",
        "music production",
        "beats for sale",
        "type beat",
      ].filter(Boolean),
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: beatUrl,
        siteName: "PPR Academy",
        type: "music.song",
        images: beat.imageUrl
          ? [
              {
                url: beat.imageUrl,
                width: 1200,
                height: 630,
                alt: beat.title,
              },
            ]
          : undefined,
        audio: beat.demoAudioUrl
          ? [
              {
                url: beat.demoAudioUrl,
                type: "audio/mpeg",
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: beat.imageUrl ? [beat.imageUrl] : undefined,
      },
      alternates: {
        canonical: beatUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "USD",
        "music:duration": beat.duration || "",
        "music:musician": creator?.name || store.name,
      },
    };
  } catch (error) {
    console.error("Error generating beat metadata:", error);
    return {
      title: "Beat",
      description: "Discover amazing beats on PPR Academy",
    };
  }
}

export default function BeatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
