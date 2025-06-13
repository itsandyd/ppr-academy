import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Plus,
  Eye,
  Edit,
  DollarSign,
  BarChart
} from "lucide-react";
import CourseCard from "@/components/course-card";
import type { User, CourseWithDetails } from "@/lib/types";
import { generateSlug } from "@/lib/utils";

interface CreatorDashboardProps {
  user: User;
  userCourses: CourseWithDetails[];
  coachingSessions: any[];
  dashboardStats: {
    enrolledCourses: number;
    completedCourses: number;
    createdCourses: number;
    totalStudents: number;
  };
}

export function CreatorDashboard({ 
  user, 
  userCourses, 
  coachingSessions,
  dashboardStats 
}: CreatorDashboardProps) {
  const totalRevenue = userCourses.reduce((sum, course) => {
    const revenue = (course.price || 0) * (course._count?.enrollments || 0);
    return sum + revenue;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          Welcome back, {user.firstName || user.email}!
        </h1>
        <p className="text-slate-600">
          Manage your courses and track your impact
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Created Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.createdCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Student activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-8">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coaching">Coaching</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Courses</h2>
            <Link href="/create-course">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>

          {userCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="relative h-48 bg-slate-200">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                        <span className="text-white text-4xl font-bold">
                          {course.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {course.isPublished ? (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          Published
                        </span>
                      ) : (
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Students</span>
                        <span className="font-semibold">{course._count?.enrollments || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Revenue</span>
                        <span className="font-semibold">
                          ${((course.price || 0) * (course._count?.enrollments || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/courses/${generateSlug(course.title)}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/edit-course/${course.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-slate-600 mb-6">
                  Create your first course and start teaching
                </p>
                <Link href="/create-course">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-slate-600">
                Detailed insights about your courses and students will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaching" className="space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Coaching Sessions</h2>
            <Link href="/coaching/setup">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Set Up Coaching
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No coaching sessions yet</h3>
              <p className="text-slate-600 mb-6">
                Offer 1-on-1 coaching to help students directly
              </p>
              <Link href="/coaching/setup">
                <Button variant="outline">
                  Learn About Coaching
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 