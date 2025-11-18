'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CourseCardEnhanced } from '@/components/ui/course-card-enhanced';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';
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

  const isLoading = !user || convexUser === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  const courses = mode === 'learn' ? enrolledCourses : createdCourses;
  const hasNoCourses = !courses || courses.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'learn' ? 'My Courses' : 'Created Courses'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'learn' 
              ? 'Continue your learning journey' 
              : 'Manage and track your course content'}
          </p>
        </div>
        {mode === 'create' && (
          <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Link href="/dashboard/create/course?category=course">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        )}
        {mode === 'learn' && (
          <Button onClick={() => window.location.href = '/'}>
            <BookOpen className="w-4 h-4 mr-2" />
            Browse Courses
          </Button>
        )}
      </div>

      {/* Courses grid */}
      {hasNoCourses ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {mode === 'learn' ? 'No Enrolled Courses' : 'No Courses Created'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {mode === 'learn' 
              ? 'Start learning by enrolling in a course'
              : 'Create your first course to start teaching'}
          </p>
          {mode === 'learn' ? (
            <Button onClick={() => window.location.href = '/'}>
              Browse Courses
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/create/course?category=course">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Link>
            </Button>
          )}
        </Card>
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
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}


