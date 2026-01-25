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
  ShieldCheck,
  AlertTriangle,
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
  /** Optional product ID for OAuth verification callback */
  productId?: string;
  /** Whether OAuth verification is available for this platform */
  oauthEnabled?: boolean;
}

// Minimum time user must have the dialog open before confirming (in seconds)
const MIN_VIEW_TIME = 3;

// Platforms that support OAuth verification
// Spotify/YouTube: Full OAuth with auto-follow capability
// Instagram/TikTok: OAuth login verification, then manual follow (Hypeddit-style)
const OAUTH_SUPPORTED_PLATFORMS: SocialPlatform[] = ["spotify", "youtube", "instagram", "tiktok"];

/**
 * Extract platform-specific ID from a URL or input
 * For Spotify/YouTube: Returns the artist/channel ID for API calls
 * For Instagram/TikTok: Returns the profile URL for OAuth redirect flow
 */
function extractPlatformId(platform: SocialPlatform, input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  switch (platform) {
    case "spotify": {
      // Extract artist ID from Spotify URL or raw ID
      const artistMatch = trimmed.match(/artist\/([a-zA-Z0-9]+)/);
      if (artistMatch) return artistMatch[1];
      // Check if it's a raw ID (22 alphanumeric chars)
      if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;
      return null;
    }
    case "youtube": {
      // Extract channel ID from YouTube URL
      const channelMatch = trimmed.match(/channel\/([a-zA-Z0-9_-]+)/);
      if (channelMatch) return channelMatch[1];
      // Extract from /c/ or /@ URLs - these need to be resolved to channel IDs
      // For now, return null for these (require manual setup)
      const handleMatch = trimmed.match(/(?:c\/|@)([a-zA-Z0-9_-]+)/);
      if (handleMatch) return null; // Can't verify handle-based URLs without API lookup
      // Check if it's a raw channel ID (starts with UC)
      if (trimmed.startsWith("UC") && trimmed.length === 24) return trimmed;
      return null;
    }
    case "instagram": {
      // For Instagram, we pass the profile URL to the OAuth flow
      // Accept full URLs or usernames
      if (trimmed.includes("instagram.com")) return trimmed;
      if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
      if (trimmed.length > 0) return `https://instagram.com/${trimmed}`;
      return null;
    }
    case "tiktok": {
      // For TikTok, we pass the profile URL to the OAuth flow
      // Accept full URLs or usernames
      if (trimmed.includes("tiktok.com")) return trimmed;
      if (trimmed.startsWith("@")) return `https://tiktok.com/${trimmed}`;
      if (trimmed.length > 0) return `https://tiktok.com/@${trimmed}`;
      return null;
    }
    default:
      return null;
  }
}

/**
 * Normalize a social media link to a full URL
 * Handles: @username, username, or full URLs
 * Returns empty string if input is invalid/empty
 */
function normalizeSocialUrl(platform: SocialPlatform, input: string): string {
  // Guard against null, undefined, or non-string inputs
  if (!input || typeof input !== "string") return "";

  const trimmed = input.trim();

  // Guard against empty or whitespace-only input
  if (!trimmed || trimmed.length === 0) return "";

  // If it's already a full URL, return it
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Remove @ if present
  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;

  // Guard against empty username after removing @
  if (!username || username.length === 0) return "";

  // Build full URL based on platform
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${username}`;
    case "tiktok":
      return `https://tiktok.com/@${username}`;
    case "youtube":
      // YouTube can be channel name or ID
      if (username.startsWith("UC") && username.length === 24) {
        return `https://youtube.com/channel/${username}`;
      }
      return `https://youtube.com/@${username}`;
    case "spotify":
      // Spotify artist IDs are 22 characters
      if (username.length === 22 && /^[a-zA-Z0-9]+$/.test(username)) {
        return `https://open.spotify.com/artist/${username}`;
      }
      // Try as user
      return `https://open.spotify.com/user/${username}`;
    default:
      return trimmed;
  }
}

