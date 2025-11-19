"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface GenerateAudioButtonProps {
  chapterId: Id<"courseChapters">;
  hasGeneratedAudio: boolean;
  hasContent: boolean;
  className?: string;
}

export function GenerateAudioButton({ 
  chapterId, 
  hasGeneratedAudio, 
  hasContent,
  className 
}: GenerateAudioButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const startAudioGeneration = useMutation(api.audioGeneration.startAudioGeneration);

  const handleGenerateAudio = async () => {
    if (!hasContent) {
      toast.error("This chapter has no content to generate audio from");
      return;
    }

    try {
      setIsGenerating(true);
      toast.info("Starting audio generation...");

      await startAudioGeneration({
        chapterId,
      });

      toast.success("Audio generation started! This may take a few minutes.", {
        duration: 5000,
      });

      // Poll for completion (optional - the UI will update automatically via Convex reactivity)
      setTimeout(() => {
        toast.info("Audio generation is still in progress...", {
          duration: 3000,
        });
      }, 30000);

    } catch (error) {
      console.error("Failed to start audio generation:", error);
      toast.error("Failed to start audio generation");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasContent) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled 
        className={className}
      >
        <Volume2 className="w-4 h-4 mr-2" />
        No Content
      </Button>
    );
  }

  if (hasGeneratedAudio) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleGenerateAudio}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Volume2 className="w-4 h-4 mr-2" />
        )}
        {isGenerating ? "Regenerating..." : "Regenerate Audio"}
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleGenerateAudio}
      disabled={isGenerating}
      className={`${className} border-blue-200 text-blue-600 hover:bg-blue-50`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Volume2 className="w-4 h-4 mr-2" />
      )}
      {isGenerating ? "Generating..." : "Generate Audio"}
    </Button>
  );
}
