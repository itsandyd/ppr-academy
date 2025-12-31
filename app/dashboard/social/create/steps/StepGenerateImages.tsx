"use client";

import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSocialPost, ImageData } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

export function StepGenerateImages() {
  const { state, updateData, goToStep, savePost, setGenerating } = useSocialPost();

  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">(
    state.data.imageAspectRatio || "9:16"
  );
  const [images, setImages] = useState<ImageData[]>(state.data.images || []);
  const [isGenerating, setIsGeneratingLocal] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const imagesRef = useRef<ImageData[]>(images);

  // @ts-ignore - Convex type inference depth issue
  const generateImagePrompts = useAction(api.masterAI.socialMediaGenerator.generateImagePrompts);
  // @ts-ignore - Convex type inference depth issue
  const generateSocialImage = useAction(api.masterAI.socialMediaGenerator.generateSocialImage);

  const updateImages = (newImages: ImageData[]) => {
    imagesRef.current = newImages;
    setImages(newImages);
  };

  const handleGeneratePrompts = async () => {
    if (!state.data.combinedScript) return;

    setIsGeneratingLocal(true);
    setGenerating(true);

    try {
      const result = await generateImagePrompts({
        script: state.data.combinedScript || "",
        aspectRatio,
      });

      if (result && result.length > 0) {
        const newImages: ImageData[] = result.map((p: { prompt: string; sentence: string }) => ({
          storageId: "" as any,
          url: "",
          aspectRatio,
          prompt: p.prompt,
          sentence: p.sentence,
        }));
        updateImages(newImages);
      }
    } catch (error) {
      console.error("Failed to generate image prompts:", error);
    } finally {
      setIsGeneratingLocal(false);
      setGenerating(false);
    }
  };

  const handleGenerateImage = async (index: number, batchMode = false) => {
    const currentImages = imagesRef.current;
    const image = currentImages[index];
    if (!image?.prompt) return;

    if (!batchMode) {
      setGeneratingIndex(index);
      setGenerating(true);
    }

    try {
      const result = await generateSocialImage({
        prompt: image.prompt,
        aspectRatio,
      });

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
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      if (!batchMode) {
        setGeneratingIndex(null);
        setGenerating(false);
      }
    }
  };

  const [generatingIndices, setGeneratingIndices] = useState<Set<number>>(new Set());

  const handleGenerateAllImages = async () => {
    setGeneratingAll(true);
    setGenerating(true);

    const currentImages = imagesRef.current;
    const indicesToGenerate = currentImages
      .map((img, idx) => (!img.url ? idx : -1))
      .filter((idx) => idx !== -1);

    setGeneratingIndices(new Set(indicesToGenerate));

    const generateOne = async (index: number) => {
      const image = imagesRef.current[index];
      if (!image?.prompt) return;

      try {
        const result = await generateSocialImage({
          prompt: image.prompt,
          aspectRatio,
        });

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
        }
      } catch (error) {
        console.error(`Failed to generate image ${index}:`, error);
      } finally {
        setGeneratingIndices((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    };

    await Promise.all(indicesToGenerate.map(generateOne));

    setGeneratingIndices(new Set());
    setGeneratingAll(false);
    setGenerating(false);
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = imagesRef.current.filter((_, i) => i !== index);
    updateImages(updatedImages);
    updateData("images", { images: updatedImages });
  };

  const handleContinue = async () => {
    updateData("images", { images, imageAspectRatio: aspectRatio });
    await savePost();
    goToStep("audio");
  };

  const generatedCount = images.filter((img) => img.url).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Generate Carousel Images</h2>
        <p className="text-muted-foreground">
          Create Excalidraw-style images for your social media carousel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aspect Ratio</CardTitle>
          <CardDescription>Choose the format for your images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAspectRatio("9:16")}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                aspectRatio === "9:16"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-10 w-6 rounded border-2 border-current" />
              <span className="text-sm font-medium">9:16 (Portrait - TikTok, Reels)</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio("16:9")}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                aspectRatio === "16:9"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-6 w-10 rounded border-2 border-current" />
              <span className="text-sm font-medium">16:9 (Landscape - YouTube)</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Prompts
                {images.length > 0 && (
                  <Badge variant="secondary">
                    {generatedCount}/{images.length} generated
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>AI-generated prompts based on your script content</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGeneratePrompts}
                disabled={isGenerating || !state.data.combinedScript}
                className="gap-2"
              >
                {isGenerating && generatingIndex === null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {images.length > 0 ? "Regenerate Prompts" : "Generate Prompts"}
                  </>
                )}
              </Button>
              {images.length > 0 && (
                <Button
                  onClick={handleGenerateAllImages}
                  disabled={isGenerating || generatingAll || generatedCount === images.length}
                  className="gap-2"
                >
                  {generatingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating{" "}
                      {generatingIndices.size > 0
                        ? `${generatingIndices.size} in parallel...`
                        : "..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate All Images
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Image className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Click "Generate Prompts" to create image ideas from your script</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="grid gap-4 md:grid-cols-2">
                {images.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div
                      className={`relative bg-muted ${aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"}`}
                    >
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`Generated image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {(generatingIndex === index || generatingIndices.has(index)) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-sm font-medium text-foreground">{image.sentence}</p>
                      </div>
                      <details className="text-xs text-muted-foreground/70">
                        <summary className="cursor-pointer hover:text-muted-foreground">
                          Show prompt
                        </summary>
                        <p className="mt-1">{image.prompt}</p>
                      </details>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={image.url ? "outline" : "default"}
                          onClick={() => handleGenerateImage(index)}
                          disabled={generatingIndex !== null}
                          className="flex-1 gap-1"
                        >
                          {image.url ? (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Regenerate
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              Generate
                            </>
                          )}
                        </Button>
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep("combine")} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={state.isSaving} className="gap-2" size="lg">
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
    </div>
  );
}
