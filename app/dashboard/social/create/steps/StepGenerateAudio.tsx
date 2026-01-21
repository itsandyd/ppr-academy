"use client";

import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Volume2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";

const ANDREW_1_VOICE_ID = "IXQAN2tgDlb8raWmXvzP";

export function StepGenerateAudio() {
  const { state, updateData, goToStep, savePost, setGenerating } = useSocialPost();
  const { toast } = useToast();

  const buildScriptWithCta = (script: string, cta: string) => {
    if (!cta) return script;
    if (script.trim().endsWith(cta.trim())) return script;
    return `${script}\n\n${cta}`;
  };

  const getInitialScript = () => {
    if (state.data.audioScript) return state.data.audioScript;
    return buildScriptWithCta(state.data.combinedScript || "", state.data.ctaText || "");
  };

  const [audioScript, setAudioScript] = useState(getInitialScript);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && state.data.combinedScript) {
      if (state.data.audioScript) {
        setAudioScript(state.data.audioScript);
      } else {
        const scriptWithCta = buildScriptWithCta(
          state.data.combinedScript,
          state.data.ctaText || ""
        );
        setAudioScript(scriptWithCta);
      }
      if (state.data.audioUrl) {
        setAudioUrl(state.data.audioUrl);
      }
      setInitialized(true);
    }
  }, [
    state.data.combinedScript,
    state.data.ctaText,
    state.data.audioScript,
    state.data.audioUrl,
    initialized,
  ]);
  const [audioUrl, setAudioUrl] = useState(state.data.audioUrl || "");
  const [isGenerating, setIsGeneratingLocal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isGeneratingRef = useRef(false);

  // @ts-ignore - Convex type inference depth issue
  const generateAudio = useAction(api.masterAI.socialMediaGenerator.generateSocialAudio);

  const handleGenerateAudio = async () => {
    if (!audioScript || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsGeneratingLocal(true);
    setGenerating(true);
    setError(null);

    try {
      const result = await generateAudio({
        script: audioScript,
        voiceId: ANDREW_1_VOICE_ID,
      });

      if (result.success && result.storageId && result.audioUrl) {
        setAudioUrl(result.audioUrl);
        updateData("audio", {
          audioStorageId: result.storageId,
          audioUrl: result.audioUrl,
          audioVoiceId: ANDREW_1_VOICE_ID,
          audioDuration: result.duration,
          audioScript,
        });
        toast({
          title: "Audio Generated",
          description: "Your voiceover has been created successfully.",
        });
      } else if (result.error) {
        setError(result.error);
        toast({
          title: "Audio Generation Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Audio Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingLocal(false);
      setGenerating(false);
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

  const handleContinue = async () => {
    updateData("audio", { audioScript });
    await savePost();
    goToStep("review");
  };

  const wordCount = audioScript.split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.ceil(wordCount / 150);

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-bold text-foreground sm:mb-2 sm:text-2xl">
          Generate Audio Narration
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Create voiceover using ElevenLabs TTS with the Andrew 1 voice.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Audio Script
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Edit the script that will be converted to speech.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
          <Textarea
            value={audioScript}
            onChange={(e) => setAudioScript(e.target.value)}
            placeholder="Enter or edit the script for audio narration..."
            className="min-h-[200px] font-mono text-sm sm:min-h-[300px]"
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge variant="secondary" className="text-xs">
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="text-xs">
              ~{estimatedDuration} min
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Voice Preview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Using ElevenLabs "Andrew 1" voice
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateAudio}
              disabled={isGenerating || !audioScript}
              className="w-full gap-2 sm:w-auto"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : audioUrl ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Audio
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Audio
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isGenerating ? (
            <div className="py-8 text-center sm:py-12">
              <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary sm:mb-4 sm:h-12 sm:w-12" />
              <p className="text-sm font-medium sm:text-base">Generating Audio...</p>
              <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
                This may take 30-60 seconds
              </p>
            </div>
          ) : audioUrl ? (
            <div className="space-y-3 sm:space-y-4">
              <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3 sm:gap-4 sm:p-4">
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
                  <p className="text-sm font-medium sm:text-base">Audio Generated</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {state.data.audioDuration
                      ? `${Math.floor(state.data.audioDuration / 60)}:${String(Math.floor(state.data.audioDuration % 60)).padStart(2, "0")}`
                      : `~${estimatedDuration} min`}
                  </p>
                </div>
                <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
                  Andrew 1
                </Badge>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground sm:py-12">
              <Volume2 className="mx-auto mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
              <p className="text-sm sm:text-base">Click "Generate Audio" to create voiceover</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep("images")}
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
              Continue to Review
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
