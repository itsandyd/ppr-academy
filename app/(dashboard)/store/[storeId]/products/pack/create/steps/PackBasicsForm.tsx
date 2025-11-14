"use client";

import { usePackCreation } from "../context";
import { useRouter, useSearchParams } from "next/navigation";
import { useValidStoreId } from "@/hooks/useStoreId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PackBasicsForm() {
  const { state, updateData, savePack } = usePackCreation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = useValidStoreId();
  const [tagInput, setTagInput] = useState("");

  const handleNext = async () => {
    await savePack();
    router.push(`/store/${storeId}/products/pack/create?step=pricing${state.packId ? `&packId=${state.packId}` : ''}`);
  };

  const addTag = () => {
    if (tagInput.trim() && !(state.data.tags || []).includes(tagInput.trim())) {
      updateData("basics", { tags: [...(state.data.tags || []), tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateData("basics", { tags: state.data.tags?.filter(t => t !== tag) || [] });
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateThumbnail = async () => {
    if (!state.data.title) {
      toast.error("Please enter a pack title first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.data.title,
          description: state.data.description || "",
          category: state.data.packType,
          type: "pack", // Tell API to use pack-style prompt
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate thumbnail");
      }

      const data = await response.json();
      updateData("basics", { thumbnail: data.imageUrl });
      toast.success("AI thumbnail generated successfully!");
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleThumbnailUpload = () => {
    // Placeholder - integrate with your upload system
    toast.success("Upload integration coming soon!");
  };

  const canProceed = !!(state.data.title && state.data.description && state.data.packType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pack Basics</h2>
        <p className="text-muted-foreground mt-1">
          Let's start with the essentials for your pack
        </p>
      </div>

      {/* Pack Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Type *</CardTitle>
          <CardDescription>What type of pack are you creating?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: "sample-pack", label: "Sample Pack", icon: "🎵", desc: "Audio samples & loops" },
              { value: "preset-pack", label: "Preset Pack", icon: "🎛️", desc: "Synth presets" },
              { value: "midi-pack", label: "MIDI Pack", icon: "🎹", desc: "MIDI files & melodies" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => updateData("basics", { packType: type.value as any })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  state.data.packType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold">{type.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{type.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Title & Description */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Lo-Fi Drum Kit Vol. 1"
              value={state.data.title || ""}
              onChange={(e) => updateData("basics", { title: e.target.value })}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what's included in your pack, the vibe, use cases, etc..."
              value={state.data.description || ""}
              onChange={(e) => updateData("basics", { description: e.target.value })}
              className="min-h-[120px] bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Thumbnail</CardTitle>
          <CardDescription>Optional but recommended for better visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {state.data.thumbnail ? (
              <img
                src={state.data.thumbnail}
                alt="Pack thumbnail"
                className="w-32 h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Paste image URL..."
                value={state.data.thumbnail || ""}
                onChange={(e) => updateData("basics", { thumbnail: e.target.value })}
                className="bg-background"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateThumbnail}
                  disabled={isGenerating || !state.data.title}
                  className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:from-purple-100 hover:to-pink-100 border-purple-200 dark:border-purple-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleThumbnailUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata (Genre, BPM, Key) */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Metadata</CardTitle>
          <CardDescription>Help people find your pack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                placeholder="e.g., Hip Hop, Lo-Fi, House"
                value={state.data.genre || ""}
                onChange={(e) => updateData("basics", { genre: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM (Optional)</Label>
              <Input
                id="bpm"
                type="number"
                min="1"
                max="300"
                placeholder="120"
                value={state.data.bpm || ""}
                onChange={(e) => updateData("basics", { bpm: e.target.value ? parseInt(e.target.value) : undefined })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key (Optional)</Label>
              <Input
                id="key"
                placeholder="e.g., C Minor, A# Major"
                value={state.data.key || ""}
                onChange={(e) => updateData("basics", { key: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Additional keywords for discoverability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add tag (e.g., drums, vintage, punchy)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="bg-background"
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {state.data.tags && state.data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.data.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          Continue →
        </Button>
      </div>
    </div>
  );
}

