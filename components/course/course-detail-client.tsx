"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  Download, 
  FileText, 
  CheckCircle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  X,
  Volume2,
  Save,
  Pause,
  Loader2
} from "lucide-react";
import { enrollInCourse, submitCourseReview, markChapterComplete, updateChapter, generateChapterAudio, getElevenLabsVoices } from "@/app/actions/course-actions";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

// Dynamically import ReactMarkdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
});

interface User {
  id: string;
  admin?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  audioUrl?: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
}

interface CourseDetailClientProps {
  courseId: string;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  userProgress: number;
  user?: any;
  course?: any;
  showContent?: boolean;
}

export function CourseDetailClient({
  courseId,
  isAuthenticated,
  isEnrolled,
  userProgress,
  user,
  course,
  showContent = false
}: CourseDetailClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Audio playback state
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement | null }>({});
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    isPublished: false,
    isFree: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<{ [key: string]: boolean }>({});
  
  // TTS state
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("9BWtsMINqrJLrRacOk9x"); // Default to Aria voice

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load available voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        console.log('🔊 Loading ElevenLabs voices...');
        const result = await getElevenLabsVoices();
        console.log('🔊 Voice loading result:', result);
        
        if (result.success && result.voices) {
          console.log(`🔊 Loaded ${result.voices.length} voices successfully`);
          setAvailableVoices(result.voices);
        } else {
          console.warn('🔊 Failed to load voices:', result.error);
          // Keep the default voice available
          setAvailableVoices([]);
        }
      } catch (error) {
        console.error('🔊 Error loading voices:', error);
        // Keep the default voice available
        setAvailableVoices([]);
      }
    };
    loadVoices();
  }, []);

  // Audio player functions
  const playAudio = (chapterId: string, audioUrl: string) => {
    console.log(`🎵 ===== AUDIO PLAYBACK DEBUG =====`);
    console.log(`🎵 Function called with:`);
    console.log(`   - chapterId: ${chapterId}`);
    console.log(`   - audioUrl: ${audioUrl}`);
    console.log(`   - audioUrl type: ${typeof audioUrl}`);
    console.log(`   - audioUrl length: ${audioUrl?.length}`);
    console.log(`   - current URL: ${window.location.href}`);
    console.log(`   - current pathname: ${window.location.pathname}`);
    
    if (!audioUrl) {
      console.error('❌ No audio URL provided');
      toast({
        title: "Audio Error",
        description: "No audio URL available",
        variant: "destructive",
      });
      return;
    }

    if (audioPlaying === chapterId) {
      console.log(`🛑 Stopping current audio for chapter ${chapterId}`);
      // Stop current audio
      if (audioRefs[chapterId]) {
        audioRefs[chapterId]?.pause();
        audioRefs[chapterId]!.currentTime = 0;
      }
      setAudioPlaying(null);
      return;
    }

    // Stop any other playing audio
    Object.keys(audioRefs).forEach(id => {
      if (audioRefs[id]) {
        audioRefs[id]?.pause();
        audioRefs[id]!.currentTime = 0;
      }
    });
    setAudioPlaying(null);

    // Check if audioUrl is a legacy reference (not a playable URL)
    if (audioUrl && audioUrl.startsWith('generated_')) {
      console.warn('⚠️ Legacy audio reference detected:', audioUrl);
      toast({
        title: "Audio Not Available",
        description: "Please regenerate the audio to enable playback.",
        variant: "destructive",
      });
      return;
    }

    console.log('🎵 Creating Audio object...');
    
    // Play new audio
    const audio = new Audio(audioUrl);
    
    audio.onloadstart = () => {
      console.log('🔄 Audio loading started');
    };
    
    audio.oncanplay = () => {
      console.log('✅ Audio can play');
    };
    
    audio.oncanplaythrough = () => {
      console.log('✅ Audio can play through');
    };
    
    audio.onended = () => {
      console.log('🏁 Audio ended');
      setAudioPlaying(null);
    };
    
    audio.onerror = (e) => {
      console.error('❌ Audio error event:', e);
      console.error('❌ Audio error details:', audio.error);
      console.error('❌ Audio error code:', audio.error?.code);
      console.error('❌ Audio error message:', audio.error?.message);
      
      let errorMessage = 'Unknown error';
      if (audio.error) {
        switch (audio.error.code) {
          case 1:
            errorMessage = 'Audio aborted';
            break;
          case 2:
            errorMessage = 'Network error';
            break;
          case 3:
            errorMessage = 'Audio decoding failed';
            break;
          case 4:
            errorMessage = 'Audio not supported';
            break;
          default:
            errorMessage = audio.error.message || 'Unknown error';
        }
      }
      
      toast({
        title: "Audio Error",
        description: `Failed to play audio: ${errorMessage}`,
        variant: "destructive",
      });
      setAudioPlaying(null);
    };
    
    setAudioRefs(prev => ({ ...prev, [chapterId]: audio }));
    
    console.log('🎵 Attempting to play audio...');
    
    // Try to play the audio
    audio.play().then(() => {
      console.log('✅ Audio play started successfully');
      setAudioPlaying(chapterId);
    }).catch((error) => {
      console.error('❌ Audio play failed:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      
      toast({
        title: "Audio Playback Failed",
        description: `Unable to play audio: ${error.message}`,
        variant: "destructive",
      });
      setAudioPlaying(null);
    });
    
    console.log(`🎵 ===== END AUDIO PLAYBACK DEBUG =====`);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, [audioRefs]);

  // Generate audio function
  const generateAudio = async (chapterId: string, text: string) => {
    if (!text.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content before generating audio.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingAudio(chapterId);
    
    try {
      const result = await generateChapterAudio(chapterId, { text, voiceId: selectedVoice });
      
      if (result.success) {
        toast({
          title: "Audio Generated",
          description: result.message || "Audio has been generated successfully!",
        });
        
        // Refresh the page to show the new audio
        router.refresh();
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate audio. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(null);
    }
  };

  const ContentRenderer = ({ content }: { content: string }) => {
    if (!isMounted) {
      return <div className="text-slate-700 whitespace-pre-wrap">{content}</div>;
    }

    if (!content || content.trim() === '') {
      return <div className="text-slate-500 italic">No content available</div>;
    }

    // Check if content is HTML (contains HTML tags like <p>, <h1>, <strong>, etc.)
    const isHTML = /<[^>]*>/g.test(content);

    if (isHTML) {
      // Render HTML content from rich text editor
      return (
        <div 
          className="course-content text-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    } else {
      // Check if content contains markdown formatting
      const hasMarkdown = /[#*`\[\]_~]/.test(content);
      
      if (hasMarkdown) {
        // Render as markdown for backward compatibility
        return (
          <div className="course-content text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
          </div>
        );
      } else {
        // Plain text - render with basic formatting
        return (
          <div className="course-content text-sm whitespace-pre-wrap">
            {content}
          </div>
        );
      }
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to sign in
      window.location.href = "/sign-in";
      return;
    }

    setIsEnrolling(true);
    const result = await enrollInCourse(courseId);
    setIsEnrolling(false);

    if (result.success) {
      toast({
        title: "Enrolled Successfully!",
        description: "You can now access all course content.",
      });
      router.refresh();
    } else {
      toast({
        title: "Enrollment Failed",
        description: result.error || "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast({
        title: "Missing Comment",
        description: "Please add a comment to your review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReview(true);
    const result = await submitCourseReview(courseId, reviewRating, reviewComment);
    setIsSubmittingReview(false);

    if (result.success) {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setReviewComment("");
      router.refresh();
    } else {
      toast({
        title: "Review Failed",
        description: result.error || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleMarkComplete = async (chapterId: string) => {
    const result = await markChapterComplete(chapterId);

    if (result.success) {
      toast({
        title: "Chapter Completed!",
        description: "Great progress on your learning journey.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to mark chapter as complete",
        variant: "destructive",
      });
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setEditForm({
      title: chapter.title,
      description: chapter.description || "",
      videoUrl: chapter.videoUrl || "",
      isPublished: chapter.isPublished,
      isFree: chapter.isFree
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChapter = async () => {
    if (!selectedChapter) return;

    if (!editForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a chapter title.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await updateChapter(selectedChapter.id, {
      title: editForm.title,
      description: editForm.description,
      videoUrl: editForm.videoUrl,
      isPublished: editForm.isPublished,
      isFree: editForm.isFree
    });
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Chapter Updated",
        description: "Chapter has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      router.refresh();
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update chapter",
        variant: "destructive",
      });
    }
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedChapter(null);
    setEditForm({
      title: "",
      description: "",
      videoUrl: "",
      isPublished: false,
      isFree: false
    });
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleChapterContent = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-slate-300"
        } cursor-pointer`}
        onClick={() => setReviewRating(i + 1)}
      />
    ));
  };

  if (!showContent) {
    // Just show enrollment button
    return (
      <div className="space-y-4">
        {isAuthenticated ? (
          isEnrolled ? (
            <div className="space-y-4">
              <Button className="w-full" size="lg">
                <PlayCircle className="w-5 h-5 mr-2" />
                Continue Learning
              </Button>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{userProgress}%</span>
                </div>
                <Progress value={userProgress} />
              </div>
            </div>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? "Enrolling..." : "Enroll Now"}
            </Button>
          )
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => window.location.href = "/sign-in"}
          >
            Sign In to Enroll
          </Button>
        )}
      </div>
    );
  }

  // Show full course content
  return (
    <>
      <Tabs defaultValue="content" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Course Content */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Course Curriculum
              </CardTitle>
              <p className="text-slate-600">
                {course?.modules?.length || 0} modules • {course?.modules?.reduce((total: number, module: any) => total + (module.lessons?.length || 0), 0) || 0} lessons • {course?.courseChapters?.length || 0} chapters
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {course?.modules && course.modules.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {course.modules.map((module: any, moduleIndex: number) => (
                    <div key={module.id || `module-${moduleIndex}`} className="group">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(module.id || moduleIndex)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {expandedModules[module.id || moduleIndex] ? (
                              <ChevronDown className="w-5 h-5 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="text-xs font-medium">
                                Module {moduleIndex + 1}
                              </Badge>
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                              {module.title}
                            </h3>
                            
                            {module.description && (
                              <div className="text-sm text-slate-600 prose prose-sm max-w-none">
                                <ContentRenderer content={module.description} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 ml-4">
                          <div className="text-right">
                            <div className="font-medium">{module.lessons?.length || 0}</div>
                            <div className="text-xs">lessons</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {module.lessons?.reduce((total: number, lesson: any) => total + (lesson.chapters?.length || 0), 0) || 0}
                            </div>
                            <div className="text-xs">chapters</div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Module Content */}
                      {expandedModules[module.id || moduleIndex] && module.lessons && (
                        <div className="border-t border-slate-100 bg-slate-50/50">
                          <div className="p-6 space-y-6">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <div key={lesson.id || `lesson-${moduleIndex}-${lessonIndex}`} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                {/* Lesson Header */}
                                <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Lesson {lessonIndex + 1}
                                    </Badge>
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500">
                                      ~{(lesson.chapters?.length || 0) * 15} min
                                    </span>
                                  </div>
                                  
                                  <h4 className="font-semibold text-slate-900 mb-2">
                                    {lesson.title}
                                  </h4>
                                  
                                  {lesson.description && (
                                    <div className="text-sm text-slate-600 prose prose-sm max-w-none">
                                      <ContentRenderer content={lesson.description} />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Lesson Chapters */}
                                {lesson.chapters && lesson.chapters.length > 0 && (
                                  <div className="divide-y divide-slate-100">
                                    {lesson.chapters.map((chapter: Chapter, chapterIndex: number) => (
                                      <div key={chapter.id} className="group hover:bg-slate-50/50 transition-colors">
                                        {/* Chapter Header */}
                                        <div className="flex items-center justify-between p-4">
                                          <div className="flex items-center space-x-3 flex-1">
                                            <div className="flex-shrink-0">
                                              {chapter.videoUrl ? (
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                  <PlayCircle className="w-4 h-4 text-primary" />
                                                </div>
                                              ) : (
                                                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                                                  <FileText className="w-4 h-4 text-secondary" />
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-slate-900">
                                                  {chapterIndex + 1}. {chapter.title}
                                                </span>
                                                {chapter.isFree && (
                                                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                                    Free
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="text-xs text-slate-500">
                                                {chapter.videoUrl ? 'Video lesson' : 'Reading material'} • ~15 min
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            {user?.admin && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleEditChapter(chapter)}
                                              >
                                                <Settings className="w-3 h-3 mr-1" />
                                                Edit
                                              </Button>
                                            )}
                                            {chapter.audioUrl && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  playAudio(chapter.id, chapter.audioUrl!);
                                                }}
                                              >
                                                {audioPlaying === chapter.id ? (
                                                  <Pause className="w-3 h-3" />
                                                ) : (
                                                  <Volume2 className="w-3 h-3" />
                                                )}
                                              </Button>
                                            )}
                                            {isEnrolled && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs"
                                                onClick={() => handleMarkComplete(chapter.id)}
                                              >
                                                <CheckCircle className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Chapter Content */}
                                        {chapter.description && (
                                          <div className="px-4 pb-4">
                                            <div className="ml-11 bg-white rounded-lg border border-slate-200 p-4">
                                              <div className="text-slate-700 leading-relaxed">
                                                {(() => {
                                                  const isLongContent = chapter.description.length > 300;
                                                  const isExpanded = expandedChapters[chapter.id];
                                                  const shouldTruncate = isLongContent && !isExpanded;
                                                  const content = shouldTruncate 
                                                    ? `${chapter.description.substring(0, 300)}...` 
                                                    : chapter.description;
                                                  
                                                  return (
                                                    <>
                                                      <div className="prose prose-sm max-w-none text-slate-700">
                                                        <ContentRenderer content={content} />
                                                      </div>
                                                      {isLongContent && (
                                                        <button
                                                          onClick={() => toggleChapterContent(chapter.id)}
                                                          className="inline-flex items-center gap-1 mt-3 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                                        >
                                                          {isExpanded ? (
                                                            <>
                                                              <ChevronDown className="w-3 h-3" />
                                                              Show Less
                                                            </>
                                                          ) : (
                                                            <>
                                                              <ChevronRight className="w-3 h-3" />
                                                              Show More
                                                            </>
                                                          )}
                                                        </button>
                                                      )}
                                                    </>
                                                  );
                                                })()}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Course content is being prepared</h3>
                  <p className="text-slate-500">Check back soon for comprehensive learning materials!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-slate-700 leading-relaxed">
                {course?.description || "Course description coming soon..."}
              </p>
              
              <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">What You'll Learn</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Master industry-standard production techniques</li>
                <li>• Create professional-quality beats and compositions</li>
                <li>• Understand advanced music theory concepts</li>
                <li>• Develop your unique artistic style</li>
                <li>• Learn to mix and master your tracks</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Requirements</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Basic understanding of music production (recommended)</li>
                <li>• Access to a Digital Audio Workstation (DAW)</li>
                <li>• Enthusiasm to learn and practice</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-6">
          {/* Add Review (if enrolled) */}
          {isEnrolled && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {getRatingStars(reviewRating)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this course..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim() || isSubmittingReview}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reviews placeholder */}
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No reviews yet</h3>
              <p className="text-slate-500">Be the first to share your experience!</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Course Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No resources available</h3>
                <p className="text-slate-500">Course resources will be added soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Chapter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Chapter Content
            </DialogTitle>
            <DialogDescription>
              Update the chapter information and content. Use the rich text editor to add images, formatting, and rich content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter chapter title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (Optional)</Label>
              <Input
                id="videoUrl"
                value={editForm.videoUrl}
                onChange={(e) => setEditForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Chapter Content</Label>
              <RichTextEditor
                content={editForm.description || ''}
                onChange={(content) => setEditForm(prev => ({ ...prev, description: content }))}
                placeholder="Enter the chapter content, lesson text, and learning material..."
                className="min-h-[300px]"
              />
              <p className="text-sm text-slate-500">
                This content will be displayed to students when they access this chapter. You can add images, formatting, and rich content using the toolbar above.
              </p>
            </div>

            {/* Audio Generation Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <Label className="text-sm font-medium">Audio Generation</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voice-select">Voice</Label>
                                 <select
                   id="voice-select"
                   value={selectedVoice}
                   onChange={(e) => setSelectedVoice(e.target.value)}
                   className="w-full p-2 border rounded-md"
                 >
                   {availableVoices && availableVoices.length > 0 ? (
                     availableVoices.map((voice) => (
                       <option key={voice.voiceId} value={voice.voiceId}>
                         {voice.name}
                       </option>
                     ))
                   ) : (
                     <>
                       <option value="9BWtsMINqrJLrRacOk9x">Aria (Default)</option>
                       <option value="" disabled>Loading more voices...</option>
                     </>
                   )}
                 </select>
              </div>

              {/* Text length indicator */}
              <div className="text-xs text-slate-500">
                Text length: {editForm.description?.length || 0} / 5000 characters
                {editForm.description && editForm.description.length > 5000 && (
                  <span className="text-red-500 ml-2">(Text will be chunked for processing)</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectedChapter && generateAudio(selectedChapter.id, editForm.description || selectedChapter.description || '')}
                  disabled={generatingAudio === selectedChapter?.id || !editForm.description}
                >
                  {generatingAudio === selectedChapter?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>

                {selectedChapter?.audioUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectedChapter && playAudio(selectedChapter.id, selectedChapter.audioUrl!)}
                  >
                    {audioPlaying === selectedChapter?.id ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play Audio
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={editForm.isPublished}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isPublished" className="text-sm">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={editForm.isFree}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isFree: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isFree" className="text-sm">Free Preview</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={closeEditDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChapter}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Volume2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 