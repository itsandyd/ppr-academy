"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Sparkles,
  Layers,
  Image,
  Volume2,
  CheckCircle,
  Save,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { SocialPostProvider, useSocialPost } from "./context";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

interface SocialCreateLayoutProps {
  children: React.ReactNode;
}

const steps = [
  {
    id: "content",
    label: "Content",
    icon: FileText,
    description: "Select course content to repurpose",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "scripts",
    label: "Scripts",
    icon: Sparkles,
    description: "Generate platform-specific scripts",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "combine",
    label: "Combine",
    icon: Layers,
    description: "Combine scripts with CTA",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "images",
    label: "Images",
    icon: Image,
    description: "Generate carousel images",
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "audio",
    label: "Audio",
    icon: Volume2,
    description: "Generate narration audio",
    color: "from-rose-500 to-red-500",
  },
  {
    id: "review",
    label: "Review",
    icon: CheckCircle,
    description: "Review and finalize",
    color: "from-green-500 to-emerald-500",
  },
];

function LayoutContent({ children }: SocialCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "content";
  const mode = searchParams.get("mode");

  const { state, canComplete, completePost, savePost, goToStep } = useSocialPost();

  React.useEffect(() => {
    if (!mode) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", "create");
      router.replace(`/dashboard/social/create?${params.toString()}`);
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-mode", "create");
      }
    }
  }, [mode, searchParams, router]);

  // @ts-ignore - Convex type inference
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");

  const navigateToStep = (step: string) => {
    goToStep(step);
  };

  const handleSaveDraft = async () => {
    await savePost();
  };

  const handleComplete = async () => {
    const result = await completePost();
    if (result.success) {
      router.push("/dashboard?mode=create");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
          <div className="animate-pulse">
            <div className="mb-6 h-6 w-1/3 rounded bg-muted sm:mb-8 sm:h-8 sm:w-1/4"></div>
            <div className="h-64 rounded bg-muted sm:h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const completedStepsCount = Object.values(state.stepCompletion).filter(Boolean).length;
  const progressPercentage = (completedStepsCount / steps.length) * 100;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard?mode=create">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Social Post Generator</h1>
                <p className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {steps.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1 sm:flex">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Auto-saving</span>
              </div>
              <Progress value={progressPercentage} className="h-2 w-24" />
              <span className="text-sm font-medium text-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center overflow-x-auto rounded-full border border-border bg-card p-2 shadow-lg">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isComplete =
                  state.stepCompletion[step.id as keyof typeof state.stepCompletion];
                const isPrevious = currentStepIndex > index;

                return (
                  <div key={step.id} className="flex items-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateToStep(step.id)}
                      className={`relative rounded-full p-3 transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                          : isComplete || isPrevious
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {isComplete && !isActive && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                    {index < steps.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 w-8 ${
                          isPrevious || isComplete ? "bg-green-300 dark:bg-green-700" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              <div
                className={`rounded-lg bg-gradient-to-r p-2 ${steps.find((s) => s.id === currentStep)?.color} text-white`}
              >
                {React.createElement(steps.find((s) => s.id === currentStep)?.icon || FileText, {
                  className: "w-4 h-4",
                })}
              </div>
              <span className="font-semibold text-foreground">
                {steps.find((s) => s.id === currentStep)?.label}
              </span>
            </div>
            <p className="mx-auto max-w-md text-muted-foreground">
              {steps.find((s) => s.id === currentStep)?.description}
            </p>
          </div>
        </motion.div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="mb-8"
        >
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl">
            <div className="p-8 lg:p-12">{children}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              {state.lastSaved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Saved {state.lastSaved.toLocaleTimeString()}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index < completedStepsCount ? "bg-green-500" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={state.isSaving}
                className="h-12 rounded-xl px-6 transition-all hover:shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                {state.isSaving ? "Saving..." : "Save Draft"}
              </Button>

              <Button
                onClick={handleComplete}
                disabled={!canComplete()}
                className={`h-12 rounded-xl px-8 font-semibold transition-all ${
                  canComplete()
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                }`}
              >
                {canComplete() ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Complete Post
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Complete Steps
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SocialCreateLayout({ children }: SocialCreateLayoutProps) {
  return (
    <SocialPostProvider>
      <LayoutContent>{children}</LayoutContent>
    </SocialPostProvider>
  );
}
