import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  try {
    const { slug, productSlug } = await params;

    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Product Not Found",
        description: "This product could not be found.",
      };
    }

    // Fetch product by slug
    const product = await fetchQuery(api.digitalProducts.getProductBySlug, {
      storeId: store._id,
      slug: productSlug,
    });

    if (!product) {
      return {
        title: "Product Not Found",
        description: "This product could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const productType = product.productType || "Digital Product";
    const category = product.category || product.productCategory || "Digital Product";
    const creatorName = creator?.name || store.name;
    const productUrl = `${baseUrl}/${slug}/products/${productSlug}`;
    const price = product.price || 0;
    const isFree = price === 0;
    const priceText = isFree ? "Free" : `$${(price / 100).toFixed(0)}`;
    const title = `${product.title} by ${creatorName} | ${category} | PausePlayRepeat`;
    const description =
      product.description ||
      `Get "${product.title}" (${priceText}) by ${creatorName}. ${category} for music production on PausePlayRepeat.`;

    return {
      title,
      description,
      keywords: [
        product.title,
        category,
        productType,
        isFree ? "free download" : "digital product",
        store.name,
        creator?.name || "",
        "music production",
        "digital downloads",
      ].filter(Boolean),
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: productUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: product.imageUrl
          ? [
              {
                url: product.imageUrl,
                width: 1200,
                height: 630,
                alt: product.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: product.imageUrl ? [product.imageUrl] : undefined,
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "USD",
        "product:availability": "in stock",
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Digital Product",
      description: "Discover amazing digital products on PausePlayRepeat",
    };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
