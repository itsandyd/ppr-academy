"use client";

import { useReleaseCreation } from "../context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Disc3,
  Calendar as CalendarIcon,
  Clock,
  Upload,
  Music,
  User,
  Users,
  Building2,
  Hash,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { useGenerateUploadUrl, useGetFileUrl } from "@/lib/convex-typed-hooks";
import { toast } from "sonner";

const releaseTypes = [
  { value: "single", label: "Single", icon: "🎵", description: "One track release" },
  { value: "ep", label: "EP", icon: "📀", description: "3-6 tracks" },
  { value: "album", label: "Album", icon: "💿", description: "Full-length release" },
  { value: "mixtape", label: "Mixtape", icon: "📼", description: "Collection of tracks" },
  { value: "remix", label: "Remix", icon: "🔄", description: "Remix release" },
];

const genres = [
  "Hip Hop", "R&B", "Pop", "Electronic", "House", "Techno", "Trap",
  "Lo-Fi", "Drill", "Afrobeats", "Latin", "Rock", "Indie", "Jazz",
  "Soul", "Funk", "Reggae", "Dancehall", "EDM", "Future Bass", "Dubstep",
];

const timezones = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "GMT / London" },
  { value: "Europe/Paris", label: "CET / Paris" },
  { value: "Europe/Berlin", label: "CET / Berlin" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Australia/Sydney", label: "Australian Eastern Time" },
];

export function ReleaseBasicsForm() {
  const { state, updateData } = useReleaseCreation();
  const [featuredArtistInput, setFeaturedArtistInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useGenerateUploadUrl();
  const getFileUrl = useGetFileUrl();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
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
        updateData("basics", { coverArtUrl: publicUrl });
        toast.success("Cover art uploaded successfully!");
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

  const handleAddFeaturedArtist = () => {
    if (featuredArtistInput.trim()) {
      const current = state.data.featuredArtists || [];
      updateData("basics", {
        featuredArtists: [...current, featuredArtistInput.trim()],
      });
      setFeaturedArtistInput("");
    }
  };

  const handleRemoveFeaturedArtist = (index: number) => {
    const current = state.data.featuredArtists || [];
    updateData("basics", {
      featuredArtists: current.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Release Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Disc3 className="h-5 w-5 text-purple-500" />
            Release Type
          </CardTitle>
          <CardDescription>What type of release is this?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {releaseTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateData("basics", { releaseType: type.value as any })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary/50",
                  state.data.releaseType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                )}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="font-medium">{type.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {type.description}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-blue-500" />
            Release Information
          </CardTitle>
          <CardDescription>Tell us about your release</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Release Title *</Label>
              <Input
                id="title"
                placeholder="Enter your release title"
                value={state.data.title || ""}
                onChange={(e) => updateData("basics", { title: e.target.value, trackTitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistName">Artist Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="artistName"
                  placeholder="Your artist name"
                  className="pl-10"
                  value={state.data.artistName || ""}
                  onChange={(e) => updateData("basics", { artistName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell fans about this release..."
              rows={3}
              value={state.data.description || ""}
              onChange={(e) => updateData("basics", { description: e.target.value })}
            />
          </div>

          {/* Featured Artists */}
          <div className="space-y-2">
            <Label>Featured Artists</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Add featured artist"
                  className="pl-10"
                  value={featuredArtistInput}
                  onChange={(e) => setFeaturedArtistInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeaturedArtist();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAddFeaturedArtist}>
                Add
              </Button>
            </div>
            {state.data.featuredArtists && state.data.featuredArtists.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {state.data.featuredArtists.map((artist, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {artist}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeaturedArtist(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="label">Record Label (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="label"
                  placeholder="Independent or label name"
                  className="pl-10"
                  value={state.data.label || ""}
                  onChange={(e) => updateData("basics", { label: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Primary Genre</Label>
              <Select
                value={state.data.genre || ""}
                onValueChange={(value) => updateData("basics", { genre: value })}
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre.toLowerCase().replace(/\s+/g, "-")}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Release Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-green-500" />
            Release Date & Time
          </CardTitle>
          <CardDescription>When will this release go live?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Release Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !state.data.releaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {state.data.releaseDate
                      ? format(new Date(state.data.releaseDate), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={state.data.releaseDate ? new Date(state.data.releaseDate) : undefined}
                    onSelect={(date) =>
                      updateData("basics", { releaseDate: date?.getTime() })
                    }
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseTime">Release Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="releaseTime"
                  type="time"
                  className="pl-10"
                  value={state.data.releaseTime || "00:00"}
                  onChange={(e) => updateData("basics", { releaseTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={state.data.timezone || "America/New_York"}
                onValueChange={(value) => updateData("basics", { timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Art */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-pink-500" />
            Cover Art
          </CardTitle>
          <CardDescription>Upload your release artwork (3000x3000px recommended)</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {state.data.coverArtUrl ? (
              <div className="relative">
                <img
                  src={state.data.coverArtUrl}
                  alt="Cover art"
                  className="h-48 w-48 rounded-lg object-cover shadow-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateData("basics", { coverArtUrl: undefined });
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-full bg-muted p-4">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isUploading ? "Uploading..." : "Upload cover art"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Track Metadata (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-gray-500" />
            Track Metadata (Optional)
          </CardTitle>
          <CardDescription>Technical details for distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="isrc">ISRC Code</Label>
              <Input
                id="isrc"
                placeholder="XX-XXX-00-00000"
                value={state.data.isrc || ""}
                onChange={(e) => updateData("basics", { isrc: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upc">UPC/EAN</Label>
              <Input
                id="upc"
                placeholder="000000000000"
                value={state.data.upc || ""}
                onChange={(e) => updateData("basics", { upc: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                value={state.data.bpm || ""}
                onChange={(e) => updateData("basics", { bpm: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                placeholder="C Major"
                value={state.data.key || ""}
                onChange={(e) => updateData("basics", { key: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
