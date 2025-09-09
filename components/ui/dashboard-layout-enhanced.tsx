"use client";

import { FC, ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Target,
  Filter,
  Grid3X3,
  List,
  Bell,
  Settings,
  User,
  ChevronDown,
  Play,
  Bookmark,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  totalHoursLearned: number;
  currentStreak: number;
  certificatesEarned: number;
  nextMilestone: {
    title: string;
    progress: number;
    target: number;
  };
}

interface RecentActivity {
  id: string;
  type: "completed_lesson" | "started_course" | "earned_certificate";
  title: string;
  courseName: string;
  timestamp: string;
  progress?: number;
}

interface DashboardLayoutProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    level: string;
    xp: number;
    nextLevelXp: number;
  };
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  children: ReactNode;
  notifications?: number;
}

export const DashboardLayoutEnhanced: FC<DashboardLayoutProps> = ({
  user,
  stats,
  recentActivity,
  children,
  notifications = 0,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const levelProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              PPR Academy
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" size="sm" className="font-medium">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="font-medium">
                My Courses
              </Button>
              <Button variant="ghost" size="sm" className="font-medium">
                Browse
              </Button>
              <Button variant="ghost" size="sm" className="font-medium">
                Progress
              </Button>
            </nav>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search courses, instructors..."
                className="pl-10 w-80 bg-gray-50/50 border-gray-200/50 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.level}</div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.name}! 👋
                </h1>
                <p className="text-white/80 mb-6">
                  Ready to continue your music production journey?
                </p>
                
                {/* Level Progress */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{user.level}</span>
                    <span className="text-sm text-white/80">
                      {user.xp} / {user.nextLevelXp} XP
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-2 bg-white/20" />
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button className="bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm">
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

            {/* Content Tabs */}
            <Tabs defaultValue="continue" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="continue">Continue</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>All Levels</DropdownMenuItem>
                      <DropdownMenuItem>Beginner</DropdownMenuItem>
                      <DropdownMenuItem>Intermediate</DropdownMenuItem>
                      <DropdownMenuItem>Advanced</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <TabsContent value="continue" className="space-y-6">
                {children}
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
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                      <span className="font-medium">{stats.nextMilestone.title}</span>
                      <span className="text-muted-foreground">
                        {stats.nextMilestone.progress}/{stats.nextMilestone.target}
                      </span>
                    </div>
                    <Progress 
                      value={(stats.nextMilestone.progress / stats.nextMilestone.target) * 100} 
                      className="h-2"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete {stats.nextMilestone.target - stats.nextMilestone.progress} more lessons to unlock your next achievement!
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
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        {activity.type === "completed_lesson" && <Award className="w-4 h-4 text-white" />}
                        {activity.type === "started_course" && <Play className="w-4 h-4 text-white" />}
                        {activity.type === "earned_certificate" && <Award className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.courseName}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
    </div>
  );
};
