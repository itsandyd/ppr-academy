"use client";

import { useProjectFileCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAW_TYPES } from "../../types";
import { AIContentAssistant } from "../../shared/AIContentAssistant";

const GENRES = [
  "Hip Hop",
  "Trap",
  "Pop",
  "EDM",
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "R&B",
  "Lo-Fi",
  "Future Bass",
  "Ambient",
  "Rock",
  "Indie",
  "Orchestral",
];

export function ProjectBasicsForm() {
  const { state, updateData, saveProject } = useProjectFileCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveProject();
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/project-files?daw=${dawType}&step=files${state.projectId ? `&projectId=${state.projectId}` : ''}`);
  };

  const canProceed = !!(state.data.title && state.data.description && state.data.dawType);

  const selectedDAW = DAW_TYPES.find(d => d.id === state.data.dawType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Project File Basics</h2>
        <p className="text-muted-foreground mt-1">
          Set up your project file details
        </p>
      </div>

      {/* DAW Selection */}
      <Card>
        <CardHeader>
          <CardTitle>DAW Type *</CardTitle>
          <CardDescription>Which DAW is this project for?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DAW_TYPES.map((daw) => (
              <button
                key={daw.id}
                onClick={() => updateData("basics", { dawType: daw.id })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  state.data.dawType === daw.id
                    ? "border-purple-500 bg-purple-500/5"
                    : "border-border hover:border-purple-500/50"
                }`}
              >
                <div className="text-2xl mb-2">{daw.icon}</div>
                <div className="font-semibold text-sm">{daw.label}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{daw.description}</div>
              </button>
            ))}
          </div>

          {selectedDAW && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Supported file types:</strong> {selectedDAW.extensions.join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DAW Version (Optional) */}
      {state.data.dawType && (
        <Card>
          <CardHeader>
            <CardTitle>DAW Version (Optional)</CardTitle>
            <CardDescription>Minimum version required to open this project</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., 11.3"
              value={state.data.dawVersion || ""}
              onChange={(e) => updateData("basics", { dawVersion: e.target.value })}
              className="max-w-xs bg-background"
            />
          </CardContent>
        </Card>
      )}

      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>Project Title *</CardTitle>
          <CardDescription>Give your project a descriptive name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Future Bass Breakdown - Full Production"
            value={state.data.title || ""}
            onChange={(e) => updateData("basics", { title: e.target.value })}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Description *</CardTitle>
              <CardDescription>Describe what learners will find in this project</CardDescription>
            </div>
            <AIContentAssistant
              productType="project-files"
              title={state.data.title}
              description={state.data.description}
              onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the track structure, sound design techniques, mixing approach, and what makes this project educational..."
            value={state.data.description || ""}
            onChange={(e) => updateData("basics", { description: e.target.value })}
            rows={6}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Genre Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Genre *</CardTitle>
          <CardDescription>What genre is this project?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={state.data.genre?.includes(genre) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const currentGenres = state.data.genre || [];
                  const newGenres = currentGenres.includes(genre)
                    ? currentGenres.filter(g => g !== genre)
                    : [...currentGenres, genre];
                  updateData("basics", { genre: newGenres });
                }}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BPM & Key (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Track Details (Optional)</CardTitle>
          <CardDescription>BPM and musical key of the project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">BPM</label>
              <Input
                type="number"
                placeholder="e.g., 140"
                value={state.data.bpm || ""}
                onChange={(e) => updateData("basics", { bpm: parseInt(e.target.value) || undefined })}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Key</label>
              <Input
                placeholder="e.g., F Minor"
                value={state.data.musicalKey || ""}
                onChange={(e) => updateData("basics", { musicalKey: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Included Info */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-purple-900 dark:from-purple-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle className="text-purple-700 dark:text-purple-300">What Learners Will Get</CardTitle>
          <CardDescription>Standard inclusions with every project file</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Complete DAW project
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> All MIDI patterns
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Audio samples used
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Mixer settings & automation
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/create')}>
          Cancel
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Continue to Files
        </Button>
      </div>
    </div>
  );
}
