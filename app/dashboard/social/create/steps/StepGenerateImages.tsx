"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSocialPost, ImageData } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import {
  Image,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Pencil,
  Upload,
  X,
  RotateCcw,
  ImagePlus,
  AlertCircle,
} from "lucide-react";

export function StepGenerateImages() {
  const { state, updateData, goToStep, savePost, setGenerating } = useSocialPost();
  const { toast } = useToast();

  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">(
    state.data.imageAspectRatio || "9:16"
  );
  const [images, setImages] = useState<ImageData[]>(state.data.images || []);
  const [isGenerating, setIsGeneratingLocal] = useState(false);
  const [generatingIndices, setGeneratingIndices] = useState<Set<number>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const imagesRef = useRef<ImageData[]>(images);

  // @ts-ignore - Convex type inference depth issue
  const generateImagePrompts = useAction(api.masterAI.socialMediaGenerator.generateImagePrompts);
  // @ts-ignore - Convex type inference depth issue
  const generateSocialImage = useAction(api.masterAI.socialMediaGenerator.generateSocialImage);
  // @ts-ignore - Convex type inference depth issue
  const editSocialImage = useAction(api.masterAI.socialMediaGenerator.editSocialImage);
  // @ts-ignore - Convex type inference depth issue
  const generateFromUploadedImage = useAction(
    api.masterAI.socialMediaGenerator.generateFromUploadedImage
  );
  // @ts-ignore - Convex type inference depth issue
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  // @ts-ignore - Convex type inference depth issue
  const getStorageUrl = useMutation(api.files.getUrl);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editResult, setEditResult] = useState<{ storageId: string; url: string } | null>(null);

  // Prompt editing state
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  // Upload state
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateImages = (newImages: ImageData[]) => {
    imagesRef.current = newImages;
    setImages(newImages);
  };

  useEffect(() => {
    if (!hasInitialized && state.data.images && state.data.images.length > 0) {
      updateImages(state.data.images);
      if (state.data.imageAspectRatio) {
        setAspectRatio(state.data.imageAspectRatio);
      }
      setHasInitialized(true);
    }
  }, [state.data.images, state.data.imageAspectRatio, hasInitialized]);

  const handleGeneratePrompts = async () => {
    if (!state.data.combinedScript) return;

    setIsGeneratingLocal(true);
    setGenerating(true);
    setPromptError(null);

    try {
      const result = await generateImagePrompts({
        script: state.data.combinedScript || "",
        aspectRatio,
      });

      if (result.error) {
        setPromptError(result.error);
        toast({
          title: "Image prompt generation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.prompts && result.prompts.length > 0) {
        const newImages: ImageData[] = result.prompts.map((p: { prompt: string; sentence: string }) => ({
          aspectRatio,
          prompt: p.prompt,
          sentence: p.sentence,
          originalPrompt: p.prompt,
        }));
        updateImages(newImages);
        updateData("images", { images: newImages, imageAspectRatio: aspectRatio });
        // Auto-save prompts to database immediately so they survive reload
        savePost().catch((err) => console.error("Auto-save prompts failed:", err));
        setPromptError(null);
      } else {
        setPromptError("No image prompts were generated. Please try again.");
        toast({
          title: "No prompts generated",
          description: "The AI model returned an empty response. Click Retry to try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to generate image prompts:", error);
      setPromptError("An unexpected error occurred. Please try again.");
      toast({
        title: "Generation failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLocal(false);
      setGenerating(false);
    }
  };

  // Prompt editing handlers
  const handlePromptChange = (index: number, newPrompt: string) => {
    const latestImages = [...imagesRef.current];
    const original = latestImages[index].originalPrompt || latestImages[index].prompt;
    latestImages[index] = {
      ...latestImages[index],
      prompt: newPrompt,
      originalPrompt: original,
      isPromptEdited: newPrompt !== original,
    };
    updateImages(latestImages);
  };

  const handleResetPrompt = (index: number) => {
    const latestImages = [...imagesRef.current];
    const original = latestImages[index].originalPrompt;
    if (original) {
      latestImages[index] = {
        ...latestImages[index],
        prompt: original,
        isPromptEdited: false,
      };
      updateImages(latestImages);
    }
  };

  // Image upload handlers
  const handleUploadClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleFileSelect = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.error("Invalid file type");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error("File too large (max 10MB)");
      return;
    }

    setUploadingIndex(index);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Get the actual Convex storage URL that FAL can access
      const actualUrl = await getStorageUrl({ storageId });

      if (!actualUrl) {
        throw new Error("Failed to get storage URL");
      }

      // Update the image data with the source image
      const latestImages = [...imagesRef.current];
      latestImages[index] = {
        ...latestImages[index],
        sourceStorageId: storageId,
        sourceImageUrl: actualUrl,
      };
      updateImages(latestImages);
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploadingIndex(null);
      // Reset the input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveSourceImage = (index: number) => {
    const latestImages = [...imagesRef.current];
    latestImages[index] = {
      ...latestImages[index],
      sourceStorageId: undefined,
      sourceImageUrl: undefined,
    };
    updateImages(latestImages);
  };

  const handleGenerateImage = async (index: number, batchMode = false) => {
    const currentImages = imagesRef.current;
    const image = currentImages[index];
    if (!image?.prompt) return;

    // Clear failed state for this index
    setFailedIndices((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    if (!batchMode) {
      // Set global lock when first image starts
      if (generatingIndices.size === 0) setGenerating(true);
      setGeneratingIndices((prev) => new Set([...prev, index]));
    }

    try {
      let result;

      // Check if we have a source image for image-to-image generation
      if (image.sourceImageUrl) {
        result = await generateFromUploadedImage({
          sourceImageUrl: image.sourceImageUrl,
          stylePrompt: image.prompt,
          aspectRatio,
        });
      } else {
        result = await generateSocialImage({
          prompt: image.prompt,
          aspectRatio,
        });
      }

      if (result.success && result.storageId && result.imageUrl) {
        const latestImages = [...imagesRef.current];
        latestImages[index] = {
          ...latestImages[index],
          storageId: result.storageId,
          url: result.imageUrl,
          aspectRatio,
        };
        updateImages(latestImages);
        updateData("images", { images: latestImages });
      } else {
        setFailedIndices((prev) => new Set([...prev, index]));
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      setFailedIndices((prev) => new Set([...prev, index]));
    } finally {
      if (!batchMode) {
        setGeneratingIndices((prev) => {
          const next = new Set(prev);
          next.delete(index);
          // Clear global lock when last image finishes
          if (next.size === 0) setGenerating(false);
          return next;
        });
      }
    }
  };

  const handleGenerateAllImages = async () => {
    setGeneratingAll(true);
    setGenerating(true);
    setFailedIndices(new Set());

    const currentImages = imagesRef.current;
    const indicesToGenerate = currentImages
      .map((img, idx) => (!img.url ? idx : -1))
      .filter((idx) => idx !== -1);

    setGeneratingIndices(new Set(indicesToGenerate));

    const BATCH_SIZE = 3;
    let successCount = 0;
    let failCount = 0;

    const generateOne = async (index: number, retryCount = 0): Promise<boolean> => {
      const image = imagesRef.current[index];
      if (!image?.prompt) return false;

      try {
        let result;

        if (image.sourceImageUrl) {
          result = await generateFromUploadedImage({
            sourceImageUrl: image.sourceImageUrl,
            stylePrompt: image.prompt,
            aspectRatio,
          });
        } else {
          result = await generateSocialImage({
            prompt: image.prompt,
            aspectRatio,
          });
        }

        if (result.success && result.storageId && result.imageUrl) {
          const latestImages = [...imagesRef.current];
          latestImages[index] = {
            ...latestImages[index],
            storageId: result.storageId,
            url: result.imageUrl,
            aspectRatio,
          };
          updateImages(latestImages);
          updateData("images", { images: latestImages });
          return true;
        }
        return false;
      } catch (error: any) {
        // Retry once on rate limit
        if (error?.data?.code === "RATE_LIMITED" && retryCount < 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return generateOne(index, retryCount + 1);
        }
        console.error(`Failed to generate image ${index}:`, error);
        return false;
      } finally {
        setGeneratingIndices((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    };

    // Process in batches of BATCH_SIZE to stay within rate limits
    for (let i = 0; i < indicesToGenerate.length; i += BATCH_SIZE) {
      const batch = indicesToGenerate.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map((idx) => generateOne(idx)));

      results.forEach((result, batchIdx) => {
        const imageIndex = batch[batchIdx];
        if (result.status === "fulfilled" && result.value) {
          successCount++;
        } else {
          failCount++;
          setFailedIndices((prev) => new Set([...prev, imageIndex]));
        }
      });

      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < indicesToGenerate.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setGeneratingIndices(new Set());
    setGeneratingAll(false);
    setGenerating(false);

    // Summary toast
    if (failCount > 0) {
      toast({
        title: "Image generation partially complete",
        description: `Generated ${successCount}/${successCount + failCount} images. ${failCount} failed — click Retry on failed images.`,
        variant: "destructive",
      });
    } else if (successCount > 0) {
      toast({
        title: "All images generated",
        description: `Successfully generated ${successCount} images.`,
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = imagesRef.current.filter((_, i) => i !== index);
    updateImages(updatedImages);
    updateData("images", { images: updatedImages });
  };

  const handleOpenEditDialog = (index: number) => {
    const image = imagesRef.current[index];
    if (!image?.url) return;
    setEditingIndex(index);
    setEditPrompt("");
    setEditedPreviewUrl(null);
    setEditResult(null);
    setEditDialogOpen(true);
  };

  const handleEditImage = async () => {
    if (editingIndex === null || !editPrompt.trim()) return;
    const image = imagesRef.current[editingIndex];
    if (!image?.url) return;

    setIsEditing(true);
    setEditedPreviewUrl(null);
    setEditResult(null);

    try {
      const result = await editSocialImage({
        imageUrl: image.url,
        prompt: editPrompt,
        aspectRatio,
      });

      if (result.success && result.storageId && result.imageUrl) {
        setEditedPreviewUrl(result.imageUrl);
        setEditResult({ storageId: result.storageId, url: result.imageUrl });
      }
    } catch (error) {
      console.error("Failed to edit image:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveEditedImage = () => {
    if (editingIndex === null || !editResult) return;

    const latestImages = [...imagesRef.current];
    latestImages[editingIndex] = {
      ...latestImages[editingIndex],
      storageId: editResult.storageId as any,
      url: editResult.url,
      prompt: `${latestImages[editingIndex].prompt} [Edited: ${editPrompt}]`,
    };
    updateImages(latestImages);
    updateData("images", { images: latestImages });

    setEditDialogOpen(false);
    setEditingIndex(null);
    setEditPrompt("");
    setEditedPreviewUrl(null);
    setEditResult(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingIndex(null);
    setEditPrompt("");
    setEditedPreviewUrl(null);
    setEditResult(null);
  };

  const handleContinue = async () => {
    updateData("images", { images, imageAspectRatio: aspectRatio });
    await savePost();
    goToStep("audio");
  };

  const generatedCount = images.filter((img) => img.url).length;

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-bold text-foreground sm:mb-2 sm:text-2xl">
          Generate Carousel Images
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Create Excalidraw-style images for your social media carousel.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Aspect Ratio</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose the format for your images
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => setAspectRatio("9:16")}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-lg border-2 p-3 transition-colors sm:gap-3 sm:p-4",
                aspectRatio === "9:16"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-8 w-5 flex-shrink-0 rounded border-2 border-current sm:h-10 sm:w-6" />
              <span className="text-xs font-medium sm:text-sm">9:16 (Portrait)</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio("16:9")}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-lg border-2 p-3 transition-colors sm:gap-3 sm:p-4",
                aspectRatio === "16:9"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-5 w-8 flex-shrink-0 rounded border-2 border-current sm:h-6 sm:w-10" />
              <span className="text-xs font-medium sm:text-sm">16:9 (Landscape)</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                <Image className="h-4 w-4 sm:h-5 sm:w-5" />
                Image Prompts
                {images.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {generatedCount}/{images.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                AI-generated prompts based on your script
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePrompts}
                disabled={isGenerating || !state.data.combinedScript}
                className="gap-2 text-xs sm:text-sm"
              >
                {isGenerating && generatingIndices.size === 0 ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {images.length > 0 ? "Regenerate" : "Generate Prompts"}
                  </>
                )}
              </Button>
              {images.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateAllImages}
                  disabled={isGenerating || generatingAll || generatedCount === images.length}
                  className="gap-2 text-xs sm:text-sm"
                >
                  {generatingAll ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Generate All
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {images.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground sm:py-12">
              {promptError ? (
                <>
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive opacity-70 sm:mb-4 sm:h-12 sm:w-12" />
                  <p className="mb-3 text-sm text-destructive sm:text-base">{promptError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePrompts}
                    disabled={isGenerating || !state.data.combinedScript}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                </>
              ) : (
                <>
                  <Image className="mx-auto mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
                  <p className="text-sm sm:text-base">Click "Generate Prompts" to create image ideas</p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                {images.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div
                      className={`relative bg-muted ${aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"}`}
                    >
                      {image.url ? (
                        <NextImage
                          src={image.url}
                          alt={`Generated image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {generatingIndices.has(index) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                      {failedIndices.has(index) && !generatingIndices.has(index) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
                          <AlertCircle className="h-8 w-8 text-red-400" />
                          <p className="text-xs font-medium text-red-300">Generation failed</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleGenerateImage(index)}
                            className="gap-1 text-xs"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                          </Button>
                        </div>
                      )}
                      {uploadingIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      {/* Sentence display */}
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-sm font-medium text-foreground">{image.sentence}</p>
                      </div>

                      {/* Source image preview (if uploaded) */}
                      {image.sourceImageUrl && (
                        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2">
                          <NextImage
                            src={image.sourceImageUrl}
                            alt="Source"
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-primary">
                              Source image uploaded
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Will transform with style
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveSourceImage(index)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Prompt section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Prompt
                            </span>
                            {image.isPromptEdited && (
                              <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                                Edited
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditingPromptIndex(editingPromptIndex === index ? null : index)
                              }
                              className="h-6 px-2 text-xs"
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              {editingPromptIndex === index ? "Close" : "Edit"}
                            </Button>
                            {image.isPromptEdited && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResetPrompt(index)}
                                className="h-6 px-2 text-xs"
                                title="Reset to original"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {editingPromptIndex === index ? (
                          <Textarea
                            value={image.prompt}
                            onChange={(e) => handlePromptChange(index, e.target.value)}
                            rows={4}
                            className="text-xs"
                            placeholder="Edit the image prompt..."
                          />
                        ) : (
                          <p className="line-clamp-2 text-xs text-muted-foreground/70">
                            {image.prompt}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={image.url ? "outline" : "default"}
                          onClick={() => handleGenerateImage(index)}
                          disabled={generatingIndices.has(index) || generatingAll}
                          className="flex-1 gap-1"
                        >
                          {image.url ? (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              {image.sourceImageUrl ? "Re-transform" : "Regenerate"}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              {image.sourceImageUrl ? "Transform" : "Generate"}
                            </>
                          )}
                        </Button>

                        {/* Upload source image button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUploadClick(index)}
                          disabled={uploadingIndex !== null}
                          title="Upload source image"
                        >
                          <ImagePlus className="h-4 w-4" />
                        </Button>
                        <input
                          ref={(el) => {
                            fileInputRefs.current[index] = el;
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(index, e)}
                          className="hidden"
                        />

                        {image.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditDialog(index)}
                            title="Edit generated image"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveImage(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep("combine")}
          className="order-2 gap-2 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={state.isSaving}
          className="order-1 gap-2 sm:order-2"
          size="lg"
        >
          {state.isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Audio
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto bg-white dark:bg-black sm:w-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Image</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Describe the changes you want to make to this image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {editingIndex !== null && imagesRef.current[editingIndex] && (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium sm:mb-2 sm:text-sm">Original</p>
                  <div
                    className={`relative overflow-hidden rounded-lg border ${aspectRatio === "9:16" ? "aspect-[9/16] max-h-[200px] sm:max-h-none" : "aspect-video"}`}
                  >
                    <NextImage
                      src={imagesRef.current[editingIndex]?.url ?? ""}
                      alt="Original"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium sm:mb-2 sm:text-sm">
                    {editedPreviewUrl ? "Edited Result" : "Preview"}
                  </p>
                  <div
                    className={`relative flex items-center justify-center overflow-hidden rounded-lg border bg-muted ${aspectRatio === "9:16" ? "aspect-[9/16] max-h-[200px] sm:max-h-none" : "aspect-video"}`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground sm:h-8 sm:w-8" />
                        <p className="text-xs text-muted-foreground sm:text-sm">Editing...</p>
                      </div>
                    ) : editedPreviewUrl ? (
                      <NextImage
                        src={editedPreviewUrl}
                        alt="Edited"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <p className="p-4 text-center text-xs text-muted-foreground sm:text-sm">
                        Enter a prompt and click Edit
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="edit-prompt" className="text-xs font-medium sm:text-sm">
                Edit Prompt
              </label>
              <Textarea
                id="edit-prompt"
                placeholder="e.g., Make the background blue, Add a sunset..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCloseEditDialog}
              size="sm"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleEditImage}
              disabled={isEditing || !editPrompt.trim()}
              className="w-full gap-2 sm:w-auto"
              size="sm"
            >
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Editing...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Edit Image
                </>
              )}
            </Button>
            {editResult && (
              <Button onClick={handleSaveEditedImage} className="w-full gap-2 sm:w-auto" size="sm">
                <Sparkles className="h-4 w-4" />
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
