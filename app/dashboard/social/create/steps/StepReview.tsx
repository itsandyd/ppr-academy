"use client";

import { useState, useRef } from "react";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  ChevronLeft,
  Loader2,
  FileText,
  Image,
  Volume2,
  Megaphone,
  Play,
  Pause,
  Download,
  ExternalLink,
} from "lucide-react";

export function StepReview() {
  const { state, goToStep, completePost, canComplete } = useSocialPost();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Images
              <Badge variant="secondary">{imageCount} generated</Badge>
            </CardTitle>
            <CardDescription>
              {state.data.imageAspectRatio || "9:16"} carousel images
            </CardDescription>
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
              <a
                href={state.data.audioUrl}
                download="narration.mp3"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
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
