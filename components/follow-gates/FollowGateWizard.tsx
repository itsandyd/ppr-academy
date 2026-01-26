"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Instagram,
  Youtube,
  Mail,
  Facebook,
  Twitter,
  Tv,
  CheckCircle2,
  Download,
  ChevronRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Platform icons
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const SoundCloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.186-1.334c-.01-.057-.053-.09-.09-.09zm1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.059-.104-.12-.104z" />
  </svg>
);

const AppleMusicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81.84-.553 1.472-1.287 1.88-2.208.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393z" />
  </svg>
);

const DeezerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19z" />
  </svg>
);

const MixcloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.462 8.596l1.732 6.842 1.756-6.842h1.528l1.756 6.842 1.732-6.842h1.608l-2.49 8.808H8.416L6.688 10.83l-1.728 6.574H3.292L.802 8.596z" />
  </svg>
);

const BandcampIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
  </svg>
);

// Platform types
export type FollowGatePlatform =
  | "email"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "soundcloud"
  | "appleMusic"
  | "deezer"
  | "twitch"
  | "mixcloud"
  | "facebook"
  | "twitter"
  | "bandcamp";

export interface FollowGateStep {
  platform: FollowGatePlatform;
  url?: string;
  mandatory: boolean;
  order: number;
}

interface PlatformStyle {
  icon: React.ReactNode;
  name: string;
  action: string;
  buttonClass: string;
}

function getPlatformStyle(platform: FollowGatePlatform): PlatformStyle {
  switch (platform) {
    case "email":
      return {
        icon: <Mail className="h-5 w-5" />,
        name: "Email",
        action: "Enter your email",
        buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      };
    case "instagram":
      return {
        icon: <Instagram className="h-5 w-5" />,
        name: "Instagram",
        action: "Follow",
        buttonClass: "bg-[#E4405F] hover:bg-[#d62e4c] text-white",
      };
    case "tiktok":
      return {
        icon: <TikTokIcon className="h-5 w-5" />,
        name: "TikTok",
        action: "Follow",
        buttonClass: "bg-black hover:bg-gray-900 text-white",
      };
    case "youtube":
      return {
        icon: <Youtube className="h-5 w-5" />,
        name: "YouTube",
        action: "Subscribe to",
        buttonClass: "bg-red-600 hover:bg-red-700 text-white",
      };
    case "spotify":
      return {
        icon: <SpotifyIcon className="h-5 w-5" />,
        name: "Spotify",
        action: "Follow",
        buttonClass: "bg-[#1DB954] hover:bg-[#1aa34a] text-white",
      };
    case "soundcloud":
      return {
        icon: <SoundCloudIcon className="h-5 w-5" />,
        name: "SoundCloud",
        action: "Follow",
        buttonClass: "bg-orange-500 hover:bg-orange-600 text-white",
      };
    case "appleMusic":
      return {
        icon: <AppleMusicIcon className="h-5 w-5" />,
        name: "Apple Music",
        action: "Follow",
        buttonClass: "bg-pink-500 hover:bg-pink-600 text-white",
      };
    case "deezer":
      return {
        icon: <DeezerIcon className="h-5 w-5" />,
        name: "Deezer",
        action: "Follow",
        buttonClass: "bg-purple-600 hover:bg-purple-700 text-white",
      };
    case "twitch":
      return {
        icon: <Tv className="h-5 w-5" />,
        name: "Twitch",
        action: "Follow",
        buttonClass: "bg-purple-500 hover:bg-purple-600 text-white",
      };
    case "mixcloud":
      return {
        icon: <MixcloudIcon className="h-5 w-5" />,
        name: "Mixcloud",
        action: "Follow",
        buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
      };
    case "facebook":
      return {
        icon: <Facebook className="h-5 w-5" />,
        name: "Facebook",
        action: "Follow",
        buttonClass: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
      };
    case "twitter":
      return {
        icon: <Twitter className="h-5 w-5" />,
        name: "X",
        action: "Follow",
        buttonClass: "bg-black hover:bg-gray-900 text-white",
      };
    case "bandcamp":
      return {
        icon: <BandcampIcon className="h-5 w-5" />,
        name: "Bandcamp",
        action: "Follow",
        buttonClass: "bg-teal-600 hover:bg-teal-700 text-white",
      };
  }
}

function extractUsername(platform: FollowGatePlatform, url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  if (trimmed.startsWith("@")) return trimmed.slice(1);

  try {
    if (trimmed.includes("/")) {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        let username = pathParts[pathParts.length - 1];
        if (username.startsWith("@")) username = username.slice(1);
        return username;
      }
    }
  } catch {
    // Not a valid URL
  }

  return trimmed;
}

function normalizeUrl(platform: FollowGatePlatform, input?: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.startsWith("http")) return trimmed;

  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${username}`;
    case "tiktok":
      return `https://tiktok.com/@${username}`;
    case "youtube":
      return username.startsWith("UC")
        ? `https://youtube.com/channel/${username}`
        : `https://youtube.com/@${username}`;
    case "spotify":
      return `https://open.spotify.com/artist/${username}`;
    case "soundcloud":
      return `https://soundcloud.com/${username}`;
    case "appleMusic":
      return `https://music.apple.com/artist/${username}`;
    case "deezer":
      return `https://deezer.com/artist/${username}`;
    case "twitch":
      return `https://twitch.tv/${username}`;
    case "mixcloud":
      return `https://mixcloud.com/${username}`;
    case "facebook":
      return `https://facebook.com/${username}`;
    case "twitter":
      return `https://x.com/${username}`;
    case "bandcamp":
      return trimmed.includes("bandcamp.com") ? trimmed : `https://${username}.bandcamp.com`;
    default:
      return trimmed;
  }
}

