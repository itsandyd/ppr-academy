import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import {
  generateCourseStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // Await params in Next.js 15
    const { slug } = await params;

    // Fetch course by slug
    const course = await fetchQuery(api.courses.getCourseBySlug, { slug });

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
    const description = course.description || `Learn ${course.title} with ${creator?.name || "expert instructors"} on PausePlayRepeat`;
    const courseUrl = `${baseUrl}/courses/${slug}`;

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
        siteName: "PausePlayRepeat",
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
      description: "Music production course on PausePlayRepeat",
    };
  }
}

export default async function CourseLayout({ children, params }: CourseLayoutProps) {
  const { slug } = await params;

  let courseStructuredData: { __html: string } | null = null;
  let breadcrumbData: { __html: string } | null = null;

  try {
    const course = await fetchQuery(api.courses.getCourseBySlug, { slug });

    if (course) {
      const creator = await fetchQuery(api.users.getUserFromClerk, { clerkId: course.userId });
      const courseUrl = `${baseUrl}/courses/${slug}`;

      courseStructuredData = generateCourseStructuredData({
        courseName: course.title,
        description: course.description || `Learn ${course.title} on PausePlayRepeat`,
        instructor: {
          name: creator?.name || "PausePlayRepeat Instructor",
          url: creator ? `${baseUrl}/creators/${course.userId}` : undefined,
        },
        price: course.price || 0,
        currency: "USD",
        imageUrl: course.imageUrl || undefined,
        category: course.category || undefined,
        url: courseUrl,
        datePublished: course._creationTime ? new Date(course._creationTime).toISOString() : undefined,
      });

      breadcrumbData = generateBreadcrumbStructuredData({
        items: [
          { name: "Home", url: baseUrl },
          { name: "Courses", url: `${baseUrl}/courses` },
          { name: course.title, url: courseUrl },
        ],
      });
    }
  } catch (error) {
    console.error("Error generating course structured data:", error);
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      {courseStructuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={courseStructuredData} />
      )}
      {breadcrumbData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={breadcrumbData} />
      )}
      {children}
    </>
  );
}

