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
    ],
  },
  {
    title: "AI Platform",
    items: [
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
        "fixed left-0 top-0 h-screen w-72 z-50 transition-all duration-300 ease-out",
        "bg-card/95 backdrop-blur-2xl border-r border-border/50",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <Link 
            href="/admin" 
            className="flex items-center gap-3 group"
            onClick={handleLinkClick}
          >
            <div className={cn(
              "relative w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-chart-1 via-chart-2 to-chart-3",
              "shadow-lg shadow-chart-1/25 group-hover:shadow-chart-1/40",
              "transition-all duration-300 group-hover:scale-105"
            )}>
              <Terminal className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-chart-1 rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mission Control</h2>
              <p className="text-xs text-muted-foreground">PPR Academy Admin</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
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
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-chart-1 to-chart-2 rounded-r-full" />
                      )}
                      
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-chart-1/20 text-chart-1" 
                          : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.title}</span>
                          {item.badge && (
                            <span className={cn(
                              "px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white",
                              item.badgeColor || "bg-chart-1"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground/70 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-0 -translate-x-2 transition-all duration-200",
                        "group-hover:opacity-50 group-hover:translate-x-0",
                        isActive && "opacity-50 translate-x-0"
                      )} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legacy Tools - Collapsed by default */}
          <details className="group">
            <summary className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 list-none flex items-center gap-2">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              Legacy Tools
            </summary>
            <div className="space-y-1 mt-2">
              {legacyItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 opacity-60 hover:opacity-100",
                      isActive
                        ? "bg-muted/50 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/30">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium text-xs">{item.title}</span>
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
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              "transition-all duration-200 group"
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-chart-1/20 transition-colors">
              <Zap className="h-4 w-4 group-hover:text-chart-1 transition-colors" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          
          {/* Status indicator */}
          <div className="mt-4 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