interface FollowGateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: FollowGateStep[];
  customMessage?: string;
  creatorName?: string;
  onComplete: (email: string, completedSteps: Record<string, boolean>) => void;
}

export function FollowGateWizard({
  open,
  onOpenChange,
  steps,
  customMessage,
  creatorName = "the creator",
  onComplete,
}: FollowGateWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState("");
  const [hasOpenedLink, setHasOpenedLink] = useState(false);

  // Sort steps by order
  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.order - b.order);
  }, [steps]);

  // Current step
  const currentStep = sortedSteps[currentStepIndex];

  // Progress calculation
  const mandatorySteps = sortedSteps.filter((s) => s.mandatory);
  const completedMandatory = mandatorySteps.filter((s) => completedSteps[s.platform]).length;
  const progress = mandatorySteps.length > 0 ? (completedMandatory / mandatorySteps.length) * 100 : 100;
  const allMandatoryComplete = completedMandatory >= mandatorySteps.length;

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setCurrentStepIndex(0);
        setCompletedSteps({});
        setEmail("");
        setHasOpenedLink(false);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Handle step completion
  const handleStepComplete = useCallback(() => {
    if (!currentStep) return;

    setCompletedSteps((prev) => ({
      ...prev,
      [currentStep.platform]: true,
    }));

    // Move to next step
    if (currentStepIndex < sortedSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setHasOpenedLink(false);
    }
  }, [currentStep, currentStepIndex, sortedSteps.length]);

  // Handle open link - opens in a smaller popup window
  const handleOpenLink = useCallback(() => {
    if (!currentStep || currentStep.platform === "email") return;

    const url = normalizeUrl(currentStep.platform, currentStep.url);
    if (url) {
      // Calculate popup position (centered on screen)
      const width = 550;
      const height = 650;
      const left = Math.max(0, (window.screen.width - width) / 2);
      const top = Math.max(0, (window.screen.height - height) / 2);

      // Open in a popup window instead of a new tab
      window.open(
        url,
        "followGatePopup",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      setHasOpenedLink(true);
    }
  }, [currentStep]);

  // Handle final completion
  const handleFinalComplete = useCallback(() => {
    onComplete(email, completedSteps);
    handleOpenChange(false);
  }, [email, completedSteps, onComplete, handleOpenChange]);

  // Skip optional step
  const handleSkip = useCallback(() => {
    if (currentStepIndex < sortedSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setHasOpenedLink(false);
    }
  }, [currentStepIndex, sortedSteps.length]);

  if (!currentStep) {
    return null;
  }

  const style = getPlatformStyle(currentStep.platform);
  const username = extractUsername(currentStep.platform, currentStep.url);
  const displayName = username || creatorName;
  const isEmailStep = currentStep.platform === "email";
  const isLastStep = currentStepIndex === sortedSteps.length - 1;
  const isCompleted = completedSteps[currentStep.platform];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStepIndex + 1} of {sortedSteps.length}
            </span>
            {!currentStep.mandatory && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">Optional</span>
            )}
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-2 h-2 bg-foreground rounded-full mx-auto" />
            <p className="font-bold text-sm uppercase tracking-wide">
              {customMessage || "Please support the artist to unlock your download"}
            </p>
          </div>

          {/* Step content */}
          {isEmailStep ? (
            // Email step
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              <Button
                onClick={handleStepComplete}
                disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                className={cn("w-full h-12 font-semibold", style.buttonClass)}
              >
                {style.icon}
                <span className="ml-2">Continue</span>
              </Button>
            </div>
          ) : isCompleted ? (
            // Completed step
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <span className="font-semibold text-green-600">
                  {style.name} completed!
                </span>
              </div>
              <Button
                onClick={() => {
                  if (isLastStep) {
                    handleFinalComplete();
                  } else {
                    setCurrentStepIndex(currentStepIndex + 1);
                    setHasOpenedLink(false);
                  }
                }}
                className="w-full h-12"
              >
                {isLastStep ? (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Get Download
                  </>
                ) : (
                  <>
                    Next Step
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Social step
            <div className="space-y-3">
              <Button
                onClick={handleOpenLink}
                className={cn("w-full h-12 font-semibold", style.buttonClass)}
              >
                {style.icon}
                <span className="ml-2">
                  {style.action} {displayName}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handleStepComplete}
                disabled={!hasOpenedLink}
                className="w-full h-12 border-2"
              >
                Next
              </Button>

              {!hasOpenedLink && (
                <p className="text-xs text-muted-foreground text-center">
                  Click the button above to open {style.name}, then click Next
                </p>
              )}

              {/* Skip button for optional steps */}
              {!currentStep.mandatory && (
                <button
                  onClick={handleSkip}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Skip this step
                </button>
              )}
            </div>
          )}

          {/* Show all steps summary at bottom */}
          {allMandatoryComplete && !isLastStep && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleFinalComplete}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-5 w-5 mr-2" />
                All required steps done - Get Download!
              </Button>
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {sortedSteps.map((step, index) => (
              <button
                key={step.platform}
                onClick={() => {
                  if (index < currentStepIndex || completedSteps[sortedSteps[index].platform]) {
                    setCurrentStepIndex(index);
                    setHasOpenedLink(false);
                  }
                }}
                disabled={index > currentStepIndex && !completedSteps[sortedSteps[index - 1]?.platform]}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStepIndex
                    ? "w-6 bg-primary"
                    : completedSteps[step.platform]
                    ? "bg-green-500"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
