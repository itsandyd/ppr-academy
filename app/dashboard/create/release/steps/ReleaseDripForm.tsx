"use client";

import { useReleaseCreation } from "../context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format, addDays, addHours } from "date-fns";
import {
  Mail,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  Music2,
  ListMusic,
  Bell,
  ArrowRight,
  Edit3,
} from "lucide-react";

// Email sequence templates
const emailSequence = [
  {
    id: "presave_confirmation",
    name: "Pre-Save Confirmation",
    timing: "Immediately",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Thank fans for pre-saving and build excitement",
    subject: "You're locked in! {{trackTitle}} drops {{releaseDate}}",
    preview: `Thanks for pre-saving! You'll be among the first to hear it when it drops.`,
    automated: true,
  },
  {
    id: "release_day",
    name: "Release Day Announcement",
    timing: "Release day",
    icon: Music2,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Let fans know the music is live",
    subject: "IT'S HERE: {{trackTitle}} is out now!",
    preview: `The wait is over. {{trackTitle}} is officially live on all platforms. Listen now!`,
    automated: true,
  },
  {
    id: "followup_48h",
    name: "48-Hour Follow-Up",
    timing: "48 hours after release",
    icon: Bell,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Remind fans and ask for shares/adds",
    subject: "{{firstName}}, did you catch {{trackTitle}}?",
    preview: `Thanks for streaming! If you're feeling it, add it to your playlist and share with a friend.`,
    automated: true,
  },
  {
    id: "playlist_pitch",
    name: "Playlist Pitch Sequence",
    timing: "1 week after release",
    icon: ListMusic,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Ask superfans to add to playlists",
    subject: "Can you add {{trackTitle}} to a playlist?",
    preview: `Your support means everything. If you have a playlist that fits, adding the track helps more than you know.`,
    automated: true,
    optional: true,
  },
];

export function ReleaseDripForm() {
  const { state, updateData } = useReleaseCreation();

  const releaseDate = state.data.releaseDate
    ? new Date(state.data.releaseDate)
    : null;

  const getEmailTiming = (emailId: string) => {
    if (!releaseDate) return "Set release date first";

    switch (emailId) {
      case "presave_confirmation":
        return "Immediately after pre-save";
      case "release_day":
        return format(releaseDate, "EEEE, MMMM d, yyyy");
      case "followup_48h":
        return format(addHours(releaseDate, 48), "EEEE, MMMM d 'at' h:mm a");
      case "playlist_pitch":
        return format(addDays(releaseDate, 7), "EEEE, MMMM d, yyyy");
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Drip Campaign Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Automated Email Sequence
              </CardTitle>
              <CardDescription>
                Automatically nurture fans from pre-save to superfan
              </CardDescription>
            </div>
            <Switch
              checked={state.data.dripCampaignEnabled !== false}
              onCheckedChange={(checked) =>
                updateData("drip", { dripCampaignEnabled: checked })
              }
            />
          </div>
        </CardHeader>
        {state.data.dripCampaignEnabled !== false && (
          <CardContent>
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Release Marketing Autopilot</AlertTitle>
              <AlertDescription>
                When enabled, fans who pre-save will automatically receive a perfectly-timed
                email sequence to maximize streams and engagement.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {state.data.dripCampaignEnabled !== false && (
        <>
          {/* Email Sequence Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Email Sequence Timeline
              </CardTitle>
              <CardDescription>
                These emails will be sent automatically based on your release date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {emailSequence.map((email, index) => {
                  const Icon = email.icon;
                  const isLast = index === emailSequence.length - 1;

                  return (
                    <div key={email.id} className="relative flex gap-4">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div className="absolute left-5 top-12 h-full w-0.5 bg-border" />
                      )}

                      {/* Timeline Node */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                          email.bgColor,
                          "border-background"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", email.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <div className="rounded-lg border bg-card p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{email.name}</h4>
                                {email.optional && (
                                  <Badge variant="outline" className="text-xs">
                                    Optional
                                  </Badge>
                                )}
                                {email.automated && (
                                  <Badge variant="secondary" className="text-xs">
                                    Automated
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {email.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Clock className="h-4 w-4" />
                            <span>{getEmailTiming(email.id)}</span>
                          </div>

                          {/* Email Preview */}
                          <div className="rounded-md bg-muted/50 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Send className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                Subject: {email.subject.replace("{{trackTitle}}", state.data.title || "Your Track")}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {email.preview
                                .replace("{{trackTitle}}", state.data.title || "your track")
                                .replace("{{firstName}}", "Fan")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Playlist Pitch Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListMusic className="h-5 w-5 text-orange-500" />
                Playlist Pitch Settings
              </CardTitle>
              <CardDescription>
                Customize your playlist pitch email (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="playlistPitch" className="flex items-center gap-2">
                  Enable playlist pitch email
                </Label>
                <Switch
                  id="playlistPitch"
                  checked={state.data.playlistPitchEnabled !== false}
                  onCheckedChange={(checked) =>
                    updateData("drip", { playlistPitchEnabled: checked })
                  }
                />
              </div>

              {state.data.playlistPitchEnabled !== false && (
                <div className="space-y-2">
                  <Label htmlFor="playlistPitchMessage">Custom Pitch Message</Label>
                  <Textarea
                    id="playlistPitchMessage"
                    placeholder="Thanks for your support on my latest release! If you're feeling the track, I'd love for you to add it to any playlist that fits. Every add helps the algorithm and gets the music to more people. Thank you!"
                    rows={4}
                    value={state.data.playlistPitchMessage || ""}
                    onChange={(e) =>
                      updateData("drip", { playlistPitchMessage: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the default message
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Emails
                  </div>
                  <p className="text-2xl font-bold">
                    {state.data.playlistPitchEnabled !== false ? 4 : 3}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    automated emails
                  </p>
                </div>

                <div className="rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Clock className="h-4 w-4 text-purple-500" />
                    Duration
                  </div>
                  <p className="text-2xl font-bold">
                    {state.data.playlistPitchEnabled !== false ? "7 days" : "2 days"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    after release
                  </p>
                </div>
              </div>

              {releaseDate && (
                <div className="mt-4 p-3 rounded-lg bg-background">
                  <p className="text-sm">
                    <span className="font-medium">Release:</span>{" "}
                    {format(releaseDate, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Campaign will run from pre-save launch until{" "}
                    {format(
                      addDays(releaseDate, state.data.playlistPitchEnabled !== false ? 7 : 2),
                      "MMMM d"
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Disabled State */}
      {state.data.dripCampaignEnabled === false && (
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium mb-2">Email Sequence Disabled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enable the email sequence to automatically nurture your fans and maximize
              engagement with your release.
            </p>
            <Button
              variant="outline"
              onClick={() => updateData("drip", { dripCampaignEnabled: true })}
            >
              Enable Email Sequence
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
