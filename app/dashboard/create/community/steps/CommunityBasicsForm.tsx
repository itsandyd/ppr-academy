"use client";

import { useState, useRef } from "react";
import { useCommunityCreation } from "../context";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Image as ImageIcon, Loader2 } from "lucide-react";
import { ValidatedField } from "@/shared/components/ValidatedField";
import { validationRules } from "@/hooks/useFieldValidation";
import { ProductAIAssistant } from "@/components/ai/ProductAIAssistant";
import { useGenerateUploadUrl, useGetFileUrl } from "@/lib/convex-typed-hooks";
import { toast } from "sonner";

export function CommunityBasicsForm() {
  const { state, updateData } = useCommunityCreation();
  const [tagInput, setTagInput] = useState("");
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
        updateData("basics", { thumbnail: publicUrl });
        toast.success("Image uploaded successfully!");
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

  const handleAddTag = () => {
    if (tagInput.trim() && !state.data.tags?.includes(tagInput.trim())) {
      updateData("basics", { tags: [...(state.data.tags || []), tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateData("basics", { tags: state.data.tags?.filter((t) => t !== tagToRemove) || [] });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Community Details</h2>
            <p className="text-sm text-muted-foreground">Create an exclusive community for your fans</p>
          </div>
        </div>

        {/* Title */}
        <ValidatedField
          id="title"
          label="Title"
          value={state.data.title || ""}
          onChange={(title) => updateData("basics", { title })}
          required
          rules={[validationRules.minLength(3, "Title must be at least 3 characters")]}
          placeholder="e.g., Producer Inner Circle, Beat Makers Club"
          description="What should members see when they join?"
        />

        {/* Description */}
        <div className="space-y-2">
          <ValidatedField
            id="description"
            label="Description"
            type="textarea"
            value={state.data.description || ""}
            onChange={(description) => updateData("basics", { description })}
            required
            rules={[validationRules.minLength(10, "Description must be at least 10 characters")]}
            placeholder="Describe what members get access to - exclusive content, direct support, networking opportunities..."
            rows={4}
            maxLength={500}
            showCharCount
          />
          <div className="flex justify-end">
            <ProductAIAssistant
              title={state.data.title || ""}
              description={state.data.description || ""}
              category="community"
              onDescriptionUpdate={(description) => updateData("basics", { description })}
              onTagsUpdate={(tags) => updateData("basics", { tags })}
              onTitleUpdate={(title) => updateData("basics", { title })}
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div className="space-y-2">
          <Label htmlFor="thumbnail">Cover Image (Optional)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {state.data.thumbnail ? (
            <div className="relative">
              <img
                src={state.data.thumbnail}
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
              className={`cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50 ${
                isUploading ? "pointer-events-none opacity-50" : ""
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-8 text-center">
                {isUploading ? (
                  <>
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 font-medium">Upload a cover image</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
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
          {state.data.tags && state.data.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {state.data.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} x
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
