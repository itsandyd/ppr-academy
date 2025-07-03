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
  Loader2,
  BookOpen
} from "lucide-react";
import { enrollInCourse, submitCourseReview, markChapterComplete, updateChapter, generateChapterAudio, getElevenLabsVoices } from "@/app/actions/course-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        <TabsContent value="content" className="space-y-8">
          {/* Course Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-900 mb-1">
                  {course?.modules?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Modules</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-900 mb-1">
                  {course?.modules?.reduce((total: number, module: any) => total + (module.lessons?.length || 0), 0) || 0}
                </div>
                <div className="text-sm text-purple-700">Lessons</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-900 mb-1">
                  {Math.ceil((course?.courseChapters?.length || 0) * 0.25)}h
                </div>
                <div className="text-sm text-emerald-700">Duration</div>
              </CardContent>
            </Card>
          </div>

          {/* Course Modules Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Course Modules</h2>
              <Badge variant="outline" className="text-slate-600">
                {course?.modules?.length || 0} modules available
              </Badge>
            </div>
            
            {course?.modules && course.modules.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {course.modules.map((module: any, moduleIndex: number) => (
                   <Card 
                     key={module.id || `module-${moduleIndex}`}
                     className="group cursor-pointer transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg bg-white"
                     onClick={() => toggleModule(module.id || moduleIndex)}
                   >
                    {/* Module Header */}
                    <div className="relative">
                      <div className="h-32 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-indigo-500/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-white/30">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              Module {moduleIndex + 1}
                            </Badge>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                            {expandedModules[module.id || moduleIndex] ? (
                              <ChevronDown className="w-4 h-4 text-white" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Module Content */}
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {module.title}
                      </h3>
                      
                      {module.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                          {module.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Play className="w-4 h-4" />
                            <span>{module.lessons?.length || 0} lessons</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span>~{(module.lessons?.reduce((total: number, lesson: any) => total + (lesson.chapters?.length || 0), 0) || 0) * 15}min</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <span className="text-xs font-medium">View</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Expanded Module Content */}
                    {expandedModules[module.id || moduleIndex] && (
                      <div className="border-t bg-slate-50/50 p-6 space-y-4">
                        <h4 className="font-medium text-slate-900 mb-4">Lessons in this module:</h4>
                        <div className="grid grid-cols-1 gap-3">
                          {module.lessons?.map((lesson: any, lessonIndex: number) => (
                            <Link 
                              key={lesson.id || `lesson-${moduleIndex}-${lessonIndex}`}
                              href={`/courses/${course.slug}/lessons/${lesson.id}`}
                              className="block"
                            >
                              <div className="bg-white rounded-lg p-4 border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                      <span className="text-xs font-semibold text-primary">
                                        {lessonIndex + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                                        {lesson.title}
                                      </h5>
                                      <p className="text-xs text-slate-500">
                                        {lesson.chapters?.length || 0} chapters • ~{(lesson.chapters?.length || 0) * 15}min
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.chapters?.some((chapter: any) => chapter.audioUrl) && (
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <Volume2 className="w-3 h-3 text-green-600" />
                                      </div>
                                    )}
                                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                      <PlayCircle className="w-3 h-3 text-primary" />
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Course content is being prepared</h3>
                  <p className="text-slate-500 mb-6">Our expert instructors are crafting comprehensive learning materials for you!</p>
                  <Badge variant="outline" className="text-slate-500">
                    Coming Soon
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
          
                     {/* Quick Stats & Lessons Navigation */}
           {course?.modules && course.modules.length > 0 && (
             <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-indigo-500/5 border-primary/20">
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to start learning?</h3>
                     <p className="text-slate-600">
                       This course contains {course.modules.reduce((total: number, module: any) => total + (module.lessons?.reduce((lessonTotal: number, lesson: any) => lessonTotal + (lesson.chapters?.length || 0), 0) || 0), 0)} chapters 
                       across {course.modules.length} comprehensive modules.
                     </p>
                   </div>
                   <div className="flex items-center gap-3">
                     <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                       <Link href={`/courses/${course.slug}/lessons`}>
                         <BookOpen className="w-4 h-4 mr-2" />
                         View All Lessons
                       </Link>
                     </Button>
                     {isEnrolled ? (
                       <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                         <Link href={`/courses/${course.slug}/lessons`}>
                           <PlayCircle className="w-4 h-4 mr-2" />
                           Continue Learning
                         </Link>
                       </Button>
                     ) : (
                       <Button 
                         onClick={handleEnroll}
                         disabled={isEnrolling}
                         className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                       >
                         {isEnrolling ? (
                           <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Enrolling...
                           </>
                         ) : (
                           <>
                             <Play className="w-4 h-4 mr-2" />
                             Start Learning
                           </>
                         )}
                       </Button>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}
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