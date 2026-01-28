"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useGenerateUploadUrl, useGetFileUrl } from "@/lib/convex-typed-hooks";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  title?: string;
  description?: string;
  productType?: string;
  productTitle?: string;
  productDescription?: string;
  showAIGenerate?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  title = "Thumbnail Image",
  description = "Upload an eye-catching image for your product",
  productType,
  productTitle,
  productDescription,
  showAIGenerate = true,
  className = "",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useGenerateUploadUrl();
  const getFileUrl = useGetFileUrl();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
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
        onChange(publicUrl);
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

  const handleGenerateThumbnail = async () => {
    if (!productTitle) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: productTitle,
          description: productDescription || "",
          category: productType,
          type: productType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate thumbnail");
      }

      const data = await response.json();
      onChange(data.imageUrl);
      toast.success("AI thumbnail generated successfully!");
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="flex items-center gap-4">
          {value ? (
            <img
              src={value}
              alt="Thumbnail"
              className="h-32 w-32 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Paste image URL..."
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className="bg-background"
            />
            <div className="flex gap-2">
              {showAIGenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateThumbnail}
                  disabled={isGenerating || !productTitle}
                  className="flex-1 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Generate
                    </>
                  )}
                </Button>
              )}
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
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
