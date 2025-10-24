"use client";

import { LibrarySidebar } from "./library-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardPreferenceSwitcher } from "@/components/dashboard/dashboard-preference-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bell, Search, Settings, X, CheckCheck, Package, Users, BarChart3, BookOpen, TrendingUp, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LibrarySidebarWrapperProps {
  children: React.ReactNode;
}

export function LibrarySidebarWrapper({ children }: LibrarySidebarWrapperProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New course update", message: "The Ultimate Guide to Mixing added 3 new lessons", time: "10 min ago", read: false },
    { id: 2, title: "Coaching reminder", message: "Your coaching session starts in 1 hour", time: "50 min ago", read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/library") return "Library";
    if (pathname === "/library/courses") return "Courses";
    if (pathname === "/library/downloads") return "Downloads";
    if (pathname === "/library/coaching") return "Coaching";
    if (pathname === "/library/bundles") return "Bundles";
    if (pathname === "/library/progress") return "Progress";
    if (pathname === "/library/recent") return "Activity";
    if (pathname === "/library/share") return "Share Tracks";
    if (pathname === "/library/showcase") return "Showcase";
    if (pathname.startsWith("/library/courses/")) return "Course";
    return "Library";
  };

  return (
    <SidebarProvider>
      <LibrarySidebar />
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
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
                className="pl-10 bg-white dark:bg-black"
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
                <div className="flex items-center justify-between px-4 py-3">
                  <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <>
                    {notifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={`px-4 py-3 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground">{notification.title}</p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                      View all notifications
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full bg-white dark:bg-black">
          {children}
        </div>
      </main>

      {/* Mobile Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="bg-white dark:bg-black sm:max-w-2xl p-0 gap-0">
          <div className="p-6 pb-4">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Search Your Library</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search courses, downloads, coaching..." 
                className="pl-11 py-6 text-base bg-background border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="px-6 pb-6 max-h-96 overflow-y-auto">
            {!searchQuery ? (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSearchOpen(false);
                        window.location.href = '/library/courses';
                      }}
                    >
                      <BookOpen className="w-4 h-4 mr-3 text-chart-1" />
                      My Courses
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSearchOpen(false);
                        window.location.href = '/library/downloads';
                      }}
                    >
                      <Package className="w-4 h-4 mr-3 text-chart-3" />
                      Downloads
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSearchOpen(false);
                        window.location.href = '/library/coaching';
                      }}
                    >
                      <Users className="w-4 h-4 mr-3 text-chart-2" />
                      Coaching Sessions
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSearchOpen(false);
                        window.location.href = '/library/progress';
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-3 text-chart-4" />
                      My Progress
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSearchOpen(false);
                        window.location.href = '/library/showcase';
                      }}
                    >
                      <Music className="w-4 h-4 mr-3 text-chart-5" />
                      Music Showcase
                    </Button>
                  </div>
                </div>

                {/* Recent Items */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Recently Accessed</h3>
                  <div className="space-y-1">
                    <Card className="p-3 hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-1/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-chart-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">Music Production Mastery</p>
                          <p className="text-xs text-muted-foreground">Course • 67% complete</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-3/10 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-chart-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">EDM Vocal Sample Pack</p>
                          <p className="text-xs text-muted-foreground">Download • 3 days ago</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-4/10 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-chart-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">1-on-1 Coaching Session</p>
                          <p className="text-xs text-muted-foreground">Coaching • Last week</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Search Results</h3>
                  <div className="space-y-2">
                    <Card className="p-3 hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-chart-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Music Production Basics</p>
                          <p className="text-xs text-muted-foreground">Course • 45% Complete</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-chart-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Mixing Template Pack</p>
                          <p className="text-xs text-muted-foreground">Download</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Real search results will appear here
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
