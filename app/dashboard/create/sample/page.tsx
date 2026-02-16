"use client";

import { useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Music,
  Play,
  Pause,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const GENRES = [
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "Electronic",
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "Lo-Fi",
  "Ambient",
  "Indie",
  "Rock",
  "Jazz",
];

const CATEGORIES = [
  { value: "drums", label: "Drums" },
  { value: "bass", label: "Bass" },
  { value: "synth", label: "Synth" },
  { value: "vocals", label: "Vocals" },
  { value: "fx", label: "FX" },
  { value: "melody", label: "Melody" },
  { value: "loops", label: "Loops" },
  { value: "one-shots", label: "One-shots" },
];

const LICENSE_TYPES = [
  { value: "royalty-free", label: "Royalty Free", desc: "Can be used in any project without royalties" },
  { value: "commercial", label: "Commercial", desc: "Can be used in commercial projects" },
  { value: "exclusive", label: "Exclusive", desc: "Only one buyer can use this sample" },
];

export default function CreateSamplePage() {
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    category: "" as typeof CATEGORIES[number]["value"] | "",
    bpm: "",
    key: "",
    creditPrice: "5",
    licenseType: "royalty-free" as "royalty-free" | "commercial" | "exclusive",
    tags: [] as string[],
  });

  // File data
  const [fileData, setFileData] = useState<{
    file: File | null;
    storageId: string | null;
    fileUrl: string | null;
    duration: number;
    localUrl: string | null;
  }>({
    file: null,
    storageId: null,
    fileUrl: null,
    duration: 0,
    localUrl: null,
  });

  // Get user's store
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const primaryStore = stores?.[0];

  // Mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createSample = useMutation(api.samples.createSample);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/aiff", "audio/flac", "audio/ogg"];
    if (!validTypes.some((t) => file.type.includes(t.split("/")[1]))) {
      toast.error("Please select a valid audio file (WAV, MP3, AIFF, FLAC, OGG)");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Create local URL for preview
    const localUrl = URL.createObjectURL(file);

    // Get duration
    const audio = new Audio(localUrl);
    audio.addEventListener("loadedmetadata", () => {
      setFileData((prev) => ({ ...prev, duration: audio.duration }));
    });

    setFileData({
      file,
      storageId: null,
      fileUrl: null,
      duration: 0,
      localUrl,
    });

    // Auto-fill title from filename if empty
    if (!formData.title) {
      const title = file.name.replace(/\.(wav|mp3|aiff|flac|ogg)$/i, "");
      updateFormData("title", title);
    }
  };

  const uploadFile = async () => {
    if (!fileData.file) return null;

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": fileData.file.type },
        body: fileData.file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      // For now, use the local URL as the file URL (Convex will generate the actual URL)
      setFileData((prev) => ({
        ...prev,
        storageId,
        fileUrl: prev.localUrl, // Temporary - will be replaced with actual URL
      }));

      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !fileData.localUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = fileData.localUrl;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateFormData("tags", formData.tags.filter((t) => t !== tag));
  };

  const handlePublish = async (asDraft: boolean = false) => {
    if (!primaryStore) {
      toast.error("Please create a store first");
      return;
    }

    if (!fileData.file) {
      toast.error("Please upload an audio file");
      return;
    }

    if (!formData.title || !formData.genre || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsPublishing(true);
    try {
      // Upload file if not already uploaded
      let storageId = fileData.storageId;
      if (!storageId) {
        storageId = await uploadFile();
        if (!storageId) {
          setIsPublishing(false);
          return;
        }
      }

      // Create sample
      await createSample({
        storeId: primaryStore._id,
        title: formData.title,
        description: formData.description || undefined,
        storageId: storageId as any,
        fileUrl: fileData.localUrl || "", // Will be updated by backend
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        duration: fileData.duration,
        format: fileData.file.name.split(".").pop() || "wav",
        bpm: formData.bpm ? parseInt(formData.bpm) : undefined,
        key: formData.key || undefined,
        genre: formData.genre,
        tags: formData.tags,
        category: formData.category as any,
        creditPrice: parseInt(formData.creditPrice) || 5,
        licenseType: formData.licenseType,
      });

      toast.success(asDraft ? "Sample saved as draft!" : "Sample published!");
      router.push("/dashboard/samples/manage?mode=create");
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error(error.message || "Failed to publish sample");
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canPublish = !!(
    fileData.file &&
    formData.title &&
    formData.genre &&
    formData.category &&
    primaryStore
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard?mode=create">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Upload Sample</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Create an individual sample that can be sold separately or added to packs
            </p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Audio File *</CardTitle>
          <CardDescription>Upload your sample (WAV, MP3, AIFF, FLAC - max 50MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.aiff,.flac,.ogg"
            onChange={handleFileSelect}
            className="hidden"
          />

          {fileData.file ? (
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-primary" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileData.file.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatFileSize(fileData.file.size)}</span>
                  <span>•</span>
                  <span>{formatDuration(fileData.duration)}</span>
                  <span>•</span>
                  <span>{fileData.file.name.split(".").pop()?.toUpperCase()}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (fileData.localUrl) URL.revokeObjectURL(fileData.localUrl);
                  setFileData({ file: null, storageId: null, fileUrl: null, duration: 0, localUrl: null });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="font-medium">Click to upload audio file</p>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sample Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Punchy Kick 01"
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your sample..."
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genre *</Label>
              <Select
                value={formData.genre}
                onValueChange={(v) => updateFormData("genre", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => updateFormData("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM (optional)</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                value={formData.bpm}
                onChange={(e) => updateFormData("bpm", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key (optional)</Label>
              <Input
                id="key"
                placeholder="C Minor"
                value={formData.key}
                onChange={(e) => updateFormData("key", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & License */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Pricing & License</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creditPrice">Price (credits) *</Label>
            <Input
              id="creditPrice"
              type="number"
              min="1"
              placeholder="5"
              value={formData.creditPrice}
              onChange={(e) => updateFormData("creditPrice", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              1 credit ≈ $1 USD. Recommended: 3-10 credits for individual samples.
            </p>
          </div>

          <div className="space-y-2">
            <Label>License Type</Label>
            <div className="grid grid-cols-1 gap-2">
              {LICENSE_TYPES.map((license) => (
                <button
                  key={license.value}
                  onClick={() => updateFormData("licenseType", license.value)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                    formData.licenseType === license.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                      formData.licenseType === license.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {formData.licenseType === license.value && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="font-medium">{license.label}</p>
                    <p className="text-sm text-muted-foreground">{license.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Tags</CardTitle>
          <CardDescription>Add tags to help buyers find your sample</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add tag (e.g., punchy, analog, vintage)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4">
        <Link href="/dashboard?mode=create">
          <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
        </Link>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => handlePublish(true)}
            disabled={!canPublish || isPublishing || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Save as Draft"
            )}
          </Button>
          <Button
            onClick={() => handlePublish(false)}
            disabled={!canPublish || isPublishing || isUploading}
            className="w-full sm:w-auto"
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Music className="mr-2 h-4 w-4" />
                Publish Sample
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
