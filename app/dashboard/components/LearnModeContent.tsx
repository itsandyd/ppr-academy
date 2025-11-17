'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CourseCardEnhanced } from '@/components/ui/course-card-enhanced';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useEffect } from 'react';

export function LearnModeContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const createUser = useMutation(api.users.createOrUpdateUserFromClerk);
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Auto-create user if needed
  useEffect(() => {
    if (isUserLoaded && user && convexUser === null) {
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
      }).catch((error) => {
        console.error('Failed to auto-create user:', error);
      });
    }
  }, [isUserLoaded, user, convexUser, createUser]);

  // Fetch enrolled courses
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch library stats
  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Loading state
  const isLoading = !isUserLoaded || (user && convexUser === undefined);
  
  if (isLoading) {
    return <LoadingState />;
  }

  const stats = userStats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHoursLearned: 0,
    currentStreak: 0,
  };

  const hasNoCourses = !enrolledCourses || enrolledCourses.length === 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-chart-1 to-chart-4 rounded-2xl p-6 md:p-8 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'Student'}! 👋
        </h1>
        <p className="text-primary-foreground/80">
          Ready to continue your music production journey?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Enrolled</p>
                <p className="text-2xl font-bold">{stats.coursesEnrolled}</p>
              </div>
              <BookOpen className="w-8 h-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
              </div>
              <Award className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Learned</p>
                <p className="text-2xl font-bold">{stats.totalHoursLearned}</p>
              </div>
              <Clock className="w-8 h-8 text-chart-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Continue Learning</h2>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Browse Courses
          </Button>
        </div>
        
        {hasNoCourses ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your learning journey by enrolling in a course.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Browse Courses
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses?.map((course: any) => (
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
                progress={course.progress || 0}
                isEnrolled={true}
                variant="default"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 md:space-y-8">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

