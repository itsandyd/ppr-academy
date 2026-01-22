"use client";

import { useReleaseCreation } from "../context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Bell,
  Mail,
  Instagram,
  Music,
  Music2,
  Users,
  Gift,
  Sparkles,
  Info,
  CheckCircle2,
  Zap,
  Youtube,
  Disc,
} from "lucide-react";

const socialPlatforms = [
  {
    id: "email",
    name: "Email",
    icon: Mail,
    description: "Required to send updates",
    required: true,
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: Disc,
    description: "Pre-save on Spotify",
    color: "text-[#1DB954]",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Follow on Instagram",
    color: "text-[#E4405F]",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    description: "Follow on TikTok",
    color: "text-black dark:text-white",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    description: "Subscribe on YouTube",
    color: "text-[#FF0000]",
  },
];

export function ReleasePresaveForm() {
  const { state, updateData } = useReleaseCreation();

  const requirements = state.data.followGateRequirements || {
    requireEmail: true,
    requireSpotify: true,
  };

  const socialLinks = state.data.followGateSocialLinks || {};

  const handleRequirementToggle = (platform: string, enabled: boolean) => {
    const key = `require${platform.charAt(0).toUpperCase() + platform.slice(1)}` as keyof typeof requirements;
    updateData("presave", {
      followGateRequirements: {
        ...requirements,
        [key]: enabled,
      },
    });
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    updateData("presave", {
      followGateSocialLinks: {
        ...socialLinks,
        [platform]: value,
      },
    });
  };

  const getRequirement = (platform: string): boolean => {
    const key = `require${platform.charAt(0).toUpperCase() + platform.slice(1)}` as keyof typeof requirements;
    const value = requirements[key];
    return typeof value === 'boolean' ? value : false;
  };

  const getSocialLink = (platform: string): string => {
    return socialLinks[platform as keyof typeof socialLinks] || "";
  };

  // Count enabled requirements
  const enabledRequirements = Object.values(requirements).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Pre-Save Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                Pre-Save Campaign
              </CardTitle>
              <CardDescription>
                Collect pre-saves and grow your fanbase before release
              </CardDescription>
            </div>
            <Switch
              checked={state.data.preSaveEnabled !== false}
              onCheckedChange={(checked) =>
                updateData("presave", { preSaveEnabled: checked })
              }
            />
          </div>
        </CardHeader>
        {state.data.preSaveEnabled !== false && (
          <CardContent>
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                Fans enter their email and complete your requirements to pre-save. When your track drops,
                they get an automatic notification and can save it instantly.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {state.data.preSaveEnabled !== false && (
        <>
          {/* Requirements Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Fan Requirements
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>What do fans need to do to pre-save?</span>
                <Badge variant="secondary">
                  {enabledRequirements} requirement{enabledRequirements !== 1 ? "s" : ""}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialPlatforms.map((platform) => {
                const isEnabled = platform.id === "email" ? true : getRequirement(platform.id);
                const Icon = platform.icon;

                return (
                  <div
                    key={platform.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 transition-all",
                      isEnabled ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          isEnabled ? "bg-primary/10" : "bg-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            platform.color || "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{platform.name}</span>
                          {platform.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    {!platform.required && (
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleRequirementToggle(platform.id, checked)
                        }
                      />
                    )}
                    {platform.required && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                );
              })}

              {/* Minimum Follows */}
              {enabledRequirements > 2 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Minimum actions required</Label>
                    <Badge variant="outline">
                      {requirements.minFollowsRequired || 0} of {enabledRequirements}
                    </Badge>
                  </div>
                  <Slider
                    value={[requirements.minFollowsRequired || 0]}
                    min={0}
                    max={enabledRequirements}
                    step={1}
                    onValueChange={([value]) =>
                      updateData("presave", {
                        followGateRequirements: {
                          ...requirements,
                          minFollowsRequired: value,
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    0 = All actions required. Set higher to give fans flexibility.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Your Social Links
              </CardTitle>
              <CardDescription>
                Add the links fans should follow/subscribe to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getRequirement("spotify") && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Disc className="h-4 w-4 text-[#1DB954]" />
                    Spotify Artist Profile
                  </Label>
                  <Input
                    placeholder="https://open.spotify.com/artist/..."
                    value={getSocialLink("spotify")}
                    onChange={(e) => handleSocialLinkChange("spotify", e.target.value)}
                  />
                </div>
              )}

              {getRequirement("instagram") && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-[#E4405F]" />
                    Instagram Username
                  </Label>
                  <Input
                    placeholder="@yourhandle"
                    value={getSocialLink("instagram")}
                    onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                  />
                </div>
              )}

              {getRequirement("tiktok") && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music2 className="h-4 w-4" />
                    TikTok Username
                  </Label>
                  <Input
                    placeholder="@yourhandle"
                    value={getSocialLink("tiktok")}
                    onChange={(e) => handleSocialLinkChange("tiktok", e.target.value)}
                  />
                </div>
              )}

              {getRequirement("youtube") && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-[#FF0000]" />
                    YouTube Channel
                  </Label>
                  <Input
                    placeholder="https://youtube.com/@yourhandle"
                    value={getSocialLink("youtube")}
                    onChange={(e) => handleSocialLinkChange("youtube", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                Pre-Save Message
              </CardTitle>
              <CardDescription>
                Customize the message fans see on your pre-save page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="followGateMessage">Custom Message</Label>
                <Textarea
                  id="followGateMessage"
                  placeholder={`Pre-save my new ${state.data.releaseType || "track"} "${state.data.title || "Untitled"}" dropping soon! Be the first to hear it.`}
                  rows={3}
                  value={state.data.followGateMessage || ""}
                  onChange={(e) =>
                    updateData("presave", { followGateMessage: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default message
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Pre-Save Page Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-background p-6 text-center space-y-4">
                {state.data.coverArtUrl && (
                  <img
                    src={state.data.coverArtUrl}
                    alt="Cover"
                    className="w-32 h-32 mx-auto rounded-lg shadow-lg"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {state.data.title || "Your Release Title"}
                  </h3>
                  <p className="text-muted-foreground">
                    {state.data.artistName || "Artist Name"}
                  </p>
                </div>
                <p className="text-sm">
                  {state.data.followGateMessage ||
                    `Pre-save to be the first to hear it when it drops!`}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(requirements)
                    .filter(([key, value]) => value && key.startsWith("require"))
                    .map(([key]) => {
                      const platformName = key.replace("require", "");
                      return (
                        <Badge key={key} variant="outline">
                          {platformName}
                        </Badge>
                      );
                    })}
                </div>
                <Button className="w-full max-w-xs">
                  Pre-Save Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
