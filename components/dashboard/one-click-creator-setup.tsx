"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Check,
  Loader2,
  ArrowRight,
  Edit2,
  Rocket,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

interface OneClickCreatorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (storeSlug: string) => void;
  nudgeContext?: string;
  contextData?: {
    courseName?: string;
    xpMilestone?: number;
    lessonCount?: number;
    level?: number;
  };
}

export function OneClickCreatorSetup({
  open,
  onOpenChange,
  onComplete,
  nudgeContext,
  contextData,
}: OneClickCreatorSetupProps) {
  const { user } = useUser();
  const router = useRouter();
  const createStoreFromProfile = useMutation(api.stores.createStoreFromProfile);

  const [step, setStep] = useState<"confirm" | "customize" | "success">("confirm");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [createdStore, setCreatedStore] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  // Derive default name from user profile
  const defaultName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.username || "My Store";

  const displayName = customName || defaultName;

  const handleOneClickCreate = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await createStoreFromProfile({
        userId: user.id,
        name: customName || undefined, // Only pass if customized
      });

      setCreatedStore({
        name: result.storeName,
        slug: result.storeSlug,
      });
      setStep("success");

      // Celebration!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#a855f7", "#ec4899", "#f97316", "#22c55e"],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    if (createdStore?.slug) {
      onComplete?.(createdStore.slug);
      // Switch to Create mode
      router.push("/dashboard?mode=create");
    }
  };

  const handleCustomize = () => {
    setCustomName(defaultName);
    setStep("customize");
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://academy.pauseplayrepeat.com";

  // Get contextual message
  const getContextMessage = () => {
    switch (nudgeContext) {
      case "course_completed":
        return `You just completed ${contextData?.courseName || "a course"}! Share your own knowledge.`;
      case "milestone_xp":
        return `Level ${contextData?.xpMilestone || "up"}! Your expertise deserves a home.`;
      case "lessons_milestone":
        return `${contextData?.lessonCount || 5}+ lessons done! You've got knowledge worth sharing.`;
      case "expert_level":
        return `Level ${contextData?.level || 8}! Time to monetize your expertise.`;
      default:
        return "Start sharing your skills and earning from your knowledge.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">
                Ready to create?
              </DialogTitle>
              <DialogDescription className="text-center">
                {getContextMessage()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Preview of what will be created */}
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20">
                <p className="mb-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                  Your creator page
                </p>
                <div className="flex items-center gap-3">
                  {user?.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-full ring-2 ring-purple-200"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {baseUrl.replace("https://", "")}/{displayName.toLowerCase().replace(/\s+/g, "-")}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {/* Primary CTA - One Click */}
              <Button
                onClick={handleOneClickCreate}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 py-6 text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-600"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating your store...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create My Store
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Secondary - Customize */}
              <button
                onClick={handleCustomize}
                className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3 w-3" />
                Use a different name
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>Free to start</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>No monthly fees</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>Keep 90%</span>
              </div>
            </div>
          </>
        )}

        {step === "customize" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Customize your store name
              </DialogTitle>
              <DialogDescription className="text-center">
                This will be your public creator name
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store name</Label>
                <Input
                  id="store-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Metro Boomin, KSHMR"
                  autoFocus
                  className="text-base"
                />
              </div>

              {customName && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Your page:</p>
                  <p className="mt-1 font-mono text-sm">
                    {baseUrl.replace("https://", "")}/
                    <span className="text-purple-500">
                      {customName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || "..."}
                    </span>
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCustomName("");
                    setStep("confirm");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleOneClickCreate}
                  disabled={isCreating || !customName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Store"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && createdStore && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500">
                <Check className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">
                You&apos;re a creator now!
              </DialogTitle>
              <DialogDescription className="text-center">
                Your store is live and ready for your first product
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
                <p className="mb-1 text-xs font-medium text-green-600 dark:text-green-400">
                  Your store is live at
                </p>
                <p className="font-mono text-lg">
                  {baseUrl.replace("https://", "")}/
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {createdStore.slug}
                  </span>
                </p>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 py-6 text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-600"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                You can customize your store anytime in settings
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
