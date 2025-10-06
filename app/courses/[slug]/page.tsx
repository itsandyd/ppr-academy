"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseLandingPage } from "./components/CourseLandingPage";
import { Loader2, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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

  // Course not found
  if (course === null) {
    notFound();
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
      {/* Preview Banner */}
      {isPreview && isOwner && !course.isPublished && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg">
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