"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./components/admin-sidebar";
import { Menu, X, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { RealTimeAlerts, useMockAlerts } from "@/components/admin/real-time-alerts";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const alerts = useMockAlerts();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-chart-1/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-chart-3/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Real-Time Alerts */}
      {alerts.length > 0 && <RealTimeAlerts alerts={alerts} position="top-right" />}

      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-border/50 shadow-lg",
            "hover:scale-105 transition-all duration-200"
          )}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-3 pl-12 lg:pl-0">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                "bg-chart-1/10 dark:bg-chart-1/20 border border-chart-1/20"
              )}>
                <div className="w-2 h-2 rounded-full bg-chart-1 animate-pulse" />
                <span className="text-xs font-medium text-chart-1">Admin Mode</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AdminCommandPalette />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className={cn(
          "p-4 sm:p-6 lg:p-8",
          mounted ? "animate-in fade-in-0 slide-in-from-bottom-4 duration-500" : "opacity-0"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
