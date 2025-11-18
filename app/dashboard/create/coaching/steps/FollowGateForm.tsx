"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Music as TikTok, Youtube, Music2, Mail } from "lucide-react";

export function CoachingFollowGateForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();

  const handleNext = async () => {
    // Make sure follow gate is enabled before saving
    if (!state.data.followGateEnabled) {
      updateData("followGate", { followGateEnabled: true });
    }
    await saveCoaching();
    const coachingType = state.data.coachingType || "sample-coaching";
    router.push(`/dashboard/create/coaching?type=${coachingType}&step=files${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const handleBack = () => {
    const coachingType = state.data.coachingType || "sample-coaching";
    router.push(`/dashboard/create/coaching?type=${coachingType}&step=pricing${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const updateRequirement = (field: string, value: boolean) => {
    updateData("followGate", {
      followGateEnabled: true,
      followGateRequirements: {
        ...state.data.followGateRequirements,
        [field]: value,
      },
    });
  };

  const updateSocialLink = (platform: string, value: string) => {
    updateData("followGate", {
      followGateSocialLinks: {
        ...state.data.followGateSocialLinks,
        [platform]: value,
      },
    });
  };

  const canProceed = state.data.followGateRequirements && (
    state.data.followGateRequirements.requireEmail ||
    state.data.followGateRequirements.requireInstagram ||
    state.data.followGateRequirements.requireTiktok ||
    state.data.followGateRequirements.requireYoutube ||
    state.data.followGateRequirements.requireSpotify
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Download Gate</h2>
        <p className="text-muted-foreground mt-1">
          Require follows or email to unlock your free coaching
        </p>
      </div>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>Choose what users need to do to unlock the download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <Label>Require Email</Label>
            </div>
            <Switch
              checked={state.data.followGateRequirements?.requireEmail || false}
              onCheckedChange={(checked) => updateRequirement("requireEmail", checked)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-muted-foreground" />
                <Label>Require Instagram Follow</Label>
              </div>
              <Switch
                checked={state.data.followGateRequirements?.requireInstagram || false}
                onCheckedChange={(checked) => updateRequirement("requireInstagram", checked)}
              />
            </div>
            {state.data.followGateRequirements?.requireInstagram && (
              <Input
                placeholder="Instagram username (without @)"
                value={state.data.followGateSocialLinks?.instagram || ""}
                onChange={(e) => updateSocialLink("instagram", e.target.value)}
                className="bg-background"
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TikTok className="w-5 h-5 text-muted-foreground" />
                <Label>Require TikTok Follow</Label>
              </div>
              <Switch
                checked={state.data.followGateRequirements?.requireTiktok || false}
                onCheckedChange={(checked) => updateRequirement("requireTiktok", checked)}
              />
            </div>
            {state.data.followGateRequirements?.requireTiktok && (
              <Input
                placeholder="TikTok username (without @)"
                value={state.data.followGateSocialLinks?.tiktok || ""}
                onChange={(e) => updateSocialLink("tiktok", e.target.value)}
                className="bg-background"
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Youtube className="w-5 h-5 text-muted-foreground" />
                <Label>Require YouTube Subscribe</Label>
              </div>
              <Switch
                checked={state.data.followGateRequirements?.requireYoutube || false}
                onCheckedChange={(checked) => updateRequirement("requireYoutube", checked)}
              />
            </div>
            {state.data.followGateRequirements?.requireYoutube && (
              <Input
                placeholder="YouTube channel URL"
                value={state.data.followGateSocialLinks?.youtube || ""}
                onChange={(e) => updateSocialLink("youtube", e.target.value)}
                className="bg-background"
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music2 className="w-5 h-5 text-muted-foreground" />
                <Label>Require Spotify Follow</Label>
              </div>
              <Switch
                checked={state.data.followGateRequirements?.requireSpotify || false}
                onCheckedChange={(checked) => updateRequirement("requireSpotify", checked)}
              />
            </div>
            {state.data.followGateRequirements?.requireSpotify && (
              <Input
                placeholder="Spotify artist URL"
                value={state.data.followGateSocialLinks?.spotify || ""}
                onChange={(e) => updateSocialLink("spotify", e.target.value)}
                className="bg-background"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Message (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Thanks for the support! Follow me on Instagram for more free coachings..."
            value={state.data.followGateMessage || ""}
            onChange={(e) => updateData("followGate", { followGateMessage: e.target.value })}
            className="min-h-[100px] bg-background"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

