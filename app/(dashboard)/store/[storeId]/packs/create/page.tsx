"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Upload,
  X,
  Music,
  Plus,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

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
  "Other",
];

const CATEGORIES = [
  "Drums",
  "Bass",
  "Synth",
  "Melody",
  "Vocals",
  "FX",
  "Loops",
  "One-Shots",
  "Full Songs",
];

export default function CreatePackPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creditPrice, setCreditPrice] = useState(10);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [selectedSamples, setSelectedSamples] = useState<Id<"audioSamples">[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const storeSamples = useQuery(api.samples.getStoreSamples, { storeId }) || [];

  // Mutations
  const createPack = useMutation(api.samplePacks.createSamplePack);
  const addSamples = useMutation(api.samplePacks.addSamplesToPack);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleSample = (sampleId: Id<"audioSamples">) => {
    setSelectedSamples(prev =>
      prev.includes(sampleId)
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      
      // Generate file URL (you'll need to add this query)
      // For now, using a placeholder
      setCoverImage(storageId);
      toast.success("Cover image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a pack name");
      return;
    }

    if (selectedSamples.length === 0) {
      toast.error("Please select at least one sample");
      return;
    }

    if (selectedGenres.length === 0) {
      toast.error("Please select at least one genre");
      return;
    }

    setIsCreating(true);

    try {
      // Create pack
      const packId = await createPack({
        storeId,
        name,
        description,
        creditPrice,
        genres: selectedGenres,
        categories: selectedCategories,
        tags,
        coverImageUrl: coverImage,
      });

      // Add samples
      await addSamples({
        packId,
        sampleIds: selectedSamples,
      });

      toast.success("Sample pack created successfully!");
      router.push(`/store/${storeId}/packs`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create pack");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Sample Pack</h1>
          <p className="text-muted-foreground mt-1">
            Bundle your samples into a pack
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Pack Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Lo-Fi Hip Hop Essentials"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what's included in this pack..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="price">Credit Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={creditPrice}
                  onChange={(e) => setCreditPrice(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Users will pay this amount in credits to download the entire pack
                </p>
              </div>

              {/* Cover Image */}
              <div>
                <Label>Cover Image</Label>
                <div className="mt-2">
                  {coverImage ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setCoverImage(undefined)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload cover image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Genres & Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Genres & Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Genres *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {GENRES.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleGenre(genre)}
                    >
                      {selectedGenres.includes(genre) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      {selectedCategories.includes(category) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                  />
                  <Button onClick={addTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sample Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Samples ({selectedSamples.length} selected)</span>
                <Badge variant="outline">
                  {storeSamples.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storeSamples.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {storeSamples.map((sample: any) => (
                    <div
                      key={sample._id}
                      onClick={() => toggleSample(sample._id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSamples.includes(sample._id)
                          ? "border-chart-1 bg-chart-1/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedSamples.includes(sample._id)
                            ? "bg-chart-1 border-chart-1"
                            : "border-border"
                        }`}>
                          {selectedSamples.includes(sample._id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <Music className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{sample.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {sample.genre} • {sample.category}
                            {sample.bpm && ` • ${sample.bpm} BPM`}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {sample.creditPrice} credits
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No samples available</p>
                  <p className="text-sm">Upload samples first to create a pack</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Pack Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Pack Name</div>
                <div className="font-medium">{name || "Untitled Pack"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Samples</div>
                <div className="font-medium">{selectedSamples.length} selected</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="text-2xl font-bold text-chart-1">
                  {creditPrice} credits
                </div>
              </div>

              {selectedGenres.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Genres</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCreate}
                  disabled={isCreating || !name || selectedSamples.length === 0}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Pack...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 mr-2" />
                      Create Pack
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

