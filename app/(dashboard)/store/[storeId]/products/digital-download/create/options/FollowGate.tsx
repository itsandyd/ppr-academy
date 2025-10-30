"use client";

import { useState } from "react";
import { Control, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Instagram, Music2, Youtube, Video } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FollowGateProps {
  control: Control<any>;
}

export function FollowGate({ control }: FollowGateProps) {
  return (
    <Controller
      control={control}
      name="followGate"
      defaultValue={{
        enabled: false,
        requirements: {
          requireEmail: true,
          requireInstagram: false,
          requireTiktok: false,
          requireYoutube: false,
          requireSpotify: false,
          minFollowsRequired: 0,
        },
        socialLinks: {
          instagram: "",
          tiktok: "",
          youtube: "",
          spotify: "",
        },
        message: "",
      }}
      render={({ field }) => {
        const { enabled, requirements, socialLinks, message } = field.value;

        const updateField = (updates: any) => {
          field.onChange({ ...field.value, ...updates });
        };

        const updateRequirements = (updates: any) => {
          field.onChange({
            ...field.value,
            requirements: { ...requirements, ...updates },
          });
        };

        const updateSocialLinks = (updates: any) => {
          field.onChange({
            ...field.value,
            socialLinks: { ...socialLinks, ...updates },
          });
        };

        // Count selected platforms
        const selectedPlatforms = [
          requirements.requireInstagram,
          requirements.requireTiktok,
          requirements.requireYoutube,
          requirements.requireSpotify,
        ].filter(Boolean).length;

        return (
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  🔒 Follow Gate
                  {enabled && (
                    <Badge className="bg-chart-1">Active</Badge>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require users to follow you on social media and/or provide email to unlock this download
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => updateField({ enabled: checked })}
              />
            </div>

            {enabled && (
              <>
                {/* Email Requirement */}
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-[#E8EAF8] dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">📧 Email Collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Collect email addresses to build your mailing list
                      </p>
                    </div>
                    <Switch
                      checked={requirements.requireEmail}
                      onCheckedChange={(checked) => updateRequirements({ requireEmail: checked })}
                    />
                  </div>
                </div>

                {/* Social Platforms */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Social Platform Follows</Label>
                  
                  {/* Instagram */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-[#E8EAF8] dark:border-zinc-700">
                    <div className="flex items-start gap-3">
                      <Instagram className="w-5 h-5 text-pink-600 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Instagram</Label>
                          <Switch
                            checked={requirements.requireInstagram}
                            onCheckedChange={(checked) => updateRequirements({ requireInstagram: checked })}
                          />
                        </div>
                        {requirements.requireInstagram && (
                          <Input
                            placeholder="@yourusername or full URL"
                            value={socialLinks.instagram || ""}
                            onChange={(e) => updateSocialLinks({ instagram: e.target.value })}
                            className="bg-background"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-[#E8EAF8] dark:border-zinc-700">
                    <div className="flex items-start gap-3">
                      <Video className="w-5 h-5 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">TikTok</Label>
                          <Switch
                            checked={requirements.requireTiktok}
                            onCheckedChange={(checked) => updateRequirements({ requireTiktok: checked })}
                          />
                        </div>
                        {requirements.requireTiktok && (
                          <Input
                            placeholder="@yourusername or full URL"
                            value={socialLinks.tiktok || ""}
                            onChange={(e) => updateSocialLinks({ tiktok: e.target.value })}
                            className="bg-background"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* YouTube */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-[#E8EAF8] dark:border-zinc-700">
                    <div className="flex items-start gap-3">
                      <Youtube className="w-5 h-5 text-red-600 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">YouTube</Label>
                          <Switch
                            checked={requirements.requireYoutube}
                            onCheckedChange={(checked) => updateRequirements({ requireYoutube: checked })}
                          />
                        </div>
                        {requirements.requireYoutube && (
                          <Input
                            placeholder="Channel URL"
                            value={socialLinks.youtube || ""}
                            onChange={(e) => updateSocialLinks({ youtube: e.target.value })}
                            className="bg-background"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Spotify */}
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-[#E8EAF8] dark:border-zinc-700">
                    <div className="flex items-start gap-3">
                      <Music2 className="w-5 h-5 text-green-600 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Spotify</Label>
                          <Switch
                            checked={requirements.requireSpotify}
                            onCheckedChange={(checked) => updateRequirements({ requireSpotify: checked })}
                          />
                        </div>
                        {requirements.requireSpotify && (
                          <Input
                            placeholder="Artist profile URL"
                            value={socialLinks.spotify || ""}
                            onChange={(e) => updateSocialLinks({ spotify: e.target.value })}
                            className="bg-background"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimum Follows Requirement */}
                {selectedPlatforms > 1 && (
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-[#E8EAF8] dark:border-zinc-700 space-y-2">
                    <Label className="text-base font-semibold">Follow Requirement</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      How many platforms must users follow?
                    </p>
                    <Select
                      value={requirements.minFollowsRequired.toString()}
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
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Custom Message (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Personalize the message users see at the follow gate
                  </p>
                  <Textarea
                    placeholder="e.g., 'Thanks for your support! Follow me to get this free download 🎵'"
                    value={message || ""}
                    onChange={(e) => updateField({ message: e.target.value })}
                    rows={3}
                    className="bg-background"
                  />
                </div>

                {/* Summary */}
                <div className="p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg">
                  <p className="text-sm font-semibold mb-2">📊 Follow Gate Summary:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {requirements.requireEmail && (
                      <li>✓ Email address required</li>
                    )}
                    {selectedPlatforms > 0 && (
                      <li>
                        ✓ Follow {requirements.minFollowsRequired === 0 
                          ? `all ${selectedPlatforms}` 
                          : `${requirements.minFollowsRequired} of ${selectedPlatforms}`} platform(s)
                      </li>
                    )}
                    {selectedPlatforms === 0 && !requirements.requireEmail && (
                      <li className="text-amber-600">⚠️ No requirements set</li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
        );
      }}
    />
  );
}

