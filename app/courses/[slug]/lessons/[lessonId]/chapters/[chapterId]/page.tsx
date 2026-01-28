import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getUserFromClerk } from "@/lib/data";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ContentRenderer from "@/components/content-renderer";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import {
  Clock,
  PlayCircle,
  CheckCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Volume2,
  FileText,
  BookOpen,
  Settings,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Bookmark,
  Share,
  Download,
  MessageCircle,
  ThumbsUp,
  Eye,
  User,
  Star,
  GraduationCap
} from "lucide-react";

export default async function ChapterDetailPage({
  params
}: {
  params: Promise<{ slug: string; lessonId: string; chapterId: string }>
}) {
  const { userId: clerkId } = await auth();
  const { slug: courseSlug, lessonId, chapterId } = await params;

  // Get the course by slug from Convex
  const courseData = await fetchQuery(api.courses.getCourseBySlug, { slug: courseSlug });

  if (!courseData) {
    notFound();
  }

  // Get course chapters
  const chapters = await fetchQuery(api.courses.getCourseChapters, { courseId: courseData._id });

  // Get all modules for this course
  const courseModules = courseData.modules || [];

  // Build a more complete course structure
  const course = {
    ...courseData,
    id: courseData._id,
    title: courseData.title,
    modules: courseModules.map((mod: any, modIdx: number) => ({
      id: `module-${modIdx}`,
      title: mod.title,
      description: mod.description,
      position: mod.orderIndex,
      lessons: (mod.lessons || []).map((les: any, lesIdx: number) => ({
        id: `${courseData._id}-lesson-${modIdx}-${lesIdx}`,
        title: les.title,
        description: les.description,
        position: les.orderIndex,
        chapters: chapters
          .filter((ch: any) => ch.lessonId === `${courseData._id}-lesson-${modIdx}-${lesIdx}` ||
                              (ch.position >= lesIdx * 10 && ch.position < (lesIdx + 1) * 10))
          .map((ch: any) => ({
            id: ch._id,
            title: ch.title,
            description: ch.description,
            videoUrl: ch.videoUrl || ch.generatedVideoUrl, // Fallback to generated
            audioUrl: ch.audioUrl || ch.generatedAudioUrl, // Fallback to generated
            position: ch.position,
            isPublished: ch.isPublished ?? true,
            isFree: ch.isFree ?? false,
          }))
      }))
    }))
  };

  // Find the specific lesson and chapter
  let lesson = null;
  let chapter = null;
  let moduleWithLesson = null;

  for (const module of course.modules) {
    const foundLesson = module.lessons.find((l: any) => l.id === lessonId);
    if (foundLesson) {
      lesson = foundLesson;
      moduleWithLesson = module;
      chapter = foundLesson.chapters.find((c: any) => c.id === chapterId);
      break;
    }
  }

  // If not found by ID, try to find by index pattern or directly from chapters array
  if (!lesson || !chapter) {
    // Try to find chapter directly in chapters array
    const foundChapter = chapters.find((ch: any) => ch._id === chapterId);
    if (foundChapter) {
      chapter = {
        id: foundChapter._id,
        title: foundChapter.title,
        description: foundChapter.description,
        videoUrl: foundChapter.videoUrl || foundChapter.generatedVideoUrl, // Fallback to generated
        audioUrl: foundChapter.audioUrl || foundChapter.generatedAudioUrl, // Fallback to generated
        position: foundChapter.position,
        isPublished: foundChapter.isPublished ?? true,
        isFree: foundChapter.isFree ?? false,
      };

      // Find a lesson to associate with
      for (const module of course.modules) {
        for (const les of module.lessons) {
          if (les.id.includes(lessonId) || lessonId.includes(les.id) || les.chapters.length > 0) {
            lesson = les;
            moduleWithLesson = module;
            break;
          }
        }
        if (lesson) break;
      }

      // If still no lesson, create a default one
      if (!lesson && course.modules.length > 0 && course.modules[0].lessons.length > 0) {
        lesson = course.modules[0].lessons[0];
        moduleWithLesson = course.modules[0];
      }
    }
  }

  if (!lesson || !moduleWithLesson || !chapter) {
    notFound();
  }

  // Ensure lesson has chapters array
  if (!lesson.chapters || lesson.chapters.length === 0) {
    lesson.chapters = chapters.map((ch: any) => ({
      id: ch._id,
      title: ch.title,
      description: ch.description,
      videoUrl: ch.videoUrl,
      audioUrl: ch.audioUrl,
      position: ch.position,
      isPublished: ch.isPublished ?? true,
      isFree: ch.isFree ?? false,
    }));
  }

  // Get current user and enrollment
  let user = null;
  let enrollment = null;

  if (clerkId) {
    user = await getUserFromClerk(clerkId);
    if (user) {
      // Check enrollment via Convex
      const accessCheck = await fetchQuery(api.library.verifyCourseAccess, {
        userId: clerkId,
        slug: courseSlug
      });

      if (accessCheck?.hasAccess) {
        enrollment = { userId: user.id, courseId: course.id };
      }
    }
  }

  // Check access permissions
  const isAdmin = user?.admin === true;
  const isEnrolled = !!enrollment;
  const isChapterFree = chapter.isFree;
  
  // Allow access if: admin, enrolled, or chapter is free
  const hasAccess = isAdmin || isEnrolled || isChapterFree;
  
  // If no access, show enrollment required message
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <Link 
              href={`/courses/${courseSlug}/lessons/${lessonId}`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lesson
            </Link>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlayCircle className="w-10 h-10 text-orange-300" />
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-4">Premium Content</h1>
              <p className="text-xl text-slate-200 mb-8">
                This chapter requires enrollment to access. Join the course to unlock all premium content.
              </p>
              
              <div className="space-y-4">
                <div className="text-white/80 mb-6">
                  <h3 className="text-lg font-semibold mb-2">📺 {chapter.title}</h3>
                  <p className="text-slate-300">
                    Premium video content • ~15 minutes
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                    <Link href={`/courses/${courseSlug}`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Enroll in Course
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
                    <Link href={`/courses/${courseSlug}/lessons/${lessonId}`}>
                      Back to Lesson
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find adjacent chapters for navigation
  const currentChapterIndex = lesson.chapters.findIndex((c: any) => c.id === chapterId);
  const previousChapter = currentChapterIndex > 0 ? lesson.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < lesson.chapters.length - 1 ? lesson.chapters[currentChapterIndex + 1] : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Extended Dark Header + Video Section */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navigation breadcrumb */}
          <div className="flex items-center gap-2 text-white/80 mb-4">
            <Link 
              href={`/courses/${courseSlug}`}
              className="hover:text-white transition-colors text-sm"
            >
              Course
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link 
              href={`/courses/${courseSlug}/lessons`}
              className="hover:text-white transition-colors text-sm"
            >
              Lessons
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link 
              href={`/courses/${courseSlug}/lessons/${lessonId}`}
              className="hover:text-white transition-colors text-sm"
            >
              {lesson.title}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white text-sm">{chapter.title}</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold">
                📖 Chapter {currentChapterIndex + 1}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10 backdrop-blur-sm">
                {lesson.chapters.length} chapters total
              </Badge>
              {chapter.isFree && (
                <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-black font-semibold">
                  Free Preview
                </Badge>
              )}
              {isAdmin && (
                <Badge className="bg-gradient-to-r from-red-400 to-pink-400 text-white font-semibold">
                  🔑 Admin Access
                </Badge>
              )}
            </div>
            
            {/* Chapter Actions */}
            <div className="flex items-center gap-3">
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Video Section within Dark Background */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-8">
            {/* Main Video Content */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden shadow-xl border-0 bg-slate-900/50 backdrop-blur-sm">
                <CardContent className="p-0">
                  {/* Video Player Area */}
                  <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
                    {chapter.videoUrl ? (
                      // Actual video player (when videoUrl exists)
                      <video 
                        className="w-full h-full object-cover"
                        controls
                        poster="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                      >
                        <source src={chapter.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      // Placeholder when no video URL
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                            <PlayCircle className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <h3 className="text-white text-xl font-semibold mb-2">Video coming soon</h3>
                          <p className="text-white/70 text-sm max-w-md mx-auto">
                            Chapter {currentChapterIndex + 1} of {lesson.chapters.length} • This video is being prepared
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Stats - Directly under video */}
                  <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          <span>{chapter.videoUrl ? 'Video Available' : 'Video Coming Soon'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>~15 min</span>
                        </div>
                        {chapter.audioUrl && (
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <span>Audio Available</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>567 views</span>
                      </div>
                    </div>
                  </div>
                
                {/* Chapter Action Buttons */}
                <div className="p-6 bg-white">
                  <div className="flex flex-wrap gap-3">
                    {enrollment && (
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    <Button variant="outline">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Bookmark
                    </Button>
                    <Button variant="outline">
                      <Share className="w-4 h-4 mr-2" />
                      Share Chapter
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Video
                    </Button>
                    {chapter.audioUrl && (
                      <Button variant="outline">
                        <Volume2 className="w-4 h-4 mr-2" />
                        Audio Version
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Chapter Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chapter Progress */}
                  {enrollment && (
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-white/80">
                        <span>Chapter Progress</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="bg-white/20" />
                      <div className="text-xs text-white/60 mt-1">
                        Start watching to track progress
                      </div>
                    </div>
                  )}
                  
                  {/* Previous/Next Navigation */}
                  <div>
                    {previousChapter && (
                      <div className="mb-2">
                        <Link href={`/courses/${courseSlug}/lessons/${lessonId}/chapters/${previousChapter.id}`}>
                          <Button className="w-full justify-start text-left bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
                            <ChevronLeft className="w-4 h-4 mr-3 flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="text-xs text-white/70 font-medium">Previous</div>
                              <div className="text-sm truncate font-medium">{previousChapter.title}</div>
                            </div>
                          </Button>
                        </Link>
                      </div>
                    )}
                    
                    {nextChapter && (
                      <div className="mb-2">
                        <Link href={`/courses/${courseSlug}/lessons/${lessonId}/chapters/${nextChapter.id}`}>
                          <Button className="w-full justify-start text-left bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
                            <ChevronRight className="w-4 h-4 mr-3 flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="text-xs text-white/70 font-medium">Next</div>
                              <div className="text-sm truncate font-medium">{nextChapter.title}</div>
                            </div>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      asChild
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    >
                      <Link href={`/courses/${courseSlug}/lessons/${lessonId}`}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Back to Lesson
                      </Link>
                    </Button>
                    
                    <Button className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
                      <Download className="w-4 h-4 mr-2" />
                      Download Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Info Section - Full Width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{chapter.title}</h1>
            {chapter.description && (
              <div className="text-lg text-slate-600 max-w-none">
                <ContentRenderer content={chapter.description} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 