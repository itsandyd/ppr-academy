'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { CourseCardEnhanced } from '@/components/ui/course-card-enhanced';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus, Package } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const mode = searchParams.get('mode') as 'learn' | 'create' | null;

  // Redirect if no mode
  useEffect(() => {
    if (!mode || (mode !== 'learn' && mode !== 'create')) {
      router.push('/dashboard?mode=learn');
    }
  }, [mode, router]);

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Learn mode: Enrolled courses
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    mode === 'learn' && convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Create mode: Created courses
  const createdCourses = useQuery(
    api.courses.getCoursesByUser,
    mode === 'create' && convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Mutations for course actions
  const updateCourse = useMutation(api.courses.updateCourse);
  const deleteCourse = useMutation(api.courses.deleteCourse);

  const isLoading = !user || convexUser === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  const courses = mode === 'learn' ? enrolledCourses : createdCourses;
  const hasNoCourses = !courses || courses.length === 0;

  // Course action handlers
  const handleEditCourse = (courseId: string) => {
    router.push(`/dashboard/create/course?courseId=${courseId}&step=course`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await deleteCourse({ courseId: courseId as any, userId: user?.id || '' });
        toast.success('Course deleted successfully');
      } catch (error) {
        toast.error('Failed to delete course');
        console.error('Delete error:', error);
      }
    }
  };

  const handleTogglePublish = async (courseId: string, currentState: boolean) => {
      try {
        await updateCourse({ 
          id: courseId as any, 
          isPublished: !currentState 
        });
        toast.success(currentState ? 'Course unpublished' : 'Course published successfully');
      } catch (error) {
      toast.error('Failed to update course');
      console.error('Publish toggle error:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">
            {mode === 'learn' ? 'My Courses' : 'Created Courses'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'learn' 
              ? 'Continue your learning journey' 
              : 'Manage and track your course content'}
          </p>
        </div>
        {mode === 'create' && (
          <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500">
            <Link href="/dashboard/create/course?category=course">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        )}
        {mode === 'learn' && (
          <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Courses
          </Button>
        )}
      </div>

      {/* Courses grid */}
      {hasNoCourses ? (
        mode === 'learn' ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Browse our marketplace to find courses from top music producers."
            action={{ label: "Browse Courses", href: "/marketplace/courses" }}
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No courses created"
            description="Create your first course to start teaching and earning."
            action={{ label: "Create Course", href: "/dashboard/create/course?category=course" }}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <CourseCardEnhanced
              key={course._id}
              id={course._id}
              title={course.title}
              description={course.description || ''}
              imageUrl={course.imageUrl || ''}
              price={course.price || 0}
              category={course.category || 'Course'}
              skillLevel={course.skillLevel || 'Beginner'}
              slug={course.slug || ''}
              progress={mode === 'learn' ? (course.progress || 0) : undefined}
              isEnrolled={mode === 'learn'}
              isCreatorMode={mode === 'create'}
              isPublished={course.isPublished}
              onEdit={handleEditCourse}
              onDelete={handleDeleteCourse}
              onTogglePublish={handleTogglePublish}
              variant="default"
            />
          ))}
        </div>
      )}

    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}


