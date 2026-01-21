"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Instagram, Music2, Youtube, Video, AlertCircle, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Social link validation utilities
const SOCIAL_URL_PATTERNS = {
  instagram: {
    patterns: [
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
      /^@?[a-zA-Z0-9._]+$/, // Just username
    ],
    example: "@username or https://instagram.com/username",
    normalizeUrl: (value: string) => {
      if (!value) return "";
      // If it's just a username, convert to URL
      if (value.match(/^@?[a-zA-Z0-9._]+$/)) {
        const username = value.replace(/^@/, "");
        return `https://instagram.com/${username}`;
      }
      return value;
    },
  },
  tiktok: {
    patterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/@?[a-zA-Z0-9._]+\/?$/,
      /^@?[a-zA-Z0-9._]+$/, // Just username
    ],
    example: "@username or https://tiktok.com/@username",
    normalizeUrl: (value: string) => {
      if (!value) return "";
      if (value.match(/^@?[a-zA-Z0-9._]+$/)) {
        const username = value.replace(/^@/, "");
        return `https://tiktok.com/@${username}`;
      }
      return value;
    },
  },
  youtube: {
    patterns: [
      /^https?:\/\/(www\.)?youtube\.com\/(c|channel|user|@)\/[a-zA-Z0-9_-]+\/?$/,
      /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+\/?$/,
    ],
    example: "https://youtube.com/@username or channel URL",
    normalizeUrl: (value: string) => value,
  },
  spotify: {
    patterns: [
      /^https?:\/\/open\.spotify\.com\/artist\/[a-zA-Z0-9]+(\?.*)?$/,
    ],
    example: "https://open.spotify.com/artist/...",
    normalizeUrl: (value: string) => value,
  },
};

type SocialPlatform = keyof typeof SOCIAL_URL_PATTERNS;

function validateSocialUrl(platform: SocialPlatform, value: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === "") {
    return { valid: false, error: "URL is required when platform is enabled" };
  }

  const config = SOCIAL_URL_PATTERNS[platform];
  const isValid = config.patterns.some((pattern) => pattern.test(value.trim()));

  if (!isValid) {
    return { valid: false, error: `Invalid format. Example: ${config.example}` };
  }

  return { valid: true };
}

export interface FollowGateSettingsValue {
  enabled: boolean;
  requirements: {
    requireEmail: boolean;
    requireInstagram: boolean;
    requireTiktok: boolean;
    requireYoutube: boolean;
    requireSpotify: boolean;
    minFollowsRequired: number;
  };
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  message?: string;
}

interface FollowGateSettingsProps {
  value: FollowGateSettingsValue;
  onChange: (value: FollowGateSettingsValue) => void;
}

