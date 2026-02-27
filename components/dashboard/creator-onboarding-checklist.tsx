"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Palette,
  CreditCard,
  Package,
  Share2,
  Check,
  ChevronRight,
  X,
  Rocket,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface CreatorOnboardingChecklistProps {
  storeId: Id<"stores">;
  clerkId: string;
  storeSlugOverride?: string;
}

const SHARE_STORE_KEY = "ppr-onboarding-store-shared";

export function CreatorOnboardingChecklist({
  storeId,
  clerkId,
  storeSlugOverride,
}: CreatorOnboardingChecklistProps) {
  const onboarding = useQuery(api.creatorOnboarding.getOnboardingStatus, {
    storeId,
    clerkId,
  });

  const dismiss = useMutation(api.creatorOnboarding.dismissOnboarding);

  const [storeShared, setStoreShared] = useState(false);

  useEffect(() => {
    setStoreShared(localStorage.getItem(SHARE_STORE_KEY) === "true");
  }, []);

  const storeSlug = storeSlugOverride || onboarding?.storeSlug || "";

  const handleShareStore = useCallback(() => {
    const url = `${window.location.origin}/${storeSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      localStorage.setItem(SHARE_STORE_KEY, "true");
      setStoreShared(true);
      toast.success("Store link copied to clipboard!");
    });
  }, [storeSlug]);

  const handleDismiss = useCallback(async () => {
    await dismiss({ storeId });
  }, [dismiss, storeId]);

  if (!onboarding || onboarding.dismissed) return null;

  const serverCompleted = onboarding.completedCount;
  const totalCompleted = serverCompleted + (storeShared ? 1 : 0);
  const totalSteps = onboarding.totalSteps;
  const allDone = totalCompleted >= totalSteps;
  const progressPercent = (totalCompleted / totalSteps) * 100;

  const steps = [
    {
      id: "profile",
      title: "Set up your profile",
      description: "Bio & avatar so fans know who you are",
      icon: User,
      completed: onboarding.steps.profileSetUp,
      href: "/dashboard/profile?mode=create",
    },
    {
      id: "store",
      title: "Customize your store",
      description: "Tagline, genre tags, or accent color",
      icon: Palette,
      completed: onboarding.steps.storeCustomized,
      href: "/dashboard/profile?mode=create&tab=branding",
    },
    {
      id: "payments",
      title: "Connect payments",
      description: "Stripe setup to receive earnings",
      icon: CreditCard,
      completed: onboarding.steps.paymentsConnected,
      href: "/dashboard/settings/payouts?mode=create",
    },
    {
      id: "product",
      title: "Create your first product",
      description: "Sample pack, preset, course, or more",
      icon: Package,
      completed: onboarding.steps.firstProductCreated,
      href: "/dashboard/create",
    },
    {
      id: "share",
      title: "Share your store",
      description: "Copy your link & share with the world",
      icon: Share2,
      completed: storeShared,
      action: handleShareStore,
    },
  ];

  return (
    <Card className="relative overflow-hidden border-primary/20">
      {/* Subtle gradient accent along the top */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              {allDone ? (
                <Sparkles className="h-5 w-5 text-primary" />
              ) : (
                <Rocket className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {allDone
                  ? "You're all set!"
                  : onboarding.isNewCreator
                    ? "Welcome to PausePlayRepeat!"
                    : "Finish setting up your store"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {allDone
                  ? "Your store is ready to start earning."
                  : `${totalCompleted} of ${totalSteps} steps complete`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={progressPercent} className="mb-5 h-2" />

        {/* Congrats state */}
        {allDone && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
              <Sparkles className="h-4 w-4" />
              Congratulations! Your store is fully set up and ready for sales.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              onClick={handleDismiss}
            >
              Dismiss checklist
            </Button>
          </div>
        )}

        {/* Steps list */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.completed;
            const firstIncompleteIndex = steps.findIndex((s) => !s.completed);
            const isNext = index === firstIncompleteIndex;

            const inner = (
              <div
                className={cn(
                  "group flex items-center gap-3 rounded-lg border p-3 transition-all duration-200",
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/10"
                    : isNext
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                )}
              >
                {/* Status icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all",
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isNext
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted-foreground/25 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted
                        ? "text-muted-foreground line-through"
                        : isNext
                          ? "text-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {!isCompleted && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                {!isCompleted && (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                      isNext
                        ? "text-primary group-hover:translate-x-0.5"
                        : "text-muted-foreground/50"
                    )}
                  />
                )}
              </div>
            );

            if (step.action) {
              return (
                <button
                  key={step.id}
                  onClick={step.action}
                  className="block w-full text-left"
                  disabled={isCompleted}
                >
                  {inner}
                </button>
              );
            }

            if (isCompleted) {
              return <div key={step.id}>{inner}</div>;
            }

            return (
              <Link key={step.id} href={step.href!} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
