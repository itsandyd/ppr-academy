"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  Phone,
  MessageCircle,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SessionPlatform } from "../types";

const PLATFORMS: {
  id: SessionPlatform;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  needsLink: boolean;
  needsPhone: boolean;
  linkPlaceholder?: string;
  phonePlaceholder?: string;
}[] = [
  {
    id: "zoom",
    label: "Zoom",
    description: "Use your personal Zoom meeting link",
    icon: Video,
    needsLink: true,
    needsPhone: false,
    linkPlaceholder: "https://zoom.us/j/1234567890",
  },
  {
    id: "google_meet",
    label: "Google Meet",
    description: "Share a Google Meet link",
    icon: Video,
    needsLink: true,
    needsPhone: false,
    linkPlaceholder: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: "discord",
    label: "Discord",
    description: "Private voice channel on PPR Academy Discord",
    icon: MessageCircle,
    needsLink: false,
    needsPhone: false,
  },
  {
    id: "phone",
    label: "Phone / Audio Call",
    description: "Phone call — you provide your number or the buyer provides theirs",
    icon: Phone,
    needsLink: false,
    needsPhone: true,
    phonePlaceholder: "+1 (555) 123-4567",
  },
  {
    id: "facetime",
    label: "FaceTime",
    description: "FaceTime call via phone number or Apple ID",
    icon: Phone,
    needsLink: false,
    needsPhone: true,
    phonePlaceholder: "your@email.com or phone number",
  },
  {
    id: "custom",
    label: "Custom URL",
    description: "Any meeting platform — Skype, Teams, or your own link",
    icon: Globe,
    needsLink: true,
    needsPhone: false,
    linkPlaceholder: "https://...",
  },
];

export function PlatformForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();
  const { user } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);

  const discordConnection = useQuery(
    api.discordPublic.getUserDiscordConnection,
    effectiveUserId ? { userId: effectiveUserId } : "skip"
  );

  const selectedPlatform = state.data.sessionPlatform || "zoom";
  const platformConfig = PLATFORMS.find((p) => p.id === selectedPlatform);

  const handleSelectPlatform = (platformId: SessionPlatform) => {
    updateData("platform", {
      sessionPlatform: platformId,
      // Clear link/phone when switching platforms
      sessionLink: undefined,
      sessionPhone: undefined,
    });
  };

  const handleNext = async () => {
    await saveCoaching();
    router.push(
      `/dashboard/create/coaching?step=availability${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`
    );
  };

  const handleBack = () => {
    const price = state.data.price;
    const isFree = !price || price === "0" || parseFloat(price) === 0;
    const previousStep = isFree ? "followGate" : "pricing";
    router.push(
      `/dashboard/create/coaching?step=${previousStep}${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`
    );
  };

  const handleConnectDiscord = () => {
    const returnUrl = `/dashboard/create/coaching?step=platform${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`;
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      alert("Discord not configured. Please contact support.");
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/discord/callback`);
    const scope = encodeURIComponent("identify guilds.join");
    const stateParam = encodeURIComponent(returnUrl);
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${stateParam}`;
  };

  // Determine if we can proceed
  const canProceed = (() => {
    if (!selectedPlatform) return false;
    if (platformConfig?.needsLink && !state.data.sessionLink) return false;
    if (platformConfig?.needsPhone && !state.data.sessionPhone) return false;
    if (selectedPlatform === "discord" && !discordConnection) return false;
    return true;
  })();

  const isDiscordLoading = selectedPlatform === "discord" && discordConnection === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Session Platform</h2>
        <p className="mt-1 text-muted-foreground">
          Choose where your coaching sessions will take place
        </p>
      </div>

      {/* Platform Selection */}
      <div className="grid gap-3 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatform === platform.id;

          return (
            <Card
              key={platform.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleSelectPlatform(platform.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{platform.label}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{platform.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform-specific configuration */}
      {platformConfig?.needsLink && (
        <Card>
          <CardHeader>
            <CardTitle>Meeting Link</CardTitle>
            <CardDescription>
              Enter your {platformConfig.label} meeting link. This will be shared with students when
              they book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Meeting URL *</Label>
              <Input
                type="url"
                value={state.data.sessionLink || ""}
                onChange={(e) => updateData("platform", { sessionLink: e.target.value })}
                placeholder={platformConfig.linkPlaceholder}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Use a personal meeting room link so students can join at the scheduled time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {platformConfig?.needsPhone && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPlatform === "facetime" ? "FaceTime Contact" : "Phone Number"}
            </CardTitle>
            <CardDescription>
              {selectedPlatform === "facetime"
                ? "Enter your Apple ID email or phone number for FaceTime"
                : "Enter the phone number students should call, or that you'll use to call them"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>
                {selectedPlatform === "facetime" ? "Apple ID / Phone *" : "Phone Number *"}
              </Label>
              <Input
                type={selectedPlatform === "facetime" ? "text" : "tel"}
                value={state.data.sessionPhone || ""}
                onChange={(e) => updateData("platform", { sessionPhone: e.target.value })}
                placeholder={platformConfig.phonePlaceholder}
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discord-specific: connection status */}
      {selectedPlatform === "discord" && (
        <Card
          className={
            discordConnection
              ? "border-green-200 dark:border-green-800"
              : "border-orange-200 dark:border-orange-800"
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Discord Connection
                </CardTitle>
                <CardDescription>
                  Required for Discord-based sessions. A private channel will be auto-created for
                  each session.
                </CardDescription>
              </div>
              {isDiscordLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : discordConnection ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-orange-500 text-orange-600">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isDiscordLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking connection...
              </div>
            ) : discordConnection ? (
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                  {discordConnection.discordUsername?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium">{discordConnection.discordUsername}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected {new Date(discordConnection.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Connect your Discord to enable private session channels.
                </p>
                <Button onClick={handleConnectDiscord} variant="outline" className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Connect Discord
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Buyer preview */}
      {selectedPlatform && selectedPlatform !== "discord" && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="mb-1 text-sm font-semibold">What buyers see</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPlatform === "zoom" &&
                    `"This session takes place on Zoom. You'll receive the meeting link after booking."`}
                  {selectedPlatform === "google_meet" &&
                    `"This session takes place on Google Meet. You'll receive the meeting link after booking."`}
                  {selectedPlatform === "phone" &&
                    `"This is a phone/audio session. Call details will be shared after booking."`}
                  {selectedPlatform === "facetime" &&
                    `"This session takes place via FaceTime. Contact details will be shared after booking."`}
                  {selectedPlatform === "custom" &&
                    `"You'll receive the session link after booking."`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          &larr; Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          {!canProceed ? "Complete platform setup" : "Continue to Availability \u2192"}
        </Button>
      </div>
    </div>
  );
}
