"use client";

import { Button } from "@/components/ui/button";
import { Copy, Home, BarChart3, Users, Package, Store, Settings, HelpCircle, User } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: any;
  href: string;
  label: string;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
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
  
  // Use URL storeId if available, otherwise use first store
  const storeId = urlStoreId || stores?.[0]?._id;
  
  // Get current store object for displaying slug
  const currentStore = stores?.find(s => s._id === storeId) || stores?.[0];

  const mainNavItems: NavItem[] = [
    { icon: Home, href: "/home", label: "Home" },
    { icon: BarChart3, href: "/analytics", label: "Analytics" },
    { icon: Users, href: "/audience", label: "Audience" },
    { icon: Package, href: `/store/${storeId}/products`, label: "Products" },
    { icon: Store, href: "/store", label: "Store" },
  ];

  const bottomNavItems: NavItem[] = [
    // { icon: HelpCircle, href: "/store/ask-stanley", label: "Ask Stanley" },
    { icon: Settings, href: "/store/settings", label: "Settings" },
    { icon: User, href: "/store/profile", label: "Profile" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-[#F5F6FF] border-r border-[#E3E5EC] flex flex-col">
        <div className="flex-1 p-4">
          {/* Logo */}
          <div className="mb-8 px-3">
            <h2 className="text-xl font-bold text-[#0F0F0F]">PausePlayRepeat</h2>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-10 px-3 rounded-full text-sm font-semibold ${
                      isActive 
                        ? "bg-white text-[#6356FF] shadow-sm" 
                        : "text-[#51536A] hover:bg-white/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-6 border-t border-[#E3E5EC]" />

          {/* Bottom Navigation */}
          <nav className="space-y-1 mt-6">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-10 px-3 rounded-full text-sm font-semibold ${
                      isActive 
                        ? "bg-white text-[#6356FF] shadow-sm" 
                        : "text-[#51536A] hover:bg-white/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-15 border-b border-[#E3E5EC] px-8 py-4 flex items-center justify-between bg-white">
          <h1 className="text-lg font-bold text-[#0F0F0F]">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#6356FF] font-medium">pauseplayrepeat.com/{currentStore?.slug || currentStore?.name || "store"}</span>
            {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Copy className="h-4 w-4 text-[#6356FF]" />
            </Button> */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
} 