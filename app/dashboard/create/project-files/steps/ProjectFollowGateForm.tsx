"use client";

import { useProjectFileCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Mail, Instagram, Youtube, Music } from "lucide-react";

export function ProjectFollowGateForm() {
  const { state, updateData, saveProject, createProject } = useProjectFileCreation();
  const router = useRouter();

  const handleBack = () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/project-files?daw=${dawType}&step=pricing${state.projectId ? `&projectId=${state.projectId}` : ''}`);
  };

  const handlePublish = async () => {
    await saveProject();
    const result = await createProject();
    if (result.success) {
      router.push('/dashboard?mode=create');
    }
  };

  const requirements = state.data.followGateRequirements || {
    requireEmail: true,
    requireInstagram: false,
    requireTiktok: false,
    requireYoutube: false,
    requireSpotify: false,
    minFollowsRequired: 1,
  };

  const socialLinks = state.data.followGateSocialLinks || {};

  const updateRequirement = (key: string, value: boolean) => {
    updateData("followGate", {
      followGateEnabled: true,
      followGateRequirements: {
        ...requirements,
        [key]: value,
      },
    });
  };

  const updateSocialLink = (platform: string, url: string) => {
    updateData("followGate", {
      followGateSocialLinks: {
        ...socialLinks,
        [platform]: url,
      },
    });
  };

  const canPublish = !!(
    state.data.followGateEnabled &&
    (requirements.requireEmail ||
      requirements.requireInstagram ||
      requirements.requireYoutube ||
      requirements.requireSpotify)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Download Gate</h2>
        <p className="text-muted-foreground mt-1">
          Configure requirements for free downloads
        </p>
      </div>

      {/* Email Requirement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Email Required</CardTitle>
                <CardDescription>Collect email addresses</CardDescription>
              </div>
            </div>
            <Switch
              checked={requirements.requireEmail}
              onCheckedChange={(checked) => updateRequirement("requireEmail", checked)}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Instagram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Instagram Follow</CardTitle>
                <CardDescription>Require users to follow your Instagram</CardDescription>
              </div>
            </div>
            <Switch
              checked={requirements.requireInstagram}
              onCheckedChange={(checked) => updateRequirement("requireInstagram", checked)}
            />
          </div>
        </CardHeader>
        {requirements.requireInstagram && (
          <CardContent>
            <Label htmlFor="instagram">Instagram Profile URL</Label>
            <Input
              id="instagram"
              placeholder="https://instagram.com/yourhandle"
              value={socialLinks.instagram || ""}
              onChange={(e) => updateSocialLink("instagram", e.target.value)}
              className="mt-2 bg-background"
            />
          </CardContent>
        )}
      </Card>

      {/* YouTube */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>YouTube Subscribe</CardTitle>
                <CardDescription>Require users to subscribe to your channel</CardDescription>
              </div>
            </div>
            <Switch
              checked={requirements.requireYoutube}
              onCheckedChange={(checked) => updateRequirement("requireYoutube", checked)}
            />
          </div>
        </CardHeader>
        {requirements.requireYoutube && (
          <CardContent>
            <Label htmlFor="youtube">YouTube Channel URL</Label>
            <Input
              id="youtube"
              placeholder="https://youtube.com/@yourchannel"
              value={socialLinks.youtube || ""}
              onChange={(e) => updateSocialLink("youtube", e.target.value)}
              className="mt-2 bg-background"
            />
          </CardContent>
        )}
      </Card>

      {/* Spotify */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Spotify Follow</CardTitle>
                <CardDescription>Require users to follow your Spotify</CardDescription>
              </div>
            </div>
            <Switch
              checked={requirements.requireSpotify}
              onCheckedChange={(checked) => updateRequirement("requireSpotify", checked)}
            />
          </div>
        </CardHeader>
        {requirements.requireSpotify && (
          <CardContent>
            <Label htmlFor="spotify">Spotify Artist URL</Label>
            <Input
              id="spotify"
              placeholder="https://open.spotify.com/artist/..."
              value={socialLinks.spotify || ""}
              onChange={(e) => updateSocialLink("spotify", e.target.value)}
              className="mt-2 bg-background"
            />
          </CardContent>
        )}
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Message (Optional)</CardTitle>
          <CardDescription>Add a personal message to downloaders</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Thanks for downloading! Follow me for more project files and tutorials..."
            value={state.data.followGateMessage || ""}
            onChange={(e) => updateData("followGate", { followGateMessage: e.target.value })}
            rows={3}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          onClick={handlePublish}
          disabled={!canPublish}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        >
          Publish Project File
        </Button>
      </div>
    </div>
  );
}
