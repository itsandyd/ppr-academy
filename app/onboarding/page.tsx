"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { BookOpen, Store, ArrowRight, Loader2, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [selecting, setSelecting] = useState<"learn" | "create" | null>(null);

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const setInitialRole = useMutation(api.users.setInitialRole);

  // If user already has a preference, skip onboarding
  if (
    convexUser &&
    convexUser.dashboardPreference &&
    (convexUser.dashboardPreference === "learn" ||
      convexUser.dashboardPreference === "create")
  ) {
    router.replace(`/dashboard?mode=${convexUser.dashboardPreference}`);
    return null;
  }

  // Loading state
  if (!isLoaded || !user || convexUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSelect = async (role: "learn" | "create") => {
    if (selecting) return;
    setSelecting(role);

    try {
      await setInitialRole({ clerkId: user.id, role });

      // Set localStorage so dashboard picks it up immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-mode", role);
      }

      router.replace(`/dashboard?mode=${role}`);
    } catch (error) {
      console.error("Failed to save role:", error);
      setSelecting(null);
    }
  };

  const firstName = user.firstName || "there";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo / Brand */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2">
          <Music className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-foreground">PausePlayRepeat</span>
      </div>

      {/* Heading */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome, {firstName}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          How do you want to get started?
        </p>
      </div>

      {/* Role Cards */}
      <div className="flex w-full max-w-lg flex-col gap-4 sm:flex-row">
        {/* Learn Card */}
        <button
          onClick={() => handleSelect("learn")}
          disabled={selecting !== null}
          className={cn(
            "group relative flex flex-1 flex-col items-center rounded-xl border-2 bg-card p-6 text-center transition-all hover:border-chart-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selecting === "learn"
              ? "border-chart-1 shadow-lg"
              : "border-border",
            selecting !== null && selecting !== "learn" && "opacity-50"
          )}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-1/10 transition-colors group-hover:bg-chart-1/20">
            <BookOpen className="h-7 w-7 text-chart-1" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground">
            I want to learn
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse courses, sample packs, and tutorials
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-chart-1 opacity-0 transition-opacity group-hover:opacity-100">
            {selecting === "learn" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Get started <ArrowRight className="h-4 w-4" />
              </>
            )}
          </div>
        </button>

        {/* Create Card */}
        <button
          onClick={() => handleSelect("create")}
          disabled={selecting !== null}
          className={cn(
            "group relative flex flex-1 flex-col items-center rounded-xl border-2 bg-card p-6 text-center transition-all hover:border-chart-2 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selecting === "create"
              ? "border-chart-2 shadow-lg"
              : "border-border",
            selecting !== null && selecting !== "create" && "opacity-50"
          )}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/10 transition-colors group-hover:bg-chart-2/20">
            <Store className="h-7 w-7 text-chart-2" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground">
            I want to create & sell
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sell courses, products, and grow your audience
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-chart-2 opacity-0 transition-opacity group-hover:opacity-100">
            {selecting === "create" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Get started <ArrowRight className="h-4 w-4" />
              </>
            )}
          </div>
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        You can always switch later in settings
      </p>
    </div>
  );
}
