"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  Youtube,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
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

// Platforms that support OAuth verification with AUTO-FOLLOW capability
// Only Spotify and YouTube have APIs that allow programmatic following
const OAUTH_SUPPORTED_PLATFORMS: SocialPlatform[] = ["spotify", "youtube"];

/**
 * Extract username from a social media URL or input
 */
function extractUsername(platform: SocialPlatform, input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();

  // If it starts with @, just remove it
  if (trimmed.startsWith("@")) return trimmed.slice(1);

  // Try to extract from URL
  try {
    if (trimmed.includes("/")) {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const pathParts = url.pathname.split("/").filter(Boolean);

      if (pathParts.length > 0) {
        let username = pathParts[pathParts.length - 1];
        // Remove @ if present in path
        if (username.startsWith("@")) username = username.slice(1);
        return username;
      }
    }
  } catch {
    // Not a valid URL, treat as username
  }

  return trimmed;
}

/**
 * Extract platform-specific ID from a URL or input (for OAuth platforms)
 */
function extractPlatformId(platform: SocialPlatform, input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  switch (platform) {
    case "spotify": {
      const artistMatch = trimmed.match(/artist\/([a-zA-Z0-9]+)/);
      if (artistMatch) return artistMatch[1];
      if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;
      return null;
    }
    case "youtube": {
      const channelMatch = trimmed.match(/channel\/([a-zA-Z0-9_-]+)/);
      if (channelMatch) return channelMatch[1];
      if (trimmed.startsWith("UC") && trimmed.length === 24) return trimmed;
      return null;
    }
    default:
      return null;
  }
}

/**
 * Normalize a social media link to a full URL
 */
function normalizeSocialUrl(platform: SocialPlatform, input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (!username) return "";

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${username}`;
    case "tiktok":
      return `https://tiktok.com/@${username}`;
    case "youtube":
      if (username.startsWith("UC") && username.length === 24) {
        return `https://youtube.com/channel/${username}`;
      }
      return `https://youtube.com/@${username}`;
    case "spotify":
      if (username.length === 22 && /^[a-zA-Z0-9]+$/.test(username)) {
        return `https://open.spotify.com/artist/${username}`;
      }
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
  creatorName,
  productId,
  oauthEnabled = false,
}: SocialLinkDialogProps) {
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // OAuth support check
  const supportsOAuth = oauthEnabled && OAUTH_SUPPORTED_PLATFORMS.includes(platform);
  const platformId = supportsOAuth ? extractPlatformId(platform, url) : null;
  const canUseOAuth = supportsOAuth && platformId !== null;

  // Extract username for display
  const username = extractUsername(platform, url);
  const displayName = username || creatorName || "the creator";

  // Get normalized URL
  const normalizedUrl = normalizeSocialUrl(platform, url);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setHasOpenedLink(false);
      setIsVerifying(false);
    }
  }, [open]);

  const handleOpenLink = useCallback(() => {
    if (!normalizedUrl || !normalizedUrl.startsWith("http")) {
      console.error(`[SocialLinkDialog] Invalid URL for ${platform}: "${url}"`);
      return;
    }
    window.open(normalizedUrl, "_blank", "noopener,noreferrer");
    setHasOpenedLink(true);
  }, [normalizedUrl, platform, url]);

  const handleNext = useCallback(() => {
    onConfirmed();
    onOpenChange(false);
  }, [onConfirmed, onOpenChange]);

  // Handle OAuth verification (Spotify/YouTube only)
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
      default:
        setIsVerifying(false);
        return;
    }

    window.location.href = oauthUrl;
  }, [canUseOAuth, platformId, platform, productId]);

  // Platform styling
  const getPlatformStyle = () => {
    switch (platform) {
      case "instagram":
        return {
          icon: <Instagram className="h-5 w-5" />,
          name: "Instagram",
          action: "Follow",
          buttonClass: "bg-[#5851DB] hover:bg-[#4840c4] text-white",
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
    }
  };

  const style = getPlatformStyle();

  // Error state - URL not configured
  if (!normalizedUrl || !normalizedUrl.startsWith("http")) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <p className="font-medium">Social link not configured</p>
            <p className="text-sm text-muted-foreground">
              The creator hasn't set up their {style.name} link yet.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading state for OAuth
  if (isVerifying) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm p-6">
          <div className="text-center space-y-4 py-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
            <p className="font-medium">Connecting to {style.name}...</p>
            <p className="text-sm text-muted-foreground">
              Please complete the authorization
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-6">
        <div className="space-y-6">
          {/* Header - Hypeddit style */}
          <div className="text-center">
            <div className="w-2 h-2 bg-foreground rounded-full mx-auto mb-4" />
            <p className="font-bold text-sm uppercase tracking-wide">
              Please support the artist to unlock your download
            </p>
          </div>

          {/* Main action button */}
          {canUseOAuth ? (
            // OAuth flow for Spotify/YouTube - auto-follow
            <div className="space-y-3">
              <Button
                onClick={handleOAuthVerify}
                className={cn("w-full font-semibold h-12", style.buttonClass)}
              >
                {style.icon}
                <span className="ml-2">{style.action} {displayName}</span>
              </Button>

              {hasOpenedLink && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="w-full h-12"
                >
                  Next
                </Button>
              )}

              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Secure verification - we never post on your behalf
              </p>
            </div>
          ) : (
            // Simple flow for Instagram/TikTok - open profile + Next
            <div className="space-y-3">
              <Button
                onClick={handleOpenLink}
                className={cn("w-full font-semibold h-12", style.buttonClass)}
              >
                {style.icon}
                <span className="ml-2">{style.action} {displayName}</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                className="w-full h-12 border-2"
                disabled={!hasOpenedLink}
              >
                Next
              </Button>

              {!hasOpenedLink && (
                <p className="text-xs text-muted-foreground text-center">
                  Click the button above to open {style.name}, then click Next
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
