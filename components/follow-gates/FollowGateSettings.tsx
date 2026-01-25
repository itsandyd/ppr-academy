"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Instagram,
  Music2,
  Youtube,
  Video,
  AlertCircle,
  Lock,
  Mail,
  Facebook,
  Twitter,
  Tv,
  Radio,
  Music,
  ShoppingBag,
  GripVertical,
} from "lucide-react";

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
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.186-1.334c-.01-.057-.053-.09-.09-.09zm1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.059-.104-.12-.104zm.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.015-.075-.074-.135-.166-.135zm1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.43zm.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18zm.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.192-4.856c-.016-.12-.105-.21-.21-.21zm.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.209-.225-.209zm1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456-.016.015zm.749-.134c-.135 0-.255.119-.255.254l-.15 5.322.15 2.473c0 .15.12.255.255.255s.255-.12.255-.27l.154-2.474-.154-5.306c0-.148-.12-.254-.255-.254zm1.005.166c-.164 0-.284.135-.284.285l-.103 5.143.135 2.474c0 .149.119.277.284.277.149 0 .271-.12.284-.285l.121-2.443-.135-5.112c-.012-.164-.135-.285-.285-.285l-.017-.054zm1.049-.09c-.165 0-.3.135-.313.3l-.091 5.233.105 2.385c.015.165.15.3.315.3.149 0 .284-.135.299-.285l.105-2.414-.12-5.217c-.015-.18-.135-.3-.3-.3zm1.064-.39c-.18 0-.314.149-.329.314l-.105 5.585.12 2.354c.015.18.149.314.314.314.164 0 .314-.135.314-.314l.12-2.354-.135-5.6c-.015-.164-.15-.299-.314-.299h.015zm1.109.105c-.195 0-.345.149-.359.344l-.074 5.415.103 2.354c.015.194.164.344.344.344.195 0 .345-.149.359-.344l.09-2.354-.09-5.43c-.014-.18-.164-.329-.358-.329h-.015zm2.004-.584c-.21 0-.375.165-.391.375l-.074 5.385.09 2.339c.016.21.18.375.391.375.195 0 .375-.165.375-.375l.09-2.354-.09-5.399c0-.21-.165-.391-.391-.391v.045zm1.065.639c-.225 0-.405.165-.405.405l-.075 4.762.09 2.325c0 .24.18.405.405.405.21 0 .405-.165.405-.405l.09-2.324-.105-4.763c0-.24-.18-.405-.405-.405zm1.094-.074c-.24 0-.42.18-.435.405l-.074 4.8.089 2.31c.016.24.196.42.42.42.24 0 .42-.18.435-.42l.09-2.31-.09-4.785c-.015-.24-.195-.42-.42-.42h-.015zm1.064.135c-.255 0-.449.195-.449.449l-.061 4.65.076 2.294c.015.255.195.435.449.435.24 0 .435-.194.449-.449l.091-2.294-.091-4.635c-.014-.255-.209-.45-.449-.45h-.015zm3.57-.449c-.254 0-.449.195-.449.449l-.09 4.635.09 2.294c0 .255.195.449.449.449.255 0 .449-.194.449-.449l.105-2.294-.105-4.635c0-.255-.194-.449-.449-.449zm1.035.27c-.27 0-.479.21-.479.479l-.061 4.365.076 2.265c0 .27.21.479.479.479.255 0 .479-.21.479-.479l.09-2.279-.09-4.365c0-.27-.225-.479-.479-.479l-.015.014zm1.095-.135c-.285 0-.51.225-.51.51l-.045 4.245.061 2.25c.014.285.224.51.509.51.27 0 .494-.225.509-.51l.076-2.25-.091-4.26c0-.27-.224-.495-.509-.495zm1.049.135c-.301 0-.524.24-.524.54l-.061 4.095.076 2.22c.015.3.225.539.524.539.285 0 .51-.24.51-.54l.091-2.219-.091-4.096c0-.3-.225-.539-.525-.539zm2.115 1.335c-.449 0-.689.15-1.086.449-.15-.39-.555-.674-1.035-.674-.3 0-.57.12-.75.315l-.015-.015c-.3 0-.539.24-.554.54l-.061 3.405.076 2.205c.015.285.24.539.539.539.285 0 .524-.24.539-.539l.091-2.205-.076-2.834c.165-.181.375-.3.63-.3.165 0 .315.06.42.135v2.999l.076 2.205c0 .285.225.539.524.539.285 0 .525-.24.54-.539l.09-2.205c-.015-1.814-.015-2.789-.015-2.834 0-1.215-.81-2.189-2.279-2.189l.35.003z" />
  </svg>
);

const AppleMusicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81.84-.553 1.472-1.287 1.88-2.208.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.456-2.105-1.341-.38-1.058.02-2.21 1.06-2.69.417-.192.863-.298 1.315-.366.452-.07.908-.12 1.35-.23.27-.067.474-.198.545-.488.017-.062.022-.126.022-.19l.003-4.867c0-.12-.026-.237-.091-.343-.102-.166-.258-.27-.448-.277-.188-.005-.377.012-.564.042l-4.478.775c-.017.002-.032.008-.05.01-.195.04-.325.16-.385.35-.023.074-.037.152-.037.23-.002 2.602-.002 5.204-.003 7.806 0 .37-.043.737-.195 1.08-.283.64-.77 1.05-1.426 1.265-.345.113-.704.18-1.067.21-.963.08-1.856-.36-2.24-1.29-.387-1.04-.037-2.178.99-2.7.407-.206.85-.312 1.3-.38.476-.072.956-.12 1.423-.238.25-.064.453-.18.536-.448.02-.063.027-.13.027-.196V6.27c0-.202.03-.395.12-.58.15-.305.4-.49.717-.567.18-.043.364-.07.548-.1l6.096-1.058c.18-.03.36-.057.543-.058.43-.002.75.22.866.64.034.124.046.254.046.383l-.004 5.184z" />
  </svg>
);

const DeezerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.59v3.027h5.189V12.59H6.27zm6.271 0v3.027h5.19V12.59h-5.19zm6.27 0v3.027H24V12.59h-5.19zM0 16.81v3.029h5.19v-3.03H0zm6.27 0v3.029h5.189v-3.03H6.27zm6.271 0v3.029h5.19v-3.03h-5.19zm6.27 0v3.029H24v-3.03h-5.19z"/>
  </svg>
);

const MixcloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.462 8.596l1.732 6.842 1.756-6.842h1.528l1.756 6.842 1.732-6.842h1.608l-2.49 8.808H8.416L6.688 10.83l-1.728 6.574H3.292L.802 8.596zm11.334 0h5.17v1.404h-3.594v2.178h3.13v1.404h-3.13v2.418h3.594v1.404h-5.17zm6.174 0h1.576v7.404h3.088v1.404h-4.664z"/>
  </svg>
);

const BandcampIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
  </svg>
);

// All supported platforms
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

