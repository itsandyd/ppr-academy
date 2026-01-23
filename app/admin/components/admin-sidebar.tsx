"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  MessageSquare,
  Sparkles,
  Settings,
  Terminal,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle as ThemeToggle } from "@/components/mode-toggle";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  {
    title: "Management",
    href: "/admin/management",
    icon: Users,
    color: "text-purple-500",
  },
  {
    title: "Finance",
    href: "/admin/finance",
    icon: DollarSign,
    color: "text-green-500",
  },
  {
    title: "Communications",
    href: "/admin/communications",
    icon: MessageSquare,
    color: "text-orange-500",
  },
  {
    title: "AI Platform",
    href: "/admin/ai",
    icon: Sparkles,
    color: "text-pink-500",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    color: "text-slate-500",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/analytics";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar className="border-r border-border">
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/admin" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3 shadow-lg transition-transform group-hover:scale-105">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">Admin</span>
            <p className="text-xs text-muted-foreground">Mission Control</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <item.icon className={cn("h-5 w-5", active ? "" : item.color)} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="space-y-3 border-t border-border p-3">
        {/* Back to Dashboard */}
        <Button variant="ghost" asChild className="w-full justify-start">
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        {/* User Menu & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.firstName || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
