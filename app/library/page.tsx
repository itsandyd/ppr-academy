"use client";

import { CourseCardEnhanced } from "@/components/ui/course-card-enhanced";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  Target,
  Users,
  Star,
  Play,
  Calendar,
  Bell,
  ChevronRight,
  Loader2
} from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function LibraryPage() {
  const { user } = useUser();
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Fetch user's enrolled courses
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch user's library stats
  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch recent activity
  const recentActivity = useQuery(
    api.userLibrary.getUserRecentActivity,
    convexUser?.clerkId ? { userId: convexUser.clerkId, limit: 5 } : "skip"
  );

  // User display data
  const userData = {
    name: user?.firstName || "Student",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl,
    level: "Music Producer Level 3",
    xp: (userStats?.coursesCompleted || 0) * 100 + (userStats?.totalHoursLearned || 0) * 10,
    nextLevelXp: 3000,
  };

  // Use real stats or defaults
  const stats = userStats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHoursLearned: 0,
    currentStreak: 0,
    certificatesEarned: 0,
  };

  const nextMilestone = {
    title: "Complete 5 Courses",
    progress: stats.coursesCompleted,
    target: 5,
  };

  const levelProgress = (userData.xp / userData.nextLevelXp) * 100;

  // Loading state
  if (
    enrolledCourses === undefined ||
    userStats === undefined ||
    recentActivity === undefined
  ) {
    return (
      <div className="space-y-8">
        <Card className="p-8">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {userData.name}! 👋
              </h1>
              <p className="text-white/80">
                Ready to continue your music production journey?
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white/20">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="text-2xl">
                  {userData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{userData.level}</span>
              <span className="text-sm text-white/80">
                {userData.xp} / {userData.nextLevelXp} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-2 bg-white/20" />
          </div>

          <div className="flex flex-wrap gap-4">
            <Button className="bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm text-white">
              <Play className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Courses Enrolled
                </p>
                <p className="text-2xl font-bold">{stats.coursesEnrolled}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hours Learned
                </p>
                <p className="text-2xl font-bold">{stats.totalHoursLearned}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Streak
                </p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Content Tabs */}
          <Tabs defaultValue="continue" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="continue">Continue</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="continue" className="space-y-6">
              {enrolledCourses && enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrolledCourses.map((course: any) => (
                    <CourseCardEnhanced
                      key={course._id}
                      id={course._id}
                      title={course.title}
                      description={course.description || ""}
                      imageUrl={course.imageUrl || ""}
                      price={course.price || 0}
                      category={course.category || "Course"}
                      skillLevel={course.skillLevel || "Beginner"}
                      slug={course.slug || ""}
                      instructor={{
                        name: "Instructor",
                        avatar: "",
                        verified: true,
                      }}
                      stats={{
                        students: 0,
                        lessons: 0,
                        duration: "0h 0m",
                        rating: 0,
                        reviews: 0,
                      }}
                      progress={course.progress || 0}
                      isEnrolled={true}
                      isNew={false}
                      isTrending={false}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Enrolled Courses Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your learning journey by enrolling in a course.
                  </p>
                  <Button>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommended" className="space-y-6">
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Personalized Recommendations</h3>
                <p className="text-muted-foreground">
                  Based on your learning progress, we'll recommend courses tailored for you.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Your Favorites</h3>
                <p className="text-muted-foreground">
                  Courses you've bookmarked will appear here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Milestone */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Next Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{nextMilestone.title}</span>
                    <span className="text-muted-foreground">
                      {nextMilestone.progress}/{nextMilestone.target}
                    </span>
                  </div>
                  <Progress 
                    value={(nextMilestone.progress / nextMilestone.target) * 100} 
                    className="h-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {nextMilestone.progress >= nextMilestone.target
                    ? "🎉 Milestone achieved! Great work!"
                    : `Complete ${nextMilestone.target - nextMilestone.progress} more ${nextMilestone.target - nextMilestone.progress === 1 ? "course" : "courses"} to unlock your next achievement!`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        {activity.type === "completed_lesson" ? (
                          <Award className="w-4 h-4 text-white" />
                        ) : activity.type === "started_course" ? (
                          <Play className="w-4 h-4 text-white" />
                        ) : (
                          <Award className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.courseName}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Study Time
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse New Courses
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2" />
                View Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}