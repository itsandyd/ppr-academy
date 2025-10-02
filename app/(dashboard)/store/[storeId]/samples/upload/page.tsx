"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useValidStoreId } from "@/hooks/useStoreId";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Music, Loader2, X, FileAudio, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const GENRES = [
  "Hip Hop", "Trap", "Drill", "R&B", "Pop", "Electronic", "House", 
  "Techno", "Dubstep", "Future Bass", "Lo-Fi", "Ambient", "Rock", 
  "Jazz", "Classical", "Other"
];

const CATEGORIES = [
  { value: "drums", label: "Drums" },
  { value: "bass", label: "Bass" },
  { value: "synth", label: "Synth" },
  { value: "vocals", label: "Vocals" },
  { value: "fx", label: "FX" },
  { value: "melody", label: "Melody" },
  { value: "loops", label: "Loops" },
  { value: "one-shots", label: "One-Shots" },
];

const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
];

const LICENSE_TYPES = [
  { value: "royalty-free", label: "Royalty Free" },
  { value: "commercial", label: "Commercial Use" },
  { value: "exclusive", label: "Exclusive Rights" },
];

export default function SampleUploadPage() {
  const router = useRouter();
  const storeId = useValidStoreId();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [category, setCategory] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [creditPrice, setCreditPrice] = useState("10");
  const [licenseType, setLicenseType] = useState("royalty-free");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const createSample = useMutation(api.samples.createSample);

  if (!storeId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Invalid store ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/aiff"];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|aiff)$/i)) {
        toast.error("Please upload a valid audio file (WAV, MP3, or AIFF)");
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be less than 100MB");
        return;
      }

      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));

      // Auto-fill title from filename if empty
      if (!title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName);
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    if (!title || !genre || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      // Get audio duration
      const audio = new Audio(audioPreview!);
      await new Promise((resolve) => {
        audio.addEventListener("loadedmetadata", resolve);
      });
      const duration = audio.duration;

      // Upload file to Convex storage
      const uploadUrl = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": audioFile.type,
        },
        body: audioFile,
      });

      if (!uploadUrl.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await uploadUrl.json();

      // Get file URL from storage
      const fileUrl = URL.createObjectURL(audioFile);

      // Create sample in database
      await createSample({
        storeId,
        title,
        description: description || undefined,
        storageId,
        fileUrl,
        fileName: audioFile.name,
        fileSize: audioFile.size,
        duration,
        format: audioFile.type.split("/")[1] || "mp3",
        bpm: bpm ? parseFloat(bpm) : undefined,
        key: key || undefined,
        genre,
        subGenre: undefined,
        tags,
        category: category as any,
        creditPrice: parseInt(creditPrice),
        licenseType: licenseType as any,
        licenseTerms: undefined,
      });

      toast.success("Sample uploaded successfully!");
      router.push(`/store/${storeId}/products`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload sample. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storeId}/products`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 px-4 py-2 rounded-full mb-4">
            <Music className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Sample Upload</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Upload Sample</h1>
          <p className="text-muted-foreground">
            Upload your audio sample and set pricing to start earning credits
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Audio File</CardTitle>
                <CardDescription>Upload WAV, MP3, or AIFF (Max 100MB)</CardDescription>
              </CardHeader>
              <CardContent>
                {!audioFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 mb-4 text-indigo-500" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        WAV, MP3, or AIFF (MAX. 100MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/wav,audio/mp3,audio/mpeg,audio/aiff"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-lg">
                      <FileAudio className="w-10 h-10 text-indigo-500" />
                      <div className="flex-1">
                        <p className="font-medium">{audioFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAudioFile(null);
                          setAudioPreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {audioPreview && (
                      <audio controls className="w-full">
                        <source src={audioPreview} type={audioFile.type} />
                      </audio>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Dark Trap 808"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your sample..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre *</Label>
                    <Select value={genre} onValueChange={setGenre} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Musical Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Musical Properties</CardTitle>
                <CardDescription>Optional metadata to help buyers find your sample</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bpm">BPM</Label>
                    <Input
                      id="bpm"
                      type="number"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      placeholder="e.g., 140"
                      min="1"
                      max="300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Select value={key} onValueChange={setKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        {KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags (Max 10)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tags..."
                      disabled={tags.length >= 10}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || tags.length >= 10}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & License */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & License</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="creditPrice">Price (Credits) *</Label>
                  <Input
                    id="creditPrice"
                    type="number"
                    value={creditPrice}
                    onChange={(e) => setCreditPrice(e.target.value)}
                    placeholder="10"
                    min="1"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll earn 90% ({Math.floor(parseInt(creditPrice || "0") * 0.9)} credits) after platform fee
                  </p>
                </div>

                <div>
                  <Label htmlFor="licenseType">License Type *</Label>
                  <Select value={licenseType} onValueChange={setLicenseType} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/store/${storeId}/products`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !audioFile}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Sample
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

