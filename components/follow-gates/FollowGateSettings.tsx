"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Instagram, Music2, Youtube, Video } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FollowGateSettingsProps {
  value: {
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
  };
  onChange: (value: any) => void;
}

export function FollowGateSettings({ value, onChange }: FollowGateSettingsProps) {
  const updateSettings = (updates: any) => {
    onChange({ ...value, ...updates });
  };

  const updateRequirements = (updates: any) => {
    onChange({
      ...value,
      requirements: { ...value.requirements, ...updates },
    });
  };

  const updateSocialLinks = (updates: any) => {
    onChange({
      ...value,
      socialLinks: { ...value.socialLinks, ...updates },
    });
  };

  // Count how many platforms are selected
  const selectedPlatforms = [
    value.requirements.requireInstagram,
    value.requirements.requireTiktok,
    value.requirements.requireYoutube,
    value.requirements.requireSpotify,
  ].filter(Boolean).length;

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🔒 Follow Gate
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
                <Label className="text-base font-semibold">📧 Email Collection</Label>
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
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
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
                  <Input
                    placeholder="@yourusername or full URL"
                    value={value.socialLinks.instagram || ""}
                    onChange={(e) => updateSocialLinks({ instagram: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* TikTok */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
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
                  <Input
                    placeholder="@yourusername or full URL"
                    value={value.socialLinks.tiktok || ""}
                    onChange={(e) => updateSocialLinks({ tiktok: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
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
                  <Input
                    placeholder="Channel URL"
                    value={value.socialLinks.youtube || ""}
                    onChange={(e) => updateSocialLinks({ youtube: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* Spotify */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
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
                  <Input
                    placeholder="Artist profile URL"
                    value={value.socialLinks.spotify || ""}
                    onChange={(e) => updateSocialLinks({ spotify: e.target.value })}
                  />
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
              placeholder="e.g., 'Thanks for your support! Follow me to get this free download 🎵'"
              value={value.message || ""}
              onChange={(e) => updateSettings({ message: e.target.value })}
              rows={3}
              className="bg-background"
            />
          </div>

          {/* Preview Summary */}
          <div className="p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg">
            <p className="text-sm font-semibold mb-2">Follow Gate Summary:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {value.requirements.requireEmail && (
                <li>✓ Email address required</li>
              )}
              {selectedPlatforms > 0 && (
                <li>
                  ✓ Follow {value.requirements.minFollowsRequired === 0 
                    ? `all ${selectedPlatforms}` 
                    : `${value.requirements.minFollowsRequired} of ${selectedPlatforms}`} platform(s)
                </li>
              )}
              {selectedPlatforms === 0 && !value.requirements.requireEmail && (
                <li className="text-amber-600">⚠️ No requirements set - follow gate won't appear</li>
              )}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

