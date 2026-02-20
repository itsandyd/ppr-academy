import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { BeatDetailClient } from "./BeatDetailClient";
import {
  generateMusicRecordingStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

interface BeatDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function isConvexId(str: string): boolean {
  return /^[a-z0-9]{32}$/.test(str);
}

async function getProductBySlugOrId(slugOrId: string) {
  if (isConvexId(slugOrId)) {
    return await fetchQuery(api.digitalProducts.getProductById, {
      productId: slugOrId as Id<"digitalProducts">,
    });
  }

  const product = await fetchQuery(api.digitalProducts.getProductByGlobalSlug, {
    slug: slugOrId,
  });

  if (product) return product;

  try {
    return await fetchQuery(api.digitalProducts.getProductById, {
      productId: slugOrId as Id<"digitalProducts">,
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BeatDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlugOrId(slug);

    if (!product) {
      return {
        title: "Beat Not Found | PausePlayRepeat",
        description: "This beat is no longer available.",
      };
    }

    const priceText = product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`;
    const bpmText = product.bpm ? `${product.bpm} BPM` : "";
    const genreText = product.genre || "";
    const beatUrl = `${baseUrl}/marketplace/beats/${slug}`;

    return {
      title: `${product.title} | Beat Lease | PausePlayRepeat`,
      description:
        product.description ||
        `License "${product.title}" ${bpmText} ${genreText}. ${priceText}. Professional beat from top producers.`,
      openGraph: {
        title: product.title,
        description:
          product.description ||
          `${bpmText} ${genreText} beat available for ${priceText}. License now and start creating.`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
        type: "music.song",
        url: beatUrl,
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description:
          product.description || `${bpmText} ${genreText} beat for ${priceText}. License now.`,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
      alternates: {
        canonical: beatUrl,
      },
    };
  } catch {
    return {
      title: "Beat Lease | PausePlayRepeat",
      description: "License professional beats from top producers.",
    };
  }
}

export default async function BeatDetailPage({ params }: BeatDetailPageProps) {
  const { slug } = await params;

  const product = await getProductBySlugOrId(slug);

  if (!product) {
    notFound();
  }

  let store = null;
  try {
    if (product.storeId) {
      store = await fetchQuery(api.stores.getStoreById, {
        storeId: product.storeId as Id<"stores">,
      });
    }
  } catch {}

  // Generate structured data for SEO
  const beatUrl = `${baseUrl}/marketplace/beats/${slug}`;
  const artistName = store?.name || "Unknown Artist";

  const musicRecordingData = generateMusicRecordingStructuredData({
    name: product.title,
    description: product.description || undefined,
    byArtist: {
      name: artistName,
      url: store ? `${baseUrl}/${store.slug}` : undefined,
    },
    duration: product.duration ? `PT${Math.floor(product.duration / 60)}M${product.duration % 60}S` : undefined,
    genre: product.genre || undefined,
    bpm: product.bpm || undefined,
    musicalKey: (product as any).musicalKey || undefined,
    imageUrl: product.imageUrl || undefined,
    audioUrl: (product as any).wavUrl || undefined,
    url: beatUrl,
    price: product.price ? product.price / 100 : undefined,
    currency: "USD",
  });

  const breadcrumbData = generateBreadcrumbStructuredData({
    items: [
      { name: "Home", url: baseUrl },
      { name: "Marketplace", url: `${baseUrl}/marketplace` },
      { name: "Beats", url: `${baseUrl}/marketplace/beats` },
      { name: product.title, url: beatUrl },
    ],
  });

  return (
    <div className="min-h-screen px-4 md:px-0">
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={musicRecordingData} />
      <script type="application/ld+json" dangerouslySetInnerHTML={breadcrumbData} />
      <BeatDetailClient
        productId={product._id}
        slug={product.slug || slug}
        initialProduct={product}
        initialStore={store}
      />
    </div>
  );
}