export function SocialLinkDialog({
  open,
  onOpenChange,
  platform,
  url,
  onConfirmed,
  creatorName = "the creator",
  productId,
  oauthEnabled = false,
}: SocialLinkDialogProps) {
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(MIN_VIEW_TIME);
  const [canConfirm, setCanConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if OAuth verification is available for this platform
  const supportsOAuth = oauthEnabled && OAUTH_SUPPORTED_PLATFORMS.includes(platform);
  const platformId = supportsOAuth ? extractPlatformId(platform, url) : null;
  const canUseOAuth = supportsOAuth && platformId !== null;

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

  // Get the normalized URL for this platform
  const normalizedUrl = normalizeSocialUrl(platform, url);

  // Debug: Log URL issues in development
  if (process.env.NODE_ENV === "development" && open) {
    console.log(`[SocialLinkDialog] Platform: ${platform}, Raw URL: "${url}", Normalized: "${normalizedUrl}"`);
  }

  const handleOpenLink = useCallback(() => {
    // Guard against empty URLs - don't open if URL is empty or invalid
    if (!normalizedUrl || normalizedUrl === "" || !normalizedUrl.startsWith("http")) {
      console.error(`[SocialLinkDialog] Invalid URL for ${platform}: "${url}" -> "${normalizedUrl}"`);
      // Show error state instead of opening invalid URL
      return;
    }
    window.open(normalizedUrl, "_blank", "noopener,noreferrer");
    setHasOpenedLink(true);
  }, [normalizedUrl, platform, url]);

  const handleConfirm = useCallback(() => {
    onConfirmed();
    onOpenChange(false);
  }, [onConfirmed, onOpenChange]);

  // Handle OAuth verification
  const handleOAuthVerify = useCallback(() => {
    if (!canUseOAuth || !platformId) return;

    setIsVerifying(true);
    const returnUrl = window.location.href;

    let oauthUrl: string;
    switch (platform) {
      case "spotify":
        oauthUrl = `/api/follow-gate/spotify?artistId=${encodeURIComponent(platformId)}&returnUrl=${encodeURIComponent(returnUrl)}${productId ? `&productId=${encodeURIComponent(productId)}` : ""}`;
        break;
      case "youtube":
        oauthUrl = `/api/follow-gate/youtube?channelId=${encodeURIComponent(platformId)}&returnUrl=${encodeURIComponent(returnUrl)}${productId ? `&productId=${encodeURIComponent(productId)}` : ""}`;
        break;
      case "instagram":
        // Instagram OAuth flow - verify login, then open profile for manual follow
        oauthUrl = `/api/follow-gate/instagram?profileUrl=${encodeURIComponent(platformId)}&returnUrl=${encodeURIComponent(returnUrl)}${productId ? `&productId=${encodeURIComponent(productId)}` : ""}`;
        break;
      case "tiktok":
        // TikTok OAuth flow - verify login, then open profile for manual follow
        oauthUrl = `/api/follow-gate/tiktok?profileUrl=${encodeURIComponent(platformId)}&returnUrl=${encodeURIComponent(returnUrl)}${productId ? `&productId=${encodeURIComponent(productId)}` : ""}`;
        break;
      default:
        setIsVerifying(false);
        return;
    }

    // Redirect to OAuth flow
    window.location.href = oauthUrl;
  }, [canUseOAuth, platformId, platform, productId]);

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
          {/* Error state: URL not configured properly */}
          {!normalizedUrl || !normalizedUrl.startsWith("http") ? (
            <div className="text-center space-y-3 py-4">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
              <p className="font-medium">Social link not configured</p>
              <p className="text-sm text-muted-foreground">
                The creator hasn't set up their {info.name} link yet.
                Please contact them or try again later.
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="mt-2"
              >
                Close
              </Button>
            </div>
          ) : isVerifying ? (
            <div className="text-center space-y-3 py-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <p className="font-medium">Verifying your {info.action.toLowerCase()}...</p>
              <p className="text-sm text-muted-foreground">
                Please complete the authorization in the new window
              </p>
            </div>
          ) : !hasOpenedLink ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                {canUseOAuth
                  ? `We can automatically verify your ${info.action.toLowerCase()} using ${info.name}. Click below to connect securely.`
                  : `Click the button below to open ${info.name} and ${info.action.toLowerCase()}. After following, come back here to confirm.`
                }
              </p>
              {canUseOAuth ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleOAuthVerify}
                    className={cn("w-full text-white font-semibold", info.buttonClass)}
                    size="lg"
                  >
                    Verify with {info.name}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    onClick={handleOpenLink}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Open {info.name} Manually
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleOpenLink}
                  className={cn("w-full text-white font-semibold", info.buttonClass)}
                  size="lg"
                >
                  Open {info.name}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              )}
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

        {!hasOpenedLink && !isVerifying && (
          <div className="text-center">
            {canUseOAuth && (
              <p className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                <ShieldCheck className="h-3 w-3" />
                Secure verification - we never post on your behalf
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              By following, you're supporting {creatorName}'s work and unlocking free content.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
