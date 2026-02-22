import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { GuideDetailClient } from "./GuideDetailClient";
import {
  generateProductStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

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
      alternates: {
        canonical: `${baseUrl}/marketplace/guides/${slug}`,
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

  const guideUrl = `${baseUrl}/marketplace/guides/${slug}`;
  const brandName = store?.name || "PausePlayRepeat";

  const productData = generateProductStructuredData({
    name: product.title,
    description: product.description || `Music production guide available on PausePlayRepeat`,
    price: product.price ? product.price / 100 : 0,
    currency: "USD",
    imageUrl: product.imageUrl || undefined,
    url: guideUrl,
    brand: brandName,
    category: "Music Production Guide",
    availability: "InStock",
  });

  const breadcrumbData = generateBreadcrumbStructuredData({
    items: [
      { name: "Home", url: baseUrl },
      { name: "Marketplace", url: `${baseUrl}/marketplace` },
      { name: "Guides", url: `${baseUrl}/marketplace/guides` },
      { name: product.title, url: guideUrl },
    ],
  });

  return (
    <div className="min-h-screen px-4 md:px-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={productData} />
      <script type="application/ld+json" dangerouslySetInnerHTML={breadcrumbData} />
      <GuideDetailClient
        productId={product._id}
        slug={product.slug || slug}
        initialProduct={product}
        initialStore={store}
      />
    </div>
  );
}
