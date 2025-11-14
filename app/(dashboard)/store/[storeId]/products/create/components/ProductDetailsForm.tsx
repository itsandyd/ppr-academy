"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Link as LinkIcon, X, Info } from "lucide-react";
import { ProductCategory } from "../types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProductDetailsFormProps {
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  tags: string[];
  productCategory: ProductCategory;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onImageUrlChange: (url: string) => void;
  onDownloadUrlChange: (url: string) => void;
  onTagsChange: (tags: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ProductDetailsForm({
  title,
  description,
  imageUrl,
  downloadUrl,
  tags,
  productCategory,
  onTitleChange,
  onDescriptionChange,
  onImageUrlChange,
  onDownloadUrlChange,
  onTagsChange,
  onContinue,
  onBack,
}: ProductDetailsFormProps) {
  const [newTag, setNewTag] = useState("");

  const needsDownloadUrl = ![
    "coaching",
    "mixing-service",
    "mastering-service",
    "playlist-curation",
    "tip-jar",
    "donation",
    "community",
    "blog-post",
    "course", // Courses have their own content structure (modules/lessons)
    "workshop",
    "masterclass",
  ].includes(productCategory);
  
  const isCommunity = productCategory === "community";
  const isBlogPost = productCategory === "blog-post";
  const isCourse = productCategory === "course";

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  const isValid = title.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Product Details</h2>
        <p className="text-muted-foreground mt-1">
          Tell us about your {productCategory.replace("-", " ")}
        </p>
      </div>

      {/* Course-specific info banner */}
      {isCourse && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Course Setup</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200 mt-1">
            You're creating the basic course structure now. After publishing, you can add modules, lessons, and chapters through the course editor. Don't worry - you can always come back to add content later!
          </AlertDescription>
        </Alert>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., 808 Drum Kit Vol. 2"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={!title.trim() ? "border-red-300" : ""}
        />
        {!title.trim() && (
          <p className="text-xs text-red-500">Title is required</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what's included, who it's for, and what makes it special..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          A good description helps customers understand the value
        </p>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Cover Image</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="imageUrl"
              placeholder="https://... or upload"
              value={imageUrl}
              onChange={(e) => onImageUrlChange(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
        {imageUrl && (
          <div className="mt-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-md border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Discord Invite Link (for community products) */}
      {isCommunity && (
        <div className="space-y-2">
          <Label htmlFor="downloadUrl">
            Discord Invite Link <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="downloadUrl"
                placeholder="https://discord.gg/..."
                value={downloadUrl}
                onChange={(e) => onDownloadUrlChange(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Discord server invite link (make sure it doesn't expire)
          </p>
        </div>
      )}
      
      {/* Blog Post URL */}
      {isBlogPost && (
        <div className="space-y-2">
          <Label htmlFor="downloadUrl">
            Blog Post URL
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="downloadUrl"
                placeholder="https://yourblog.com/post-title"
                value={downloadUrl}
                onChange={(e) => onDownloadUrlChange(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Link to your blog post or article
          </p>
        </div>
      )}

      {/* Download File (for digital products) */}
      {needsDownloadUrl && (
        <div className="space-y-2">
          <Label htmlFor="downloadUrl">
            Download File <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="downloadUrl"
                placeholder="https://... or upload"
                value={downloadUrl}
                onChange={(e) => onDownloadUrlChange(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            URL to your file or upload directly
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Add tags to help customers find your product
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onContinue} disabled={!isValid} size="lg">
          Continue →
        </Button>
      </div>
    </div>
  );
}

