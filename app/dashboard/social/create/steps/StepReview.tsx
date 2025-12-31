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
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Review Your Post</h2>
        <p className="text-muted-foreground">
          Review all generated content before finalizing your social media post.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Combined Script
            </CardTitle>
            <CardDescription>Your final unified script</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <p className="whitespace-pre-wrap text-sm">
                {state.data.combinedScript || "No script generated"}
              </p>
            </ScrollArea>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">{state.data.combinedScript?.length || 0} characters</Badge>
              {state.data.ctaKeyword && (
                <Badge variant="outline">CTA: {state.data.ctaKeyword}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Images
                  <Badge variant="secondary">{imageCount} generated</Badge>
                </CardTitle>
                <CardDescription>
                  {state.data.imageAspectRatio || "9:16"} carousel images
                </CardDescription>
              </div>
              {imageCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllImages}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {imageCount > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {state.data.images
                  ?.filter((img) => img.url)
                  .slice(0, 6)
                  .map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={image.url}
                        alt={`Image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Image className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No images generated (optional)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Narration
            {hasAudio && <Badge variant="secondary">Ready</Badge>}
          </CardTitle>
          <CardDescription>ElevenLabs TTS voiceover</CardDescription>
        </CardHeader>
        <CardContent>
          {hasAudio ? (
            <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
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
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </Button>
              <div className="flex-1">
                <p className="font-medium">Audio Ready</p>
                <p className="text-sm text-muted-foreground">
                  {state.data.audioDuration
                    ? `${Math.floor(state.data.audioDuration / 60)}:${String(Math.floor(state.data.audioDuration % 60)).padStart(2, "0")}`
                    : "Duration unknown"}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={state.data.audioUrl} download="narration.mp3">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Volume2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No audio generated (optional)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Captions with Hashtags
                {(instagramCaption || tiktokCaption) && <Badge variant="secondary">Ready</Badge>}
              </CardTitle>
              <CardDescription>Platform-specific captions for Instagram and TikTok</CardDescription>
            </div>
            <Button
              onClick={handleGenerateCaptions}
              disabled={isGeneratingCaptions || !state.data.combinedScript}
              className="gap-2"
            >
              {isGeneratingCaptions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {instagramCaption || tiktokCaption ? "Regenerate" : "Generate Captions"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {instagramCaption || tiktokCaption ? (
            <Tabs defaultValue="instagram" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instagram" className="gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  TikTok
                </TabsTrigger>
              </TabsList>
              <TabsContent value="instagram" className="space-y-3">
                <Textarea
                  value={instagramCaption}
                  onChange={(e) => setInstagramCaption(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCaption(instagramCaption, "Instagram")}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveCaptions}>
                    Save Changes
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="tiktok" className="space-y-3">
                <Textarea
                  value={tiktokCaption}
                  onChange={(e) => setTiktokCaption(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCaption(tiktokCaption, "TikTok")}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveCaptions}>
                    Save Changes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Hash className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">
                Click "Generate Captions" to create platform-specific captions with hashtags
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completion Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${state.stepCompletion.content ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={state.stepCompletion.content ? "" : "text-muted-foreground"}>
                Source content selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${state.stepCompletion.scripts ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={state.stepCompletion.scripts ? "" : "text-muted-foreground"}>
                Platform scripts generated
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${state.stepCompletion.combine ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={state.stepCompletion.combine ? "" : "text-muted-foreground"}>
                Scripts combined with CTA
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${imageCount > 0 ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={imageCount > 0 ? "" : "text-muted-foreground"}>
                Carousel images generated (optional)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${hasAudio ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={hasAudio ? "" : "text-muted-foreground"}>
                Audio narration generated (optional)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle
                className={`h-5 w-5 ${instagramCaption || tiktokCaption ? "text-green-500" : "text-muted-foreground"}`}
              />
              <span className={instagramCaption || tiktokCaption ? "" : "text-muted-foreground"}>
                Captions with hashtags (optional)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep("audio")} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete() || isCompleting}
          className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
