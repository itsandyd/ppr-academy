import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { getCourses, getUserFromClerk, getUserCourses } from "@/lib/data";
import CourseFilters from "@/components/course-filters";
import CourseGrid from "@/components/course-grid";  
import CourseManagement from "@/components/course-management";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  category?: string;
  skillLevel?: string;
  view?: 'browse' | 'manage';
}

async function CoursesContent({ searchParams, isAdmin }: { searchParams: Promise<SearchParams>, isAdmin: boolean }) {
  const params = await searchParams;
  
  console.log(`🔍 CoursesContent - isAdmin: ${isAdmin}, params:`, params);
  
  const courses = await getCourses({
    search: params.search,
    category: params.category,
    skillLevel: params.skillLevel,
    includeUnpublished: isAdmin, // Admins can see all courses including unpublished
  });
  
  console.log(`📚 CoursesContent - Found ${courses.length} courses`);

  const isManageView = params.view === 'manage' && isAdmin;

  if (courses.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-600 mb-4">
            {params.search || params.category || params.skillLevel 
              ? "No courses found" 
              : "No courses available"}
          </h3>
          <p className="text-slate-500">
            {params.search || params.category || params.skillLevel 
              ? "Try adjusting your search filters or browse all courses."
              : isAdmin 
                ? "No courses have been created yet. Use the AI Generator to create your first course!"
                : "Be the first to create a course and share your knowledge!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-dark">
          {isManageView ? "Manage Courses" : 
           params.search ? `Search Results for "${params.search}"` : "All Courses"}
        </h2>
        <p className="text-slate-600">
          {courses.length} course{courses.length !== 1 ? "s" : ""} found
        </p>
      </div>
      
      {isManageView ? (
        <CourseManagement courses={courses} />
      ) : (
        <CourseGrid courses={courses} />
      )}
    </>
  );
}

function CoursesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse">
          <div className="h-48 bg-slate-200" />
          <div className="p-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Check if user is admin
  const { userId: clerkId } = await auth();
  let isAdmin = false;
  
  if (clerkId) {
    const user = await getUserFromClerk(clerkId);
    isAdmin = user?.admin || false;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-dark mb-4">
              {isAdmin ? "Courses" : "Explore Courses"}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {isAdmin 
                ? "Browse courses or switch to management mode to edit, publish, and organize courses"
                : "Discover expert-led courses to master music production techniques"
              }
            </p>
          </div>

          {/* Search and Filters - Client Component */}
          <CourseFilters isAdmin={isAdmin} />
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<CoursesLoading />}>
          <CoursesContent searchParams={searchParams} isAdmin={isAdmin} />
        </Suspense>
      </div>
    </div>
  );
} 