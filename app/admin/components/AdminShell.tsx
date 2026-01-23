"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { Badge } from "@/components/ui/badge";

interface AdminShellProps {
  children?: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user } = useUser();

  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex w-full flex-1 flex-col">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1 md:hidden" />

          <div className="flex flex-1 items-center gap-3">
            <h1 className="text-lg font-semibold text-card-foreground">
              Admin Panel
            </h1>
            <Badge variant="outline" className="border-chart-1/30 bg-chart-1/5 text-chart-1">
              <Shield className="mr-1 h-3 w-3" />
              Admin Mode
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette */}
            <AdminCommandPalette />

            {/* Quick actions */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full flex-1 overflow-x-hidden bg-background p-4 md:p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