interface PlatformConfig {
  id: FollowGatePlatform;
  name: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  example: string;
  needsUrl: boolean; // email doesn't need URL
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: "email",
    name: "Email Capture",
    icon: <Mail className="w-5 h-5" />,
    color: "text-blue-600",
    placeholder: "",
    example: "",
    needsUrl: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    color: "text-pink-600",
    placeholder: "@yourusername or https://instagram.com/username",
    example: "@username or https://instagram.com/username",
    needsUrl: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon className="w-5 h-5" />,
    color: "text-black dark:text-white",
    placeholder: "@yourusername or https://tiktok.com/@username",
    example: "@username or https://tiktok.com/@username",
    needsUrl: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="w-5 h-5" />,
    color: "text-red-600",
    placeholder: "https://youtube.com/@yourchannel",
    example: "https://youtube.com/@channel or channel URL",
    needsUrl: true,
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: <SpotifyIcon className="w-5 h-5" />,
    color: "text-green-600",
    placeholder: "https://open.spotify.com/artist/...",
    example: "https://open.spotify.com/artist/...",
    needsUrl: true,
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    icon: <SoundCloudIcon className="w-5 h-5" />,
    color: "text-orange-500",
    placeholder: "https://soundcloud.com/yourprofile",
    example: "https://soundcloud.com/profile",
    needsUrl: true,
  },
  {
    id: "appleMusic",
    name: "Apple Music",
    icon: <AppleMusicIcon className="w-5 h-5" />,
    color: "text-pink-500",
    placeholder: "https://music.apple.com/artist/...",
    example: "https://music.apple.com/artist/...",
    needsUrl: true,
  },
  {
    id: "deezer",
    name: "Deezer",
    icon: <DeezerIcon className="w-5 h-5" />,
    color: "text-purple-600",
    placeholder: "https://deezer.com/artist/...",
    example: "https://deezer.com/artist/...",
    needsUrl: true,
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: <Tv className="w-5 h-5" />,
    color: "text-purple-500",
    placeholder: "https://twitch.tv/yourchannel",
    example: "https://twitch.tv/channel",
    needsUrl: true,
  },
  {
    id: "mixcloud",
    name: "Mixcloud",
    icon: <MixcloudIcon className="w-5 h-5" />,
    color: "text-blue-500",
    placeholder: "https://mixcloud.com/yourprofile",
    example: "https://mixcloud.com/profile",
    needsUrl: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    color: "text-blue-600",
    placeholder: "https://facebook.com/yourpage",
    example: "https://facebook.com/page",
    needsUrl: true,
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: <Twitter className="w-5 h-5" />,
    color: "text-black dark:text-white",
    placeholder: "@yourusername or https://x.com/username",
    example: "@username or https://x.com/username",
    needsUrl: true,
  },
  {
    id: "bandcamp",
    name: "Bandcamp",
    icon: <BandcampIcon className="w-5 h-5" />,
    color: "text-teal-600",
    placeholder: "https://yourbandcamp.bandcamp.com",
    example: "https://name.bandcamp.com",
    needsUrl: true,
  },
];

export interface FollowGateStep {
  platform: FollowGatePlatform;
  url?: string;
  mandatory: boolean;
  order: number;
}

export interface FollowGateSettingsValue {
  enabled: boolean;
  steps: FollowGateStep[];
  message?: string;
  // Legacy fields for backward compatibility
  requirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    appleMusic?: string;
    deezer?: string;
    twitch?: string;
    mixcloud?: string;
    facebook?: string;
    twitter?: string;
    bandcamp?: string;
  };
}

interface FollowGateSettingsProps {
  value: FollowGateSettingsValue;
  onChange: (value: FollowGateSettingsValue) => void;
}

