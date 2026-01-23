import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}): Promise<Metadata> {
  try {
    const { slug, courseSlug } = await params;

    // Fetch store by slug
    const store = await fetchQuery(api.stores.getStoreBySlug, { slug });

    if (!store) {
      return {
        title: "Course Not Found",
        description: "This course could not be found.",
      };
    }

    // Fetch course by slug
    const course = await fetchQuery(api.courses.getCourseBySlug, { slug: courseSlug });

    if (!course) {
      return {
        title: "Course Not Found",
        description: "This course could not be found.",
      };
    }

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId });

    const title = `${course.title} | ${store.name}`;
    const description =
      course.description ||
      `Learn ${course.title} from ${creator?.name || store.name} on PPR Academy`;
    const courseUrl = `${baseUrl}/${slug}/courses/${courseSlug}`;
    const price = course.price || 0;

    return {
      title,
      description,
      keywords: [
        course.title,
        course.category || "online course",
        course.skillLevel || "all levels",
        store.name,
        creator?.name || "",
        "music production",
        "online learning",
        "music education",
      ].filter(Boolean),
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: courseUrl,
        siteName: "PPR Academy",
        type: "website",
        images: course.imageUrl
          ? [
              {
                url: course.imageUrl,
                width: 1200,
                height: 630,
                alt: course.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: course.imageUrl ? [course.imageUrl] : undefined,
      },
      alternates: {
        canonical: courseUrl,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": "USD",
      },
    };
  } catch (error) {
    console.error("Error generating course metadata:", error);
    return {
      title: "Course",
      description: "Discover amazing courses on PPR Academy",
    };
  }
}

// JSON-LD Structured Data for SEO
export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
