"use client";

import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  ChevronLeft,
  Loader2,
  FileText,
  Image,
  Volume2,
  Play,
  Pause,
  Download,
  Copy,
  Sparkles,
  Instagram,
  Hash,
} from "lucide-react";

export function StepReview() {
  const { state, goToStep, completePost, canComplete, updateData, savePost } = useSocialPost();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [instagramCaption, setInstagramCaption] = useState(state.data.instagramCaption || "");
  const [tiktokCaption, setTiktokCaption] = useState(state.data.tiktokCaption || "");
  const audioRef = useRef<HTMLAudioElement>(null);

  // @ts-ignore - Convex type inference depth issue
  const generateCaptions = useAction(api.masterAI.socialMediaGenerator.generateCaptions);

  const handleGenerateCaptions = async () => {
    if (!state.data.combinedScript) return;

    setIsGeneratingCaptions(true);
    try {
      const result = await generateCaptions({
        script: state.data.combinedScript,
        title: state.data.title,
        ctaText: state.data.ctaText,
      });

      setInstagramCaption(result.instagramCaption);
      setTiktokCaption(result.tiktokCaption);
      updateData("captions", {
        instagramCaption: result.instagramCaption,
        tiktokCaption: result.tiktokCaption,
      });
      toast({
        title: "Captions Generated",
        description: "Instagram and TikTok captions are ready!",
      });
    } catch (error) {
      console.error("Failed to generate captions:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate captions.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleCopyCaption = async (caption: string, platform: string) => {
    await navigator.clipboard.writeText(caption);
    toast({ title: "Copied!", description: `${platform} caption copied to clipboard.` });
  };

  const handleSaveCaptions = () => {
    updateData("captions", { instagramCaption, tiktokCaption });
    savePost();
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    const result = await completePost();
    if (!result.success) {
      setIsCompleting(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const imageCount = state.data.images?.filter((img) => img.url).length || 0;
  const hasAudio = !!state.data.audioUrl;

  const sanitizeFilename = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
  };

  const handleDownloadAllImages = async () => {
    const images = state.data.images?.filter((img) => img.url) || [];
    if (images.length === 0) return;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filename = image.sentence
          ? `${String(i + 1).padStart(2, "0")}-${sanitizeFilename(image.sentence)}.png`
          : `carousel-${i + 1}.png`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.error(`Failed to download image ${i + 1}:`, error);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-bold text-foreground sm:mb-2 sm:text-2xl">
          Review Your Post
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review all generated content before finalizing your social media post.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Combined Script
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your final unified script
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ScrollArea className="h-[150px] sm:h-[200px]">
              <p className="whitespace-pre-wrap text-xs sm:text-sm">
                {state.data.combinedScript || "No script generated"}
              </p>
            </ScrollArea>
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
              <Badge variant="secondary" className="text-xs">
                {state.data.combinedScript?.length || 0} chars
              </Badge>
              {state.data.ctaKeyword && (
                <Badge variant="outline" className="text-xs">
                  CTA: {state.data.ctaKeyword}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                  <Image className="h-4 w-4 sm:h-5 sm:w-5" />
                  Images
                  <Badge variant="secondary" className="text-xs">
                    {imageCount}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {state.data.imageAspectRatio || "9:16"} carousel
                </CardDescription>
              </div>
              {imageCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllImages}
                  className="w-full gap-2 text-xs sm:w-auto sm:text-sm"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Download All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {imageCount > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {state.data.images
                  ?.filter((img) => img.url)
                  .slice(0, 6)
                  .map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-md bg-muted sm:rounded-lg"
                    >
                      <img
                        src={image.url}
                        alt={`Image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground sm:py-8">
                <Image className="mx-auto mb-2 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
                <p className="text-xs sm:text-sm">No images generated (optional)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Audio Narration
            {hasAudio && (
              <Badge variant="secondary" className="text-xs">
                Ready
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">ElevenLabs TTS voiceover</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {hasAudio ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3 sm:gap-4 sm:p-4">
              <audio
                ref={audioRef}
                src={state.data.audioUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={togglePlayback}
                className="h-10 w-10 flex-shrink-0 rounded-full sm:h-12 sm:w-12"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium sm:text-base">Audio Ready</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {state.data.audioDuration
                    ? `${Math.floor(state.data.audioDuration / 60)}:${String(Math.floor(state.data.audioDuration % 60)).padStart(2, "0")}`
                    : "Duration unknown"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
              >
                <a href={state.data.audioUrl} download="narration.mp3">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="xs:inline hidden">Download</span>
                </a>
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground sm:py-8">
              <Volume2 className="mx-auto mb-2 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
              <p className="text-xs sm:text-sm">No audio generated (optional)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                <Hash className="h-4 w-4 sm:h-5 sm:w-5" />
                Captions
                {(instagramCaption || tiktokCaption) && (
                  <Badge variant="secondary" className="text-xs">
                    Ready
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Platform-specific captions
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateCaptions}
              disabled={isGeneratingCaptions || !state.data.combinedScript}
              className="w-full gap-2 sm:w-auto"
              size="sm"
            >
              {isGeneratingCaptions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {instagramCaption || tiktokCaption ? "Regenerate" : "Generate"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {instagramCaption || tiktokCaption ? (
            <Tabs defaultValue="instagram" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instagram" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
                  <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Instagram
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  TikTok
                </TabsTrigger>
              </TabsList>
              <TabsContent value="instagram" className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                <Textarea
                  value={instagramCaption}
                  onChange={(e) => setInstagramCaption(e.target.value)}
                  className="min-h-[150px] font-mono text-xs sm:min-h-[200px] sm:text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCaption(instagramCaption, "Instagram")}
                    className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCaptions}
                    className="text-xs sm:text-sm"
                  >
                    Save
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="tiktok" className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                <Textarea
                  value={tiktokCaption}
                  onChange={(e) => setTiktokCaption(e.target.value)}
                  className="min-h-[120px] font-mono text-xs sm:min-h-[150px] sm:text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCaption(tiktokCaption, "TikTok")}
                    className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCaptions}
                    className="text-xs sm:text-sm"
                  >
                    Save
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-6 text-center text-muted-foreground sm:py-8">
              <Hash className="mx-auto mb-2 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
              <p className="text-xs sm:text-sm">
                Click "Generate" to create platform-specific captions with hashtags
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Completion Checklist</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${state.stepCompletion.content ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs sm:text-sm ${state.stepCompletion.content ? "" : "text-muted-foreground"}`}
              >
                Source content selected
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${state.stepCompletion.scripts ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs sm:text-sm ${state.stepCompletion.scripts ? "" : "text-muted-foreground"}`}
              >
                Platform scripts generated
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${state.stepCompletion.combine ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs sm:text-sm ${state.stepCompletion.combine ? "" : "text-muted-foreground"}`}
              >
                Scripts combined with CTA
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${imageCount > 0 ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs sm:text-sm ${imageCount > 0 ? "" : "text-muted-foreground"}`}
              >
                Carousel images (optional)
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${hasAudio ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={`text-xs sm:text-sm ${hasAudio ? "" : "text-muted-foreground"}`}>
                Audio narration (optional)
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle
                className={`h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 ${instagramCaption || tiktokCaption ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span
                className={`text-xs sm:text-sm ${instagramCaption || tiktokCaption ? "" : "text-muted-foreground"}`}
              >
                Captions with hashtags (optional)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep("audio")}
          className="order-2 gap-2 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete() || isCompleting}
          className="order-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 sm:order-2"
          size="lg"
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Complete Post
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