export function FollowGateSettings({ value, onChange }: FollowGateSettingsProps) {
  const updateSettings = (updates: Partial<FollowGateSettingsValue>) => {
    onChange({ ...value, ...updates });
  };

  const updateRequirements = (updates: Partial<FollowGateSettingsValue["requirements"]>) => {
    onChange({
      ...value,
      requirements: { ...value.requirements, ...updates },
    });
  };

  const updateSocialLinks = (updates: Partial<FollowGateSettingsValue["socialLinks"]>) => {
    onChange({
      ...value,
      socialLinks: { ...value.socialLinks, ...updates },
    });
  };

  // Validate social links
  const validation = useMemo(() => {
    const errors: Partial<Record<SocialPlatform, string>> = {};

    if (value.requirements.requireInstagram && value.socialLinks.instagram) {
      const result = validateSocialUrl("instagram", value.socialLinks.instagram);
      if (!result.valid) errors.instagram = result.error;
    }

    if (value.requirements.requireTiktok && value.socialLinks.tiktok) {
      const result = validateSocialUrl("tiktok", value.socialLinks.tiktok);
      if (!result.valid) errors.tiktok = result.error;
    }

    if (value.requirements.requireYoutube && value.socialLinks.youtube) {
      const result = validateSocialUrl("youtube", value.socialLinks.youtube);
      if (!result.valid) errors.youtube = result.error;
    }

    if (value.requirements.requireSpotify && value.socialLinks.spotify) {
      const result = validateSocialUrl("spotify", value.socialLinks.spotify);
      if (!result.valid) errors.spotify = result.error;
    }

    // Check for missing URLs when platform is required
    if (value.requirements.requireInstagram && !value.socialLinks.instagram) {
      errors.instagram = "Instagram URL is required";
    }
    if (value.requirements.requireTiktok && !value.socialLinks.tiktok) {
      errors.tiktok = "TikTok URL is required";
    }
    if (value.requirements.requireYoutube && !value.socialLinks.youtube) {
      errors.youtube = "YouTube URL is required";
    }
    if (value.requirements.requireSpotify && !value.socialLinks.spotify) {
      errors.spotify = "Spotify URL is required";
    }

    return {
      errors,
      hasErrors: Object.keys(errors).length > 0,
    };
  }, [value.requirements, value.socialLinks]);

  // Count how many platforms are selected
  const selectedPlatforms = [
    value.requirements.requireInstagram,
    value.requirements.requireTiktok,
    value.requirements.requireYoutube,
    value.requirements.requireSpotify,
  ].filter(Boolean).length;

  // Check if any requirement is set
  const hasRequirement = value.requirements.requireEmail || selectedPlatforms > 0;

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Follow Gate
              {value.enabled && (
                <Badge variant="default" className="bg-chart-1">Active</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Require users to follow you on social media and/or provide their email to unlock this download
            </CardDescription>
          </div>
          <Switch
            checked={value.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>
      </CardHeader>

      {value.enabled && (
        <CardContent className="space-y-6">
          {/* Email Requirement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Email Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Collect email addresses to build your mailing list
                </p>
              </div>
              <Switch
                checked={value.requirements.requireEmail}
                onCheckedChange={(requireEmail) => updateRequirements({ requireEmail })}
              />
            </div>
          </div>

          {/* Social Platform Requirements */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Social Platform Follows</Label>
              <p className="text-sm text-muted-foreground">
                Select which platforms users need to follow you on
              </p>
            </div>

            {/* Instagram */}
            <div className={`flex items-start gap-4 p-4 rounded-lg ${
              validation.errors.instagram ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted/50"
            }`}>
              <div className="mt-1">
                <Instagram className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Instagram</Label>
                  <Switch
                    checked={value.requirements.requireInstagram}
                    onCheckedChange={(requireInstagram) => updateRequirements({ requireInstagram })}
                  />
                </div>
                {value.requirements.requireInstagram && (
                  <>
                    <Input
                      placeholder="@yourusername or https://instagram.com/username"
                      value={value.socialLinks.instagram || ""}
                      onChange={(e) => updateSocialLinks({ instagram: e.target.value })}
                      className={validation.errors.instagram ? "border-red-500" : ""}
                    />
                    {validation.errors.instagram && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.instagram}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* TikTok */}
            <div className={`flex items-start gap-4 p-4 rounded-lg ${
              validation.errors.tiktok ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted/50"
            }`}>
              <div className="mt-1">
                <Video className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">TikTok</Label>
                  <Switch
                    checked={value.requirements.requireTiktok}
                    onCheckedChange={(requireTiktok) => updateRequirements({ requireTiktok })}
                  />
                </div>
                {value.requirements.requireTiktok && (
                  <>
                    <Input
                      placeholder="@yourusername or https://tiktok.com/@username"
                      value={value.socialLinks.tiktok || ""}
                      onChange={(e) => updateSocialLinks({ tiktok: e.target.value })}
                      className={validation.errors.tiktok ? "border-red-500" : ""}
                    />
                    {validation.errors.tiktok && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.tiktok}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className={`flex items-start gap-4 p-4 rounded-lg ${
              validation.errors.youtube ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted/50"
            }`}>
              <div className="mt-1">
                <Youtube className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">YouTube</Label>
                  <Switch
                    checked={value.requirements.requireYoutube}
                    onCheckedChange={(requireYoutube) => updateRequirements({ requireYoutube })}
                  />
                </div>
                {value.requirements.requireYoutube && (
                  <>
                    <Input
                      placeholder="https://youtube.com/@yourchannel"
                      value={value.socialLinks.youtube || ""}
                      onChange={(e) => updateSocialLinks({ youtube: e.target.value })}
                      className={validation.errors.youtube ? "border-red-500" : ""}
                    />
                    {validation.errors.youtube && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.youtube}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Spotify */}
            <div className={`flex items-start gap-4 p-4 rounded-lg ${
              validation.errors.spotify ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-muted/50"
            }`}>
              <div className="mt-1">
                <Music2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Spotify</Label>
                  <Switch
                    checked={value.requirements.requireSpotify}
                    onCheckedChange={(requireSpotify) => updateRequirements({ requireSpotify })}
                  />
                </div>
                {value.requirements.requireSpotify && (
                  <>
                    <Input
                      placeholder="https://open.spotify.com/artist/..."
                      value={value.socialLinks.spotify || ""}
                      onChange={(e) => updateSocialLinks({ spotify: e.target.value })}
                      className={validation.errors.spotify ? "border-red-500" : ""}
                    />
                    {validation.errors.spotify && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.spotify}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Minimum Follows Requirement */}
          {selectedPlatforms > 1 && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Follow Requirement</Label>
                <p className="text-sm text-muted-foreground">
                  How many platforms must users follow?
                </p>
              </div>
              <Select
                value={value.requirements.minFollowsRequired.toString()}
                onValueChange={(val) => updateRequirements({ minFollowsRequired: parseInt(val) })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="0">All {selectedPlatforms} platforms (required)</SelectItem>
                  {Array.from({ length: selectedPlatforms - 1 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      At least {num} out of {selectedPlatforms} platforms
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Custom Message (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Personalize the message users see when they encounter the follow gate
              </p>
            </div>
            <Textarea
              placeholder="e.g., 'Thanks for your support! Follow me to get this free download'"
              value={value.message || ""}
              onChange={(e) => updateSettings({ message: e.target.value })}
              rows={3}
              className="bg-background"
            />
          </div>

          {/* Preview Summary */}
          <div className={`p-4 rounded-lg border ${
            !hasRequirement
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              : validation.hasErrors
              ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
          }`}>
            <p className="text-sm font-semibold mb-2">Follow Gate Summary:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {value.requirements.requireEmail && (
                <li className="text-green-600 dark:text-green-400">Email address required</li>
              )}
              {selectedPlatforms > 0 && (
                <li className={validation.hasErrors ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                  Follow {value.requirements.minFollowsRequired === 0
                    ? `all ${selectedPlatforms}`
                    : `${value.requirements.minFollowsRequired} of ${selectedPlatforms}`} platform(s)
                  {validation.hasErrors && " (fix URL errors above)"}
                </li>
              )}
              {!hasRequirement && (
                <li className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No requirements set - follow gate won't appear
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
