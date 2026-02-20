"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseLandingPage } from "./components/CourseLandingPage";
import { CourseStructuredDataWrapper } from "./components/CourseStructuredDataWrapper";
import { Loader2, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export default function PublicCoursePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const courseSlug = params.slug as string;
  const isPreview = searchParams.get("preview") === "true";

  // Fetch course by slug from Convex
  const course = useQuery(
    api.courses.getCourseBySlug,
    courseSlug ? { slug: courseSlug } : "skip"
  );

  // Fetch store data from Convex (using course's storeId)
  const store = useQuery(
    api.stores.getStoreById,
    course?.storeId ? { storeId: course.storeId as any } : "skip"
  );

  // Fetch creator data from Convex
  const creator = useQuery(
    api.users.getUserFromClerk,
    course ? { clerkId: course.userId } : "skip"
  );

  // Check if current user is the course owner
  const isOwner = user?.id === course?.userId;

  // Loading state
  if (course === undefined || store === undefined || creator === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading course...</span>
        </div>
      </div>
    );
  }

  // Course not found - show helpful debug info
  if (course === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Course Not Found</h1>
          <p className="text-muted-foreground">
            No course found with slug: <code className="bg-muted px-2 py-1 rounded">{courseSlug}</code>
          </p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Common issues:</p>
            <ul className="text-left space-y-1">
              <li>• Course might not be published (try adding <code className="bg-muted px-1">?preview=true</code>)</li>
              <li>• Slug might be different (check your dashboard)</li>
              <li>• Course might not be created yet</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Store not found
  if (!store) {
    notFound();
  }

  // Creator not found
  if (!creator) {
    notFound();
  }

  // If course is not published, only show to owner in preview mode
  if (!course.isPublished) {
    if (!isOwner || !isPreview) {
      notFound();
    }
  }

  return (
    <div className="relative">
      {/* Structured Data for SEO */}
      <CourseStructuredDataWrapper
        courseName={course.title}
        description={course.description || `Learn ${course.title} with expert instructors`}
        instructor={{
          name: creator.name || "Expert Instructor",
          url: `${baseUrl}/${store.slug}`,
        }}
        price={course.price}
        currency="USD"
        imageUrl={course.imageUrl}
        category={course.category}
        url={`${baseUrl}/courses/${courseSlug}`}
        datePublished={new Date(course._creationTime).toISOString()}
      />

      {/* Preview Banner */}
      {isPreview && isOwner && !course.isPublished && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4" />
            <span>Preview Mode - This course is not published yet. Only you can see this page.</span>
          </div>
        </div>
      )}
      
      <div className={isPreview && isOwner && !course.isPublished ? "pt-12" : ""}>
        <CourseLandingPage 
          course={course}
          store={store}
          creator={creator}
        />
      </div>
    </div>
  );
}