"use client";

import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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

  const [audioScript, setAudioScript] = useState(
    state.data.audioScript || state.data.combinedScript || ""
  );
  const [audioUrl, setAudioUrl] = useState(state.data.audioUrl || "");
  const [isGenerating, setIsGeneratingLocal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateAudio = useAction(api.masterAI.socialMediaGenerator.generateSocialAudio);

  const handleGenerateAudio = async () => {
    if (!audioScript) return;

    setIsGeneratingLocal(true);
    setGenerating(true);

    try {
      const result = await generateAudio({
        text: audioScript,
        voiceId: ANDREW_1_VOICE_ID,
      });

      if (result.storageId && result.url) {
        setAudioUrl(result.url);
        updateData("audio", {
          audioStorageId: result.storageId,
          audioUrl: result.url,
          audioVoiceId: ANDREW_1_VOICE_ID,
          audioDuration: result.duration,
          audioScript,
        });
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
    } finally {
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
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Generate Audio Narration</h2>
        <p className="text-muted-foreground">
          Create voiceover using ElevenLabs TTS with the Andrew 1 voice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Script
          </CardTitle>
          <CardDescription>
            Edit the script that will be converted to speech. This defaults to your combined script.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={audioScript}
            onChange={(e) => setAudioScript(e.target.value)}
            placeholder="Enter or edit the script for audio narration..."
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex items-center gap-4">
            <Badge variant="secondary">{wordCount} words</Badge>
            <Badge variant="outline">~{estimatedDuration} min</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Preview</CardTitle>
              <CardDescription>Using ElevenLabs "Andrew 1" voice</CardDescription>
            </div>
            <Button
              onClick={handleGenerateAudio}
              disabled={isGenerating || !audioScript}
              className="gap-2"
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
        <CardContent>
          {audioUrl ? (
            <div className="space-y-4">
              <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />
              <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={togglePlayback}
                  className="h-12 w-12 rounded-full"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </Button>
                <div className="flex-1">
                  <p className="font-medium">Audio Generated</p>
                  <p className="text-sm text-muted-foreground">
                    {state.data.audioDuration
                      ? `${Math.floor(state.data.audioDuration / 60)}:${String(Math.floor(state.data.audioDuration % 60)).padStart(2, "0")}`
                      : `~${estimatedDuration} min`}
                  </p>
                </div>
                <Badge variant="secondary">Andrew 1</Badge>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Volume2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Click "Generate Audio" to create voiceover</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep("images")} className="gap-2">
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
              Continue to Review
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
