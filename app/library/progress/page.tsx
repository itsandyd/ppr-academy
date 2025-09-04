"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  Book,
  BarChart3,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export default function LibraryProgressPage() {
  const { user } = useUser();
  
  const courses = useQuery(
    api.library.getUserCourses,
    user?.id ? { userId: user.id } : "skip"
  );

  const purchases = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  );

  // Calculate progress statistics
  const stats = {
    totalCourses: courses?.length || 0,
    completedCourses: courses?.filter(c => (c.progress || 0) >= 100).length || 0,
    inProgressCourses: courses?.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length || 0,
    avgProgress: courses?.length ? 
      Math.round((courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length)) : 0,
    totalSpent: purchases?.reduce((sum, p) => sum + p.amount, 0) || 0,
    thisWeekActivity: 0, // Would need to implement session tracking
  };

  // Learning streak calculation (placeholder)
  const learningStreak = 7; // days

  // Recent achievements (placeholder)
  const achievements = [
    { title: "First Course Completed", description: "Completed your first course", date: new Date(), icon: Award },
    { title: "Learning Streak", description: "7 days of consistent learning", date: new Date(), icon: Target },
    { title: "Fast Learner", description: "Completed 3 chapters in one day", date: new Date(), icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Learning Progress</h1>
        <p className="text-muted-foreground mt-2">
          Track your learning journey and celebrate your achievements
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Average across {stats.totalCourses} courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCourses > 0 ? 
                Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total learning investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Book className="w-5 h-5" />
              <span>Course Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {courses && courses.length > 0 ? (
              courses.map((course) => (
                <div key={course._id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {course.storeName}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground ml-4">
                      {course.progress || 0}%
                    </div>
                  </div>
                  <Progress value={course.progress || 0} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {course.lastAccessedAt ? 
                        `Last accessed ${formatDistanceToNow(new Date(course.lastAccessedAt), { addSuffix: true })}` :
                        "Not started yet"
                      }
                    </span>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/library/courses/${course.slug}`}>
                        Continue
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start learning to see your progress here
                </p>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-background rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <achievement.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(achievement.date, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Learning Activity (placeholder for future charts) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Learning Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">Activity Charts Coming Soon</h3>
            <p className="text-sm">
              We're working on detailed analytics to help you track your learning patterns
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Weekly Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Book className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Complete 3 chapters</h3>
                  <p className="text-sm text-muted-foreground">This week's learning goal</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">1/3</div>
                <Progress value={33} className="w-20 h-2 mt-1" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Study 5 hours</h3>
                  <p className="text-sm text-muted-foreground">Weekly time commitment</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">2.5/5h</div>
                <Progress value={50} className="w-20 h-2 mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
