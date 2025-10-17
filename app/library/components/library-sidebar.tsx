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
  Sparkles
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
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
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
          gradient: "from-blue-500 to-cyan-500"
        },
        { 
          icon: BookOpen, 
          href: "/library/courses", 
          label: "My Courses",
          gradient: "from-purple-500 to-pink-500"
        },
        { 
          icon: Package, 
          href: "/library/bundles", 
          label: "Bundles",
          gradient: "from-orange-500 to-red-500"
        },
        { 
          icon: CreditCard, 
          href: "/library/subscriptions", 
          label: "Subscriptions",
          gradient: "from-yellow-500 to-orange-500"
        },
      ]
    },
    {
      label: "Share & Showcase",
      items: [
        { 
          icon: Upload, 
          href: "/library/share", 
          label: "Share Your Track",
          gradient: "from-purple-500 to-pink-500",
          isNew: true
        },
        { 
          icon: Music, 
          href: "/library/showcase", 
          label: "My Showcase",
          gradient: "from-blue-500 to-indigo-500",
          isNew: true
        },
      ]
    },
    {
      label: "Content & Progress",
      items: [
        { 
          icon: Download, 
          href: "/library/downloads", 
          label: "Downloads",
          gradient: "from-green-500 to-emerald-500"
        },
        { 
          icon: Video, 
          href: "/library/coaching", 
          label: "Coaching",
          gradient: "from-indigo-500 to-purple-500"
        },
        { 
          icon: TrendingUp, 
          href: "/library/progress", 
          label: "Progress",
          gradient: "from-emerald-500 to-teal-500"
        },
        { 
          icon: Clock, 
          href: "/library/recent", 
          label: "Recent Activity",
          gradient: "from-blue-500 to-indigo-500"
        },
      ]
    }
  ];

  const isActiveLink = (href: string) => {
    if (href === "/library") return pathname === "/library";
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <Sidebar className="border-r border-border/50 bg-white dark:bg-black">
      <SidebarHeader className="border-b border-border/50 bg-white dark:bg-black backdrop-blur-sm">
        <motion.div 
          className="px-4 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand Header - Simplified and cleaner */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <LibraryIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight">
                My Library
              </h2>
              <p className="text-xs text-muted-foreground/80 leading-tight">
                Your Learning Hub
              </p>
            </div>
          </div>
          
          {/* Stats Info - More compact */}
          {userStats && (
            <motion.div 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-border/20 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <Award className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {userStats.coursesEnrolled} Courses Enrolled
                </p>
                <p className="text-xs text-muted-foreground/70 truncate leading-tight">
                  {userStats.coursesCompleted} Completed
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-2 bg-white dark:bg-black">
        {navigationSections.map((section, sectionIndex) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
          >
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide mb-1 px-2">
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
                          className={`
                            group relative w-full transition-all duration-200 hover:scale-[1.02]
                            ${isActive 
                              ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-foreground'
                            }
                          `}
                        >
                          <Link href={item.href} className="flex items-center relative overflow-hidden">
                            {/* Background Gradient for Active State */}
                            {isActive && item.gradient && (
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-5 rounded-lg`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.05 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                            
                            {/* Icon with Gradient Background */}
                            <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-200
                              ${isActive && item.gradient
                                ? `bg-gradient-to-br ${item.gradient} text-white shadow-sm`
                                : 'bg-gray-100 dark:bg-gray-900 text-muted-foreground group-hover:bg-gray-200 dark:group-hover:bg-gray-800 group-hover:text-foreground'
                              }
                            `}>
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            {/* Label */}
                            <span className="font-medium flex-1">{item.label}</span>
                            
                            {/* Badges */}
                            <div className="flex items-center space-x-1">
                              {item.isNew && (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-1.5 py-0.5 font-medium">
                                  New
                                </Badge>
                              )}
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-medium">
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

      <SidebarFooter className="border-t border-border/50 bg-white dark:bg-black backdrop-blur-sm">
        <div className="px-3 py-4 space-y-4">
          {/* Quick Actions */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide px-1 mb-1">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-200"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Browse
                </Button>
              </Link>
              <Link href="/library/progress">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-200"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Progress
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* User Account Section */}
          <motion.div 
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-border/30"
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
                    userButtonPopoverActionButton: "text-foreground hover:bg-gray-100 dark:hover:bg-gray-900",
                  }
                }}
                showName={false}
                afterSignOutUrl="/"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || user?.username || "Student"}
                </p>
                <p className="text-xs text-muted-foreground">Library Access</p>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full">
                  <User className="w-4 h-4 mr-2" />
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