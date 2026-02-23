"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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
  MessageCircle,
  User,
  CreditCard,
  ChevronDown,
  Megaphone,
  UserCog,
  Crown,
  HeartPulse,
  FileText,
  ShoppingCart,
  Store,
  Layout,
  Shield,
  GitBranch,
  Workflow,
  SquarePen,
  Calendar,
  FolderOpen,
  Magnet,
  Eye,
  UserPlus,
  Filter,
  MailCheck,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface SidebarCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen: boolean;
  links: SidebarLink[];
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
    href: "/dashboard/samples?mode=learn",
    label: "My Samples",
    icon: Music,
    color: "text-pink-500",
  },
  {
    href: "/dashboard/coaching?mode=learn",
    label: "My Sessions",
    icon: Video,
    color: "text-teal-500",
  },
  {
    href: "/dashboard/messages?mode=learn",
    label: "Messages",
    icon: MessageCircle,
    color: "text-blue-500",
  },
  {
    href: "/dashboard/notes?mode=learn",
    label: "My Notes",
    icon: StickyNote,
    color: "text-amber-500",
  },
  {
    href: "/dashboard/memberships?mode=learn",
    label: "My Memberships",
    icon: Crown,
    color: "text-amber-500",
  },
  {
    href: "/dashboard/certificates?mode=learn",
    label: "Certificates",
    icon: Award,
    color: "text-yellow-500",
  },
];

// Standalone dashboard link (not inside any collapsible category)
const dashboardLink: SidebarLink = {
  href: "/dashboard?mode=create",
  label: "Dashboard",
  icon: Home,
  color: "text-purple-500",
};

