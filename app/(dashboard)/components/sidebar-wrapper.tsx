"use client";

import { AppSidebarEnhanced } from "./app-sidebar-enhanced";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { DashboardPreferenceSwitcher } from "@/components/dashboard/dashboard-preference-switcher";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  return (
    <SidebarProvider>
      <AppSidebarEnhanced />
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <div className="flex-1" />
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/70 rounded-md flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">♪</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Creator Studio
              </h1>
            </div>
            {/* Dashboard Switcher for hybrid users */}
            <DashboardPreferenceSwitcher />
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