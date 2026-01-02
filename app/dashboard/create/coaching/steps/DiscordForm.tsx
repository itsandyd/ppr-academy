"use client";

import { useEffect } from "react";
import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Bell, CheckCircle, Shield, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DiscordForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();
  const { user } = useUser();

  const discordConnection = useQuery(
    api.discordPublic.getUserDiscordConnection,
    user?.id ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    updateData("discord", {
      discordConfig: {
        ...state.data.discordConfig,
        requireDiscord: true,
        autoCreateChannel: true,
      } as any,
    });
  }, []);

  const handleNext = async () => {
    await saveCoaching();
    router.push(
      `/dashboard/create/coaching?step=availability${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`
    );
  };

  const handleBack = () => {
    const price = state.data.price;
    const isFree = !price || price === "0" || parseFloat(price) === 0;
    const previousStep = isFree ? "follow-gate" : "pricing";
    router.push(
      `/dashboard/create/coaching?step=${previousStep}${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`
    );
  };

  const handleConnectDiscord = () => {
    const returnUrl = `/dashboard/create/coaching?step=discord${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`;
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

  const updateDiscordConfig = (field: string, value: any) => {
    updateData("discord", {
      discordConfig: {
        ...state.data.discordConfig,
        [field]: value,
      } as any,
    });
  };

  const isCoachConnected = !!discordConnection;
  const isLoading = discordConnection === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Discord Setup</h2>
        <p className="mt-1 text-muted-foreground">
          All coaching sessions happen on PPR Academy Discord
        </p>
      </div>

      <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Platform Verified Sessions
          </CardTitle>
          <CardDescription>
            To ensure quality and accountability, all coaching sessions are conducted on our Discord
            server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Students must connect Discord to book</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Private channel created automatically for each session</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Only you and your student can access the channel</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span>Channel cleaned up after session completion</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          isCoachConnected
            ? "border-green-200 dark:border-green-800"
            : "border-orange-200 dark:border-orange-800"
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Your Discord Connection
              </CardTitle>
              <CardDescription>
                You need Discord connected to receive session notifications
              </CardDescription>
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isCoachConnected ? (
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
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking connection...
            </div>
          ) : isCoachConnected ? (
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
                Connect your Discord to be added to session channels and receive booking
                notifications.
              </p>
              <Button onClick={handleConnectDiscord} variant="outline" className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Connect Discord
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Booking Notifications
              </CardTitle>
              <CardDescription>Get a Discord DM when someone books a session</CardDescription>
            </div>
            <Switch
              checked={state.data.discordConfig?.notifyOnBooking ?? true}
              onCheckedChange={(checked) => updateDiscordConfig("notifyOnBooking", checked)}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!isCoachConnected}>
          {!isCoachConnected ? "Connect Discord to Continue" : "Continue to Availability →"}
        </Button>
      </div>
    </div>
  );
}
