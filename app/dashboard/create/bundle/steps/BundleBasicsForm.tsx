"use client";

import { useBundleCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BundleBasicsForm() {
  const { state, updateData, saveBundle } = useBundleCreation();
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = async () => {
    await saveBundle();
    router.push(
      `/dashboard/create/bundle?step=products${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !(state.data.tags || []).includes(tagInput.trim())) {
      updateData("basics", { tags: [...(state.data.tags || []), tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateData("basics", { tags: state.data.tags?.filter((t) => t !== tag) || [] });
  };

  const handleGenerateThumbnail = async () => {
    if (!state.data.title) {
      toast.error("Please enter a bundle title first");
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
          category: "bundle",
          type: "bundle",
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

  const canProceed = !!(state.data.title && state.data.description);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bundle Basics</h2>
        <p className="mt-1 text-muted-foreground">
          Create a bundle to sell multiple products together at a discount
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bundle Information</CardTitle>
          <CardDescription>Give your bundle a compelling name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Producer Starter Pack, Complete Lo-Fi Bundle"
              value={state.data.title || ""}
              onChange={(e) => updateData("basics", { title: e.target.value })}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what's included in this bundle and the value customers get..."
              value={state.data.description || ""}
              onChange={(e) => updateData("basics", { description: e.target.value })}
              className="min-h-[120px] bg-background"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bundle Cover</CardTitle>
          <CardDescription>Add an eye-catching cover image for your bundle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {state.data.thumbnail ? (
              <img
                src={state.data.thumbnail}
                alt="Bundle thumbnail"
                className="h-32 w-32 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
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
                  className="flex-1 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Generate
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Help customers find your bundle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add tag (e.g., starter, essential, complete)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="bg-background"
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {state.data.tags && state.data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.data.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          Continue to Products
        </Button>
      </div>
    </div>
  );
}
