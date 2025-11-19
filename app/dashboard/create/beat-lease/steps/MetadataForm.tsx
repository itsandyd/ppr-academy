"use client";

import { useBeatLeaseCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { MUSICAL_KEYS } from "../types";

export function MetadataForm() {
  const { state, updateData, saveBeat } = useBeatLeaseCreation();
  const router = useRouter();
  const [moodInput, setMoodInput] = useState("");
  const [instrumentInput, setInstrumentInput] = useState("");

  const handleNext = async () => {
    await saveBeat();
    router.push(`/dashboard/create/beat-lease?step=files${state.beatId ? `&beatId=${state.beatId}` : ''}`);
  };

  const handleBack = () => {
    router.push(`/dashboard/create/beat-lease?step=basics${state.beatId ? `&beatId=${state.beatId}` : ''}`);
  };

  const canProceed = !!(
    state.data.metadata?.bpm && 
    state.data.metadata?.key && 
    state.data.metadata?.duration
  );

  const updateMetadata = (field: string, value: any) => {
    updateData("metadata", {
      metadata: {
        ...state.data.metadata,
        [field]: value,
      } as any
    });
  };

  const addMood = () => {
    if (moodInput.trim() && !(state.data.metadata?.mood || []).includes(moodInput.trim())) {
      updateMetadata("mood", [...(state.data.metadata?.mood || []), moodInput.trim()]);
      setMoodInput("");
    }
  };

  const removeMood = (mood: string) => {
    updateMetadata("mood", (state.data.metadata?.mood || []).filter(m => m !== mood));
  };

  const addInstrument = () => {
    if (instrumentInput.trim() && !(state.data.metadata?.instruments || []).includes(instrumentInput.trim())) {
      updateMetadata("instruments", [...(state.data.metadata?.instruments || []), instrumentInput.trim()]);
      setInstrumentInput("");
    }
  };

  const removeInstrument = (instrument: string) => {
    updateMetadata("instruments", (state.data.metadata?.instruments || []).filter(i => i !== instrument));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Beat Details</h2>
        <p className="text-muted-foreground mt-1">
          Add technical details about your beat
        </p>
      </div>

      {/* BPM and Key */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>BPM *</CardTitle>
            <CardDescription>Beats per minute</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="60"
              max="200"
              placeholder="140"
              value={state.data.metadata?.bpm || ""}
              onChange={(e) => updateMetadata("bpm", parseInt(e.target.value) || undefined)}
              className="bg-background text-2xl font-bold h-14"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Musical Key *</CardTitle>
            <CardDescription>Key signature</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={state.data.metadata?.key}
              onValueChange={(value) => updateMetadata("key", value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select key..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black max-h-60">
                {MUSICAL_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle>Duration *</CardTitle>
          <CardDescription>How long is the beat? (in seconds)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[120, 150, 180, 210, 240, 300].map((seconds) => {
              const minutes = Math.floor(seconds / 60);
              const remainingSeconds = seconds % 60;
              const timeLabel = remainingSeconds > 0 
                ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
                : `${minutes}:00`;
              
              return (
                <button
                  key={seconds}
                  onClick={() => updateMetadata("duration", seconds)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    state.data.metadata?.duration === seconds
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-bold">{timeLabel}</div>
                  <div className="text-xs text-muted-foreground">min</div>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Label htmlFor="custom-duration">Or enter custom duration (seconds)</Label>
            <Input
              id="custom-duration"
              type="number"
              min="30"
              placeholder="180"
              value={state.data.metadata?.duration || ""}
              onChange={(e) => updateMetadata("duration", parseInt(e.target.value) || undefined)}
              className="max-w-xs bg-background mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mood Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Mood (Optional)</CardTitle>
          <CardDescription>Describe the beat's vibe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g., dark, aggressive, melodic"
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addMood();
                }
              }}
              className="bg-background"
            />
            <Button type="button" variant="secondary" onClick={addMood}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {state.data.metadata?.mood && state.data.metadata.mood.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.data.metadata.mood.map((mood) => (
                <Badge 
                  key={mood} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => removeMood(mood)}
                >
                  {mood} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruments */}
      <Card>
        <CardHeader>
          <CardTitle>Instruments (Optional)</CardTitle>
          <CardDescription>What instruments/sounds are featured?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g., 808, piano, strings, vocal chops"
              value={instrumentInput}
              onChange={(e) => setInstrumentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addInstrument();
                }
              }}
              className="bg-background"
            />
            <Button type="button" variant="secondary" onClick={addInstrument}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {state.data.metadata?.instruments && state.data.metadata.instruments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.data.metadata.instruments.map((instrument) => (
                <Badge 
                  key={instrument} 
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => removeInstrument(instrument)}
                >
                  {instrument} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Upload Files →
        </Button>
      </div>
    </div>
  );
}
