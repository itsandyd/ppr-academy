import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { GuideDetailClient } from "./GuideDetailClient";

interface GuideDetailPageProps {
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

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlugOrId(slug);

    if (!product) {
      return {
        title: "Guide Not Found | PausePlayRepeat",
        description: "This guide is no longer available.",
      };
    }

    const priceText = product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`;
    const categoryText = (product as { category?: string }).category || "Music Production";

    return {
      title: `${product.title} | Guide | PausePlayRepeat`,
      description:
        product.description ||
        `Download "${product.title}" - ${categoryText} guide. ${priceText}. Learn from industry professionals.`,
      openGraph: {
        title: product.title,
        description:
          product.description ||
          `${categoryText} guide available for ${priceText}. Level up your music production skills.`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description: product.description || `${categoryText} guide for ${priceText}. Download now.`,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Guide | PausePlayRepeat",
      description: "Download comprehensive guides and eBooks from industry professionals.",
    };
  }
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
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

  return (
    <GuideDetailClient
      productId={product._id}
      slug={product.slug || slug}
      initialProduct={product}
      initialStore={store}
    />
  );
}
