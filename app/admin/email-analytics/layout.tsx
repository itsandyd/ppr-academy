"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Mail,
  ShieldBan,
  HeartPulse,
} from "lucide-react";

const tabs = [
  { label: "Overview", href: "/admin/email-analytics", icon: BarChart3 },
  { label: "Campaigns", href: "/admin/email-analytics/campaigns", icon: Mail },
  { label: "Suppression", href: "/admin/email-analytics/suppression", icon: ShieldBan },
  { label: "List Health", href: "/admin/email-analytics/health", icon: HeartPulse },
];

export default function EmailAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/email-analytics") {
      return pathname === "/admin/email-analytics";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor deliverability, track campaigns, and manage list health
        </p>
      </div>

      <nav className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
