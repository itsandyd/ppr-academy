"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseEnrollmentForm } from "./components/CourseEnrollmentForm";
import { Loader2 } from "lucide-react";

export default function CourseEnrollPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const courseId = params.courseId as string;

  // Fetch course data
  const course = useQuery(
    api.courses.getCourseForEdit,
    courseId ? { courseId: courseId as any, userId: "temp" } : "skip" // TODO: Get actual userId or create public course query
  );

  // Fetch store data
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  // Loading state
  if (course === undefined || store === undefined) {
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
  if (course === null || store === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-muted-foreground">The course you're looking for doesn't exist or is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <CourseEnrollmentForm 
      course={course}
      store={store}
      storeId={storeId}
    />
  );
}
