"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseCheckout } from "./components/CourseCheckout";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

export default function CourseCheckoutPage() {
  const params = useParams();
  const courseSlug = params.slug as string;

  // Fetch course by slug
  const course = useQuery(
    api.courses.getCourseBySlug,
    courseSlug ? { slug: courseSlug } : "skip"
  );

  // Fetch store data
  const store = useQuery(
    api.stores.getStoreById,
    course ? { storeId: course.storeId as any } : "skip"
  );

  // Fetch creator data
  const creator = useQuery(
    api.users.getUserByClerkId,
    course ? { clerkId: course.userId } : "skip"
  );

  // Loading state
  if (course === undefined || store === undefined || creator === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading checkout...</span>
        </div>
      </div>
    );
  }

  // Course not found or not published
  if (course === null || !course.isPublished) {
    notFound();
  }

  // Store not found
  if (store === null) {
    notFound();
  }

  return (
    <CourseCheckout 
      course={course}
      store={store}
      creator={creator}
    />
  );
}
