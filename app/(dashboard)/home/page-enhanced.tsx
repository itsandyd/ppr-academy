"use client";

import { DashboardLayoutEnhanced } from "@/components/ui/dashboard-layout-enhanced";
import { CourseCardEnhanced } from "@/components/ui/course-card-enhanced";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardHomeEnhanced() {
  const { user, isLoaded } = useUser();

  // Fetch enrolled courses from Convex
  const enrolledCourses = useQuery(
    api.library.getUserCourses,
    user?.id ? { userId: user.id } : "skip"
  );

  // Fetch user certificates
  const certificates = useQuery(
    api.certificates.getUserCertificates,
    user?.id ? { userId: user.id } : "skip"
  );

  // Calculate real stats from data
  const coursesEnrolled = enrolledCourses?.length || 0;
  const coursesCompleted = enrolledCourses?.filter(c => c.progress === 100).length || 0;
  const certificatesEarned = certificates?.length || 0;

  // Build user data from Clerk
  const userData = {
    name: user?.firstName || "Student",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl,
    level: `Level ${Math.floor(coursesCompleted / 2) + 1}`,
    xp: coursesCompleted * 500 + (coursesEnrolled * 100),
    nextLevelXp: (Math.floor(coursesCompleted / 2) + 2) * 1000,
  };

  const stats = {
    coursesEnrolled,
    coursesCompleted,
    totalHoursLearned: coursesEnrolled * 6, // Estimate 6 hours per course
    currentStreak: 1, // Would need activity tracking for real streaks
    certificatesEarned,
    nextMilestone: {
      title: `Complete ${coursesCompleted + 2} Courses`,
      progress: coursesCompleted,
      target: coursesCompleted + 2,
    },
  };

  // Build recent activity from courses
  const recentActivity = (enrolledCourses || [])
    .slice(0, 3)
    .map((course) => ({
      id: course._id,
      type: (course.progress ?? 0) === 100 ? "earned_certificate" as const :
            (course.progress ?? 0) > 0 ? "completed_lesson" as const : "started_course" as const,
      title: (course.progress ?? 0) === 100 ? "Completed course" :
             (course.progress ?? 0) > 0 ? `${course.progress}% complete` : "Started course",
      courseName: course.title,
      timestamp: course.lastAccessedAt
        ? new Date(course.lastAccessedAt).toLocaleDateString()
        : new Date(course.purchaseDate).toLocaleDateString(),
    }));

  // Transform enrolled courses for display
  const continueLearningCourses = (enrolledCourses || []).map(course => ({
    id: course._id,
    title: course.title,
    description: course.description || "Continue your learning journey",
    imageUrl: course.imageUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop",
    price: 0,
    category: course.category || "Course",
    skillLevel: (course.skillLevel || "Beginner") as "Beginner" | "Intermediate" | "Advanced",
    slug: course.slug || course._id,
    instructor: {
      name: course.storeName || "Instructor",
      avatar: undefined,
      verified: true,
    },
    stats: {
      students: 0,
      lessons: 0,
      duration: "Self-paced",
      rating: 0,
      reviews: 0,
    },
    progress: course.progress || 0,
    isEnrolled: true,
    isNew: course._creationTime > Date.now() - 7 * 24 * 60 * 60 * 1000,
    isTrending: false,
  }));

  // Show loading state
  if (!isLoaded || enrolledCourses === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayoutEnhanced
      user={userData}
      stats={stats}
      recentActivity={recentActivity}
      notifications={3}
    >
      {/* Continue Learning Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {continueLearningCourses.map((course) => (
          <CourseCardEnhanced
            key={course.id}
            id={course.id}
            title={course.title}
            description={course.description}
            imageUrl={course.imageUrl}
            price={course.price}
            category={course.category}
            skillLevel={course.skillLevel}
            slug={course.slug}
            instructor={course.instructor}
            stats={course.stats}
            progress={course.progress}
            isEnrolled={course.isEnrolled}
            isNew={course.isNew}
            isTrending={course.isTrending}
            variant="default"
          />
        ))}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Learning</h3>
          <p className="text-2xl font-bold">{stats.totalHoursLearned} hours</p>
          <p className="text-sm opacity-75">Estimated time</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Courses</h3>
          <p className="text-2xl font-bold">{coursesCompleted} / {coursesEnrolled}</p>
          <p className="text-sm opacity-75">Completed</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Certificates</h3>
          <p className="text-2xl font-bold">{certificatesEarned}</p>
          <p className="text-sm opacity-75">Earned</p>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Next Goal</h3>
          <p className="text-2xl font-bold">{userData.level}</p>
          <p className="text-sm opacity-75">{userData.nextLevelXp - userData.xp} XP to go</p>
        </div>
      </div>
    </DashboardLayoutEnhanced>
  );
}
