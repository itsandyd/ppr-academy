"use client";

import { AppSidebarEnhanced } from "./app-sidebar-enhanced";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardPreferenceSwitcher } from "@/components/dashboard/dashboard-preference-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const pathname = usePathname();
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === "/home") return "Dashboard Overview";
    if (pathname === "/home/analytics") return "Analytics";
    if (pathname.startsWith("/store/")) {
      if (pathname.includes("/products")) return "Products";
      if (pathname.includes("/customers")) return "Customers";
      if (pathname.includes("/email-campaigns")) return "Email Campaigns";
      if (pathname.includes("/social")) return "Social Media";
      if (pathname.includes("/automations")) return "Automations";
      if (pathname.includes("/options")) return "Settings";
      if (pathname.includes("/settings")) return "Store Settings";
    }
    return "Creator Studio";
  };

  return (
    <SidebarProvider>
      <AppSidebarEnhanced />
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
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
                placeholder="Search your studio..." 
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
                3
              </Badge>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full bg-background">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}