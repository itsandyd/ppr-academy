"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { DashboardPreferenceSwitcher } from "@/components/dashboard/dashboard-preference-switcher";

export function LibraryHeader() {
  const pathname = usePathname();
  
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

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b border-border bg-card">
      {/* Mobile sidebar trigger */}
      <SidebarTrigger className="-ml-1 md:hidden" />
      
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-card-foreground">
          {getPageTitle()}
        </h1>
      </div>

      {/* Search bar - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search your library..." 
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Search button for mobile */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-4 h-4" />
        </Button>

        {/* Dashboard Switcher for hybrid users */}
        <DashboardPreferenceSwitcher />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
          >
            2
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}