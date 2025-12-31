"use client";

import { ReactNode, Suspense, useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { DashboardShell } from "./components/DashboardShell";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

const MODE_STORAGE_KEY = "dashboard-mode";

interface DashboardLayoutProps {
  children: ReactNode;
}

function getStoredMode(): "learn" | "create" | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === "learn" || stored === "create") return stored;
  return null;
}

function setStoredMode(mode: "learn" | "create") {
  if (typeof window !== "undefined") {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const urlMode = searchParams.get("mode") as "learn" | "create" | null;
  const isCreationPage =
    pathname.startsWith("/dashboard/create") || pathname.startsWith("/dashboard/social/create");

  const [storedMode, setStoredModeState] = useState<"learn" | "create" | null>(null);

  useEffect(() => {
    setMounted(true);
    setStoredModeState(getStoredMode());
  }, []);

  useEffect(() => {
    if (urlMode) {
      setStoredMode(urlMode);
      setStoredModeState(urlMode);
    }
  }, [urlMode]);

  const effectiveMode = urlMode || (isCreationPage ? "create" : storedMode) || "learn";

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (pathname === "/dashboard") {
    return <>{children}</>;
  }

  return <DashboardShell mode={effectiveMode}>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Skeleton className="h-screen w-full" />
        </div>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
