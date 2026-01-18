"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "./ModeToggle";
import { LearnModeContent } from "./LearnModeContent";
import { CreateModeContent } from "./CreateModeContent";
import { DashboardSidebar } from "./DashboardSidebar";
import { StoreRequiredGuard } from "./StoreRequiredGuard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type DashboardMode = "learn" | "create";

interface DashboardShellProps {
  mode: DashboardMode;
  children?: ReactNode; // Optional children for subpages
}

export function DashboardShell({ mode, children }: DashboardShellProps) {
  const router = useRouter();
  const { user } = useUser();
  const savePreference = useMutation(api.users.setDashboardPreference);

  // Check if user has stores (required for Create mode)
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");

  const handleModeChange = async (newMode: DashboardMode) => {
    // Update URL immediately (optimistic)
    router.replace(`/dashboard?mode=${newMode}`, { scroll: false });

    // Save preference in background (non-blocking)
    if (user?.id) {
      try {
        await savePreference({
          clerkId: user.id,
          preference: newMode,
        });
      } catch (error) {
        console.error("Failed to save dashboard preference:", error);
        // Don't block the UI, just log the error
      }
    }
  };

  return (
    <SidebarProvider>
      <DashboardSidebar mode={mode} onModeChange={handleModeChange} />
      <main className="flex w-full flex-1 flex-col">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1 md:hidden" />

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-card-foreground">
              {mode === "learn" ? "My Learning" : "Creator Studio"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onChange={handleModeChange} />

            {/* Quick actions */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full flex-1 overflow-x-hidden bg-background p-4 md:p-6">
          <StoreRequiredGuard mode={mode}>
            {children ? (
              // Subpages (products, courses, etc.) provide their own content
              children
            ) : // Main dashboard page shows mode-specific content
            mode === "learn" ? (
              <LearnModeContent />
            ) : (
              <CreateModeContent />
            )}
          </StoreRequiredGuard>
        </div>
      </main>
    </SidebarProvider>
  );
}
