"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { List, Eye, EyeOff, ImageIcon, Link as LinkIcon, Upload, Loader2 } from "lucide-react";
import { usePlaylistCuration } from "../context";
import { GENRE_OPTIONS } from "../types";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { useGenerateUploadUrl, useGetFileUrl } from "@/lib/convex-typed-hooks";
import { toast } from "sonner";

export function BasicsForm() {
  const { state, updateData, validateStep } = usePlaylistCuration();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useGenerateUploadUrl();
  const getFileUrl = useGetFileUrl();

  // Validate on mount and data changes
  useEffect(() => {
    validateStep("basics");
  }, [state.data.name, state.data.description]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Failed to upload image");

      const { storageId } = await result.json();
      const publicUrl = await getFileUrl({ storageId });

      if (publicUrl) {
        updateData("basics", { coverUrl: publicUrl });
        toast.success("Cover image uploaded successfully!");
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenreToggle = (genre: string) => {
    const currentGenres = state.data.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre];
    updateData("basics", { genres: newGenres });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Playlist Details
          </CardTitle>
          <CardDescription>
            Basic information about your playlist that artists will see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Playlist Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={state.data.name || ""}
              onChange={(e) => updateData("basics", { name: e.target.value })}
              placeholder="e.g., Chill Electronic Vibes"
              className="bg-white dark:bg-black"
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name that reflects the mood or genre
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <AIContentAssistant
                productType="playlist-curation"
                title={state.data.name}
                description={state.data.description}
                onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
              />
            </div>
            <Textarea
              id="description"
              value={state.data.description || ""}
              onChange={(e) => updateData("basics", { description: e.target.value })}
              placeholder="Describe what kind of tracks you're looking for, the vibe, and what makes your playlist special..."
              rows={4}
              className="bg-white dark:bg-black"
            />
            <p className="text-xs text-muted-foreground">
              Help artists understand if their music is a good fit
            </p>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="coverUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Cover Image
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              {state.data.coverUrl ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                  <img
                    src={state.data.coverUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-muted">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  id="coverUrl"
                  type="url"
                  value={state.data.coverUrl || ""}
                  onChange={(e) => updateData("basics", { coverUrl: e.target.value })}
                  placeholder="Paste image URL..."
                  className="bg-white dark:bg-black"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <Label>Genres (Select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((genre) => (
                <Badge
                  key={genre}
                  variant={(state.data.genres || []).includes(genre) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Helps artists find playlists that match their music style
            </p>
          </div>

          {/* Custom Slug */}
          <div className="space-y-2">
            <Label htmlFor="customSlug" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Custom URL Slug (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/playlists/</span>
              <Input
                id="customSlug"
                value={state.data.customSlug || ""}
                onChange={(e) =>
                  updateData("basics", {
                    customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="chill-electronic"
                className="flex-1 bg-white dark:bg-black"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Create a memorable URL for sharing (letters, numbers, and hyphens only)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state.data.isPublic ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
            Visibility
          </CardTitle>
          <CardDescription>Control who can see your playlist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex-1">
              <h4 className="font-medium">Public Playlist</h4>
              <p className="text-sm text-muted-foreground">
                {state.data.isPublic
                  ? "Anyone can view this playlist and submit tracks"
                  : "Only you can see this playlist"}
              </p>
            </div>
            <Switch
              checked={state.data.isPublic ?? true}
              onCheckedChange={(checked) => updateData("basics", { isPublic: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* External Playlist Links */}
      <Card>
        <CardHeader>
          <CardTitle>Streaming Platform Links (Optional)</CardTitle>
          <CardDescription>
            Link to your playlist on streaming platforms to show artists where their music could end up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spotify">Spotify Playlist URL</Label>
            <Input
              id="spotify"
              type="url"
              value={state.data.spotifyPlaylistUrl || ""}
              onChange={(e) => updateData("basics", { spotifyPlaylistUrl: e.target.value })}
              placeholder="https://open.spotify.com/playlist/..."
              className="bg-white dark:bg-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apple">Apple Music Playlist URL</Label>
            <Input
              id="apple"
              type="url"
              value={state.data.applePlaylistUrl || ""}
              onChange={(e) => updateData("basics", { applePlaylistUrl: e.target.value })}
              placeholder="https://music.apple.com/playlist/..."
              className="bg-white dark:bg-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soundcloud">SoundCloud Playlist URL</Label>
            <Input
              id="soundcloud"
              type="url"
              value={state.data.soundcloudPlaylistUrl || ""}
              onChange={(e) => updateData("basics", { soundcloudPlaylistUrl: e.target.value })}
              placeholder="https://soundcloud.com/.../sets/..."
              className="bg-white dark:bg-black"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
