"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Music, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface QuickCreatorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function QuickCreatorSetup({
  open,
  onOpenChange,
  onComplete,
}: QuickCreatorSetupProps) {
  const { user } = useUser();
  const createStore = useMutation(api.stores.createStore);

  const [step, setStep] = useState<"name" | "success">("name");
  const [producerName, setProducerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState("");

  const slug = generateSlug(producerName);
  const isValidName = producerName.trim().length >= 2;

  const handleCreate = async () => {
    if (!user?.id || !isValidName) return;

    setIsCreating(true);
    setError(null);

    try {
      await createStore({
        name: producerName.trim(),
        slug: slug,
      });

      setCreatedSlug(slug);
      setStep("success");

      // Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://academy.pauseplayrepeat.com";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "name" && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <Music className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">
                Claim your producer name
              </DialogTitle>
              <p className="text-center text-sm text-muted-foreground">
                This is your profile URL. You can add details later.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="producer-name">Producer name</Label>
                <Input
                  id="producer-name"
                  placeholder="e.g., Metro Boomin, KSHMR, deadmau5"
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValidName && !isCreating) {
                      handleCreate();
                    }
                  }}
                  autoFocus
                  className="text-base"
                />
              </div>

              {producerName && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Your page will be at:</p>
                  <p className="mt-1 font-mono text-sm">
                    {baseUrl.replace("https://", "")}/
                    <span className="text-purple-500">{slug || "..."}</span>
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleCreate}
                disabled={!isValidName || isCreating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Claim this name
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                You can change this anytime in settings
              </p>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                <Check className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">
                You&apos;re in!
              </DialogTitle>
              <p className="text-center text-sm text-muted-foreground">
                Your producer page is ready
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <p className="font-mono text-sm">
                  {baseUrl.replace("https://", "")}/
                  <span className="text-purple-500">{createdSlug}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start creating
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Upload a beat, sample pack, or just explore
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
