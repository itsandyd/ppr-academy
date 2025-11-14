"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Music, X, Plus } from "lucide-react";
import { PlaylistConfig } from "../types";

interface PlaylistConfigStepProps {
  config?: PlaylistConfig;
  onConfigChange: (config: PlaylistConfig) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PlaylistConfigStep({
  config,
  onConfigChange,
  onContinue,
  onBack,
}: PlaylistConfigStepProps) {
  const [genreInput, setGenreInput] = useState("");

  const handleUpdate = (field: keyof PlaylistConfig, value: any) => {
    onConfigChange({
      reviewTurnaroundDays: config?.reviewTurnaroundDays || 7,
      genresAccepted: config?.genresAccepted || [],
      ...config,
      [field]: value,
    });
  };

  const addGenre = () => {
    if (genreInput.trim() && !config?.genresAccepted?.includes(genreInput.trim())) {
      handleUpdate("genresAccepted", [...(config?.genresAccepted || []), genreInput.trim()]);
      setGenreInput("");
    }
  };

  const removeGenre = (genre: string) => {
    handleUpdate("genresAccepted", config?.genresAccepted?.filter(g => g !== genre) || []);
  };

  const canProceed = 
    (config?.genresAccepted?.length || 0) > 0 &&
    (config?.reviewTurnaroundDays || 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Playlist Curation Setup</h2>
        <p className="text-muted-foreground mt-1">
          Configure your playlist submission service
        </p>
      </div>

      {/* Playlist Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Review Turnaround */}
          <div className="space-y-2">
            <Label htmlFor="turnaround">Review Turnaround (days) *</Label>
            <Input
              id="turnaround"
              type="number"
              min="1"
              max="30"
              placeholder="7"
              value={config?.reviewTurnaroundDays || ""}
              onChange={(e) => handleUpdate("reviewTurnaroundDays", parseInt(e.target.value))}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              How long will it take you to review submissions?
            </p>
          </div>

          {/* Genres Accepted */}
          <div className="space-y-2">
            <Label>Genres Accepted *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add genre (e.g., Lo-Fi, House, Hip-Hop)"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGenre())}
                className="bg-background"
              />
              <Button type="button" onClick={addGenre} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {config?.genresAccepted && config.genresAccepted.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {config.genresAccepted.map((genre) => (
                  <Badge key={genre} variant="secondary" className="gap-1">
                    <Music className="w-3 h-3" />
                    {genre}
                    <button
                      onClick={() => removeGenre(genre)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submission Guidelines */}
          <div className="space-y-2">
            <Label htmlFor="guidelines">Submission Guidelines (Optional)</Label>
            <Textarea
              id="guidelines"
              placeholder="e.g., Please submit high-quality WAV or MP3 files. Tempo between 70-90 BPM preferred. No harsh sounds or heavy vocals..."
              value={config?.submissionGuidelines || ""}
              onChange={(e) => handleUpdate("submissionGuidelines", e.target.value)}
              className="min-h-[120px] bg-background"
            />
          </div>

          {/* Max Submissions Per Month */}
          <div className="space-y-2">
            <Label htmlFor="maxSubmissions">Max Submissions Per Month (Optional)</Label>
            <Input
              id="maxSubmissions"
              type="number"
              min="1"
              placeholder="100"
              value={config?.maxSubmissionsPerMonth || ""}
              onChange={(e) => handleUpdate("maxSubmissionsPerMonth", parseInt(e.target.value))}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for unlimited submissions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onContinue} disabled={!canProceed}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

