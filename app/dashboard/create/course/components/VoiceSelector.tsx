"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Volume2, 
  Play, 
  Pause, 
  Loader2, 
  User, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  preview_url?: string;
  labels: Record<string, string>;
  samples: number;
}

interface VoiceSelectorProps {
  selectedVoiceId?: string;
  onVoiceSelect: (voiceId: string, voiceName: string) => void;
  className?: string;
}

export function VoiceSelector({ selectedVoiceId, onVoiceSelect, className }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/elevenlabs/voices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voices');
      }

      setVoices(data.voices || []);
      setIsDemo(data.isDemo || false);
      
      if (data.isDemo) {
        toast.info("Demo mode: Add ElevenLabs API key to see your actual voices", {
          duration: 4000,
        });
      }

    } catch (error) {
      console.error('Error fetching voices:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const testVoice = async (voiceId: string, voiceName: string) => {
    try {
      setTestingVoice(voiceId);
      
      // Stop any currently playing audio
      if (playingAudio) {
        playingAudio.pause();
        setPlayingAudio(null);
      }

      const response = await fetch('/api/elevenlabs/voices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_id: voiceId,
          text: `Hello! I'm ${voiceName}. This is how I sound when generating audio for your course content.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test voice');
      }

      if (data.isDemo) {
        toast.info(`Demo: Would test voice "${voiceName}" with real audio`);
        return;
      }

      // Play the generated audio
      const audio = new Audio(data.audioData);
      setPlayingAudio(audio);
      
      audio.onended = () => {
        setPlayingAudio(null);
      };
      
      audio.onerror = () => {
        toast.error('Failed to play audio sample');
        setPlayingAudio(null);
      };

      await audio.play();
      toast.success(`Playing voice sample: ${voiceName}`);

    } catch (error) {
      console.error('Error testing voice:', error);
      toast.error(`Failed to test voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingVoice(null);
    }
  };

  const stopAudio = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
  };

  useEffect(() => {
    fetchVoices();
    
    // Cleanup audio on unmount
    return () => {
      if (playingAudio) {
        playingAudio.pause();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading voices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Volume2 className="w-4 h-4" />
          <span className="font-medium">Error Loading Voices</span>
        </div>
        <p className="text-red-700 text-sm mb-3">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchVoices}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium">Choose Voice</h3>
          {isDemo && (
            <Badge variant="secondary" className="text-xs">
              Demo Mode
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchVoices}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {voices.map((voice) => (
            <Card
              key={voice.voice_id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedVoiceId === voice.voice_id
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-accent'
              }`}
              onClick={() => onVoiceSelect(voice.voice_id, voice.name)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{voice.name}</span>
                      {voice.category && (
                        <Badge variant="outline" className="text-xs">
                          {voice.category}
                        </Badge>
                      )}
                      {voice.labels?.accent && (
                        <Badge variant="secondary" className="text-xs">
                          {voice.labels.accent}
                        </Badge>
                      )}
                    </div>
                    {voice.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {voice.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      <span>{voice.samples} samples</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (playingAudio && testingVoice === voice.voice_id) {
                          stopAudio();
                        } else {
                          testVoice(voice.voice_id, voice.name);
                        }
                      }}
                      disabled={testingVoice === voice.voice_id}
                      className="w-8 h-8 p-0"
                    >
                      {testingVoice === voice.voice_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : playingAudio && testingVoice === voice.voice_id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {voices.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No voices available</p>
          {isDemo && (
            <p className="text-xs mt-1">Add ElevenLabs API key to see your voices</p>
          )}
        </div>
      )}
    </div>
  );
}
