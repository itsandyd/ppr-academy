"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  MessageSquare,
  Flag,
  TrendingUp,
  Package,
  DollarSign,
  Activity,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview and key metrics",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage users and permissions",
  },
  {
    title: "All Products",
    href: "/admin/products",
    icon: Package,
    description: "Courses & digital products",
  },
  {
    title: "Content Moderation",
    href: "/admin/moderation",
    icon: Shield,
    description: "Review flagged content",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Platform analytics",
  },
  {
    title: "Revenue",
    href: "/admin/revenue",
    icon: DollarSign,
    description: "Financial overview",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: Flag,
    description: "User reports and issues",
  },
  {
    title: "Activity",
    href: "/admin/activity",
    icon: Activity,
    description: "Platform activity logs",
  },
  {
    title: "AI Tools",
    href: "/admin/ai-tools",
    icon: Sparkles,
    description: "AI generation tools",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "System configuration",
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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white dark:bg-black">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">PPR Academy</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-purple-100 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Legacy Tools */}
          <div className="mt-6 pt-6 border-t">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Legacy Tools
              </h3>
            </div>
            <div className="space-y-1">
              {legacyItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <Link
            href="/home"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <TrendingUp className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </aside>
  );
}

