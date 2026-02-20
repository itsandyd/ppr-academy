import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

function isConvexId(str: string): boolean {
  return /^[a-z0-9]{32}$/.test(str);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  try {
    const { slug, productId: productSlugOrId } = await params;

    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Coaching Not Found",
        description: "This coaching session could not be found.",
      };
    }

    // Fetch coaching product by slug or ID
    let coachingProduct;

    if (isConvexId(productSlugOrId)) {
      coachingProduct = await fetchQuery(api.coachingProducts.getCoachingProductForBooking, {
        productId: productSlugOrId as Id<"digitalProducts">,
      });
    } else {
      coachingProduct = await fetchQuery(api.coachingProducts.getCoachingProductBySlug, {
        storeId: store._id,
        slug: productSlugOrId,
      });
    }

    if (!coachingProduct) {
      return {
        title: "Coaching Not Found",
        description: "This coaching session could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const creatorName = creator?.name || store.name;
    const duration = coachingProduct.duration || 60;
    const coachingUrl = `${baseUrl}/${slug}/coaching/${productSlugOrId}`;
    const price = coachingProduct.price || 0;
    const priceText = price === 0 ? "Free" : `$${price}`;
    const title = `${coachingProduct.title} with ${creatorName} | ${duration}-min Coaching | PausePlayRepeat`;
    const description =
      coachingProduct.description ||
      `Book a ${duration}-minute coaching session with ${creatorName} (${priceText}). Get personalized 1-on-1 guidance and mentorship.`;

    return {
      title,
      description,
      keywords: [
        coachingProduct.title,
        "coaching",
        "mentorship",
        "1-on-1 coaching",
        `${duration} minute session`,
        store.name,
        creator?.name || "",
        "music production coaching",
        "online coaching",
        "book coaching session",
      ].filter(Boolean),
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: coachingUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: coachingProduct.imageUrl
          ? [
              {
                url: coachingProduct.imageUrl,
                width: 1200,
                height: 630,
                alt: coachingProduct.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: coachingProduct.imageUrl ? [coachingProduct.imageUrl] : undefined,
      },
      alternates: {
        canonical: coachingUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "USD",
        "product:availability": "in stock",
      },
    };
  } catch (error) {
    console.error("Error generating coaching metadata:", error);
    return {
      title: "Coaching Session",
      description: "Book a coaching session with experienced mentors on PausePlayRepeat",
    };
  }
}

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
