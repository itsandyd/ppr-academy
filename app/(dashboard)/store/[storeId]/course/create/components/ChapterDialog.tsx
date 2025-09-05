"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { VoiceSelector } from "./VoiceSelector";
import { Plus, FileText, Save, X, Video, Volume2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { cleanTextForSpeech, previewCleanedText } from "@/lib/text-utils";

interface Chapter {
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  orderIndex: number;
  generatedAudioData?: string; // Add this to pass generated audio data
}

interface ChapterDialogProps {
  moduleTitle: string;
  lessonTitle: string;
  onChapterAdd: (chapter: Chapter) => void;
  onChapterEdit?: (chapter: Chapter) => void;
  existingChapters: Chapter[];
  editData?: Chapter;
  trigger?: React.ReactNode;
}

export function ChapterDialog({ 
  moduleTitle, 
  lessonTitle, 
  onChapterAdd, 
  onChapterEdit,
  existingChapters,
  editData,
  trigger 
}: ChapterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chapterData, setChapterData] = useState({
    title: editData?.title || "",
    content: editData?.content || "",
    videoUrl: editData?.videoUrl || "",
    duration: editData?.duration || 0,
  });

  // Load existing generated audio data when editing
  useEffect(() => {
    if (editData?.generatedAudioData) {
      setGeneratedAudioData(editData.generatedAudioData);
      setShowAudioPreview(true);
      // Set some basic metadata for existing audio
      setAudioMetadata({
        isSimulated: false,
        wordCount: 0,
        estimatedDuration: 0,
        audioSize: 0,
      });
    }
  }, [editData]);

  const isEditing = !!editData;
  const { user } = useUser();
  
  // Audio generation state
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState("pNInz6obpgDQGcFmaJgB"); // Default to Adam
  const [selectedVoiceName, setSelectedVoiceName] = useState("Adam");
  const [generatedAudioData, setGeneratedAudioData] = useState<string | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<any>(null);
  
  // Convex mutations for audio generation
  const startAudioGeneration = useMutation(api.audioGeneration.startAudioGeneration);
  const startVideoGeneration = useMutation(api.audioGeneration.startVideoGeneration);
  const saveGeneratedAudio = useMutation(api.audioGeneration.saveGeneratedAudioToChapter);

  const handleSave = () => {
    if (!chapterData.title.trim()) {
      alert("Chapter title is required");
      return;
    }

    const chapterToSave = {
      title: chapterData.title.trim(),
      content: chapterData.content.trim(),
      videoUrl: chapterData.videoUrl.trim(),
      duration: chapterData.duration || 0,
      orderIndex: isEditing ? editData!.orderIndex : existingChapters.length + 1,
      generatedAudioData: generatedAudioData || undefined, // Include generated audio data
    };

    if (isEditing && onChapterEdit) {
      onChapterEdit(chapterToSave);
    } else {
      onChapterAdd(chapterToSave);
    }
    
    // Reset form and close dialog
    if (!isEditing) {
      setChapterData({ title: "", content: "", videoUrl: "", duration: 0 });
    }
    // Clear generated audio
    setGeneratedAudioData(null);
    setAudioMetadata(null);
    setShowAudioPreview(false);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (isEditing && editData) {
      setChapterData({ 
        title: editData.title, 
        content: editData.content, 
        videoUrl: editData.videoUrl, 
        duration: editData.duration 
      });
    } else {
      setChapterData({ title: "", content: "", videoUrl: "", duration: 0 });
    }
    // Clear generated audio
    setGeneratedAudioData(null);
    setAudioMetadata(null);
    setShowAudioPreview(false);
    setIsOpen(false);
  };

  // Handle audio generation
  const handleGenerateAudio = async () => {
    if (!user || !chapterData.content.trim()) {
      toast.error("Chapter content is required for audio generation");
      return;
    }

    try {
      setIsGeneratingAudio(true);
      
      // Preview the cleaned text first
      const preview = previewCleanedText(chapterData.content);
      
      if (!preview.validation.isValid) {
        toast.error(`Cannot generate audio: ${preview.validation.errors.join(', ')}`);
        setIsGeneratingAudio(false);
        return;
      }

      // Call the actual audio generation API
      toast.success(`Audio generation started! Estimated duration: ${preview.estimatedDuration} minutes`);
      
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: chapterData.content,
          chapterId: editData ? `existing-${Date.now()}` : 'temp-chapter-id', // Temporary ID for new chapters
          voice: selectedVoiceName,
          voiceId: selectedVoiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Parse the JSON response
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Audio generation failed');
      }
      
      // Store the generated audio data
      setGeneratedAudioData(result.audioData);
      setAudioMetadata(result.metadata);
      setShowAudioPreview(true);
      
      if (result.metadata.isSimulated) {
        toast.success(`Demo: Audio generation simulated with ${selectedVoiceName} voice! ${result.message}`, {
          duration: 5000,
        });
      } else {
        if (editData) {
          toast.success(`Audio generated successfully with ${selectedVoiceName} voice! Generated ${result.metadata.audioSize} bytes of audio data.`);
        } else {
          toast.success(`Audio generated successfully with ${selectedVoiceName} voice! Audio will be available in the course player after you publish the course.`, {
            duration: 6000,
          });
        }
      }
      
    } catch (error) {
      console.error("Audio generation error:", error);
      toast.error("Failed to generate audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Handle video generation
  const handleGenerateVideo = async () => {
    if (!user || !chapterData.content.trim()) {
      toast.error("Chapter content and audio are required for video generation");
      return;
    }

    try {
      setIsGeneratingVideo(true);
      
      // First, we need to generate audio if it doesn't exist
      // For now, we'll simulate having an audio URL
      const simulatedAudioUrl = "https://placeholder-audio.com/chapter-audio.mp3";
      
      toast.success("Video generation started! This may take a few minutes...");

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: chapterData.content,
          audioUrl: simulatedAudioUrl,
          title: chapterData.title,
          chapterId: 'temp-id', // In real scenario, this would be the actual chapter ID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      toast.success(`Video generated successfully! Duration: ${result.duration}s`);
      console.log('Video generation result:', result);
      
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error("Failed to generate video");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Get text preview for audio generation
  const getTextPreview = () => {
    if (!chapterData.content.trim()) return null;
    return previewCleanedText(chapterData.content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Chapter
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {isEditing ? `Edit Chapter in "${lessonTitle}"` : `Add Chapter to "${lessonTitle}"`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Chapter Title */}
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Chapter Title *</Label>
            <Input
              id="chapter-title"
              placeholder="e.g., Introduction to EQ3 Controls"
              value={chapterData.title}
              onChange={(e) => setChapterData(prev => ({ ...prev, title: e.target.value }))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              {isEditing ? `Editing Chapter ${editData?.orderIndex} in ${lessonTitle}` : `This will be Chapter ${existingChapters.length + 1} in ${lessonTitle}`}
            </p>
          </div>

          {/* Chapter Content */}
          <div className="space-y-2">
            <Label htmlFor="chapter-content">Chapter Content *</Label>
            <WysiwygEditor
              content={chapterData.content}
              onChange={(content) => setChapterData(prev => ({ ...prev, content }))}
              placeholder="Write your chapter content here. Use the toolbar to format text, add headings, lists, images, and more..."
              className="min-h-[300px]"
            />
            <p className="text-xs text-muted-foreground">
              Use the rich text editor to format your content with headings, bold text, lists, images, and more. Perfect for comprehensive explanations like your EQ3 content.
            </p>
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="chapter-video">Video URL (Optional)</Label>
            <Input
              id="chapter-video"
              placeholder="https://youtube.com/watch?v=..."
              value={chapterData.videoUrl}
              onChange={(e) => setChapterData(prev => ({ ...prev, videoUrl: e.target.value }))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add a video to accompany this chapter
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="chapter-duration">Estimated Duration (minutes)</Label>
            <Input
              id="chapter-duration"
              type="number"
              placeholder="15"
              value={chapterData.duration || ""}
              onChange={(e) => setChapterData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              className="h-12"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Estimated time for students to complete this chapter
            </p>
          </div>

          {/* AI Generation Section */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-800 dark:text-blue-200">AI Content Generation</h4>
            </div>

            {/* Voice Selection */}
            <VoiceSelector
              selectedVoiceId={selectedVoiceId}
              onVoiceSelect={(voiceId, voiceName) => {
                setSelectedVoiceId(voiceId);
                setSelectedVoiceName(voiceName);
              }}
              className="mb-4"
            />

            {/* Text Preview for Audio */}
            {chapterData.content.trim() && (
              <div className="space-y-3">
                {(() => {
                  const preview = getTextPreview();
                  if (!preview) return null;
                  
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clean Text Preview</span>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{preview.validation.wordCount} words</span>
                          <span>~{preview.estimatedDuration} min audio</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-h-20 overflow-y-auto">
                        {preview.cleanedText.slice(0, 200)}
                        {preview.cleanedText.length > 200 && "..."}
                      </div>
                      {!preview.validation.isValid && (
                        <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          {preview.validation.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Generation Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAudio}
                    disabled={!chapterData.content.trim() || !getTextPreview()?.validation.isValid || isGeneratingAudio}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    {isGeneratingAudio ? "Generating..." : "Generate Audio"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateVideo}
                    disabled={!chapterData.content.trim() || isGeneratingVideo}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingVideo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                    {isGeneratingVideo ? "Generating..." : "Generate Video"}
                  </Button>
                </div>

                {/* Generated Audio Preview */}
                {showAudioPreview && generatedAudioData && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h5 className="font-medium text-green-800 dark:text-green-200">Generated Audio</h5>
                    </div>
                    
                    <audio 
                      controls 
                      src={generatedAudioData}
                      className="w-full mb-3"
                      preload="metadata"
                    >
                      Your browser does not support the audio element.
                    </audio>
                    
                    <div className="flex items-start justify-between">
                      {audioMetadata && (
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <div>Voice: {selectedVoiceName}</div>
                          <div>Word Count: {audioMetadata.validation?.wordCount || 'N/A'}</div>
                          <div>Estimated Duration: {audioMetadata.estimatedDuration || 'N/A'} minutes</div>
                          {audioMetadata.audioSize && (
                            <div>Audio Size: {Math.round(audioMetadata.audioSize / 1024)} KB</div>
                          )}
                          {audioMetadata.isSimulated && (
                            <div className="text-amber-600">⚠️ Demo Mode - Simulated Audio</div>
                          )}
                        </div>
                      )}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGeneratedAudioData(null);
                          setAudioMetadata(null);
                          setShowAudioPreview(false);
                        }}
                        className="text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Generate audio narration from your chapter content using AI text-to-speech, then combine with images to create a video.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border">
                    🔧 <strong>Setup Required:</strong> Add your ElevenLabs API key to environment variables for real audio generation. Currently running in demo mode.
                  </p>
                </div>
              </div>
            )}

            {!chapterData.content.trim() && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Add chapter content to enable AI generation</p>
              </div>
            )}
          </div>

          {/* Chapter Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2">Preview:</h4>
            <div className="text-sm space-y-2">
              <div className="font-medium text-purple-700">
                Chapter {existingChapters.length + 1}: {chapterData.title || "Chapter Title"}
              </div>
              {chapterData.content && (
                <div className="text-purple-600 bg-white p-3 rounded border max-h-32 overflow-y-auto prose prose-sm">
                  <div dangerouslySetInnerHTML={{ 
                    __html: chapterData.content.length > 200 
                      ? chapterData.content.slice(0, 200) + "..." 
                      : chapterData.content 
                  }} />
                </div>
              )}
              {chapterData.videoUrl && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Video className="w-4 h-4" />
                  <span>Video included</span>
                </div>
              )}
              {chapterData.duration > 0 && (
                <div className="text-xs text-purple-500">
                  Duration: {chapterData.duration} minutes
                </div>
              )}
              <div className="text-xs text-purple-500">
                In: {moduleTitle} → {lessonTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center gap-3 justify-end pt-6 border-t border-border">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!chapterData.title.trim() || !chapterData.content.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Update Chapter" : "Add Chapter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
