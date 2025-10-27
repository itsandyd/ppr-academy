"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  TrendingUp, 
  Users, 
  Package, 
  Store, 
  Settings, 
  User, 
  Mail,
  Music,
  Headphones,
  Disc,
  Radio,
  BarChart3,
  DollarSign,
  Zap,
  Sparkles,
  Star,
  Download,
  Upload,
  Play,
  Palette,
  Share2,
  FileText,
  PenTool,
  List,
  Inbox,
  MessageSquare
} from "lucide-react";
import { usePathname, useParams } from "next/navigation";
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

export function AppSidebarEnhanced() {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useUser();
  
  // Get storeId from URL params or fetch user's first store as fallback
  const urlStoreId = params.storeId as string;
  
  // Fetch user's stores to get fallback storeId
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  
  // Use URL storeId if available, otherwise use first store or fallback
  const storeId = urlStoreId || stores?.[0]?._id || 'setup';
  
  // Get current store object for displaying info
  const currentStore = stores?.find(s => s._id === storeId) || stores?.[0];

  const navigationSections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { 
          icon: Home, 
          href: "/home", 
          label: "Dashboard",
          gradient: "from-blue-500 to-cyan-500"
        },
        { 
          icon: TrendingUp, 
          href: "/home/analytics", 
          label: "Analytics",
          gradient: "from-emerald-500 to-teal-500"
        },
      ]
    },
    {
      label: "Create & Distribute",
      items: [
        { 
          icon: FileText, 
          href: `/store/${storeId || 'setup'}/notes`, 
          label: "Notes & Ideas",
          badge: "AI",
          isNew: true,
          gradient: "from-violet-500 to-purple-500"
        },
        { 
          icon: Package, 
          href: `/store/${storeId || 'setup'}/products`, 
          label: "Create Product",
          badge: "New",
          gradient: "from-purple-500 to-pink-500"
        },
        { 
          icon: Music, 
          href: `/store/${storeId || 'setup'}/packs`, 
          label: "Sample Packs",
          gradient: "from-pink-500 to-rose-500",
          isNew: true
        },
        { 
          icon: List, 
          href: `/home/playlists`, 
          label: "Playlists",
          gradient: "from-purple-500 to-blue-500",
          isNew: true
        },
        { 
          icon: Inbox, 
          href: `/home/submissions`, 
          label: "Submissions",
          gradient: "from-orange-500 to-amber-500",
          isNew: true
        },
      ]
    },
    {
      label: "Audience & Growth",
      items: [
        { 
          icon: Users, 
          href: `/store/${storeId || 'setup'}/customers`, 
          label: "Fans",
          gradient: "from-orange-500 to-red-500"
        },
        { 
          icon: Mail, 
          href: `/store/${storeId || 'setup'}/email-campaigns`, 
          label: "Email Campaigns",
          gradient: "from-indigo-500 to-purple-500"
        },
        { 
          icon: MessageSquare, 
          href: `/store/${storeId || 'setup'}/inbox`, 
          label: "Inbox",
          gradient: "from-pink-500 to-rose-500"
        },
        { 
          icon: Share2, 
          href: `/store/${storeId || 'setup'}/social`, 
          label: "Social Media",
          isNew: true,
          gradient: "from-blue-500 to-cyan-500"
        },
        { 
          icon: Zap, 
          href: `/store/${storeId || 'setup'}/automations`, 
          label: "Automations",
          isNew: true,
          gradient: "from-yellow-500 to-orange-500"
        },
      ]
    },
    {
      label: "Manage & Monetize",
      items: [
        { 
          icon: Store, 
          href: `/store/${storeId || 'setup'}/products`, 
          label: "My Products",
          gradient: "from-rose-500 to-pink-500"
        },
        { 
          icon: DollarSign, 
          href: `/store/${storeId || 'setup'}/settings/payouts`, 
          label: "Earnings",
          gradient: "from-green-500 to-emerald-500"
        },
        { 
          icon: Settings, 
          href: `/store/${storeId || 'setup'}/options`, 
          label: "Settings",
          gradient: "from-gray-500 to-slate-500"
        },
      ]
    }
  ];

  const isActiveLink = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/store") return pathname === "/store";
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <Sidebar className="border-r border-border/50 bg-gradient-to-b from-background to-background/95">
      <SidebarHeader className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <motion.div 
          className="px-4 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand Header - Simplified and cleaner */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Music className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight">
                PausePlayRepeat
              </h2>
              <p className="text-xs text-muted-foreground/80 leading-tight">
                Creator Studio
              </p>
            </div>
          </div>
          
          {/* Store Info - More compact */}
          {currentStore && (
            <motion.div 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors duration-200"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-md flex items-center justify-center">
                <Disc className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {currentStore.name || "My Store"}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate leading-tight">
                  /{currentStore.slug || "setup"}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-2">
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
                              : 'hover:bg-muted/70 hover:text-foreground'
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
                                : 'bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
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

      <SidebarFooter className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
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
              <Link href={`/store/${storeId}/products`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
              </Link>
              <Link href="/analytics">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-200"
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Stats
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* User Account Section */}
          <motion.div 
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border-border",
                    userButtonPopoverActionButton: "text-foreground hover:bg-muted",
                  }
                }}
                showName={false}
                afterSignOutUrl="/"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || user?.username || "Creator"}
                </p>
                <p className="text-xs text-muted-foreground">Account & Settings</p>
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
