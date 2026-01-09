"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Instagram, Youtube, Music2, Video, ArrowRight, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface FollowGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    _id: Id<"digitalProducts">;
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
  };
  onSuccess?: (submissionId: Id<"followGateSubmissions">) => void;
}

export function FollowGateModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: FollowGateModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [followedPlatforms, setFollowedPlatforms] = useState({
    instagram: false,
    tiktok: false,
    youtube: false,
    spotify: false,
  });

  const submitFollowGate = useMutation(api.followGateSubmissions.submitFollowGate);
  const trackDownload = useMutation(api.followGateSubmissions.trackFollowGateDownload);
  const checkSubmission = useQuery(
    api.followGateSubmissions.checkFollowGateSubmission,
    email && product._id
      ? { productId: product._id, email }
      : "skip"
  );

  const requirements = product.followGateRequirements || {};
  const socialLinks = product.followGateSocialLinks || {};

  // Count required and followed platforms
  const requiredPlatforms = [
    requirements.requireInstagram,
    requirements.requireTiktok,
    requirements.requireYoutube,
    requirements.requireSpotify,
  ].filter(Boolean).length;

  const followedCount = Object.values(followedPlatforms).filter(Boolean).length;
  const minRequired = requirements.minFollowsRequired || 0;
  const requiredCount = minRequired === 0 ? requiredPlatforms : minRequired;

  // Check if requirements are met
  const emailValid = !requirements.requireEmail || (email && /\S+@\S+\.\S+/.test(email));
  const followsValid = requiredPlatforms === 0 || followedCount >= requiredCount;
  const canSubmit = emailValid && followsValid;

  // Handle form submission
  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      const result = await submitFollowGate({
        productId: product._id,
        email,
        name: name || undefined,
        followedPlatforms,
        ipAddress: undefined,
        userAgent: navigator.userAgent,
      });

      if (result.success) {
        setStep("success");
        if (onSuccess) {
          onSuccess(result.submissionId);
        }
      }
    } catch (error) {
      console.error("Failed to submit follow gate:", error);
    }
  };

  // Handle download
  const handleDownload = async (submissionId: Id<"followGateSubmissions">) => {
    try {
      await trackDownload({ submissionId });
      
      if (product.downloadUrl) {
        window.open(product.downloadUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to track download:", error);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("form");
      setEmail("");
      setName("");
      setFollowedPlatforms({
        instagram: false,
        tiktok: false,
        youtube: false,
        spotify: false,
      });
    }
  }, [open]);

  // Check if user already submitted
  useEffect(() => {
    if (checkSubmission && checkSubmission.hasSubmitted) {
      setStep("success");
      setFollowedPlatforms({
        instagram: checkSubmission.submission.followedPlatforms?.instagram ?? false,
        tiktok: checkSubmission.submission.followedPlatforms?.tiktok ?? false,
        youtube: checkSubmission.submission.followedPlatforms?.youtube ?? false,
        spotify: checkSubmission.submission.followedPlatforms?.spotify ?? false,
      });
    }
  }, [checkSubmission]);

  const openSocialLink = (platform: string, url?: string) => {
    if (url) {
      window.open(url, "_blank");
      setFollowedPlatforms(prev => ({ ...prev, [platform]: true }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black max-w-md">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                🎁 Get {product.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                {product.followGateMessage || "Support the creator by following on social media to unlock your free download"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Email Input */}
              {requirements.requireEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    📧 Email Address
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
                  />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background"
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
                Get Download Access
                <ArrowRight className="w-4 h-4 ml-2" />
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
                🎉 Thank You!
              </DialogTitle>
              <DialogDescription className="text-base text-center">
                Your download is ready. Thanks for your support!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {checkSubmission && checkSubmission.hasSubmitted && (
                <Button
                  onClick={() => handleDownload(checkSubmission.submission._id)}
                  className="w-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 hover:opacity-90 text-white font-semibold"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Now
                </Button>
              )}

              <p className="text-sm text-muted-foreground text-center">
                You'll receive an email at <strong>{email}</strong> with your download link
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

