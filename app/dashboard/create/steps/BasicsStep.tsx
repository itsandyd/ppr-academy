"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { ProductCategory, getProductInfo } from "../types";
import { ProductAIAssistant } from "@/components/ai/ProductAIAssistant";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGenerateUploadUrl, useGetFileUrl } from "@/lib/convex-typed-hooks";

// Category-specific placeholder text for better UX
const CATEGORY_PLACEHOLDERS: Record<string, { title: string; description: string }> = {
  "community": {
    title: "e.g., Producer's Inner Circle, Beat Makers Community",
    description: "Describe your community - what members get access to, the vibe, exclusive perks, how often you engage with members..."
  },
  "tip-jar": {
    title: "e.g., Support My Music, Buy Me a Coffee",
    description: "Tell supporters what their tips help you create - new music, better equipment, more free content..."
  },
  "sample-pack": {
    title: "e.g., Ultimate Trap Drum Kit, Lo-Fi Essentials",
    description: "Describe what's included - number of samples, genres, quality, what makes this pack unique..."
  },
  "preset-pack": {
    title: "e.g., Dark Serum Presets, Vital Bass Pack",
    description: "Describe the presets - target plugin, genre, sound characteristics, what producers will create with them..."
  },
  "midi-pack": {
    title: "e.g., Melodic Trap MIDI Kit, Neo-Soul Chords",
    description: "Describe the MIDI files - genres, chord progressions, melodies, how they can be used..."
  },
  "effect-chain": {
    title: "e.g., Vocal Chain Pro, Master Bus Settings",
    description: "Describe your effect chain - what it does, target DAW, what sound it achieves..."
  },
  "default": {
    title: "e.g., My Awesome Product",
    description: "Describe what makes this product special, what's included, and who it's for..."
  }
};

interface BasicsStepProps {
  productCategory: ProductCategory;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onImageChange: (url: string) => void;
  onTagsChange: (tags: string[]) => void;
  onNext: () => void;
}

export function BasicsStep({
  productCategory,
  title,
  description,
  imageUrl,
  tags,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
  onTagsChange,
  onNext,
}: BasicsStepProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productInfo = getProductInfo(productCategory);

  // Get category-specific placeholders
  const placeholders = CATEGORY_PLACEHOLDERS[productCategory] || CATEGORY_PLACEHOLDERS["default"];

  // Convex mutation for generating upload URL
  const generateUploadUrl = useGenerateUploadUrl();
  const getFileUrl = useGetFileUrl();

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      // Generate upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();

      // Get the public URL for the uploaded image
      const publicUrl = await getFileUrl({ storageId });

      if (publicUrl) {
        onImageChange(publicUrl);
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onTagsChange([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const canProceed = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Product type badge */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">{productInfo?.icon}</span>
        <div>
          <h2 className="text-2xl font-bold">{productInfo?.label}</h2>
          <p className="text-sm text-muted-foreground">{productInfo?.description}</p>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Product Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder={placeholders.title}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={cn("text-lg", title.trim().length === 0 && "border-destructive")}
        />
        <p className="text-xs text-muted-foreground">Make it catchy and descriptive</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder={placeholders.description}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={6}
          className={cn(description.trim().length === 0 && "border-destructive")}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
          <ProductAIAssistant
            title={title}
            description={description}
            category={productCategory}
            onDescriptionUpdate={onDescriptionChange}
            onTagsUpdate={onTagsChange}
            onTitleUpdate={onTitleChange}
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail Image</Label>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Thumbnail preview"
              className="h-48 w-full rounded-lg object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Change Image"
              )}
            </Button>
          </div>
        ) : (
          <Card
            className={cn(
              "cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <div
              className="p-12 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground" />
                  <h3 className="mb-2 font-medium">Uploading...</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Please wait while your image uploads</p>
                </>
              ) : (
                <>
                  <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-medium">Upload Thumbnail</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Click to upload (PNG, JPG, max 5MB)</p>
                  <Badge variant="secondary">Recommended: 1200x630px</Badge>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Tags help students find your product</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/create")}>
          Cancel
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Continue
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
