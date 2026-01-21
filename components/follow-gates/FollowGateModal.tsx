"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Instagram, Youtube, Music2, Video, ArrowRight, CheckCircle2, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";

// Flexible product type to support digitalProducts, courses, presetPacks, etc.
export interface FollowGateProduct {
  _id: string;
  title: string;
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;
  downloadUrl?: string;
}

interface FollowGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: FollowGateProduct;
  onSuccess?: (submissionId: Id<"followGateSubmissions">) => void;
}

type FollowedPlatforms = {
  instagram: boolean;
  tiktok: boolean;
  youtube: boolean;
  spotify: boolean;
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function FollowGateModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: FollowGateModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<Id<"followGateSubmissions"> | null>(null);
  const [followedPlatforms, setFollowedPlatforms] = useState<FollowedPlatforms>({
    instagram: false,
    tiktok: false,
    youtube: false,
    spotify: false,
  });

  // Debounce email for query optimization (500ms delay)
  const debouncedEmail = useDebounce(email, 500);

  const submitFollowGate = useMutation(api.followGateSubmissions.submitFollowGate);
  const trackDownload = useMutation(api.followGateSubmissions.trackFollowGateDownload);

  // Only run query when we have a valid debounced email
  const checkSubmission = useQuery(
    api.followGateSubmissions.checkFollowGateSubmission,
    debouncedEmail && product._id && /\S+@\S+\.\S+/.test(debouncedEmail)
      ? { productId: product._id as Id<"digitalProducts">, email: debouncedEmail }
      : "skip"
  );

  const requirements = product.followGateRequirements || {};
  const socialLinks = product.followGateSocialLinks || {};

  // Memoize computed values
  const { requiredPlatforms, followedCount, requiredCount } = useMemo(() => {
    const required = [
      requirements.requireInstagram,
      requirements.requireTiktok,
      requirements.requireYoutube,
      requirements.requireSpotify,
    ].filter(Boolean).length;

    const followed = Object.values(followedPlatforms).filter(Boolean).length;
    const minRequired = requirements.minFollowsRequired || 0;
    const count = minRequired === 0 ? required : minRequired;

    return { requiredPlatforms: required, followedCount: followed, requiredCount: count };
  }, [requirements, followedPlatforms]);

  // Validation
  const emailValid = useMemo(() => {
    if (!requirements.requireEmail) return true;
    return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [requirements.requireEmail, email]);

  const followsValid = useMemo(() => {
    if (requiredPlatforms === 0) return true;
    return followedCount >= requiredCount;
  }, [requiredPlatforms, followedCount, requiredCount]);

  const canSubmit = emailValid && followsValid && submitStatus !== "loading";

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setSubmitStatus("loading");
    setErrorMessage(null);

    try {
      const result = await submitFollowGate({
        productId: product._id as Id<"digitalProducts">,
        email,
        name: name || undefined,
        followedPlatforms,
        ipAddress: undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      if (result.success) {
        setSubmitStatus("success");
        setSubmissionId(result.submissionId);
        setStep("success");

        // Send download email in the background (don't block success)
        if (!result.alreadySubmitted) {
          fetch("/api/follow-gate/send-download-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              submissionId: result.submissionId,
              productId: product._id,
            }),
          }).catch((err) => {
            console.error("Failed to send download email:", err);
          });
        }

        onSuccess?.(result.submissionId);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  }, [canSubmit, submitFollowGate, product._id, email, name, followedPlatforms, onSuccess]);

  // Handle download
  const handleDownload = useCallback(async () => {
    const idToUse = submissionId || (checkSubmission?.hasSubmitted ? checkSubmission.submission._id : null);
    if (!idToUse) return;

    try {
      await trackDownload({ submissionId: idToUse });

      if (product.downloadUrl) {
        window.open(product.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to track download:", error);
      // Still open download even if tracking fails
      if (product.downloadUrl) {
        window.open(product.downloadUrl, "_blank");
      }
    }
  }, [submissionId, checkSubmission, trackDownload, product.downloadUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("form");
      setEmail("");
      setName("");
      setSubmitStatus("idle");
      setErrorMessage(null);
      setSubmissionId(null);
      setFollowedPlatforms({
        instagram: false,
        tiktok: false,
        youtube: false,
        spotify: false,
      });
    }
  }, [open]);

  // Check if user already submitted (with debounced email)
  useEffect(() => {
    if (checkSubmission?.hasSubmitted) {
      setStep("success");
      setSubmissionId(checkSubmission.submission._id);
      setFollowedPlatforms({
        instagram: checkSubmission.submission.followedPlatforms?.instagram ?? false,
        tiktok: checkSubmission.submission.followedPlatforms?.tiktok ?? false,
        youtube: checkSubmission.submission.followedPlatforms?.youtube ?? false,
        spotify: checkSubmission.submission.followedPlatforms?.spotify ?? false,
      });
    }
  }, [checkSubmission]);

  const openSocialLink = useCallback((platform: keyof FollowedPlatforms, url?: string) => {
    if (url) {
      window.open(url, "_blank");
      setFollowedPlatforms(prev => ({ ...prev, [platform]: true }));
    }
  }, []);

  // Determine what to show on success screen
  const hasDirectDownload = Boolean(product.downloadUrl);
  const currentSubmissionId = submissionId || (checkSubmission?.hasSubmitted ? checkSubmission.submission._id : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black max-w-md max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Get {product.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                {product.followGateMessage || "Support the creator by following on social media to unlock your free download"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Email Input */}
              {requirements.requireEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    Email Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background"
                    disabled={submitStatus === "loading"}
                  />
                  {email && !emailValid && (
                    <p className="text-xs text-red-500">Please enter a valid email address</p>
                  )}
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background"
                    disabled={submitStatus === "loading"}
                  />
                </div>
              )}

              {/* Social Platform Follows */}
              {requiredPlatforms > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Follow {requiredCount === requiredPlatforms ? "all" : `${requiredCount} of ${requiredPlatforms}`} platform(s):
                    <span className="text-red-500">*</span>
                  </Label>

                  {/* Instagram */}
                  {requirements.requireInstagram && socialLinks.instagram && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="instagram"
                        checked={followedPlatforms.instagram}
                        onCheckedChange={(checked) =>
                          setFollowedPlatforms(prev => ({ ...prev, instagram: checked as boolean }))
                        }
                        disabled={submitStatus === "loading"}
                      />
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <Label htmlFor="instagram" className="flex-1 font-medium cursor-pointer">
                        Follow on Instagram
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openSocialLink("instagram", socialLinks.instagram)}
                        className="gap-1"
                        disabled={submitStatus === "loading"}
                      >
                        Follow
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* TikTok */}
                  {requirements.requireTiktok && socialLinks.tiktok && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="tiktok"
                        checked={followedPlatforms.tiktok}
                        onCheckedChange={(checked) =>
                          setFollowedPlatforms(prev => ({ ...prev, tiktok: checked as boolean }))
                        }
                        disabled={submitStatus === "loading"}
                      />
                      <Video className="w-5 h-5" />
                      <Label htmlFor="tiktok" className="flex-1 font-medium cursor-pointer">
                        Follow on TikTok
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openSocialLink("tiktok", socialLinks.tiktok)}
                        className="gap-1"
                        disabled={submitStatus === "loading"}
                      >
                        Follow
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* YouTube */}
                  {requirements.requireYoutube && socialLinks.youtube && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="youtube"
                        checked={followedPlatforms.youtube}
                        onCheckedChange={(checked) =>
                          setFollowedPlatforms(prev => ({ ...prev, youtube: checked as boolean }))
                        }
                        disabled={submitStatus === "loading"}
                      />
                      <Youtube className="w-5 h-5 text-red-600" />
                      <Label htmlFor="youtube" className="flex-1 font-medium cursor-pointer">
                        Subscribe on YouTube
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openSocialLink("youtube", socialLinks.youtube)}
                        className="gap-1"
                        disabled={submitStatus === "loading"}
                      >
                        Subscribe
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Spotify */}
                  {requirements.requireSpotify && socialLinks.spotify && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="spotify"
                        checked={followedPlatforms.spotify}
                        onCheckedChange={(checked) =>
                          setFollowedPlatforms(prev => ({ ...prev, spotify: checked as boolean }))
                        }
                        disabled={submitStatus === "loading"}
                      />
                      <Music2 className="w-5 h-5 text-green-600" />
                      <Label htmlFor="spotify" className="flex-1 font-medium cursor-pointer">
                        Follow on Spotify
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openSocialLink("spotify", socialLinks.spotify)}
                        className="gap-1"
                        disabled={submitStatus === "loading"}
                      >
                        Follow
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  <div className="text-sm text-muted-foreground text-center">
                    {followedCount}/{requiredCount} completed
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 hover:opacity-90 text-white font-semibold"
                size="lg"
              >
                {submitStatus === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get Download Access
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-center">
                Thank You!
              </DialogTitle>
              <DialogDescription className="text-base text-center">
                {hasDirectDownload
                  ? "Your download is ready. Click below to get your file!"
                  : "Thanks for your support! Check your email for the download link."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Show download button if direct download available */}
              {hasDirectDownload && currentSubmissionId && (
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 hover:opacity-90 text-white font-semibold"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Now
                </Button>
              )}

              {/* Show email notice only if no direct download OR as secondary info */}
              {requirements.requireEmail && email && (
                <p className="text-sm text-muted-foreground text-center">
                  {hasDirectDownload
                    ? `A copy has also been sent to ${email}`
                    : `Download link sent to ${email}`
                  }
                </p>
              )}

              {/* Close button */}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
