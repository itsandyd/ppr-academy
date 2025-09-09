"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseLandingPage } from "./components/CourseLandingPage";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

export default function PublicCoursePage() {
  const params = useParams();
  const courseSlug = params.slug as string;

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

  // Course not found or not published
  if (course === null || !course.isPublished) {
    notFound();
  }

  // Store not found
  if (!store) {
    notFound();
  }

  return (
    <CourseLandingPage 
      course={course}
      store={store}
      creator={creator}
    />
  );
}