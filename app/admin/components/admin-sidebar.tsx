"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Shield,
  BarChart3,
  Settings,
  Database,
  Sparkles,
  CreditCard,
  Flag,
  TrendingUp,
  Package,
  DollarSign,
  Activity,
  Mail,
  Bell,
  Server,
  Terminal,
  ChevronRight,
  Zap,
  Lightbulb,
  Wand2,
  GitCommit,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle as ThemeToggle } from "@/components/mode-toggle";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Platform overview",
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        description: "Deep insights",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        description: "User management",
      },
      {
        title: "Products",
        href: "/admin/products",
        icon: Package,
        description: "All products",
      },
      {
        title: "Creators",
        href: "/admin/creators",
        icon: TrendingUp,
        description: "Creator success",
        badge: "NEW",
        badgeColor: "bg-green-500",
      },
      {
        title: "Moderation",
        href: "/admin/moderation",
        icon: Shield,
        description: "Content review",
        badge: "3",
        badgeColor: "bg-destructive",
      },
      {
        title: "Reports",
        href: "/admin/reports",
        icon: Flag,
        description: "User reports",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        title: "Revenue",
        href: "/admin/revenue",
        icon: DollarSign,
        description: "Financial data",
      },
      {
        title: "Activity",
        href: "/admin/activity",
        icon: Activity,
        description: "Admin audit log",
        badge: "NEW",
        badgeColor: "bg-blue-500",
      },
      {
        title: "Conversions",
        href: "/admin/conversions",
        icon: TrendingUp,
        description: "Funnel optimization",
        badge: "NEW",
        badgeColor: "bg-green-500",
      },
    ],
  },
  {
    title: "Communications",
    items: [
      {
        title: "Email Marketing",
        href: "/admin/emails",
        icon: Mail,
        description: "Campaigns",
      },
      {
        title: "Email Monitor",
        href: "/admin/email-monitoring",
        icon: Server,
        description: "Deliverability",
      },
      {
        title: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        description: "Push alerts",
      },
      {
        title: "Changelog",
        href: "/admin/changelog",
        icon: GitCommit,
        description: "Release notes",
        badge: "NEW",
        badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
      },
    ],
  },
  {
    title: "AI Platform",
    items: [
      {
        title: "Course Builder",
        href: "/admin/course-builder",
        icon: Wand2,
        description: "Batch AI course generation",
        badge: "NEW",
        badgeColor: "bg-gradient-to-r from-violet-500 to-purple-600",
      },
      {
        title: "AI Flywheel",
        href: "/admin/ai-flywheel",
        icon: TrendingUp,
        description: "Self-improving AI",
        badge: "✨",
        badgeColor: "bg-gradient-to-r from-chart-1 to-chart-2",
      },
      {
        title: "Feature Discovery",
        href: "/admin/feature-discovery",
        icon: Lightbulb,
        description: "Course → Product ideas",
      },
      {
        title: "AI Studio",
        href: "/admin/ai-tools",
        icon: Sparkles,
        description: "AI generation",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Configuration",
        href: "/admin/settings",
        icon: Settings,
        description: "Platform settings",
      },
    ],
  },
];

const legacyItems: NavItem[] = [
  {
    title: "Embeddings",
    href: "/admin/embeddings",
    icon: Database,
  },
  {
    title: "Generate Samples",
    href: "/admin/generate-samples",
    icon: Sparkles,
  },
  {
    title: "Seed Credits",
    href: "/admin/seed-credits",
    icon: CreditCard,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <Sidebar className="border-r border-border">
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/admin" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3 shadow-lg transition-transform group-hover:scale-110">
            <Terminal className="h-5 w-5 text-white" />
            <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-chart-1" />
          </div>
          <div>
            <span className="text-lg font-bold">Mission Control</span>
            <p className="text-xs text-muted-foreground">PPR Academy Admin</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3">
        {/* Navigation Sections */}
        {navSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href} className="group relative">
                          <Icon className={cn("h-5 w-5", isActive ? "text-chart-1" : "text-muted-foreground")} />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">{item.title}</span>
                            {item.description && (
                              <p className="truncate text-[11px] text-muted-foreground/70">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                                item.badgeColor || "bg-chart-1"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Legacy Tools - Collapsed */}
        <SidebarGroup className="mt-4">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              Legacy Tools
            </summary>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className="space-y-1">
                {legacyItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href} className="opacity-60 hover:opacity-100">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </details>
        </SidebarGroup>

        {/* System Status Widget */}
        <SidebarGroup className="mt-6">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold">System Status</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">API</span>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Database</span>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Payments</span>
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                      Operational
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  userButtonPopoverCard: "bg-white dark:bg-zinc-900",
                  userButtonPopoverActionButton: "hover:bg-muted",
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
