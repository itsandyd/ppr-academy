"use client";

import { Platform, platformMeta } from "@/lib/marketing-campaigns/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Twitter, Instagram, Facebook, Linkedin } from "lucide-react";
import { TikTokIcon } from "./CampaignCard";
import { cn } from "@/lib/utils";

// Platform icon mapping
const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
};

// Platform display names
const platformNames: Record<Platform, string> = {
  email: "Email",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

interface PlatformTabsProps {
  activePlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  enabledPlatforms?: Platform[];
  disabledPlatforms?: Platform[];
  showLabels?: boolean;
  showCharLimits?: boolean;
  contentLengths?: Partial<Record<Platform, number>>;
  variant?: "default" | "compact" | "pills";
  className?: string;
  children?: React.ReactNode;
}

export function PlatformTabs({
  activePlatform,
  onPlatformChange,
  enabledPlatforms,
  disabledPlatforms = [],
  showLabels = true,
  showCharLimits = false,
  contentLengths = {},
  variant = "default",
  className,
  children,
}: PlatformTabsProps) {
  const allPlatforms: Platform[] = ["email", "instagram", "twitter", "facebook", "linkedin", "tiktok"];

  const platforms = enabledPlatforms || allPlatforms;
  const availablePlatforms = platforms.filter((p) => !disabledPlatforms.includes(p));

  // Get character limit status
  const getCharStatus = (platform: Platform): "ok" | "warning" | "error" | null => {
    const length = contentLengths[platform];
    const meta = platformMeta.find((m) => m.id === platform);
    const limit = meta?.characterLimit;

    if (!length || !limit) return null;

    if (length > limit) return "error";
    if (length > limit * 0.9) return "warning";
    return "ok";
  };

  if (variant === "pills") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex flex-wrap gap-2">
          {availablePlatforms.map((platform) => {
            const Icon = platformIcons[platform];
            const isActive = activePlatform === platform;
            const charStatus = showCharLimits ? getCharStatus(platform) : null;
            const meta = platformMeta.find((m) => m.id === platform);

            return (
              <button
                key={platform}
                onClick={() => onPlatformChange(platform)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full border transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input",
                  charStatus === "error" && "border-red-500",
                  charStatus === "warning" && "border-yellow-500"
                )}
              >
                <Icon className="h-4 w-4" />
                {showLabels && (
                  <span className="text-sm">{platformNames[platform]}</span>
                )}
                {showCharLimits && contentLengths[platform] !== undefined && (
                  <Badge
                    variant={
                      charStatus === "error"
                        ? "destructive"
                        : charStatus === "warning"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {contentLengths[platform]}
                    {meta?.characterLimit && (
                      <>/{meta.characterLimit}</>
                    )}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    );
  }

  return (
    <Tabs
      value={activePlatform}
      onValueChange={(v) => onPlatformChange(v as Platform)}
      className={className}
    >
      <TabsList className={cn(
        "w-full justify-start",
        variant === "compact" && "h-9"
      )}>
        {availablePlatforms.map((platform) => {
          const Icon = platformIcons[platform];
          const charStatus = showCharLimits ? getCharStatus(platform) : null;

          return (
            <TabsTrigger
              key={platform}
              value={platform}
              className={cn(
                "flex items-center gap-2",
                variant === "compact" && "text-xs px-2",
                charStatus === "error" && "text-red-600",
                charStatus === "warning" && "text-yellow-600"
              )}
            >
              <Icon className={cn("h-4 w-4", variant === "compact" && "h-3 w-3")} />
              {showLabels && platformNames[platform]}
              {showCharLimits && contentLengths[platform] !== undefined && (
                <span className="text-xs opacity-70">
                  ({contentLengths[platform]})
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}

// Export for direct use
export { platformIcons, platformNames };
