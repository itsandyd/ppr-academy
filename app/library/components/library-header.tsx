"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Settings, X, BookOpen, Clock, Award, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter } from "next/navigation";
import { DashboardPreferenceSwitcher } from "@/components/dashboard/dashboard-preference-switcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

export function LibraryHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Get user's enrolled courses for search
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );
  
  // Mock notifications - replace with real data later
  const notifications = [
    {
      id: 1,
      type: "course",
      title: "New lesson available",
      description: "Advanced Mixing Techniques - Lesson 5 is now available",
      time: "2 hours ago",
      read: false,
      icon: BookOpen,
    },
    {
      id: 2,
      type: "achievement",
      title: "Achievement unlocked!",
      description: "You've completed 5 courses. Keep it up!",
      time: "1 day ago",
      read: false,
      icon: Award,
    },
    {
      id: 3,
      type: "reminder",
      title: "Continue learning",
      description: "You haven't studied in 3 days. Come back!",
      time: "3 days ago",
      read: true,
      icon: Clock,
    },
  ];
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/library") return "Library Overview";
    if (pathname === "/library/courses") return "My Courses";
    if (pathname === "/library/downloads") return "Downloads";
    if (pathname === "/library/coaching") return "Coaching Sessions";
    if (pathname === "/library/bundles") return "Bundles";
    if (pathname === "/library/progress") return "Progress";
    if (pathname === "/library/recent") return "Recent Activity";
    if (pathname.startsWith("/library/courses/")) return "Course Player";
    return "Library";
  };
  
  // Filter courses based on search query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredCourses = enrolledCourses?.filter((course: any) => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Handle navigation to course
  const handleCourseClick = (slug: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/${slug}`);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b border-border bg-white dark:bg-black">
        {/* Mobile sidebar trigger */}
        <SidebarTrigger className="-ml-1 md:hidden" />
        
        {/* Page title */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            {getPageTitle()}
          </h1>
        </div>

        {/* Search bar - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search your library..." 
              className="pl-10 bg-white dark:bg-black cursor-pointer"
              onClick={() => setSearchOpen(true)}
              readOnly
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Search button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Dashboard Switcher for hybrid users */}
          <DashboardPreferenceSwitcher />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-black">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'course' ? 'bg-blue-100 dark:bg-blue-900' :
                          notification.type === 'achievement' ? 'bg-green-100 dark:bg-green-900' :
                          'bg-orange-100 dark:bg-orange-900'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-sm font-medium">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-white dark:bg-black">
              <SheetHeader>
                <SheetTitle>Library Settings</SheetTitle>
                <SheetDescription>
                  Customize your learning experience
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Preferences */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Preferences</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Bell className="w-4 h-4 mr-2" />
                      Notification Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Course Display
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Progress Tracking
                    </Button>
                  </div>
                </div>

                {/* Learning Goals */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Learning Goals</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="w-4 h-4 mr-2" />
                      Daily Learning Reminder
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Award className="w-4 h-4 mr-2" />
                      Achievement Tracking
                    </Button>
                  </div>
                </div>

                {/* Account */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Account</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Search Your Library</DialogTitle>
            <DialogDescription>
              Find courses, lessons, and content you've enrolled in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-10 bg-white dark:bg-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchQuery.length > 0 ? (
                filteredCourses.length > 0 ? (
                  filteredCourses.map((course: any) => (
                    <button
                      key={course._id}
                      onClick={() => handleCourseClick(course.slug)}
                      className="w-full p-3 rounded-lg border border-border hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        {course.imageUrl && (
                          <Image
                            src={course.imageUrl}
                            alt={course.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {course.title}
                          </h4>
                          {course.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {course.description}
                            </p>
                          )}
                          {course.progress !== undefined && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{course.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No courses found matching "{searchQuery}"
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Start typing to search your library
                  </p>
                  {enrolledCourses && enrolledCourses.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}