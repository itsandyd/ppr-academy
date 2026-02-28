"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { DashboardShell } from "./components/DashboardShell";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

type DashboardMode = "learn" | "create";

const MODE_STORAGE_KEY = "dashboard-mode";

function getStoredMode(): DashboardMode | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === "learn" || stored === "create") return stored;
  return null;
}

function setStoredMode(mode: DashboardMode) {
  if (typeof window !== "undefined") {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);

  const mode = searchParams.get("mode") as DashboardMode | null;

  // Get user from Convex (uses impersonated user when admin is managing)
  const convexUser = useQuery(api.users.getUserFromClerk, effectiveUserId ? { clerkId: effectiveUserId } : "skip");

  // Get stores
  const stores = useQuery(api.stores.getStoresByUser, effectiveUserId ? { userId: effectiveUserId } : "skip");

  useEffect(() => {
    if (mode === "learn" || mode === "create") {
      setStoredMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (!isLoaded) return;
    // Wait for convexUser and stores to load before making routing decisions
    if (convexUser === undefined || stores === undefined) return;

    if (!mode || (mode !== "learn" && mode !== "create")) {
      const localMode = getStoredMode();
      if (localMode) {
        router.replace(`/dashboard?mode=${localMode}`);
        return;
      }

      const preference = convexUser?.dashboardPreference as DashboardMode | undefined;
      if (preference && (preference === "learn" || preference === "create")) {
        router.replace(`/dashboard?mode=${preference}`);
        return;
      }

      // If user has stores, they're an existing creator - default to create
      if (stores && stores.length > 0) {
        router.replace(`/dashboard?mode=create`);
        return;
      }

      // No preference set or no Convex record yet - send to onboarding
      if (!convexUser || !convexUser.dashboardPreference) {
        router.replace("/onboarding");
        return;
      }
    }
  }, [mode, convexUser, stores, router, isLoaded]);

  // Loading state
  if (!isLoaded || !user || convexUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // If no valid mode yet, show loading
  if (!mode || (mode !== "learn" && mode !== "create")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-0">
      <DashboardShell mode={mode} />
    </div>
  );
}
