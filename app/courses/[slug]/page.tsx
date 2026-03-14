import { fetchQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/lib/convex-api";
import { CourseLandingPage } from "./components/CourseLandingPage";
import { Eye } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function PublicCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug: courseSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === "true";

  // Fetch course by slug from Convex
  const course = await fetchQuery(api.courses.getCourseBySlug, {
    slug: courseSlug,
  }).catch(() => null);

  if (!course) {
    notFound();
  }

  // Fetch store and creator data in parallel
  const [store, creator] = await Promise.all([
    course.storeId
      ? fetchQuery(api.stores.getStoreById, { storeId: course.storeId }).catch(
          () => null
        )
      : null,
    fetchQuery(api.users.getUserFromClerk, { clerkId: course.userId }).catch(
      () => null
    ),
  ]);

  if (!store || !creator) {
    notFound();
  }

  // Check ownership for unpublished course preview
  let isOwner = false;
  if (!course.isPublished || isPreview) {
    const { userId: clerkId } = await auth();
    isOwner = clerkId === course.userId;
  }

  // If course is not published, only show to owner in preview mode
  if (!course.isPublished && (!isOwner || !isPreview)) {
    notFound();
  }

  return (
    <div className="relative">
      {/* Preview Banner */}
      {isPreview && isOwner && !course.isPublished && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-amber-500 px-4 py-3 text-white shadow-lg dark:bg-amber-600">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4" />
            <span>
              Preview Mode - This course is not published yet. Only you can see
              this page.
            </span>
          </div>
        </div>
      )}

      <div
        className={
          isPreview && isOwner && !course.isPublished ? "pt-12" : ""
        }
      >
        <CourseLandingPage course={course} store={store} creator={creator} />
      </div>
    </div>
  );
}
