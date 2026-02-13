"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DiscordConnectionCard } from "@/components/discord/DiscordConnectionCard";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  PlayCircle, 
  Star,
  Calendar,
  Award,
  Plus,
  Eye,
  Edit,
  Settings,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  User as UserIcon,
  GraduationCap,
  Video,
  UserCheck,
  BarChart,
  DollarSign,
  Loader2
} from "lucide-react";
import CourseCard from "@/components/course-card";
import CoachScheduleManager from "@/components/coach-schedule-manager";
import type { User, CourseWithDetails, EnrollmentWithCourse } from "@/lib/types";
import { generateSlug } from "@/lib/utils";
import { initializeDiscordAuth, getUserCoachProfile } from "@/app/actions/coaching-actions";

interface UnifiedDashboardProps {
  user: User;
  enrollments: EnrollmentWithCourse[];
  userCourses: CourseWithDetails[];
  dashboardStats: {
    enrolledCourses: number;
    completedCourses: number;
    createdCourses: number;
    totalStudents: number;
  };
  featuredCourses: CourseWithDetails[];
  popularCourses: CourseWithDetails[];
}

export default function UnifiedDashboard({ 
  user, 
  enrollments, 
  userCourses,
  dashboardStats,
  featuredCourses,
  popularCourses 
}: UnifiedDashboardProps) {
  const [isConnectingDiscord, setIsConnectingDiscord] = useState(false);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [isLoadingCoachProfile, setIsLoadingCoachProfile] = useState(true);
  const { toast } = useToast();

  // Load coach profile on component mount
  useEffect(() => {
    const loadCoachProfile = async () => {
      try {
        const result = await getUserCoachProfile();
        if (result.success && result.profile) {
          setCoachProfile(result.profile);
        }
      } catch (error) {
        console.error("Error loading coach profile:", error);
      } finally {
        setIsLoadingCoachProfile(false);
      }
    };

    loadCoachProfile();
  }, []);

  const handleDiscordAuth = async () => {
    setIsConnectingDiscord(true);
    try {
      const result = await initializeDiscordAuth();
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize Discord authentication",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Discord auth error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Discord authentication",
        variant: "destructive",
      });
    } finally {
      setIsConnectingDiscord(false);
    }
  };

  // Revenue should come from actual purchase amounts, not price * enrollment count.
  // price * count is wrong when course prices change after enrollments.
  const totalRevenue = 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          Welcome back, {user.firstName || user.email}!
        </h1>
        <p className="text-slate-600">
          Manage your learning, teaching, and coaching activities
        </p>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="student" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="student" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Student
          </TabsTrigger>
          <TabsTrigger value="creator" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Creator
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Coach
            {coachProfile?.isActive && (
              <Badge variant="secondary" className="ml-1 text-xs">Active</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Student Tab */}
        <TabsContent value="student" className="space-y-6">
          {/* Student Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.enrolledCourses}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.completedCourses}</div>
                <p className="text-xs text-muted-foreground">Courses finished</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0h</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Days</p>
              </CardContent>
            </Card>
          </div>

          {/* Continue Learning */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Continue Learning</h2>
            {enrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.slice(0, 6).map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white/80" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {enrollment.course.title}
                      </h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-slate-600 mb-1">
                          <span>Progress</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                      </div>
                      <Link href={`/courses/${generateSlug(enrollment.course.title)}`}>
                        <Button className="w-full">Continue</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                  <p className="text-slate-600 mb-6">Start learning by enrolling in a course</p>
                  <Link href="/courses">
                    <Button>Browse Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Creator Tab */}
        <TabsContent value="creator" className="space-y-6">
          {/* Creator Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Created Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.createdCourses}</div>
                <p className="text-xs text-muted-foreground">Active courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">Enrolled learners</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Activity rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Course Management */}
          <div className="flex justify-between items-center">
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
                    <div className="absolute top-4 right-4">
                      {course.isPublished ? (
                        <Badge className="bg-green-500">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
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
                          $0.00
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.slug || generateSlug(course.title)}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.slug || generateSlug(course.title)}`} className="flex-1">
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
                <p className="text-slate-600 mb-6">Create your first course and start teaching</p>
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

        {/* Coach Tab */}
        <TabsContent value="coach" className="space-y-6">
          {isLoadingCoachProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading coach profile...</span>
            </div>
          ) : coachProfile?.isActive ? (
            <>
              {/* Active Coach Dashboard */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-dark">Coaching Dashboard</h2>
                  <Badge className="bg-green-500">Active Coach</Badge>
                </div>
                <p className="text-slate-600">
                  Manage your coaching sessions and schedule
                </p>
              </div>

              {/* Coach Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <p className="text-sm text-slate-600">Total Sessions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-green-600">${coachProfile.basePrice}</div>
                    <p className="text-sm text-slate-600">Hourly Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <p className="text-sm text-slate-600">Students</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-yellow-600">5.0</div>
                    <p className="text-sm text-slate-600">Rating</p>
                  </CardContent>
                </Card>
              </div>

              {/* Coach Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    Your Coaching Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-slate-900">Specialty:</span>
                        <span className="ml-2 text-slate-600">{coachProfile.category}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Title:</span>
                        <span className="ml-2 text-slate-600">{coachProfile.title}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Location:</span>
                        <span className="ml-2 text-slate-600">{coachProfile.location || 'Remote'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-slate-900">Timezone:</span>
                        <span className="ml-2 text-slate-600">{coachProfile.timezone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Available Days:</span>
                        <span className="ml-2 text-slate-600">{coachProfile.availableDays || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">Available Hours:</span>
                        <span className="ml-2 text-slate-600">{coachProfile.availableHours || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Manager */}
              <CoachScheduleManager />
            </>
          ) : (
            <>
              {/* Non-Coach Dashboard */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-dark mb-2">Coaching Dashboard</h2>
                <p className="text-slate-600">
                  Apply to become a coach and start offering 1-on-1 sessions
                </p>
              </div>

              {/* Coach Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-slate-400">-</div>
                    <p className="text-sm text-slate-600">Total Sessions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-slate-400">-</div>
                    <p className="text-sm text-slate-600">Hourly Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-slate-400">-</div>
                    <p className="text-sm text-slate-600">Students</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-slate-400">-</div>
                    <p className="text-sm text-slate-600">Rating</p>
                  </CardContent>
                </Card>
              </div>

              {/* Coaching Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Become a Coach
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600">
                      Share your expertise with students through personalized 1-on-1 coaching sessions.
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Set your own rates and schedule</li>
                      <li>• Connect with motivated students</li>
                      <li>• Build your teaching reputation</li>
                      <li>• Earn additional income</li>
                    </ul>
                    <Link href="/become-a-coach">
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Apply to Become a Coach
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Find Coaches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600">
                      Book sessions with experienced coaches to accelerate your learning.
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Personalized feedback and guidance</li>
                      <li>• Real-time problem solving</li>
                      <li>• Industry insights and tips</li>
                      <li>• Flexible scheduling</li>
                    </ul>
                    <Link href="/coaching">
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        Browse Coaches
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-dark mb-2">Account Settings</h2>
            <p className="text-slate-600">
              Manage your account information and integrations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.imageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-white text-lg">
                      {user.firstName?.[0] || user.email?.[0] || 'U'}
                      {user.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {user.firstName || ''} {user.lastName || ''}
                    </h3>
                    <p className="text-slate-600">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">Student</Badge>
                      {userCourses.length > 0 && (
                        <Badge variant="outline">Creator</Badge>
                      )}
                      {coachProfile?.isActive && (
                        <Badge className="bg-green-500">Coach</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discord Integration - Using new component */}
            <DiscordConnectionCard />

            {/* Learning Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Learning Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{dashboardStats.enrolledCourses}</div>
                    <p className="text-sm text-slate-600">Courses Enrolled</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{dashboardStats.completedCourses}</div>
                    <p className="text-sm text-slate-600">Courses Completed</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-slate-600">
                    Keep up the great work! Continue learning to unlock achievements and build your skills.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/courses">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </Link>
                
                <Link href="/coaching">
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="w-4 h-4 mr-2" />
                    Find Coaches
                  </Button>
                </Link>

                {!coachProfile?.isActive && (
                  <Link href="/become-a-coach">
                    <Button variant="outline" className="w-full justify-start">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Apply to Become a Coach
                    </Button>
                  </Link>
                )}

                <Link href="/create-course">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Create a Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 