export function FollowGateSettings({ value, onChange }: FollowGateSettingsProps) {
  // Ensure steps array exists
  const steps = value.steps || [];

  const updateSettings = (updates: Partial<FollowGateSettingsValue>) => {
    onChange({ ...value, ...updates });
  };

  const togglePlatform = (platformId: FollowGatePlatform) => {
    const existingIndex = steps.findIndex((s) => s.platform === platformId);

    if (existingIndex >= 0) {
      // Remove platform
      const newSteps = steps.filter((s) => s.platform !== platformId);
      // Reorder remaining steps
      const reorderedSteps = newSteps.map((s, i) => ({ ...s, order: i }));
      updateSettings({ steps: reorderedSteps });
    } else {
      // Add platform
      const newStep: FollowGateStep = {
        platform: platformId,
        url: "",
        mandatory: true, // Default to mandatory
        order: steps.length,
      };
      updateSettings({ steps: [...steps, newStep] });
    }
  };

  const updateStep = (platformId: FollowGatePlatform, updates: Partial<FollowGateStep>) => {
    const newSteps = steps.map((s) =>
      s.platform === platformId ? { ...s, ...updates } : s
    );
    updateSettings({ steps: newSteps });
  };

  const isPlatformEnabled = (platformId: FollowGatePlatform) => {
    return steps.some((s) => s.platform === platformId);
  };

  const getStepForPlatform = (platformId: FollowGatePlatform) => {
    return steps.find((s) => s.platform === platformId);
  };

  // Validation
  const validation = useMemo(() => {
    const errors: Partial<Record<FollowGatePlatform, string>> = {};

    for (const step of steps) {
      const config = PLATFORM_CONFIGS.find((p) => p.id === step.platform);
      if (!config) continue;

      if (config.needsUrl && (!step.url || step.url.trim() === "")) {
        errors[step.platform] = `${config.name} URL is required`;
      }
    }

    return {
      errors,
      hasErrors: Object.keys(errors).length > 0,
    };
  }, [steps]);

  // Count stats
  const enabledPlatforms = steps.length;
  const mandatoryPlatforms = steps.filter((s) => s.mandatory).length;
  const optionalPlatforms = steps.filter((s) => !s.mandatory).length;

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
              Require users to follow you on social media and/or provide their email to unlock downloads
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
          {/* Platform Selection */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Gate Steps</Label>
              <p className="text-sm text-muted-foreground">
                Select which platforms users must follow. Toggle "Required" for mandatory steps.
              </p>
            </div>

            <div className="space-y-3">
              {PLATFORM_CONFIGS.map((platform) => {
                const isEnabled = isPlatformEnabled(platform.id);
                const step = getStepForPlatform(platform.id);
                const hasError = validation.errors[platform.id];

                return (
                  <div
                    key={platform.id}
                    className={`rounded-lg border-2 transition-all ${
                      isEnabled
                        ? hasError
                          ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                          : "border-primary/30 bg-primary/5"
                        : "border-transparent bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Platform Icon & Name */}
                      <div className={`flex-shrink-0 ${platform.color}`}>
                        {platform.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">{platform.name}</Label>
                          <div className="flex items-center gap-3">
                            {/* Mandatory Toggle (only show when enabled) */}
                            {isEnabled && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {step?.mandatory ? "Required" : "Optional"}
                                </span>
                                <Switch
                                  checked={step?.mandatory ?? true}
                                  onCheckedChange={(mandatory) =>
                                    updateStep(platform.id, { mandatory })
                                  }
                                  className="data-[state=checked]:bg-primary"
                                />
                              </div>
                            )}
                            {/* Enable Toggle */}
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => togglePlatform(platform.id)}
                            />
                          </div>
                        </div>

                        {/* URL Input (when enabled and needs URL) */}
                        {isEnabled && platform.needsUrl && (
                          <div className="mt-3">
                            <Input
                              placeholder={platform.placeholder}
                              value={step?.url || ""}
                              onChange={(e) => updateStep(platform.id, { url: e.target.value })}
                              className={hasError ? "border-red-500" : ""}
                            />
                            {hasError && (
                              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {hasError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

          {/* Summary */}
          <div className={`p-4 rounded-lg border ${
            enabledPlatforms === 0
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              : validation.hasErrors
              ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
          }`}>
            <p className="text-sm font-semibold mb-2">Follow Gate Summary:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {enabledPlatforms === 0 ? (
                <li className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No steps configured - follow gate won't appear
                </li>
              ) : (
                <>
                  <li className={validation.hasErrors ? "text-red-600" : "text-green-600"}>
                    {mandatoryPlatforms} required step(s)
                    {optionalPlatforms > 0 && `, ${optionalPlatforms} optional`}
                    {validation.hasErrors && " (fix URL errors above)"}
                  </li>
                  <li className="text-muted-foreground text-xs">
                    Users must complete all required steps to unlock download
                  </li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
