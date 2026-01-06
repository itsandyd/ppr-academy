"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  BookOpen,
  Download,
  Video,
  Package,
  TrendingUp,
  Clock,
  User,
  Music,
  Star,
  Award,
  Play,
  Heart,
  Library as LibraryIcon,
  CreditCard,
  Upload,
  Eye,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { motion } from "framer-motion";
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

interface NavItem {
  icon: any;
  href: string;
  label: string;
  badge?: string;
  gradient?: string;
  isNew?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function LibrarySidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  // Get Convex user for stats
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // Get library stats
  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const navigationSections: NavSection[] = [
    {
      label: "Library",
      items: [
        {
          icon: Home,
          href: "/library",
          label: "Overview",
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          icon: BookOpen,
          href: "/library/courses",
          label: "My Courses",
          gradient: "from-purple-500 to-pink-500",
        },
        {
          icon: Music,
          href: "/library/samples",
          label: "My Samples",
          gradient: "from-indigo-500 to-purple-500",
        },
        {
          icon: Package,
          href: "/library/bundles",
          label: "Bundles",
          gradient: "from-orange-500 to-red-500",
        },
        {
          icon: CreditCard,
          href: "/library/subscriptions",
          label: "Subscriptions",
          gradient: "from-yellow-500 to-orange-500",
        },
        {
          icon: Heart,
          href: "/library/wishlist",
          label: "Wishlist",
          gradient: "from-pink-500 to-red-500",
        },
      ],
    },
    {
      label: "Share & Showcase",
      items: [
        {
          icon: Upload,
          href: "/library/share",
          label: "Share Your Track",
          gradient: "from-purple-500 to-pink-500",
          isNew: true,
        },
        {
          icon: Music,
          href: "/library/showcase",
          label: "My Showcase",
          gradient: "from-blue-500 to-indigo-500",
          isNew: true,
        },
      ],
    },
    {
      label: "Content & Progress",
      items: [
        {
          icon: Download,
          href: "/library/downloads",
          label: "Downloads",
          gradient: "from-green-500 to-emerald-500",
        },
        {
          icon: Video,
          href: "/library/coaching",
          label: "Coaching",
          gradient: "from-indigo-500 to-purple-500",
        },
        {
          icon: TrendingUp,
          href: "/library/progress",
          label: "Progress",
          gradient: "from-emerald-500 to-teal-500",
        },
        {
          icon: Clock,
          href: "/library/recent",
          label: "Recent Activity",
          gradient: "from-blue-500 to-indigo-500",
        },
      ],
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/library") return pathname === "/library";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Sidebar className="border-r border-border/50 bg-white dark:bg-black">
      <SidebarHeader className="border-b border-border/50 bg-white backdrop-blur-sm dark:bg-black">
        <motion.div
          className="px-4 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand Header - Simplified and cleaner */}
          <div className="mb-3 flex items-center space-x-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
              <LibraryIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold leading-tight text-foreground">My Library</h2>
              <p className="text-xs leading-tight text-muted-foreground/80">Your Learning Hub</p>
            </div>
          </div>

          {/* Stats Info - More compact */}
          {userStats && (
            <motion.div
              className="flex items-center space-x-2 rounded-lg border border-border/20 bg-gray-100 px-3 py-2 transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
                <Award className="h-2.5 w-2.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight text-foreground">
                  {userStats.coursesEnrolled} Courses Enrolled
                </p>
                <p className="truncate text-xs leading-tight text-muted-foreground/70">
                  {userStats.coursesCompleted} Completed
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="space-y-2 bg-white px-2 py-4 dark:bg-black">
        {navigationSections.map((section, sectionIndex) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
          >
            <SidebarGroup>
              <SidebarGroupLabel className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const isActive = isActiveLink(item.href);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          size="lg"
                          className={`group relative w-full transition-all duration-200 hover:scale-[1.02] ${
                            isActive
                              ? "border border-primary/20 bg-primary/10 text-primary shadow-sm"
                              : "hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-900"
                          } `}
                        >
                          <Link
                            href={item.href}
                            className="relative flex items-center overflow-hidden"
                          >
                            {/* Background Gradient for Active State */}
                            {isActive && item.gradient && (
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-lg opacity-5`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.05 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}

                            {/* Icon with Gradient Background */}
                            <div
                              className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                                isActive && item.gradient
                                  ? `bg-gradient-to-br ${item.gradient} text-white shadow-sm`
                                  : "bg-gray-100 text-muted-foreground group-hover:bg-gray-200 group-hover:text-foreground dark:bg-gray-900 dark:group-hover:bg-gray-800"
                              } `}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            {/* Label */}
                            <span className="flex-1 font-medium">{item.label}</span>

                            {/* Badges */}
                            <div className="flex items-center space-x-1">
                              {item.isNew && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 px-1.5 py-0.5 text-xs font-medium text-white">
                                  New
                                </Badge>
                              )}
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="px-1.5 py-0.5 text-xs font-medium"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </motion.div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 bg-white backdrop-blur-sm dark:bg-black">
        <div className="space-y-4 px-3 py-4">
          {/* Quick Actions */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-full border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-xs transition-all duration-200 hover:from-blue-500/20 hover:to-purple-500/20"
                >
                  <BookOpen className="mr-1 h-3 w-3" />
                  Browse
                </Button>
              </Link>
              <Link href="/library/progress">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-full border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-xs transition-all duration-200 hover:from-green-500/20 hover:to-emerald-500/20"
                >
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Progress
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* User Account Section */}
          <motion.div
            className="flex items-center gap-3 rounded-lg border border-border/30 bg-gray-100 p-2 dark:bg-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border-border bg-white dark:bg-black",
                    userButtonPopoverActionButton:
                      "text-foreground hover:bg-gray-100 dark:hover:bg-gray-900",
                  },
                }}
                showName={false}
                afterSignOutUrl="/"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.firstName || user?.username || "Student"}
                </p>
                <p className="text-xs text-muted-foreground">Library Access</p>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <ModeToggle />
          </motion.div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