// Organized into Kajabi-style collapsible categories (accordion: one open at a time)
const createCategories: SidebarCategory[] = [
  {
    id: "products",
    label: "Products",
    icon: Package,
    defaultOpen: false,
    links: [
      { href: "/dashboard/products?mode=create", label: "All Products", icon: Package, color: "text-blue-500" },
      { href: "/dashboard/create", label: "Create New", icon: Plus, color: "text-indigo-500", highlight: true },
      { href: "/dashboard/courses?mode=create", label: "Courses", icon: BookOpen, color: "text-green-500" },
      { href: "/dashboard/coaching/sessions", label: "Coaching", icon: Video, color: "text-teal-500" },
      { href: "/dashboard/memberships?mode=create", label: "Memberships", icon: Crown, color: "text-amber-500" },
      { href: "/dashboard/notes?mode=create", label: "AI Notes", icon: StickyNote, color: "text-amber-500" },
      { href: "/dashboard/reference-guides?mode=create", label: "Guides", icon: FileText, color: "text-rose-500" },
      { href: "/dashboard/samples?mode=create", label: "Samples", icon: Music, color: "text-pink-500" },
      { href: "/dashboard/downloads?mode=create", label: "Downloads", icon: Download, color: "text-orange-500" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: DollarSign,
    defaultOpen: false,
    links: [
      { href: "/dashboard/my-orders?mode=create", label: "Orders", icon: ShoppingCart, color: "text-green-500" },
      { href: "/dashboard/service-orders?mode=create", label: "Services", icon: Handshake, color: "text-teal-500" },
    ],
  },
  {
    id: "storefront",
    label: "Storefront",
    icon: Store,
    defaultOpen: false,
    links: [
      { href: "/dashboard/profile?mode=create", label: "Profile", icon: User, color: "text-indigo-500" },
      { href: "/dashboard/landing-pages?mode=create", label: "Pages", icon: Layout, color: "text-blue-500" },
      { href: "/dashboard/copyright?mode=create", label: "Copyright", icon: Shield, color: "text-red-500" },
      { href: "/dashboard/certificates?mode=create", label: "Certificates", icon: Award, color: "text-yellow-500" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    defaultOpen: false,
    links: [
      { href: "/dashboard/marketing?mode=create", label: "Hub", icon: Megaphone, color: "text-purple-500" },
      { href: "/dashboard/emails?mode=create", label: "Campaigns", icon: Mail, color: "text-cyan-500" },
      { href: "/dashboard/emails/sequences?mode=create", label: "Sequences", icon: GitBranch, color: "text-cyan-500" },
      { href: "/dashboard/emails/workflows?mode=create", label: "Workflows", icon: Workflow, color: "text-cyan-500" },
      { href: "/dashboard/social?mode=create", label: "Social", icon: Instagram, color: "text-pink-500" },
      { href: "/dashboard/social/create?mode=create", label: "Create Post", icon: SquarePen, color: "text-pink-500" },
      { href: "/dashboard/social/automation?mode=create", label: "Automation", icon: Zap, color: "text-amber-500" },
      { href: "/dashboard/social/library?mode=create", label: "Library", icon: FolderOpen, color: "text-pink-500" },
      { href: "/dashboard/social/profiles?mode=create", label: "Profiles", icon: UserCog, color: "text-pink-500" },
      { href: "/dashboard/lead-magnet-ideas?mode=create", label: "Lead Magnets", icon: Magnet, color: "text-orange-500" },
      { href: "/dashboard/emails/leads?mode=create", label: "Lead Capture", icon: Target, color: "text-green-500" },
      { href: "/dashboard/emails/setup?mode=create", label: "Email Setup", icon: Settings, color: "text-gray-500" },
      { href: "/dashboard/emails/preview?mode=create", label: "Templates", icon: Eye, color: "text-cyan-500" },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    icon: Users,
    defaultOpen: false,
    links: [
      { href: "/dashboard/students?mode=create", label: "Students", icon: Users, color: "text-emerald-500" },
      { href: "/dashboard/emails/subscribers?mode=create", label: "Subscribers", icon: UserPlus, color: "text-cyan-500" },
      { href: "/dashboard/emails/segments?mode=create", label: "Segments", icon: Filter, color: "text-blue-500" },
      { href: "/dashboard/affiliates?mode=create", label: "Affiliates", icon: Handshake, color: "text-rose-500" },
      { href: "/dashboard/messages?mode=create", label: "Messages", icon: MessageCircle, color: "text-blue-500" },
      { href: "/dashboard/emails/health?mode=create", label: "List Health", icon: HeartPulse, color: "text-cyan-500" },
      { href: "/dashboard/emails/deliverability?mode=create", label: "Deliverability", icon: MailCheck, color: "text-green-500" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    defaultOpen: false,
    links: [
      { href: "/dashboard/analytics?mode=create", label: "Overview", icon: BarChart3, color: "text-orange-500" },
      { href: "/dashboard/emails/campaigns?mode=create", label: "Email Stats", icon: Mail, color: "text-cyan-500" },
      { href: "/dashboard/emails/analytics?mode=create", label: "Email Detail", icon: TrendingUp, color: "text-cyan-500" },
    ],
  },
];

// Flat list for backward compatibility (used in learn mode comparison)
const createLinks: SidebarLink[] = [dashboardLink, ...createCategories.flatMap((cat) => cat.links)];

const SIDEBAR_OPEN_CATEGORY_KEY = "ppr-sidebar-open-category";

export function DashboardSidebar({ mode, onModeChange }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const links = mode === "learn" ? learnLinks : createLinks;
  const savePreference = useMutation(api.users.setDashboardPreference);

  // Accordion state: only one category open at a time
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  // Helper: find which category contains the active page
  const findActiveCategoryId = (currentPath: string): string | null => {
    const match = createCategories.find((cat) =>
      cat.links.some((link) => {
        const linkPath = link.href.split("?")[0];
        return currentPath === linkPath || (currentPath.startsWith(linkPath + "/") && linkPath !== "/dashboard");
      })
    );
    return match?.id ?? null;
  };

  // On mount: restore from localStorage or auto-detect from pathname
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_OPEN_CATEGORY_KEY);
      if (saved && createCategories.some((cat) => cat.id === saved)) {
        setOpenCategoryId(saved);
        return;
      }
    } catch {
      // Ignore localStorage errors
    }
    // Fallback: auto-expand category containing current active page
    setOpenCategoryId(findActiveCategoryId(pathname));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pathname changes, auto-expand the category containing the active page
  useEffect(() => {
    const activeId = findActiveCategoryId(pathname);
    if (activeId) {
      setOpenCategoryId(activeId);
      try {
        localStorage.setItem(SIDEBAR_OPEN_CATEGORY_KEY, activeId);
      } catch {
        // Ignore localStorage errors
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Toggle: clicking an open category closes it; clicking a closed one opens it (closing others)
  const toggleCategory = (categoryId: string) => {
    setOpenCategoryId((prev) => {
      const newId = prev === categoryId ? null : categoryId;
      try {
        localStorage.setItem(SIDEBAR_OPEN_CATEGORY_KEY, newId || "");
      } catch {
        // Ignore localStorage errors
      }
      return newId;
    });
  };

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
        {/* Main Navigation - Learn Mode (flat list) */}
        {mode === "learn" && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className="space-y-1">
                {learnLinks.map((link) => {
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
        )}

        {/* Main Navigation - Create Mode (Kajabi-style accordion categories) */}
        {mode === "create" && (
          <div className="space-y-1">
            {/* Standalone Dashboard link (always visible, not collapsible) */}
            <SidebarGroup className="py-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                    <Link href="/dashboard?mode=create" className="group relative">
                      <Home className={cn("h-5 w-5", pathname === "/dashboard" ? "" : "text-purple-500")} />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Collapsible categories (accordion: only one open at a time) */}
            {createCategories.map((category) => {
              const isOpen = openCategoryId === category.id;
              const hasActiveLink = category.links.some((link) => {
                const linkPath = link.href.split("?")[0];
                return pathname === linkPath || (pathname.startsWith(linkPath + "/") && linkPath !== "/dashboard");
              });

              return (
                <Collapsible
                  key={category.id}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <SidebarGroup className="py-0">
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          "hover:bg-accent/50",
                          isOpen && "bg-accent/30",
                          hasActiveLink && !isOpen && "text-primary"
                        )}
                      >
                        <category.icon
                          className={cn(
                            "h-4 w-4",
                            isOpen ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            isOpen ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {category.label}
                        </span>
                        {!isOpen && hasActiveLink && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                        <ChevronDown
                          className={cn(
                            "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180",
                            !isOpen && hasActiveLink && "hidden"
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      <SidebarGroupContent className="mt-1 pb-1">
                        <SidebarMenuSub>
                          {category.links.map((link) => {
                            const linkPath = link.href.split("?")[0];
                            const isActive =
                              pathname === linkPath ||
                              (pathname.startsWith(linkPath + "/") && linkPath !== "/dashboard");

                            return (
                              <SidebarMenuSubItem key={link.href}>
                                <SidebarMenuSubButton asChild isActive={isActive}>
                                  <Link
                                    href={link.href}
                                    className={cn(
                                      "group relative",
                                      link.highlight &&
                                        !isActive &&
                                        "rounded-md border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                                    )}
                                  >
                                    <link.icon
                                      className={cn("h-3.5 w-3.5", isActive ? "" : link.color)}
                                    />
                                    <span>{link.label}</span>
                                    {link.highlight && !isActive && (
                                      <Sparkles className="ml-auto h-3 w-3 text-purple-500" />
                                    )}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              );
            })}
          </div>
        )}

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
                      <Link href="/dashboard/create/sample">
                        <Music className="mr-2 h-3 w-3" />
                        Individual Sample
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start text-xs"
                    >
                      <Link href="/dashboard/create/pack?type=sample-pack">
                        <Package className="mr-2 h-3 w-3" />
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
