"use client";

import { Button } from "@/components/ui/button";
import {
  Copy,
  Home,
  BarChart3,
  Users,
  Package,
  Store,
  Settings,
  HelpCircle,
  User,
  Mail,
  Inbox,
  FileText,
  BookOpen,
  Rocket,
} from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { useUser, UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
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
}

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useUser();

  // Get storeId from URL params or fetch user's first store as fallback
  const urlStoreId = params.storeId as string;

  // Fetch user's stores to get fallback storeId
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");

  // Use URL storeId if available, otherwise use first store
  const storeId = urlStoreId || stores?.[0]?._id || null;
  const hasStore = Boolean(storeId && storeId !== 'setup');

  // Get current store object for displaying slug
  const currentStore = stores?.find((s: any) => s._id === storeId) || stores?.[0];

  const mainNavItems: NavItem[] = [
    { icon: Home, href: "/home", label: "Home" },
    { icon: BarChart3, href: "/analytics", label: "Analytics" },
    ...(hasStore ? [
      { icon: FileText, href: `/store/${storeId}/notes`, label: "Notes" },
      { icon: Users, href: `/store/${storeId}/customers`, label: "Customers" },
      { icon: Mail, href: `/store/${storeId}/email-campaigns`, label: "Campaigns" },
      { icon: Inbox, href: `/store/${storeId}/inbox`, label: "Inbox" },
      { icon: Package, href: `/store/${storeId}/products`, label: "Products" },
      { icon: BookOpen, href: `/store/${storeId}/blog`, label: "Blog" },
      { icon: Store, href: "/store", label: "Store" },
    ] : [
      { icon: Store, href: "/store", label: "Store" },
    ]),
  ];

  const bottomNavItems: NavItem[] = hasStore
    ? [{ icon: Settings, href: `/store/${storeId}/settings/payouts`, label: "Payouts" }]
    : [];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col space-y-2 px-2 py-4">
          <h2 className="text-lg font-bold text-sidebar-foreground">PausePlayRepeat</h2>
          {/* {currentStore && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-sidebar-foreground/70 truncate">
                pauseplayrepeat.com/{currentStore.slug || currentStore.name || "store"}
              </span>
            </div>
          )} */}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!hasStore && stores !== undefined && (
          <div className="mx-3 mt-3 mb-1">
            <Link href="/dashboard">
              <div className="rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-sidebar-foreground">Set up your store</span>
                </div>
                <p className="text-xs text-sidebar-foreground/70">
                  Start selling beats, packs, and courses.
                </p>
              </div>
            </Link>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="lg" className="w-full">
                      <Link href={item.href} className="flex items-center">
                        <Icon className="h-5 w-5" />
                        <span className="ml-3">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="lg" className="w-full">
                      <Link href={item.href} className="flex items-center">
                        <Icon className="h-5 w-5" />
                        <span className="ml-3">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="space-y-3 px-3 py-2">
          {/* User Account Section */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border-sidebar-border",
                    userButtonPopoverActionButton:
                      "text-sidebar-foreground hover:bg-sidebar-accent",
                  },
                }}
                showName={false}
                afterSignOutUrl="/"
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <User className="h-4 w-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <span className="text-sm font-medium text-sidebar-foreground/70">Account</span>
          </div>

          {/* Theme Toggle Section */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sidebar-foreground/70">Theme</span>
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
