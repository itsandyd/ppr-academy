"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Clock, MessageSquare, Music, CheckCircle } from "lucide-react";
import { usePlaylistCuration } from "../context";
import { GENRE_OPTIONS } from "../types";

export function SubmissionSettingsForm() {
  const { state, updateData, validateStep } = usePlaylistCuration();

  // Validate on mount
  useEffect(() => {
    validateStep("submissionSettings");
  }, [state.data.acceptsSubmissions]);

  const handleAllowedGenreToggle = (genre: string) => {
    const currentGenres = state.data.submissionRules?.allowedGenres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre];
    updateData("submissionSettings", {
      submissionRules: {
        ...state.data.submissionRules,
        allowedGenres: newGenres,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Accept Submissions Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Accept Track Submissions
          </CardTitle>
          <CardDescription>
            Allow artists to submit their tracks for consideration in your playlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex-1">
              <h4 className="font-medium">Enable Submissions</h4>
              <p className="text-sm text-muted-foreground">
                {state.data.acceptsSubmissions
                  ? "Artists can submit tracks to this playlist"
                  : "Submissions are closed"}
              </p>
            </div>
            <Switch
              checked={state.data.acceptsSubmissions ?? true}
              onCheckedChange={(checked) =>
                updateData("submissionSettings", { acceptsSubmissions: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {state.data.acceptsSubmissions && (
        <>
          {/* Review SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Review Timeline
              </CardTitle>
              <CardDescription>
                How long artists should expect to wait for your feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sla">Review Time (Days)</Label>
                <Select
                  value={String(state.data.submissionSLA || 7)}
                  onValueChange={(value) =>
                    updateData("submissionSettings", { submissionSLA: parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="3">3 days (Express)</SelectItem>
                    <SelectItem value="7">7 days (Standard)</SelectItem>
                    <SelectItem value="14">14 days (Extended)</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Setting a shorter review time can attract more submissions but requires more commitment
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Genre Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Accepted Genres
              </CardTitle>
              <CardDescription>
                Filter submissions by genre (leave empty to accept all genres)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <Badge
                    key={genre}
                    variant={
                      (state.data.submissionRules?.allowedGenres || []).includes(genre)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer transition-colors"
                    onClick={() => handleAllowedGenreToggle(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {(state.data.submissionRules?.allowedGenres || []).length === 0
                  ? "All genres accepted"
                  : `Only accepting: ${(state.data.submissionRules?.allowedGenres || []).join(", ")}`}
              </p>
            </CardContent>
          </Card>

          {/* Submission Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Submission Requirements
              </CardTitle>
              <CardDescription>Additional requirements for track submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Require Message */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <h4 className="font-medium">Require Pitch Message</h4>
                  <p className="text-sm text-muted-foreground">
                    Artists must write a message explaining why their track fits
                  </p>
                </div>
                <Switch
                  checked={state.data.submissionRules?.requiresMessage ?? false}
                  onCheckedChange={(checked) =>
                    updateData("submissionSettings", {
                      submissionRules: {
                        ...state.data.submissionRules,
                        requiresMessage: checked,
                      },
                    })
                  }
                />
              </div>

              {/* Max Track Length */}
              <div className="space-y-2">
                <Label htmlFor="maxLength">Maximum Track Length (seconds)</Label>
                <Input
                  id="maxLength"
                  type="number"
                  min={60}
                  max={600}
                  value={state.data.submissionRules?.maxLengthSeconds || ""}
                  onChange={(e) =>
                    updateData("submissionSettings", {
                      submissionRules: {
                        ...state.data.submissionRules,
                        maxLengthSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="Leave empty for no limit"
                  className="bg-white dark:bg-black"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Set a maximum track length (e.g., 300 = 5 minutes)
                </p>
              </div>

              {/* Guidelines */}
              <div className="space-y-2">
                <Label htmlFor="guidelines">Submission Guidelines</Label>
                <Textarea
                  id="guidelines"
                  value={state.data.submissionRules?.guidelines || ""}
                  onChange={(e) =>
                    updateData("submissionSettings", {
                      submissionRules: {
                        ...state.data.submissionRules,
                        guidelines: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., 'Looking for melodic tracks with strong hooks. No tracks with explicit lyrics. Must be original productions.'"
                  rows={4}
                  className="bg-white dark:bg-black"
                />
                <p className="text-xs text-muted-foreground">
                  Share any specific requirements or tips for artists
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What Artists See */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                What Artists Will See
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Playlist name, description, and cover</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Accepted genres and submission guidelines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Expected review time: {state.data.submissionSLA || 7} days</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    Submission fee:{" "}
                    {state.data.pricingModel === "paid" && state.data.submissionFee
                      ? `$${state.data.submissionFee}`
                      : "Free"}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
