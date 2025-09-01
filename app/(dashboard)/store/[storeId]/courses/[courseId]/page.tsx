"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseViewLayout } from "./components/CourseViewLayout";
import { Loader2 } from "lucide-react";

interface CourseViewPageProps {
  params: Promise<{
    storeId: string;
    courseId: string;
  }>;
  searchParams: Promise<{
    lesson?: string;
    module?: string;
  }>;
}

export default function CourseViewPage({ params, searchParams }: CourseViewPageProps) {
  // Note: We'll need to unwrap these promises in a real implementation
  // For now, let's use the hooks directly
  const routeParams = useParams();
  const urlSearchParams = useSearchParams();
  
  const storeId = routeParams.storeId as string;
  const courseId = routeParams.courseId as string;
  const currentLessonId = urlSearchParams.get("lesson");
  const currentModuleId = urlSearchParams.get("module");

  // Fetch course data with modules and lessons
  const course = useQuery(
    api.courses.getCourseForEdit,
    courseId ? { courseId: courseId as any, userId: "temp" } : "skip" // TODO: Get actual userId
  );

  // Loading state
  if (course === undefined) {
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-muted-foreground">The course you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <CourseViewLayout 
      course={course}
      currentLessonId={currentLessonId}
      currentModuleId={currentModuleId}
      storeId={storeId}
    />
  );
}
