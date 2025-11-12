"use client";

import { Button } from "@/components/ui/button";
import { FollowGateConfig } from "../types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Instagram, Music, Youtube, AlertCircle } from "lucide-react";

interface FollowGateConfigStepProps {
  config: FollowGateConfig | undefined;
  onConfigChange: (config: FollowGateConfig) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function FollowGateConfigStep({
  config,
  onConfigChange,
  onContinue,
  onBack,
}: FollowGateConfigStepProps) {
  const [localConfig, setLocalConfig] = useState<FollowGateConfig>(
    config || {
      requireEmail: true,
      requireInstagram: false,
      requireTiktok: false,
      requireYoutube: false,
      requireSpotify: false,
      minFollowsRequired: 0,
      socialLinks: {},
      customMessage: "",
    }
  );

  const updateConfig = (updates: Partial<FollowGateConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updateSocialLink = (platform: string, value: string) => {
    updateConfig({
      socialLinks: {
        ...localConfig.socialLinks,
        [platform]: value,
      },
    });
  };

  const toggleRequirement = (platform: keyof FollowGateConfig) => {
    if (typeof localConfig[platform] === "boolean") {
      updateConfig({ [platform]: !localConfig[platform] });
    }
  };

  const enabledPlatforms = [
    localConfig.requireInstagram,
    localConfig.requireTiktok,
    localConfig.requireYoutube,
    localConfig.requireSpotify,
  ].filter(Boolean).length;

  const isValid = localConfig.requireEmail || enabledPlatforms > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Download Gate Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Choose what users need to do to unlock this free product
        </p>
      </div>

      {/* Email Requirement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">Email Address</CardTitle>
                <CardDescription>Build your email list</CardDescription>
              </div>
            </div>
            <Checkbox
              checked={localConfig.requireEmail}
              onCheckedChange={() => toggleRequirement("requireEmail")}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Social Platform Requirements */}
      <div className="space-y-3">
        <Label>Social Media Requirements</Label>

        {/* Instagram */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={localConfig.requireInstagram}
                onCheckedChange={() => toggleRequirement("requireInstagram")}
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  <Label className="font-semibold">Instagram Follow</Label>
                </div>
                {localConfig.requireInstagram && (
                  <Input
                    placeholder="@yourhandle or full URL"
                    value={localConfig.socialLinks.instagram || ""}
                    onChange={(e) => updateSocialLink("instagram", e.target.value)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TikTok */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={localConfig.requireTiktok}
                onCheckedChange={() => toggleRequirement("requireTiktok")}
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  <Label className="font-semibold">TikTok Follow</Label>
                </div>
                {localConfig.requireTiktok && (
                  <Input
                    placeholder="@yourhandle or full URL"
                    value={localConfig.socialLinks.tiktok || ""}
                    onChange={(e) => updateSocialLink("tiktok", e.target.value)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YouTube */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={localConfig.requireYoutube}
                onCheckedChange={() => toggleRequirement("requireYoutube")}
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Youtube className="h-5 w-5" />
                  <Label className="font-semibold">YouTube Subscribe</Label>
                </div>
                {localConfig.requireYoutube && (
                  <Input
                    placeholder="https://youtube.com/c/YourChannel"
                    value={localConfig.socialLinks.youtube || ""}
                    onChange={(e) => updateSocialLink("youtube", e.target.value)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spotify */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={localConfig.requireSpotify}
                onCheckedChange={() => toggleRequirement("requireSpotify")}
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  <Label className="font-semibold">Spotify Follow</Label>
                </div>
                {localConfig.requireSpotify && (
                  <Input
                    placeholder="https://open.spotify.com/artist/..."
                    value={localConfig.socialLinks.spotify || ""}
                    onChange={(e) => updateSocialLink("spotify", e.target.value)}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flexibility Setting */}
      {enabledPlatforms > 1 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base">Follow Requirements Flexibility</CardTitle>
            <CardDescription>
              How many platforms must users follow?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Users must follow:</Label>
              <Select
                value={localConfig.minFollowsRequired.toString()}
                onValueChange={(value) =>
                  updateConfig({ minFollowsRequired: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="0">
                    ALL {enabledPlatforms} platforms (required)
                  </SelectItem>
                  {Array.from({ length: enabledPlatforms - 1 }, (_, i) => i + 1).map(
                    (num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} out of {enabledPlatforms} platforms
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {localConfig.minFollowsRequired === 0
                  ? `Users must follow all ${enabledPlatforms} platforms`
                  : `Users can choose any ${localConfig.minFollowsRequired} platform(s) to follow`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Message */}
      <div className="space-y-2">
        <Label htmlFor="customMessage">Custom Message (Optional)</Label>
        <Textarea
          id="customMessage"
          placeholder="e.g., Thanks for supporting! Follow me on Instagram & Spotify to unlock 🎵"
          value={localConfig.customMessage || ""}
          onChange={(e) => updateConfig({ customMessage: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          This message will be shown to users in the download gate modal
        </p>
      </div>

      {/* Summary */}
      {isValid && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Summary:</p>
              <p className="text-sm text-muted-foreground">
                Users will need to:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                {localConfig.requireEmail && <li>✓ Enter their email address</li>}
                {localConfig.requireInstagram && <li>✓ Follow you on Instagram</li>}
                {localConfig.requireTiktok && <li>✓ Follow you on TikTok</li>}
                {localConfig.requireYoutube && <li>✓ Subscribe on YouTube</li>}
                {localConfig.requireSpotify && <li>✓ Follow you on Spotify</li>}
              </ul>
              {enabledPlatforms > 1 && localConfig.minFollowsRequired > 0 && (
                <p className="text-xs text-muted-foreground italic">
                  (Users can choose any {localConfig.minFollowsRequired} platform{localConfig.minFollowsRequired > 1 ? 's' : ''})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Warning */}
      {!isValid && (
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">At least one requirement needed</p>
                <p className="text-xs text-muted-foreground">
                  Enable email or select at least one social platform
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onContinue} disabled={!isValid} size="lg">
          Continue →
        </Button>
      </div>
    </div>
  );
}

