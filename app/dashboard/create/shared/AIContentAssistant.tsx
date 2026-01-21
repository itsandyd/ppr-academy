"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Wand2, Tag, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ProductCategory } from "../types";

interface AIContentAssistantProps {
  productType: ProductCategory;
  title?: string;
  description?: string;
  onDescriptionGenerated?: (description: string) => void;
  onTagsGenerated?: (tags: string[]) => void;
  onThumbnailGenerated?: (imageUrl: string) => void;
  existingTags?: string[];
  className?: string;
}

/**
 * AI Content Assistant - Provides AI-powered content generation for product creation
 *
 * Features:
 * - Description generation from title
 * - Tag suggestions based on title/description
 * - Thumbnail generation (delegates to existing API)
 */
export function AIContentAssistant({
  productType,
  title,
  description,
  onDescriptionGenerated,
  onTagsGenerated,
  onThumbnailGenerated,
  existingTags = [],
  className = "",
}: AIContentAssistantProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showTagPopover, setShowTagPopover] = useState(false);

  const handleGenerateDescription = async () => {
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "description",
          productType,
          title,
          existingDescription: description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate description");
      }

      const data = await response.json();
      onDescriptionGenerated?.(data.description);
      toast.success("Description generated!");
    } catch (error: any) {
      console.error("Description generation error:", error);
      toast.error(error.message || "Failed to generate description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!title && !description) {
      toast.error("Please enter a title or description first");
      return;
    }

    setIsGeneratingTags(true);
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tags",
          productType,
          title,
          description,
          existingTags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate tags");
      }

      const data = await response.json();
      setSuggestedTags(data.tags.filter((t: string) => !existingTags.includes(t)));
      setShowTagPopover(true);
      toast.success("Tags suggested!");
    } catch (error: any) {
      console.error("Tag generation error:", error);
      toast.error(error.message || "Failed to generate tags");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleAddTag = (tag: string) => {
    const newTags = [...existingTags, tag];
    onTagsGenerated?.(newTags);
    setSuggestedTags(suggestedTags.filter((t) => t !== tag));
    if (suggestedTags.length <= 1) {
      setShowTagPopover(false);
    }
  };

  const handleAddAllTags = () => {
    const newTags = [...existingTags, ...suggestedTags];
    onTagsGenerated?.(newTags);
    setSuggestedTags([]);
    setShowTagPopover(false);
  };

  const handleGenerateThumbnail = async () => {
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGeneratingThumbnail(true);
    try {
      // Map product type to thumbnail API type parameter
      const typeParam = getThumnailType(productType);

      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || "",
          category: productType,
          type: typeParam,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate thumbnail");
      }

      const data = await response.json();
      onThumbnailGenerated?.(data.imageUrl);
      toast.success("AI thumbnail generated!");
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Description Generator */}
      {onDescriptionGenerated && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateDescription}
          disabled={isGeneratingDescription || !title}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:from-purple-100 hover:to-pink-100 border-purple-200 dark:border-purple-800"
        >
          {isGeneratingDescription ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              AI Description
            </>
          )}
        </Button>
      )}

      {/* Tag Generator */}
      {onTagsGenerated && (
        <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateTags}
              disabled={isGeneratingTags || (!title && !description)}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 hover:from-blue-100 hover:to-cyan-100 border-blue-200 dark:border-blue-800"
            >
              {isGeneratingTags ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suggesting...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 mr-2" />
                  AI Tags
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white dark:bg-black" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Suggested Tags</h4>
                {suggestedTags.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddAllTags}
                    className="text-xs"
                  >
                    Add All
                  </Button>
                )}
              </div>
              {suggestedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleAddTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click "AI Tags" to generate suggestions
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Thumbnail Generator */}
      {onThumbnailGenerated && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateThumbnail}
          disabled={isGeneratingThumbnail || !title}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 hover:from-amber-100 hover:to-orange-100 border-amber-200 dark:border-amber-800"
        >
          {isGeneratingThumbnail ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Thumbnail
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline AI button for individual fields
 */
interface AIFieldButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  label?: string;
}

export function AIFieldButton({
  onClick,
  isLoading,
  disabled = false,
  label = "AI",
}: AIFieldButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={isLoading || disabled}
      className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Wand2 className="w-4 h-4 mr-1" />
          {label}
        </>
      )}
    </Button>
  );
}

/**
 * Get thumbnail type parameter for the generate-thumbnail API
 */
function getThumnailType(productType: ProductCategory): string {
  switch (productType) {
    case "sample-pack":
    case "preset-pack":
    case "midi-pack":
      return "pack";
    case "course":
    case "workshop":
    case "masterclass":
      return "course";
    case "beat-lease":
      return "beat";
    case "coaching":
      return "coaching";
    case "mixing-service":
    case "mastering-service":
      return "service";
    case "effect-chain":
    case "project-files":
    case "mixing-template":
      return "template";
    case "pdf":
    case "cheat-sheet":
    case "template":
      return "pdf";
    case "playlist-curation":
      return "playlist";
    case "membership":
      return "membership";
    case "bundle":
      return "bundle";
    default:
      return "generic";
  }
}
