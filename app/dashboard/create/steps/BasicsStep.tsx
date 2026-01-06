"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { ProductCategory, getProductInfo } from "../types";
import { ProductAIAssistant } from "@/components/ai/ProductAIAssistant";
import { useRouter } from "next/navigation";

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
  const productInfo = getProductInfo(productCategory);

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
          placeholder="e.g., Ultimate Trap Drum Kit"
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
          placeholder="Describe what makes this product special..."
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
              onClick={() => onImageChange("")}
            >
              Change Image
            </Button>
          </div>
        ) : (
          <Card className="cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50">
            <div
              className="p-12 text-center"
              onClick={() => {
                // TODO: Open image picker/uploader
                console.log("Open image picker");
              }}
            >
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-medium">Upload Thumbnail</h3>
              <p className="mb-4 text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <Badge variant="secondary">Recommended: 1200x630px</Badge>
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
