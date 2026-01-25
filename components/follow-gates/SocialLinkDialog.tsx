"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  Youtube,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Platform specific icons
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

export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "spotify";

interface SocialLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: SocialPlatform;
  url: string;
  onConfirmed: () => void;
  creatorName?: string;
}

// Minimum time user must have the dialog open before confirming (in seconds)
const MIN_VIEW_TIME = 3;

export function SocialLinkDialog({
  open,
  onOpenChange,
  platform,
  url,
  onConfirmed,
  creatorName = "the creator",
}: SocialLinkDialogProps) {
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MIN_VIEW_TIME);
  const [canConfirm, setCanConfirm] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setHasOpenedLink(false);
      setTimeRemaining(MIN_VIEW_TIME);
      setCanConfirm(false);
    }
  }, [open]);

  // Countdown timer after link is opened
  useEffect(() => {
    if (!hasOpenedLink || canConfirm) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanConfirm(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasOpenedLink, canConfirm]);

  const handleOpenLink = useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer");
    setHasOpenedLink(true);
  }, [url]);

  const handleConfirm = useCallback(() => {
    onConfirmed();
    onOpenChange(false);
  }, [onConfirmed, onOpenChange]);

  const getPlatformInfo = () => {
    switch (platform) {
      case "instagram":
        return {
          icon: <Instagram className="h-8 w-8 text-pink-500" />,
          name: "Instagram",
          action: "Follow",
          color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
          buttonClass: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90",
        };
      case "tiktok":
        return {
          icon: <TikTokIcon className="h-8 w-8" />,
          name: "TikTok",
          action: "Follow",
          color: "bg-black",
          buttonClass: "bg-black hover:bg-gray-900",
        };
      case "youtube":
        return {
          icon: <Youtube className="h-8 w-8 text-red-600" />,
          name: "YouTube",
          action: "Subscribe",
          color: "bg-red-600",
          buttonClass: "bg-red-600 hover:bg-red-700",
        };
      case "spotify":
        return {
          icon: <SpotifyIcon className="h-8 w-8 text-green-500" />,
          name: "Spotify",
          action: "Follow",
          color: "bg-green-500",
          buttonClass: "bg-green-500 hover:bg-green-600",
        };
    }
  };

  const info = getPlatformInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {info.icon}
          </div>
          <DialogTitle className="text-xl">
            {info.action} on {info.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {info.action} {creatorName} on {info.name} to unlock your free download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasOpenedLink ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Click the button below to open {info.name} and {info.action.toLowerCase()}.
                After following, come back here to confirm.
              </p>
              <Button
                onClick={handleOpenLink}
                className={cn("w-full text-white font-semibold", info.buttonClass)}
                size="lg"
              >
                Open {info.name}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : !canConfirm ? (
            <>
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 animate-pulse" />
                  <span>
                    Please {info.action.toLowerCase()} on {info.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Waiting {timeRemaining} seconds...
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-1000", info.color)}
                    style={{ width: `${((MIN_VIEW_TIME - timeRemaining) / MIN_VIEW_TIME) * 100}%` }}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleOpenLink}
                className="w-full"
              >
                Open {info.name} Again
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <p className="font-medium">Great! Did you {info.action.toLowerCase()}?</p>
                <p className="text-sm text-muted-foreground">
                  Click confirm if you've followed {creatorName} on {info.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleOpenLink}
                >
                  Open Again
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={cn("text-white", info.buttonClass)}
                >
                  I've Followed
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {!hasOpenedLink && (
          <p className="text-center text-xs text-muted-foreground">
            By following, you're supporting {creatorName}'s work and unlocking free content.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
