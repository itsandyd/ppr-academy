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
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  badgeColor?: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navSections = [
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
        description: "Transaction logs",
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

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen w-72 transition-all duration-300 ease-out",
        "border-r border-border/50 bg-card/95 backdrop-blur-2xl",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-border/50 p-6">
          <Link href="/admin" className="group flex items-center gap-3" onClick={handleLinkClick}>
            <div
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3",
                "shadow-lg shadow-chart-1/25 group-hover:shadow-chart-1/40",
                "transition-all duration-300 group-hover:scale-105"
              )}
            >
              <Terminal className="h-5 w-5 text-white" />
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-chart-1" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mission Control</h2>
              <p className="text-xs text-muted-foreground">PPR Academy Admin</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                        "relative overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-chart-1/20 to-chart-2/10 text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-chart-1 to-chart-2" />
                      )}

                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-chart-1/20 text-chart-1"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{item.title}</span>
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
                        </div>
                        {item.description && (
                          <p className="truncate text-[11px] text-muted-foreground/70">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-4 w-4 -translate-x-2 opacity-0 transition-all duration-200",
                          "group-hover:translate-x-0 group-hover:opacity-50",
                          isActive && "translate-x-0 opacity-50"
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legacy Tools - Collapsed by default */}
          <details className="group">
            <summary className="mb-2 flex cursor-pointer list-none items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/60">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              Legacy Tools
            </summary>
            <div className="mt-2 space-y-1">
              {legacyItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm opacity-60 transition-all duration-200 hover:opacity-100",
                      isActive
                        ? "bg-muted/50 text-foreground"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/30">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </details>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <Link
            href="/home"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
              "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              "group transition-all duration-200"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-chart-1/20">
              <Zap className="h-4 w-4 transition-colors group-hover:text-chart-1" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          {/* Status indicator */}
          <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
