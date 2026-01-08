"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Download,
  Award,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Settings,
  Music,
  Plus,
  Sparkles,
  Target,
  Zap,
  Instagram,
  StickyNote,
  Rocket,
  ArrowRight,
  DollarSign,
  Mail,
  Video,
  Handshake,
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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { ModeToggle as ThemeToggle } from "@/components/mode-toggle";

type DashboardMode = "learn" | "create";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  highlight?: boolean;
}

interface DashboardSidebarProps {
  mode: DashboardMode;
  onModeChange?: (mode: DashboardMode) => void;
}

const learnLinks: SidebarLink[] = [
  { href: "/dashboard?mode=learn", label: "Dashboard", icon: Home, color: "text-purple-500" },
  {
    href: "/dashboard/courses?mode=learn",
    label: "My Courses",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    href: "/dashboard/products?mode=learn",
    label: "My Products",
    icon: Package,
    color: "text-green-500",
  },
  {
    href: "/dashboard/downloads?mode=learn",
    label: "Downloads",
    icon: Download,
    color: "text-orange-500",
  },
  {
    href: "/dashboard/coaching?mode=learn",
    label: "My Sessions",
    icon: Video,
    color: "text-teal-500",
  },
  {
    href: "/dashboard/notes?mode=learn",
    label: "My Notes",
    icon: StickyNote,
    color: "text-amber-500",
  },
  {
    href: "/dashboard/certificates?mode=learn",
    label: "Certificates",
    icon: Award,
    color: "text-yellow-500",
  },
];

const createLinks: SidebarLink[] = [
  { href: "/dashboard?mode=create", label: "Dashboard", icon: Home, color: "text-purple-500" },
  {
    href: "/dashboard/products?mode=create",
    label: "My Products",
    icon: Package,
    color: "text-blue-500",
  },
  {
    href: "/dashboard/courses?mode=create",
    label: "My Courses",
    icon: BookOpen,
    color: "text-green-500",
  },
  {
    href: "/dashboard/coaching/sessions",
    label: "Coaching",
    icon: Video,
    color: "text-teal-500",
  },
  {
    href: "/dashboard/notes?mode=create",
    label: "AI Notes",
    icon: StickyNote,
    color: "text-amber-500",
  },
  {
    href: "/dashboard/social?mode=create",
    label: "Social Media",
    icon: Instagram,
    color: "text-pink-500",
  },
  {
    href: "/dashboard/emails?mode=create",
    label: "Email Campaigns",
    icon: Mail,
    color: "text-cyan-500",
  },
  {
    href: "/dashboard/create",
    label: "Create New",
    icon: Plus,
    color: "text-indigo-500",
    highlight: true,
  },
  {
    href: "/dashboard/analytics?mode=create",
    label: "Analytics",
    icon: BarChart3,
    color: "text-orange-500",
  },
  {
    href: "/dashboard/students?mode=create",
    label: "Students",
    icon: Users,
    color: "text-emerald-500",
  },
  {
    href: "/dashboard/affiliates?mode=create",
    label: "Affiliates",
    icon: Handshake,
    color: "text-rose-500",
  },
];

export function DashboardSidebar({ mode, onModeChange }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const links = mode === "learn" ? learnLinks : createLinks;
  const savePreference = useMutation(api.users.setDashboardPreference);

  const handleModeChange = async (newMode: DashboardMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      // Fallback: navigate directly
      router.push(`/dashboard?mode=${newMode}`);
    }

    // Save preference in background
    if (user?.id) {
      try {
        await savePreference({
          clerkId: user.id,
          preference: newMode,
        });
      } catch (error) {
        console.error("Failed to save preference:", error);
      }
    }
  };

  // Get user stats for sidebar widgets
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    mode === "learn" && convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  return (
    <Sidebar className="border-r border-border">
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 transition-transform group-hover:scale-110">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">PPR Academy</span>
            <p className="text-xs text-muted-foreground">
              {mode === "learn" ? "Learning Hub" : "Creator Studio"}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {links.map((link) => {
                const isActive =
                  pathname === link.href.split("?")[0] ||
                  (link.href.includes("/dashboard?mode=") && pathname === "/dashboard");

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={link.href}
                        className={cn(
                          "group relative",
                          link.highlight &&
                            !isActive &&
                            "border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                        )}
                      >
                        <link.icon className={cn("h-5 w-5", isActive ? "" : link.color)} />
                        <span className="font-medium">{link.label}</span>
                        {link.highlight && !isActive && (
                          <Sparkles className="ml-auto h-3 w-3 text-purple-500" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Learn mode: Progress widget */}
        {mode === "learn" && userStats && (
          <SidebarGroup className="mt-6">
            <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/10 to-chart-4/10">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-chart-1" />
                    <span className="text-sm font-semibold">Your Progress</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Courses Completed</span>
                      <span className="font-medium">
                        {userStats.coursesCompleted}/{userStats.coursesEnrolled}
                      </span>
                    </div>
                    <Progress
                      value={
                        userStats.coursesEnrolled > 0
                          ? (userStats.coursesCompleted / userStats.coursesEnrolled) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-2">
                    <div className="flex-1 text-center">
                      <p className="text-xl font-bold text-chart-1">
                        {userStats.totalHoursLearned}
                      </p>
                      <p className="text-xs text-muted-foreground">Hours</p>
                    </div>
                    <div className="flex-1 border-l border-border/50 text-center">
                      <p className="text-xl font-bold text-chart-4">{userStats.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroup>
        )}

        {/* Learn mode: Become a Creator CTA */}
        {mode === "learn" && (
          <SidebarGroup className="mt-4">
            <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-orange-500/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_50%)]" />
              <CardContent className="relative p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-bold">Become a Creator</span>
                      <p className="text-[10px] text-muted-foreground">Share your knowledge</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span>Earn from your music skills</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3 text-blue-500" />
                      <span>Sell courses, packs & presets</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 text-purple-500" />
                      <span>Build your audience</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleModeChange("create")}
                    size="sm"
                    className="group w-full border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <span>Start Creating</span>
                    <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </SidebarGroup>
        )}

        {/* Create mode: Quick create widget */}
        {mode === "create" && (
          <SidebarGroup className="mt-6">
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold">Quick Create</span>
                  </div>

                  <div className="space-y-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start text-xs"
                    >
                      <Link href="/dashboard/create/pack?type=sample-pack">
                        <Music className="mr-2 h-3 w-3" />
                        Sample Pack
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start text-xs"
                    >
                      <Link href="/dashboard/create/course?category=course">
                        <BookOpen className="mr-2 h-3 w-3" />
                        Course
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start text-xs"
                    >
                      <Link href="/dashboard/create/coaching">
                        <Video className="mr-2 h-3 w-3" />
                        Coaching
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start text-xs"
                    >
                      <Link href="/dashboard/create">
                        <Package className="mr-2 h-3 w-3" />
                        More Options
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroup>
        )}

        {/* Tips section */}
        <SidebarGroup className="mb-4 mt-auto">
          <Card className="border-dashed bg-muted/50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-semibold">Pro Tip</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {mode === "learn"
                    ? "Ready to share what you've learned? Switch to Creator mode and start selling your own content!"
                    : "Free products with download gates help build your email list."}
                </p>
              </div>
            </CardContent>
          </Card>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="space-y-3 border-t border-border p-3">
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>

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
              <p className="text-xs text-muted-foreground">
                {mode === "learn" ? "Learning" : "Creating"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
