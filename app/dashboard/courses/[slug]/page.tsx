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
import { LiveViewerBadge } from "./components/LiveViewerBadge";
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
      router.push("/dashboard/courses?mode=learn");
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Please sign in to access this course.</div>
      </div>
    );
  }

  if (courseData === undefined || accessVerification === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading course...</div>
      </div>
    );
  }

  if (!courseData || !accessVerification?.hasAccess) {
    return (
      <Card className="mx-auto mt-20 max-w-md">
        <CardContent className="pt-6 text-center">
          <Book className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold text-foreground">Course Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            This course may have been removed or is no longer available.
          </p>
          <Button asChild>
            <Link href="/dashboard/courses?mode=learn">Back to Courses</Link>
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

  courseData.modules?.forEach((module: any) => {
    module.lessons?.forEach((lesson: any) => {
      lesson.chapters?.forEach((chapter: any) => {
        allChapters.push({ ...chapter, moduleId: module._id, lessonId: lesson._id });
        if (chapter._id === selectedChapter) {
          currentChapter = chapter;
          currentModule = module;
          currentLesson = lesson;
        }
      });
    });
  });

  const currentChapterIndex = allChapters.findIndex((c) => c._id === selectedChapter);
  const previousChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;

  // Calculate overall progress
  const completedChapters = allChapters.filter((chapter) => chapter.isCompleted).length;
  const totalChapters = allChapters.length;
  const overallProgress =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <Book className="h-4 w-4" />
            <span className="font-semibold">Course Menu</span>
          </Button>
          <div className="flex items-center gap-2.5 text-sm">
            <LiveViewerBadge courseId={courseData._id} chapterId={selectedChapter as any} />
            <Progress value={overallProgress} className="h-2 w-20" />
            <span className="min-w-[3ch] font-semibold text-foreground">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex lg:h-[calc(100vh-120px)] lg:gap-6">
        {/* Course Outline Sidebar */}
        <div
          className={`fixed bottom-0 left-0 top-0 z-50 flex w-80 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl transition-transform duration-300 lg:static lg:inset-y-0 lg:translate-x-0 lg:shadow-none ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex-shrink-0 border-b border-border bg-card/50 p-4">
            {/* Mobile Close Button */}
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h2 className="font-semibold text-foreground">Course Content</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              {/* Course Title & Progress */}
              <div className="space-y-3">
                <h2 className="line-clamp-2 hidden text-base font-bold leading-tight text-foreground lg:block">
                  {courseData?.title}
                </h2>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2.5" />
                </div>
              </div>

              {/* Course Home Button */}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-muted"
              >
                <Link href="/dashboard/courses?mode=learn">
                  <Home className="mr-2 h-4 w-4" />
                  <span className="font-medium">Course Home</span>
                </Link>
              </Button>
            </div>
          </div>

          <ScrollArea className="h-0 min-h-0 flex-1 bg-card">
            <div className="space-y-5 p-4 pb-8">
              {/* Course Modules */}
              {courseData.modules?.map((module: any, moduleIndex: number) => (
                <div key={module._id} className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/80 px-4 py-2.5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {module.lessons?.reduce(
                        (acc: number, lesson: any) => acc + (lesson.chapters?.length || 0),
                        0
                      ) || 0}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {module.lessons?.map((lesson: any, lessonIndex: number) => (
                      <div key={lesson._id} className="pl-2">
                        <h4 className="mb-2.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Lesson {lessonIndex + 1}: {lesson.title}
                        </h4>

                        <div className="space-y-1.5">
                          {lesson.chapters?.map((chapter: any, chapterIndex: number) => (
                            <button
                              key={chapter._id}
                              onClick={() => setSelectedChapter(chapter._id)}
                              className={`w-full rounded-md border p-3 text-left transition-all duration-200 ${
                                selectedChapter === chapter._id
                                  ? "border-primary/50 bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20"
                                  : "border-border bg-card text-foreground hover:border-border/80 hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                  {chapter.isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  ) : selectedChapter === chapter._id ? (
                                    <PlayCircle className="h-4 w-4 fill-primary/20 text-primary" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`text-sm font-medium leading-snug ${
                                      selectedChapter === chapter._id ? "text-foreground" : ""
                                    }`}
                                  >
                                    {chapterIndex + 1}. {chapter.title}
                                  </div>
                                  {chapter.timeSpent && (
                                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                                      <Clock className="mr-1 h-3 w-3" />
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
        <div className="flex-1 overflow-y-auto scroll-smooth rounded-lg border border-border bg-card">
          {currentChapter ? (
            <div className="flex flex-col">
              {/* Chapter Header */}
              <div className="border-b border-border bg-gradient-to-b from-muted/30 to-transparent p-6 lg:p-8">
                <div className="mx-auto flex max-w-4xl flex-col justify-center">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="truncate">{currentModule?.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{currentLesson?.title}</span>
                  </div>
                  <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground lg:mb-6 lg:text-3xl">
                    {currentChapter.title}
                  </h1>
                  {currentChapter.description && (
                    <div
                      className="prose prose-base max-w-3xl dark:prose-invert lg:prose-lg prose-headings:font-bold prose-headings:text-foreground prose-h1:mb-4 prose-h1:mt-8 prose-h1:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-xl prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-lg prose-p:mb-4 prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-ul:my-4 prose-li:my-1 prose-hr:my-8"
                      dangerouslySetInnerHTML={{ __html: currentChapter.description }}
                    />
                  )}
                </div>
              </div>

              {/* Chapter Content */}
              <div className="flex flex-col">
                {/* Video/Audio Player */}
                {(currentChapter.videoUrl ||
                  currentChapter.audioUrl ||
                  currentChapter.generatedAudioUrl ||
                  currentChapter.generatedVideoUrl) && (
                  <div className="p-6 lg:p-8">
                    <div className="mx-auto max-w-4xl space-y-4">
                      {/* Video Player (prioritize generated video, then original video) */}
                      {(currentChapter.generatedVideoUrl || currentChapter.videoUrl) && (
                        <div className="space-y-2">
                          <div className="aspect-video overflow-hidden rounded-lg bg-black shadow-lg">
                            <video
                              controls
                              className="h-full w-full"
                              src={currentChapter.generatedVideoUrl || currentChapter.videoUrl}
                              poster={courseData.imageUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          {currentChapter.generatedVideoUrl && (
                            <div className="flex items-center justify-center gap-1 text-center text-xs text-primary">
                              <span>🤖</span> AI-Generated Video
                            </div>
                          )}
                        </div>
                      )}

                      {/* Audio Player (show if no video, or if there's generated audio) */}
                      {(currentChapter.generatedAudioUrl || currentChapter.audioUrl) &&
                        !currentChapter.videoUrl &&
                        !currentChapter.generatedVideoUrl && (
                          <AudioPlayer
                            src={currentChapter.generatedAudioUrl || currentChapter.audioUrl}
                            title={currentChapter.title}
                            isGenerated={!!currentChapter.generatedAudioUrl}
                          />
                        )}

                      {/* Show both if there's both original and generated content */}
                      {currentChapter.generatedAudioUrl && currentChapter.audioUrl && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Additional Audio
                          </h4>
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
                <div className="border-t border-border bg-muted/40 p-6 lg:p-8">
                  <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      {!currentChapter.isCompleted && (
                        <Button
                          onClick={() => handleChapterComplete(currentChapter._id)}
                          className="flex items-center gap-2 shadow-sm"
                          size="default"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Mark as Complete</span>
                        </Button>
                      )}
                      {currentChapter.isCompleted && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-600 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-semibold">Completed</span>
                        </div>
                      )}
                    </div>
                    {currentChapter.lastAccessedAt && (
                      <div className="text-xs font-medium text-muted-foreground">
                        Last accessed {formatDistanceToNow(new Date(currentChapter.lastAccessedAt))}{" "}
                        ago
                      </div>
                    )}
                  </div>
                </div>

                {/* Q&A Section */}
                <div className="border-t border-border bg-muted/30 p-6 lg:p-8">
                  <div className="mx-auto max-w-4xl">
                    <LessonQASection
                      courseId={courseData._id}
                      lessonId={currentChapter._id}
                      chapterIndex={currentModule?.lessons?.findIndex((l: any) =>
                        l.chapters?.some((c: any) => c._id === currentChapter._id)
                      )}
                      lessonIndex={currentModule?.lessons
                        ?.find((l: any) =>
                          l.chapters?.some((c: any) => c._id === currentChapter._id)
                        )
                        ?.chapters?.findIndex((c: any) => c._id === currentChapter._id)}
                      isInstructor={(courseData as any).creatorId === user?.id}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 shadow-lg backdrop-blur-sm">
                {/* Mobile Navigation - Stacked */}
                <div className="space-y-2 p-3 lg:hidden">
                  {previousChapter && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedChapter(previousChapter._id)}
                      className="h-auto w-full justify-start gap-3 px-4 py-3"
                      aria-label={`Previous chapter: ${previousChapter.title}`}
                    >
                      <ChevronLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-xs font-medium text-muted-foreground">Previous</div>
                        <div className="truncate text-sm font-semibold">
                          {previousChapter.title}
                        </div>
                      </div>
                    </Button>
                  )}
                  {nextChapter ? (
                    <Button
                      onClick={() => setSelectedChapter(nextChapter._id)}
                      className="h-auto w-full justify-between gap-3 px-4 py-3"
                      aria-label={`Next chapter: ${nextChapter.title}`}
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-xs font-medium opacity-90">Next</div>
                        <div className="truncate text-sm font-semibold">{nextChapter.title}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button variant="default" asChild className="w-full py-3">
                      <Link
                        href="/dashboard/courses?mode=learn"
                        className="flex items-center justify-center gap-2"
                        aria-label="Return to courses - course complete"
                      >
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        <span className="font-semibold">Course Complete</span>
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Desktop Navigation - Side by Side */}
                <div className="mx-auto hidden max-w-4xl items-center justify-between gap-3 p-6 lg:flex">
                  {previousChapter ? (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedChapter(previousChapter._id)}
                      className="flex h-auto min-w-[240px] flex-initial items-center gap-3 border-border px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <ChevronLeft className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="mb-0.5 text-xs font-medium text-muted-foreground">
                          Previous
                        </div>
                        <div className="truncate text-sm font-semibold text-foreground">
                          {previousChapter.title}
                        </div>
                      </div>
                    </Button>
                  ) : (
                    <div className="min-w-[240px] flex-initial" />
                  )}

                  {nextChapter ? (
                    <Button
                      onClick={() => setSelectedChapter(nextChapter._id)}
                      className="flex h-auto min-w-[240px] flex-initial items-center gap-3 px-4 py-3 shadow-md transition-all hover:shadow-lg"
                    >
                      <div className="min-w-0 flex-1 text-right">
                        <div className="mb-0.5 text-xs font-medium opacity-90">Next</div>
                        <div className="truncate text-sm font-semibold">{nextChapter.title}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0" />
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      asChild
                      className="h-auto min-w-[240px] flex-initial px-4 py-3 shadow-md"
                    >
                      <Link
                        href="/dashboard/courses?mode=learn"
                        className="flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Course Complete</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Course Overview */
            <div className="p-6 text-center lg:p-8">
              <Book className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">
                Welcome to {courseData.title}
              </h2>
              <p className="mb-8 text-muted-foreground">
                Select a chapter from the sidebar to begin your learning journey.
              </p>
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {courseData.modules?.slice(0, 3).map((module: any, index: number) => (
                  <Card key={module._id} className="text-left">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Module {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h3 className="mb-2 font-semibold">{module.title}</h3>
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {module.description || "Start learning with this module"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{module.lessons?.length || 0} lessons</span>
                        <span>
                          {module.lessons?.reduce(
                            (acc: number, lesson: any) => acc + (lesson.chapters?.length || 0),
                            0
                          ) || 0}{" "}
                          chapters
                        </span>
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
        <CourseQAChat courseId={courseData._id} courseTitle={courseData.title} userId={user.id} />
      )}
    </div>
  );
}
