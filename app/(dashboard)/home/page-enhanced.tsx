"use client";

import { DashboardLayoutEnhanced } from "@/components/ui/dashboard-layout-enhanced";
import { CourseCardEnhanced } from "@/components/ui/course-card-enhanced";
import { useUser } from "@clerk/nextjs";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardHomeEnhanced() {
  const { user } = useUser();

  // Mock data - replace with real data from your Convex queries
  const userData = {
    name: user?.firstName || "Student",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl,
    level: "Music Producer Level 3",
    xp: 2450,
    nextLevelXp: 3000,
  };

  const stats = {
    coursesEnrolled: 8,
    coursesCompleted: 3,
    totalHoursLearned: 47,
    currentStreak: 12,
    certificatesEarned: 3,
    nextMilestone: {
      title: "Complete 5 Courses",
      progress: 3,
      target: 5,
    },
  };

  const recentActivity = [
    {
      id: "1",
      type: "completed_lesson" as const,
      title: "Finished 'Advanced EQ Techniques'",
      courseName: "Mixing Masterclass",
      timestamp: "2 hours ago",
    },
    {
      id: "2", 
      type: "started_course" as const,
      title: "Started new course",
      courseName: "Beat Making Fundamentals",
      timestamp: "1 day ago",
    },
    {
      id: "3",
      type: "earned_certificate" as const,
      title: "Earned certificate",
      courseName: "Music Theory Basics",
      timestamp: "3 days ago",
    },
  ];

  // Mock course data for the "Continue Learning" section
  const continueLearningCourses = [
    {
      id: "1",
      title: "Advanced Mixing Techniques",
      description: "Master the art of professional mixing with industry-standard techniques and tools.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop",
      price: 99,
      category: "Mixing",
      skillLevel: "Intermediate" as const,
      slug: "advanced-mixing-techniques",
      instructor: {
        name: "Alex Johnson",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
        verified: true,
      },
      stats: {
        students: 1250,
        lessons: 24,
        duration: "8h 30m",
        rating: 4.8,
        reviews: 156,
      },
      progress: 65,
      isEnrolled: true,
      isNew: false,
      isTrending: true,
    },
    {
      id: "2",
      title: "Beat Making Fundamentals",
      description: "Learn the basics of creating beats from scratch using modern production techniques.",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
      price: 79,
      category: "Beat Making",
      skillLevel: "Beginner" as const,
      slug: "beat-making-fundamentals",
      instructor: {
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b639?w=32&h=32&fit=crop&crop=face",
        verified: true,
      },
      stats: {
        students: 2100,
        lessons: 18,
        duration: "6h 45m",
        rating: 4.9,
        reviews: 203,
      },
      progress: 25,
      isEnrolled: true,
      isNew: true,
      isTrending: false,
    },
    {
      id: "3",
      title: "Vocal Production Masterclass",
      description: "Professional vocal recording, editing, and production techniques for modern music.",
      imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
      price: 129,
      category: "Vocal Production",
      skillLevel: "Advanced" as const,
      slug: "vocal-production-masterclass",
      instructor: {
        name: "Mike Rodriguez",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
        verified: true,
      },
      stats: {
        students: 890,
        lessons: 32,
        duration: "12h 15m",
        rating: 4.7,
        reviews: 98,
      },
      progress: 0,
      isEnrolled: true,
      isNew: false,
      isTrending: false,
    },
  ];

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
          <h3 className="text-sm font-medium opacity-90">This Week</h3>
          <p className="text-2xl font-bold">12.5 hours</p>
          <p className="text-sm opacity-75">Learning time</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Completed</h3>
          <p className="text-2xl font-bold">8 lessons</p>
          <p className="text-sm opacity-75">This month</p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Streak</h3>
          <p className="text-2xl font-bold">{stats.currentStreak} days</p>
          <p className="text-sm opacity-75">Keep it up!</p>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90">Next Goal</h3>
          <p className="text-2xl font-bold">Level 4</p>
          <p className="text-sm opacity-75">{userData.nextLevelXp - userData.xp} XP to go</p>
        </div>
      </div>
    </DashboardLayoutEnhanced>
  );
}
