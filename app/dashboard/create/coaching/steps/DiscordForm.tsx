"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Shield, Zap, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DiscordForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveCoaching();
    router.push(`/dashboard/create/coaching?step=availability${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const handleBack = () => {
    router.push(`/dashboard/create/coaching?step=pricing${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const updateDiscordConfig = (field: string, value: any) => {
    updateData("discord", {
      discordConfig: {
        ...state.data.discordConfig,
        [field]: value,
      } as any
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Discord Integration</h2>
        <p className="text-muted-foreground mt-1">
          Auto-create private channels for each booking
        </p>
      </div>

      {/* Require Discord */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                Require Discord (Recommended)
              </CardTitle>
              <CardDescription>Students must connect Discord to book</CardDescription>
            </div>
            <Switch
              checked={state.data.discordConfig?.requireDiscord}
              onCheckedChange={(checked) => updateDiscordConfig("requireDiscord", checked)}
            />
          </div>
        </CardHeader>
        {state.data.discordConfig?.requireDiscord && (
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>Students see Discord connect button during checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>Booking blocked until Discord is connected</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Auto-Create Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Auto-Create Private Channels
              </CardTitle>
              <CardDescription>Automatically create a private Discord channel for each booking</CardDescription>
            </div>
            <Switch
              checked={state.data.discordConfig?.autoCreateChannel}
              onCheckedChange={(checked) => updateDiscordConfig("autoCreateChannel", checked)}
            />
          </div>
        </CardHeader>
        {state.data.discordConfig?.autoCreateChannel && (
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Channel created when booking confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Only you and the student have access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Channel includes session details and countdown</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Channel name format:</strong> coaching-studentname-dec15
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Booking Notifications
              </CardTitle>
              <CardDescription>Get notified in Discord when someone books</CardDescription>
            </div>
            <Switch
              checked={state.data.discordConfig?.notifyOnBooking}
              onCheckedChange={(checked) => updateDiscordConfig("notifyOnBooking", checked)}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Discord integration is optional</strong> but highly recommended. 
            It creates a seamless experience for both you and your students.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button onClick={handleNext}>
          Continue to Availability →
        </Button>
      </div>
    </div>
  );
}

