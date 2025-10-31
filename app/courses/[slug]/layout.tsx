import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    // Fetch course by slug
    const course = await fetchQuery(api.courses.getCourseBySlug, { slug: params.slug });

    if (!course) {
      return {
        title: "Course Not Found",
        description: "This course could not be found.",
      };
    }

    // Fetch store data
    const store = course.storeId
      ? await fetchQuery(api.stores.getStoreById, { storeId: course.storeId as any })
      : null;

    // Fetch creator data
    const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: course.userId });

    const title = `${course.title} - Music Production Course`;
    const description = course.description || `Learn ${course.title} with ${creator?.name || "expert instructors"} on PPR Academy`;
    const courseUrl = `${baseUrl}/courses/${params.slug}`;

    return {
      title,
      description,
      keywords: [
        course.title,
        "music production",
        "online course",
        "music education",
        course.category || "music",
        ...(creator?.name ? [creator.name] : []),
      ],
      authors: creator ? [{ name: creator.name }] : undefined,
      openGraph: {
        title,
        description,
        url: courseUrl,
        siteName: "PPR Academy",
        type: "website",
        images: course.thumbnail
          ? [
              {
                url: course.thumbnail,
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
        images: course.thumbnail ? [course.thumbnail] : undefined,
        creator: store?.socialLinks?.twitter ? `@${store.socialLinks.twitter}` : undefined,
      },
      alternates: {
        canonical: courseUrl,
      },
      other: {
        "course:price": course.price?.toString() || "0",
        "course:currency": "USD",
        "course:instructor": creator?.name || "Unknown",
      },
    };
  } catch (error) {
    console.error("Error generating course metadata:", error);
    return {
      title: "Course",
      description: "Music production course on PPR Academy",
    };
  }
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

