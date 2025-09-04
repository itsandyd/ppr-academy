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
    if (selectedChapter) {
      const newUrl = `/library/courses/${slug}?chapter=${selectedChapter}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedChapter, slug]);

  const handleChapterComplete = async (chapterId: string, moduleId?: string, lessonId?: string) => {
    if (!user?.id) return;

    try {
      await updateProgress({
        userId: user.id,
        slug,
        chapterId,
        moduleId,
        lessonId,
        isCompleted: true,
      });
      toast.success("Chapter marked as complete!");
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  if (!user) {
    return <div>Please sign in to access your courses.</div>;
  }

  if (accessVerification === undefined || courseData === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!accessVerification.hasAccess) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="text-center py-8">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have access to this course.
          </p>
          <Button asChild>
            <Link href="/library">Return to Library</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!courseData) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="text-center py-8">
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
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Course Outline Sidebar */}
      <div className="w-80 bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="space-y-3">
            <div>
              <h2 className="font-bold text-lg text-foreground line-clamp-2">
                {courseData.title}
              </h2>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={courseData.overallProgress} className="flex-1 h-2" />
                <span className="text-sm font-medium text-muted-foreground">
                  {courseData.overallProgress}%
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

        {/* Module List */}
        <div className="flex-1 overflow-y-auto">
          {courseData.modules?.map((module, moduleIndex) => (
            <div key={module._id} className="border-b border-border last:border-b-0">
              <div className="p-4 bg-accent/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    Module {moduleIndex + 1}: {module.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {module.lessons?.reduce((acc, lesson) => 
                      acc + (lesson.chapters?.length || 0), 0) || 0}
                  </Badge>
                </div>
                {module.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {module.description}
                  </p>
                )}
              </div>

              {/* Lessons */}
              {module.lessons?.map((lesson, lessonIndex) => (
                <div key={lesson._id}>
                  <div className="px-6 py-2 bg-background/50">
                    <h4 className="font-medium text-sm text-foreground">
                      Lesson {lessonIndex + 1}: {lesson.title}
                    </h4>
                  </div>

                  {/* Chapters */}
                  {lesson.chapters?.map((chapter, chapterIndex) => (
                    <button
                      key={chapter._id}
                      onClick={() => setSelectedChapter(chapter._id)}
                      className={`w-full text-left px-8 py-3 hover:bg-accent transition-colors border-l-4 ${
                        selectedChapter === chapter._id
                          ? "border-l-primary bg-primary/10 text-primary"
                          : "border-l-transparent"
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
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Lesson Canvas */}
      <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
        {currentChapter ? (
          <div className="h-full flex flex-col">
            {/* Chapter Header */}
            <div className="p-8 border-b border-border">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                  <span>{currentModule?.title}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{currentLesson?.title}</span>
                </div>
                <h1 className="text-3xl font-bold text-primary mb-4">
                  {currentChapter.title}
                </h1>
                {currentChapter.description && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {currentChapter.description}
                  </p>
                )}
              </div>
            </div>

            {/* Chapter Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Video/Audio Player */}
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

                {/* Chapter Content */}
                <div className="prose prose-lg max-w-none">
                  <h3>What you'll learn in this chapter:</h3>
                  <ul>
                    <li>Understanding the core concepts and principles</li>
                    <li>Practical application and real-world examples</li>
                    <li>Best practices and common pitfalls to avoid</li>
                  </ul>
                  
                  <p>
                    This chapter will guide you through the essential concepts you need to master. 
                    Take your time to understand each section before moving on to the next.
                  </p>
                  
                  <h3>Key takeaways:</h3>
                  <p>
                    By the end of this chapter, you'll have a solid understanding of the material
                    and be ready to apply what you've learned in practical scenarios.
                  </p>
                </div>

                {/* Chapter Actions */}
                <div className="flex items-center justify-between pt-6">
                  <div className="flex items-center space-x-4">
                    {!currentChapter.isCompleted && (
                      <Button
                        onClick={() => handleChapterComplete(
                          currentChapter._id,
                          currentModule?._id,
                          currentLesson?._id
                        )}
                        variant="default"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                    
                    {currentChapter.isCompleted && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="border-t border-border p-6">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                {previousChapter ? (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedChapter(previousChapter._id)}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous Chapter</div>
                      <div className="font-medium">{previousChapter.title}</div>
                    </div>
                  </Button>
                ) : (
                  <div />
                )}

                {nextChapter ? (
                  <Button
                    onClick={() => setSelectedChapter(nextChapter._id)}
                    className="flex items-center space-x-2"
                  >
                    <div className="text-right">
                      <div className="text-xs opacity-75">Next Chapter</div>
                      <div className="font-medium">{nextChapter.title}</div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/library/courses">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Course Complete
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Course Overview */
          <div className="h-full flex flex-col">
            <div className="p-8 border-b border-border">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-primary mb-4">
                  {courseData.title}
                </h1>
                {courseData.description && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {courseData.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-6">
                  {courseData.category && (
                    <Badge variant="secondary">{courseData.category}</Badge>
                  )}
                  {courseData.skillLevel && (
                    <Badge variant="outline">{courseData.skillLevel}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-foreground">Course Content</h2>
                    
                    {courseData.modules?.map((module, moduleIndex) => (
                      <Card key={module._id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Module {moduleIndex + 1}: {module.title}</span>
                            <Badge variant="secondary">
                              {module.lessons?.reduce((acc, lesson) => 
                                acc + (lesson.chapters?.length || 0), 0) || 0} chapters
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {module.description && (
                            <p className="text-muted-foreground mb-4">{module.description}</p>
                          )}
                          
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div key={lesson._id} className="mb-4 last:mb-0">
                              <h4 className="font-medium text-foreground mb-2">
                                Lesson {lessonIndex + 1}: {lesson.title}
                              </h4>
                              <div className="space-y-2 ml-4">
                                {lesson.chapters?.map((chapter, chapterIndex) => (
                                  <button
                                    key={chapter._id}
                                    onClick={() => setSelectedChapter(chapter._id)}
                                    className="w-full text-left flex items-center space-x-3 p-2 rounded hover:bg-accent transition-colors"
                                  >
                                    {chapter.isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <PlayCircle className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <span className="text-sm">
                                      {chapterIndex + 1}. {chapter.title}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Progress Sidebar */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {courseData.overallProgress}%
                          </div>
                          <div className="text-sm text-muted-foreground">Complete</div>
                        </div>
                        <Progress value={courseData.overallProgress} className="h-3" />
                        <div className="text-sm text-muted-foreground">
                          {allChapters.filter(c => c.isCompleted).length} of {allChapters.length} chapters completed
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Course Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Modules</span>
                          <span className="font-medium">{courseData.modules?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Chapters</span>
                          <span className="font-medium">{allChapters.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Skill Level</span>
                          <Badge variant="outline" className="text-xs">
                            {courseData.skillLevel || "All Levels"}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                          Purchased {accessVerification.purchaseDate ? 
                            formatDistanceToNow(new Date(accessVerification.purchaseDate), { addSuffix: true }) :
                            "recently"
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
