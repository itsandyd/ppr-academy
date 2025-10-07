"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioPlayer } from "./components/AudioPlayer";
import { GenerateAudioButton } from "./components/GenerateAudioButton";
import {
  Book,
  PlayCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Home,
  MoreHorizontal,
  Lock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CourseQAChat } from "@/components/course/CourseQAChat";
import { LessonQASection } from "@/components/qa/LessonQASection";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

export default function CoursePlayerPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const slug = params.slug as string;
  const currentChapterId = searchParams.get("chapter");
  
  const [selectedChapter, setSelectedChapter] = useState<string | null>(currentChapterId);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const courseData = useQuery(
    api.library.getCourseWithProgress,
    user?.id && slug ? { userId: user.id, slug } : "skip"
  );

  const accessVerification = useQuery(
    api.library.verifyCourseAccess,
    user?.id && slug ? { userId: user.id, slug } : "skip"
  );

  const updateProgress = useMutation(api.library.updateProgress);
  const generateCertificate = useMutation(api.certificates.generateCertificate);
  const hasCertificate = useQuery(
    api.certificates.hasCertificate,
    user?.id && courseData ? { userId: user.id, courseId: courseData._id } : "skip"
  );

  // Redirect if no access
  useEffect(() => {
    if (accessVerification !== undefined && !accessVerification.hasAccess) {
      toast.error("You don't have access to this course");
      router.push("/library");
    }
  }, [accessVerification, router]);

  // Set initial chapter if none selected
  useEffect(() => {
    if (courseData && !selectedChapter) {
      // Find the last accessed chapter or first incomplete chapter
      const lastChapter = courseData.lastAccessedChapter;
      if (lastChapter) {
        setSelectedChapter(lastChapter);
      } else {
        // Find first chapter
        const firstModule = courseData.modules?.[0];
        const firstLesson = firstModule?.lessons?.[0];
        const firstChapter = firstLesson?.chapters?.[0];
        if (firstChapter) {
          setSelectedChapter(firstChapter._id);
        }
      }
    }
  }, [courseData, selectedChapter]);

  // Update URL when chapter changes
  useEffect(() => {
    if (selectedChapter && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", selectedChapter);
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedChapter]);

  const handleChapterComplete = async (chapterId: string) => {
    if (!user?.id || !courseData) return;
    
    try {
      await updateProgress({
        userId: user.id,
        slug,
        chapterId,
        isCompleted: true,
        timeSpent: 300, // Default 5 minutes
      });
      toast.success("Chapter marked as complete!");

      // Check if course is now 100% complete
      let totalChapters = 0;
      let completedChapters = 0;
      
      courseData.modules?.forEach((module: any) => {
        module.lessons?.forEach((lesson: any) => {
          lesson.chapters?.forEach((chapter: any) => {
            totalChapters++;
            if (chapter._id === chapterId || chapter.isCompleted) {
              completedChapters++;
            }
          });
        });
      });

      const completionPercentage = Math.round((completedChapters / totalChapters) * 100);

      // Generate certificate if 100% complete and doesn't have one yet
      if (completionPercentage === 100 && !hasCertificate?.hasCertificate) {
        const result = await generateCertificate({
          userId: user.id,
          userName: user.fullName || user.firstName || "Student",
          userEmail: user.emailAddresses[0]?.emailAddress || "",
          courseId: courseData._id,
          courseTitle: courseData.title,
          instructorName: (courseData as any).creatorName || "Instructor",
          instructorId: (courseData as any).creatorId || user.id,
          totalChapters,
          completedChapters,
          completionPercentage,
        });

        if (result.success) {
          toast.success("🎉 Congratulations! You've earned a certificate!", {
            description: "Check your library to view and download it",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please sign in to access this course.</div>
      </div>
    );
  }

  if (courseData === undefined || accessVerification === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading course...</div>
      </div>
    );
  }

  if (!courseData || !accessVerification?.hasAccess) {
    return (
      <Card className="max-w-md mx-auto mt-20">
        <CardContent className="pt-6 text-center">
          <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This course may have been removed or is no longer available.
          </p>
          <Button asChild>
            <Link href="/library/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Find current chapter details
  let currentChapter: any = null;
  let currentModule: any = null;
  let currentLesson: any = null;
  let allChapters: any[] = [];

  courseData.modules?.forEach((module) => {
    module.lessons?.forEach((lesson) => {
      lesson.chapters?.forEach((chapter) => {
        allChapters.push({ ...chapter, moduleId: module._id, lessonId: lesson._id });
        if (chapter._id === selectedChapter) {
          currentChapter = chapter;
          currentModule = module;
          currentLesson = lesson;
        }
      });
    });
  });

  const currentChapterIndex = allChapters.findIndex(c => c._id === selectedChapter);
  const previousChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;

  // Calculate overall progress
  const completedChapters = allChapters.filter(chapter => chapter.isCompleted).length;
  const totalChapters = allChapters.length;
  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border p-4 mb-4 rounded-lg">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="flex items-center space-x-2"
          >
            <Book className="w-4 h-4" />
            <span className="font-medium">Course Menu</span>
          </Button>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Progress value={overallProgress} className="w-16 h-2" />
            <span>{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex h-[calc(100vh-120px)] lg:gap-6">
        {/* Course Outline Sidebar */}
        <div className={`fixed lg:static top-0 bottom-0 lg:inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-transform duration-300 lg:translate-x-0 shadow-xl lg:shadow-none flex flex-col ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {/* Mobile Close Button */}
            <div className="lg:hidden flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Course Content</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Course Title & Progress */}
              <div className="space-y-3">
                <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 line-clamp-2 hidden lg:block leading-tight">
                  {courseData?.title}
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Progress</span>
                    <span className="font-medium">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              </div>

              {/* Course Home Button */}
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link href="/library/courses">
                  <Home className="w-4 h-4 mr-2" />
                  Course Home
                </Link>
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-white dark:bg-gray-900 h-0 min-h-0">
            <div className="p-4 space-y-6 pb-8">
              {/* Course Modules */}
              {courseData.modules?.map((module, moduleIndex) => (
                <div key={module._id} className="space-y-3">
                  {/* Module Header */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {module.lessons?.reduce((acc, lesson) => acc + (lesson.chapters?.length || 0), 0) || 0}
                    </Badge>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-3">
                    {module.lessons?.map((lesson, lessonIndex) => (
                      <div key={lesson._id} className="pl-3">
                        <h4 className="font-medium text-xs text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                          Lesson {lessonIndex + 1}: {lesson.title}
                        </h4>
                        
                        {/* Chapters */}
                        <div className="space-y-2 pl-2">
                          {lesson.chapters?.map((chapter, chapterIndex) => (
                            <button
                              key={chapter._id}
                              onClick={() => setSelectedChapter(chapter._id)}
                              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                                selectedChapter === chapter._id
                                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm"
                                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {chapter.isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <PlayCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium leading-snug">
                                    {chapterIndex + 1}. {chapter.title}
                                  </div>
                                  {chapter.timeSpent && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {Math.round(chapter.timeSpent / 60)}m watched
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            ))}
            </div>
          </ScrollArea>
        </div>

        {/* Lesson Canvas */}
        <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
          {currentChapter ? (
            <div className="h-full flex flex-col">
              {/* Chapter Header */}
              <div className={`p-4 lg:p-8 border-b border-border ${!currentChapter.videoUrl && !currentChapter.audioUrl ? 'flex-1' : 'h-60 lg:h-80'}`}>
                <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <span>{currentModule?.title}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>{currentLesson?.title}</span>
                  </div>
                  <h1 className="text-xl lg:text-3xl font-bold text-primary mb-4 lg:mb-6">
                    {currentChapter.title}
                  </h1>
                  {currentChapter.description && (
                    <>
                      {!currentChapter.videoUrl && !currentChapter.audioUrl ? (
                        <div className="flex-1 max-w-3xl overflow-y-auto">
                          <div className="prose prose-base lg:prose-lg max-w-none text-muted-foreground pr-4">
                            <div dangerouslySetInnerHTML={{ __html: currentChapter.description }} />
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-base lg:prose-lg max-w-3xl text-muted-foreground line-clamp-3 lg:line-clamp-4">
                          <div dangerouslySetInnerHTML={{ __html: currentChapter.description }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Chapter Content */}
              <div className="flex-1 flex flex-col">
                {/* Video/Audio Player */}
                {(currentChapter.videoUrl || currentChapter.audioUrl || currentChapter.generatedAudioUrl || currentChapter.generatedVideoUrl) && (
                  <div className="p-4 lg:p-6">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {/* Video Player (prioritize generated video, then original video) */}
                      {(currentChapter.generatedVideoUrl || currentChapter.videoUrl) && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            controls
                            className="w-full h-full"
                            src={currentChapter.generatedVideoUrl || currentChapter.videoUrl}
                            poster={courseData.imageUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                          {currentChapter.generatedVideoUrl && (
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 text-center">
                              🤖 AI-Generated Video
                            </div>
                          )}
                        </div>
                      )}

                      {/* Audio Player (show if no video, or if there's generated audio) */}
                      {((currentChapter.generatedAudioUrl || currentChapter.audioUrl) && !currentChapter.videoUrl && !currentChapter.generatedVideoUrl) && (
                        <AudioPlayer
                          src={currentChapter.generatedAudioUrl || currentChapter.audioUrl}
                          title={currentChapter.title}
                          isGenerated={!!currentChapter.generatedAudioUrl}
                        />
                      )}

                      {/* Show both if there's both original and generated content */}
                      {currentChapter.generatedAudioUrl && currentChapter.audioUrl && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Additional Audio</h4>
                          <AudioPlayer
                            src={currentChapter.audioUrl}
                            title={`${currentChapter.title} (Original)`}
                            isGenerated={false}
                          />
                        </div>
                      )}

                      {/* Audio Generation Button */}
                      <div className="flex justify-center pt-4">
                        <GenerateAudioButton
                          chapterId={currentChapter._id}
                          hasGeneratedAudio={!!currentChapter.generatedAudioUrl}
                          hasContent={!!currentChapter.description?.trim()}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Chapter Actions */}
                <div className="mt-auto p-4 lg:p-6 border-t border-border">
                  <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {!currentChapter.isCompleted && (
                        <Button
                          onClick={() => handleChapterComplete(currentChapter._id)}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Complete</span>
                        </Button>
                      )}
                      {currentChapter.isCompleted && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentChapter.lastAccessedAt && (
                        <span>
                          Last accessed {formatDistanceToNow(new Date(currentChapter.lastAccessedAt))} ago
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Q&A Section */}
                <div className="p-4 lg:p-6 border-t border-border bg-muted/30">
                  <div className="max-w-4xl mx-auto">
                    <LessonQASection
                      courseId={courseData._id}
                      lessonId={currentChapter._id}
                      chapterIndex={currentModule?.lessons?.findIndex((l: any) => 
                        l.chapters?.some((c: any) => c._id === currentChapter._id)
                      )}
                      lessonIndex={currentModule?.lessons?.find((l: any) => 
                        l.chapters?.some((c: any) => c._id === currentChapter._id)
                      )?.chapters?.findIndex((c: any) => c._id === currentChapter._id)}
                      isInstructor={(courseData as any).creatorId === user?.id}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="border-t border-border p-3 lg:p-4 mt-auto">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
                  {previousChapter ? (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedChapter(previousChapter._id)}
                      className="flex items-center space-x-2 flex-1 lg:flex-none"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <div className="text-left hidden lg:block">
                        <div className="text-xs text-muted-foreground">Previous Chapter</div>
                        <div className="font-medium">{previousChapter.title}</div>
                      </div>
                      <span className="lg:hidden text-sm">Previous</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {nextChapter ? (
                    <Button
                      onClick={() => setSelectedChapter(nextChapter._id)}
                      className="flex items-center space-x-2 flex-1 lg:flex-none"
                      size="sm"
                    >
                      <div className="text-right hidden lg:block">
                        <div className="text-xs opacity-75">Next Chapter</div>
                        <div className="font-medium">{nextChapter.title}</div>
                      </div>
                      <span className="lg:hidden text-sm">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" asChild size="sm" className="flex-1 lg:flex-none">
                      <Link href="/library/courses">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="hidden lg:inline">Course Complete</span>
                        <span className="lg:hidden">Complete</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Course Overview */
            <div className="p-8 text-center">
              <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to {courseData.title}</h2>
              <p className="text-muted-foreground mb-6">
                Select a chapter from the sidebar to begin your learning journey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {courseData.modules?.slice(0, 3).map((module, index) => (
                  <Card key={module._id} className="text-left">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Module {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold mb-2">{module.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {module.description || "Start learning with this module"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{module.lessons?.length || 0} lessons</span>
                        <span>{module.lessons?.reduce((acc, lesson) => acc + (lesson.chapters?.length || 0), 0) || 0} chapters</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Q&A Chat Component for enrolled students */}
      {courseData && user && (
        <CourseQAChat 
          courseId={courseData._id}
          courseTitle={courseData.title}
          userId={user.id}
        />
      )}
    </div>
  );
}