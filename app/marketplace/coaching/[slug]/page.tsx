import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { CoachingDetailClient } from "./CoachingDetailClient";

interface CoachingDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProductBySlugOrId(slugOrId: string) {
  const productBySlug = await fetchQuery(api.coachingProducts.getCoachingProductByGlobalSlug, {
    slug: slugOrId,
  });

  if (productBySlug) return productBySlug;

  try {
    const productById = await fetchQuery(api.coachingProducts.getCoachingProductForBooking, {
      productId: slugOrId as Id<"digitalProducts">,
    });
    return productById;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: CoachingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlugOrId(slug);

    if (!product) {
      return {
        title: "Coaching Session Not Found | PausePlayRepeat",
        description: "This coaching session is no longer available.",
      };
    }

    const priceText = product.price === 0 ? "Free" : `$${product.price}`;
    const durationText = product.duration ? `${product.duration} min` : "60 min";

    return {
      title: `${product.title} | Coaching | PausePlayRepeat`,
      description:
        product.description ||
        `Book a ${durationText} 1-on-1 coaching session. ${priceText}. Learn from professional music producers.`,
      openGraph: {
        title: product.title,
        description:
          product.description ||
          `${durationText} coaching session for ${priceText}. Get personalized feedback and guidance.`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description:
          product.description ||
          `${durationText} coaching session for ${priceText}. Get personalized feedback.`,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Coaching Session | PausePlayRepeat",
      description: "Book 1-on-1 coaching sessions with professional music producers.",
    };
  }
}

export default async function CoachingDetailPage({ params }: CoachingDetailPageProps) {
  const { slug } = await params;

  const product = await getProductBySlugOrId(slug);

  if (!product) {
    notFound();
  }

  let store = null;
  try {
    store = await fetchQuery(api.stores.getStoreById, {
      storeId: product.storeId as Id<"stores">,
    });
  } catch {}

  return (
    <div className="min-h-screen px-4 md:px-0">
      <CoachingDetailClient
        productId={product._id}
        slug={product.slug || slug}
        initialProduct={product}
        initialStore={store}
      />
    </div>
  );
}
