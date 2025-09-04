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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <h1>Course Player - Mobile Optimized</h1>
        <p>Testing mobile layout...</p>
      </div>
      
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
            <Progress value={0} className="w-16 h-2" />
            <span>0%</span>
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
        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-card rounded-lg border border-border overflow-hidden transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-6 border-b border-border">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <h2 className="font-semibold">Course Content</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileSidebarOpen(false)}
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <h2 className="font-bold text-lg text-foreground line-clamp-2 hidden lg:block">
                {courseData?.title}
              </h2>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={0} className="flex-1 h-2" />
                <span className="text-sm font-medium text-muted-foreground">
                  0%
                </span>
              </div>
            </div>
            
            <Button asChild variant="ghost" size="sm" className="w-full justify-start">
              <Link href="/library/courses">
                <Home className="w-4 h-4 mr-2" />
                Course Home
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Course Modules */}
          {courseData.modules?.map((module, moduleIndex) => (
            <div key={module._id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {module.lessons?.reduce((acc, lesson) => acc + (lesson.chapters?.length || 0), 0) || 0}/{module.lessons?.reduce((acc, lesson) => acc + (lesson.chapters?.length || 0), 0) || 0}
                </Badge>
              </div>

              {/* Lessons */}
              {module.lessons?.map((lesson, lessonIndex) => (
                <div key={lesson._id} className="ml-4 mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Lesson {lessonIndex + 1}: {lesson.title}
                  </h4>
                  
                  {/* Chapters */}
                  <div className="space-y-1">
                    {lesson.chapters?.map((chapter, chapterIndex) => (
                      <button
                        key={chapter._id}
                        onClick={() => setSelectedChapter(chapter._id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedChapter === chapter._id
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {chapter.isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {chapterIndex + 1}. {chapter.title}
                            </div>
                            {chapter.timeSpent && (
                              <div className="text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 inline mr-1" />
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
          ))}
          </div>
        </div>
      </div>

      {/* Lesson Canvas */}
      <div className="flex-1 lg:ml-0 bg-card rounded-lg border border-border overflow-hidden">
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
                        <div className="text-base lg:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap pr-4">
                          {currentChapter.description}
                        </div>
                      </div>
                    ) : (
                      <div className="text-base lg:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-3xl line-clamp-3 lg:line-clamp-4">
                        {currentChapter.description}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chapter Content */}
            <div className="flex-1 flex flex-col">
              {/* Video/Audio Player */}
              {(currentChapter.videoUrl || currentChapter.audioUrl) && (
                <div className="p-4 lg:p-6">
                  <div className="max-w-4xl mx-auto">
                    {currentChapter.videoUrl && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          controls
                          className="w-full h-full"
                          src={currentChapter.videoUrl}
                          poster={courseData.imageUrl}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {currentChapter.audioUrl && !currentChapter.videoUrl && (
                      <div className="bg-muted rounded-lg p-6">
                        <audio
                          controls
                          className="w-full"
                          src={currentChapter.audioUrl}
                        >
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    )}
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
  );
}