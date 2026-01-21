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
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { cleanTextForSpeech, previewCleanedText } from "@/lib/text-utils";
import { useCourseCreation } from "../context";
import { sanitizeHtml } from "@/lib/sanitize";

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
  // Add these for auto-save functionality
  courseId?: string;
  lessonId?: string;
  chapterId?: string; // For editing existing chapters
}

export function ChapterDialog({ 
  moduleTitle, 
  lessonTitle, 
  onChapterAdd, 
  onChapterEdit,
  existingChapters,
  editData,
  trigger,
  courseId,
  lessonId,
  chapterId
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
      console.log(`🎵 Loading audio from editData: ${editData.generatedAudioData.substring(0, 100)}...`);
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
  const { state } = useCourseCreation();
  
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
  
  // Auto-save mutation
  const createOrUpdateChapter = useMutation(api.courses.createOrUpdateChapter);
  
  // Track the actual Convex chapter ID for auto-save
  const [actualChapterId, setActualChapterId] = useState<string | null>(chapterId || null);
  
  // Create a stable unique key for this chapter based on its content
  // This should remain the same across dialog reopenings for the same chapter
  // Use editData title if available (for consistency when editing), otherwise use current title
  const titleForKey = editData?.title || chapterData.title;
  const chapterKey = `${state.courseId}_${titleForKey.replace(/\s+/g, '_').toLowerCase()}_${moduleTitle.replace(/\s+/g, '_').toLowerCase()}_${lessonTitle.replace(/\s+/g, '_').toLowerCase()}`;

  // Debug dialog open state
  useEffect(() => {
    if (isOpen) {
      console.log(`🚪 ChapterDialog opened:`, {
        isEditing,
        chapterKey,
        actualChapterId,
        hasEditData: !!editData,
        hasEditDataWithAudio: !!(editData?.generatedAudioData),
        showAudioPreview,
        hasGeneratedAudioData: !!generatedAudioData,
      });
    }
  }, [isOpen, isEditing, chapterKey, actualChapterId, editData, showAudioPreview, generatedAudioData]);
  
  // Debug: Log the chapter key components
  console.log(`🔑 Chapter key components:`, {
    courseId: state.courseId,
    chapterTitle: editData?.title || chapterData.title,
    moduleTitle: moduleTitle,
    lessonTitle: lessonTitle,
    finalKey: chapterKey
  });
  
  // Try to get existing chapter ID from localStorage for this specific chapter
  useEffect(() => {
    if (!actualChapterId && typeof window !== 'undefined' && chapterKey) {
      const storageKey = `chapter_${chapterKey}_id`;
      const storedChapterId = localStorage.getItem(storageKey);
      console.log(`🔍 Looking for stored chapter ID with key: ${storageKey}`);
      
      if (storedChapterId) {
        setActualChapterId(storedChapterId);
        console.log(`🔄 Restored chapter ID from storage: ${storedChapterId} for key: ${chapterKey}`);
      } else {
        console.log(`🔍 No stored chapter ID found for key: ${chapterKey}`);
        
        // Debug: Show all localStorage keys that contain 'chapter'
        const allKeys = Object.keys(localStorage).filter(key => key.includes('chapter'));
        console.log(`🔍 All chapter keys in localStorage:`, allKeys);
      }
    }
  }, [chapterKey, actualChapterId]);

  // Fetch existing chapter data if we have a chapter ID and user
  // Always fetch when we have an actualChapterId, unless we already have audio loaded
  const shouldFetchChapterData = !!(
    actualChapterId && 
    user?.id && 
    !showAudioPreview // Only skip if we already have audio preview loaded
  );

  const existingChapterData = useQuery(
    api.courses.getChapterById,
    shouldFetchChapterData ? { 
      chapterId: actualChapterId as Id<"courseChapters">,
      userId: user.id 
    } : "skip"
  );

  // Debug the query state
  console.log(`🔍 Query state:`, {
    actualChapterId,
    hasEditData: !!editData,
    hasEditDataWithAudio: !!(editData?.generatedAudioData),
    hasUserId: !!user?.id,
    showAudioPreview,
    hasGeneratedAudioData: !!generatedAudioData,
    shouldQuery: shouldFetchChapterData,
    existingChapterData: existingChapterData ? 'loaded' : 'not loaded',
    queryResult: existingChapterData
  });

  // Load existing chapter data when it's fetched
  useEffect(() => {
    if (existingChapterData) {
      console.log(`🔄 Loading existing chapter data:`, existingChapterData);
      
      // Only update chapter data if we don't have editData (avoid overwriting form data)
      if (!editData) {
        setChapterData({
          title: existingChapterData.title || "",
          content: existingChapterData.description || "",
          videoUrl: existingChapterData.videoUrl || "",
          duration: 0, // Duration not stored in database
        });
      }
      
      // Always load existing audio if available and not already loaded
      if (existingChapterData.generatedAudioUrl && !generatedAudioData) {
        console.log(`🎵 Restoring audio from database: ${existingChapterData.generatedAudioUrl.substring(0, 100)}...`);
        setGeneratedAudioData(existingChapterData.generatedAudioUrl);
        setShowAudioPreview(true);
        
        // Set basic metadata for existing audio
        setAudioMetadata({
          isSimulated: false,
          wordCount: 0,
          estimatedDuration: 0,
          audioSize: 0,
        });
      }
    } else if (shouldFetchChapterData && actualChapterId) {
      // Query returned null - chapter might not exist or permission issue
      console.log(`❌ Failed to load chapter data for ID: ${actualChapterId}`);
      console.log(`🧹 Clearing invalid chapter ID from localStorage`);
      
      // Clear the invalid chapter ID from localStorage
      const storageKey = `chapter_${chapterKey}_id`;
      localStorage.removeItem(storageKey);
      setActualChapterId(null);
    }
  }, [existingChapterData, editData, generatedAudioData, shouldFetchChapterData, actualChapterId, chapterKey]);

  // Auto-save function
  const autoSaveChapter = async (audioData?: string) => {
    // Only auto-save if we have courseId and the chapter has content
    if (!state.courseId || !chapterData.title.trim()) {
      
      if (!state.courseId) {
        toast.info("💡 Tip: Save your course first to enable auto-save for chapters with generated audio", {
          duration: 4000,
        });
      }
      return;
    }

    try {
      // Use passed audioData or fallback to state
      const audioToSave = audioData || generatedAudioData;
      
      
      // Ensure courseId is properly typed for Convex
      if (!state.courseId) {
        console.error("No courseId available for auto-save");
        return;
      }

      console.log(`💾 ${actualChapterId ? 'Updating' : 'Creating'} chapter:`, {
        chapterId: actualChapterId,
        title: chapterData.title,
        chapterKey: chapterKey,
        hasAudioData: !!audioToSave
      });

      const result = await createOrUpdateChapter({
        courseId: state.courseId as Id<"courses">,
        lessonId: lessonId as Id<"courseLessons"> | undefined,
        chapterId: (actualChapterId as Id<"courseChapters">) || null,
        chapterData: {
          title: chapterData.title,
          content: chapterData.content,
          videoUrl: chapterData.videoUrl || undefined,
          duration: chapterData.duration,
          position: existingChapters.length + 1,
          generatedAudioData: audioToSave || undefined,
        },
      });

      if (result.success && result.chapterId) {
        // Always update the actualChapterId to ensure we have the latest ID
        const wasCreatingNew = !actualChapterId;
        const idChanged = actualChapterId && actualChapterId !== result.chapterId;
        
        if (wasCreatingNew) {
          setActualChapterId(result.chapterId);
          // Store in localStorage for future sessions
          localStorage.setItem(`chapter_${chapterKey}_id`, result.chapterId);
          console.log("✅ Chapter auto-saved with ID:", result.chapterId, "stored with key:", chapterKey);
          toast.success("Chapter saved to Convex!");
        } else if (idChanged) {
          // The function found an existing chapter with a different ID
          // This can happen when the localStorage had a stale ID and the function found the real chapter
          setActualChapterId(result.chapterId);
          localStorage.setItem(`chapter_${chapterKey}_id`, result.chapterId);
          console.log("🔄 Chapter ID corrected:", result.chapterId, "stored with key:", chapterKey);
          toast.success("Chapter updated!");
        } else {
          console.log("✅ Chapter auto-updated with ID:", result.chapterId, "key:", chapterKey);
          toast.success("Chapter updated!");
        }
      } else {
        console.error("Auto-save failed:", result.error);
        toast.error(`Auto-save failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

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
      // Restore original audio data if it existed
      if (editData.generatedAudioData) {
        setGeneratedAudioData(editData.generatedAudioData);
        setShowAudioPreview(true);
      } else {
        setGeneratedAudioData(null);
        setAudioMetadata(null);
        setShowAudioPreview(false);
      }
    } else {
      setChapterData({ title: "", content: "", videoUrl: "", duration: 0 });
      // For new chapters, only clear audio if it wasn't saved to database
      if (!actualChapterId) {
        setGeneratedAudioData(null);
        setAudioMetadata(null);
        setShowAudioPreview(false);
      }
      // If we have actualChapterId, the audio will be restored when dialog reopens
    }
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
      
      // Use the actual chapter ID if we have one, otherwise create a temporary one
      const chapterIdForAudio = actualChapterId || `temp-${Date.now()}`;
      console.log(`🎵 Generating audio for chapter ID: ${chapterIdForAudio}`, {
        hasExistingId: !!actualChapterId,
        chapterTitle: chapterData.title,
        chapterKey: chapterKey
      });
      
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: chapterData.content,
          chapterId: chapterIdForAudio,
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
      
      // Store the generated audio URL or fallback data
      const audioToStore = result.audioUrl || result.audioData;
      const isUrl = result.audioUrl && !result.audioUrl.startsWith('data:');
      
      console.log(`🎵 Audio generation result:`, {
        hasUrl: !!result.audioUrl,
        hasData: !!result.audioData,
        isRealUrl: isUrl,
        isSimulated: result.metadata?.isSimulated,
        isBase64Fallback: result.metadata?.isBase64Fallback,
        audioLength: audioToStore?.length || 0
      });
      
      setGeneratedAudioData(audioToStore);
      setAudioMetadata(result.metadata);
      setShowAudioPreview(true);
      
      // Auto-save the chapter with the generated audio immediately
      autoSaveChapter(audioToStore);
      
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

      // Check if audio has been generated
      if (!generatedAudioData) {
        toast.error("Please generate audio first before creating a video");
        setIsGeneratingVideo(false);
        return;
      }

      toast.success("Video generation started! This may take a few minutes...");

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: chapterData.content,
          audioData: generatedAudioData, // Use the generated audio data
          title: chapterData.title,
          chapterId: actualChapterId || 'temp-id',
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
      
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-sm sm:text-base">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            {isEditing ? `Edit Chapter in "${lessonTitle}"` : `Add Chapter to "${lessonTitle}"`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Chapter Title */}
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Chapter Title *</Label>
            <Input
              id="chapter-title"
              placeholder="e.g., Introduction to EQ3 Controls"
              value={chapterData.title}
              onChange={(e) => setChapterData(prev => ({ ...prev, title: e.target.value }))}
              className="h-10 sm:h-12"
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
              className="h-10 sm:h-12"
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
              className="h-10 sm:h-12"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Estimated time for students to complete this chapter
            </p>
          </div>

          {/* AI Generation Section */}
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm sm:text-base">AI Content Generation</h4>
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
                    <div className="bg-card p-3 rounded border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Clean Text Preview</span>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{preview.validation.wordCount} words</span>
                          <span>~{preview.estimatedDuration} min audio</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
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
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAudio}
                    disabled={!chapterData.content.trim() || !getTextPreview()?.validation.isValid || isGeneratingAudio}
                    className="flex items-center gap-2 w-full sm:w-auto"
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
                    className="flex items-center gap-2 w-full sm:w-auto"
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
                  
                  {state.courseId ? (
                    <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded border">
                      ✅ <strong>Auto-save enabled:</strong> Generated audio will be saved to Convex automatically.
                    </p>
                  ) : (
                    <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border">
                      ⏳ <strong>Save course first:</strong> Audio will be temporarily stored until you save the course.
                    </p>
                  )}
                  
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border">
                    🔧 <strong>Setup Required:</strong> Add your ElevenLabs API key to environment variables for real audio generation. Currently running in demo mode.
                  </p>
                </div>
              </div>
            )}

            {!chapterData.content.trim() && (
              <div className="text-center py-4 text-muted-foreground">
                <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Add chapter content to enable AI generation</p>
              </div>
            )}
          </div>

          {/* Chapter Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-purple-800 mb-2 text-sm sm:text-base">Preview:</h4>
            <div className="text-sm space-y-2">
              <div className="font-medium text-purple-700">
                Chapter {existingChapters.length + 1}: {chapterData.title || "Chapter Title"}
              </div>
              {chapterData.content && (
                <div className="text-purple-600 dark:text-purple-400 bg-card p-2 sm:p-3 rounded border border-border max-h-24 sm:max-h-32 overflow-y-auto prose prose-sm">
                  <div dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(chapterData.content.length > 200
                      ? chapterData.content.slice(0, 200) + "..."
                      : chapterData.content)
                  }} />
                </div>
              )}
              {chapterData.videoUrl && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Video included</span>
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
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end pt-4 sm:pt-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!chapterData.title.trim() || !chapterData.content.trim()}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Update Chapter" : "Add Chapter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
