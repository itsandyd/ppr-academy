import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getUserFromClerk } from "@/lib/convex-data";
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

interface Chapter {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
}

export default async function LessonDetailPage({
  params
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { userId: clerkId } = await auth();
  const { slug: courseSlug, lessonId } = await params;

  // Get the course by slug from Convex
  const courseData = await fetchQuery(api.courses.getCourseBySlug, { slug: courseSlug });

  if (!courseData) {
    notFound();
  }

  // Get course modules with lessons and chapters
  const modules = await fetchQuery(api.courses.getCourseChapters, { courseId: courseData._id });

  // Get all modules for this course
  const courseModules = courseData.modules || [];

  // Build a more complete course structure
  const course = {
    ...courseData,
    id: courseData._id,
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
        chapters: modules
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

  // Find the specific lesson
  let lesson = null;
  let moduleWithLesson = null;

  for (const module of course.modules) {
    const foundLesson = module.lessons.find((l: any) => l.id === lessonId);
    if (foundLesson) {
      lesson = foundLesson;
      moduleWithLesson = module;
      break;
    }
  }

  // If not found by ID, try to find by index pattern
  if (!lesson) {
    // The lessonId might be a Convex ID from courseLessons table
    // Try to find by matching with existing lessons
    for (const module of course.modules) {
      for (const les of module.lessons) {
        if (les.id.includes(lessonId) || lessonId.includes(les.id)) {
          lesson = les;
          moduleWithLesson = module;
          break;
        }
      }
      if (lesson) break;
    }
  }

  if (!lesson || !moduleWithLesson) {
    notFound();
  }

  // Ensure lesson has chapters array
  if (!lesson.chapters) {
    lesson.chapters = modules.map((ch: any) => ({
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
        // Redirect enrolled users to the dashboard course player for proper progress tracking
        redirect(`/dashboard/courses/${courseSlug}`);
      }
    }
  }

  // Check access permissions
  const isAdmin = user?.admin === true;
  const isEnrolled = !!enrollment;
  const hasFreeChapters = lesson.chapters.some((chapter: any) => chapter.isFree);
  
  // Allow access if: admin, enrolled, or lesson has free chapters
  const hasAccess = isAdmin || isEnrolled || hasFreeChapters;
  
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
              href={`/courses/${courseSlug}`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </Link>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-orange-300" />
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-4">Enrollment Required</h1>
              <p className="text-xl text-slate-200 mb-8">
                This lesson is part of a premium course. Enroll now to access all lessons and start your learning journey.
              </p>
              
              <div className="space-y-4">
                <div className="text-white/80 mb-6">
                  <h3 className="text-lg font-semibold mb-2">📚 {lesson.title}</h3>
                  <p className="text-slate-300">
                    {lesson.chapters.length} chapters • ~{lesson.chapters.length * 15} minutes
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
                    <Link href="/courses">
                      Browse All Courses
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

  // Find current lesson position and adjacent lessons
  const currentLessonIndex = moduleWithLesson.lessons.findIndex((l: any) => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? moduleWithLesson.lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < moduleWithLesson.lessons.length - 1 ? moduleWithLesson.lessons[currentLessonIndex + 1] : null;

  // Calculate lesson progress
  const totalChapters = lesson.chapters.length;
  const completedChapters = Math.floor(totalChapters * 0.6); // Mock data - would be from UserProgress
  const lessonProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation breadcrumb */}
          <div className="flex items-center gap-2 text-white/80 mb-8">
            <Link 
              href={`/courses/${courseSlug}`}
              className="hover:text-white transition-colors"
            >
              {course.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link 
              href={`/courses/${courseSlug}/lessons`}
              className="hover:text-white transition-colors"
            >
              Lessons
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{lesson.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold">
                    📖 Lesson {currentLessonIndex + 1}
                  </Badge>
                  <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10 backdrop-blur-sm">
                    {lesson.chapters.length} chapters
                  </Badge>
                  {isAdmin && (
                    <Badge className="bg-gradient-to-r from-red-400 to-pink-400 text-white font-semibold">
                      🔑 Admin Access
                    </Badge>
                  )}
                  {enrollment && (
                    <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-black font-semibold">
                      {lessonProgress}% complete
                    </Badge>
                  )}
                </div>
                
                {/* Lesson Actions */}
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
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">{lesson.title}</h1>
                  
                                      {lesson.description && (
                      <div className="text-xl text-white/90 leading-relaxed max-w-4xl">
                        <ContentRenderer 
                          content={lesson.description} 
                          className="prose prose-xl prose-invert max-w-none text-white/90"
                        />
                      </div>
                    )}
                </div>
                
                {/* Enhanced lesson overview stats */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-400/30">
                        <FileText className="w-6 h-6 text-blue-300" />
                      </div>
                      <div className="text-2xl font-bold text-white">{lesson.chapters.length}</div>
                      <div className="text-sm text-white/70">Chapters</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-green-400/30">
                        <Clock className="w-6 h-6 text-green-300" />
                      </div>
                      <div className="text-2xl font-bold text-white">~{lesson.chapters.length * 15}m</div>
                      <div className="text-sm text-white/70">Duration</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-400/30">
                        <Volume2 className="w-6 h-6 text-purple-300" />
                      </div>
                      <div className="text-lg font-bold text-white">
                        {lesson.chapters.filter((ch: any) => ch.audioUrl).length > 0 ? 'Yes' : 'Soon'}
                      </div>
                      <div className="text-sm text-white/70">Audio</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-yellow-400/30">
                        <Eye className="w-6 h-6 text-yellow-300" />
                      </div>
                      <div className="text-2xl font-bold text-white">1.2k</div>
                      <div className="text-sm text-white/70">Views</div>
                    </div>
                  </div>
                </div>
              </div>
              

            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Lesson Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  {enrollment && (
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-white/80">
                        <span>Lesson Progress</span>
                        <span>{lessonProgress}%</span>
                      </div>
                      <Progress value={lessonProgress} className="bg-white/20" />
                      <div className="text-xs text-white/60 mt-1">
                        {completedChapters} of {totalChapters} chapters completed
                      </div>
                    </div>
                  )}
                  
                  {/* Previous/Next Navigation */}
                  <div>
                    {previousLesson && (
                      <div className="mb-2">
                        <Link href={`/courses/${courseSlug}/lessons/${previousLesson.id}`}>
                          <Button className="w-full justify-start text-left bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
                            <ChevronLeft className="w-4 h-4 mr-3 flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="text-xs text-white/70 font-medium">Previous</div>
                              <div className="text-sm truncate font-medium">{previousLesson.title}</div>
                            </div>
                          </Button>
                        </Link>
                      </div>
                    )}
                    
                    {nextLesson && (
                      <div className="mb-2">
                        <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
                          <Button className="w-full justify-start text-left bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
                            <ChevronRight className="w-4 h-4 mr-3 flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="text-xs text-white/70 font-medium">Next</div>
                              <div className="text-sm truncate font-medium">{nextLesson.title}</div>
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
                      <Link href={`/courses/${courseSlug}/lessons`}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        All Lessons
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



      {/* Chapters Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Lesson Chapters</h2>
              <p className="text-slate-600">Dive deeper into the topic with these detailed chapters</p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/courses/${courseSlug}/lessons/${lessonId}/chapters`}>
                <BookOpen className="w-4 h-4 mr-2" />
                View All Chapters
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Chapter Content */}
          <div className="lg:col-span-3 space-y-8">
            {lesson.chapters.length > 0 ? (
              lesson.chapters.map((chapter: any, chapterIndex: number) => {
                const canAccessChapter = isAdmin || isEnrolled || chapter.isFree;
                
                return (
                  <Card key={chapter.id} className="overflow-hidden shadow-lg border-0 bg-white group hover:shadow-xl transition-all duration-300">
                    <Link href={canAccessChapter ? `/courses/${courseSlug}/lessons/${lessonId}/chapters/${chapter.id}` : `/courses/${courseSlug}`}>
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50/30 border-b group-hover:from-primary/5 group-hover:to-purple-100/50 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-primary border-primary/30">
                              Chapter {chapterIndex + 1}
                            </Badge>
                            {chapter.isFree && (
                              <Badge className="bg-green-100 text-green-800">
                                Free Preview
                              </Badge>
                            )}
                            {!canAccessChapter && (
                              <Badge variant="outline" className="border-orange-300 text-orange-600">
                                🔒 Premium
                              </Badge>
                            )}
                            {completedChapters > chapterIndex && (
                              <Badge className="bg-blue-100 text-blue-800">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {chapter.audioUrl && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <Volume2 className="w-3 h-3 mr-1" />
                                Audio
                              </Badge>
                            )}
                            {chapter.videoUrl && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                <PlayCircle className="w-3 h-3 mr-1" />
                                Video
                              </Badge>
                            )}
                            <PlayCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                        
                        <CardTitle className="text-xl text-slate-900 group-hover:text-primary transition-colors duration-300">{chapter.title}</CardTitle>
                      </CardHeader>
                    </Link>
                    
                    <CardContent className="p-8">
                      {chapter.description ? (
                        <div className="mb-6">
                          <ContentRenderer content={chapter.description} />
                        </div>
                      ) : (
                        <div className="text-center py-8 mb-6">
                          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-slate-600 mb-2">Chapter content coming soon</h3>
                          <p className="text-slate-500">This chapter is being prepared by our instructors.</p>
                        </div>
                      )}
                      
                      {/* Chapter Actions */}
                      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            ~15 min
                          </span>
                          {chapter.audioUrl && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Volume2 className="w-4 h-4" />
                              Audio available
                            </span>
                          )}
                          {chapter.videoUrl && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <PlayCircle className="w-4 h-4" />
                              Video available
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                            <Link href={canAccessChapter ? `/courses/${courseSlug}/lessons/${lessonId}/chapters/${chapter.id}` : `/courses/${courseSlug}`}>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              {canAccessChapter ? 'Watch Chapter' : 'Enroll to Access'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="space-y-8">
                {/* Enhanced empty state */}
                <Card className="border-0 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 shadow-xl overflow-hidden">
                  <CardContent className="p-16 text-center relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-indigo-500/5"></div>
                    <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                      
                      <h3 className="text-3xl font-bold text-slate-900 mb-4">Content Coming Soon!</h3>
                      <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                        Our expert instructors are crafting high-quality chapter content for this lesson. 
                        Get ready for an amazing learning experience!
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold px-4 py-2 text-sm">
                          🚀 In Development
                        </Badge>
                        <Badge variant="outline" className="border-primary/30 text-primary px-4 py-2 text-sm">
                          📅 Available Soon
                        </Badge>
                      </div>
                      
                      {/* What to expect section */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50 max-w-2xl mx-auto">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">What to expect in this lesson:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4 text-primary" />
                            <span>Interactive video content</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-green-500" />
                            <span>Audio explanations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>Detailed written guides</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-purple-500" />
                            <span>Downloadable resources</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Suggested actions */}
                <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-indigo-500/5 border-primary/20">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h4 className="text-xl font-semibold text-slate-900 mb-2">
                          While you wait, explore other lessons!
                        </h4>
                        <p className="text-slate-600">
                          Continue your learning journey with available content in this course.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                          <Link href={`/courses/${courseSlug}/lessons`}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Browse All Lessons
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/courses/${courseSlug}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Course
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Lesson Navigation */}
            <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-indigo-500/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {lessonProgress === 100 ? "Great job! You've completed this lesson." : "Continue your learning journey"}
                    </h3>
                    <p className="text-slate-600">
                      {nextLesson 
                        ? `Next up: ${nextLesson.title}` 
                        : "You've reached the end of this module. Great progress!"
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {previousLesson && (
                      <Button variant="outline" asChild>
                        <Link href={`/courses/${courseSlug}/lessons/${previousLesson.id}`}>
                          <SkipBack className="w-4 h-4 mr-2" />
                          Previous
                        </Link>
                      </Button>
                    )}
                    {nextLesson && (
                      <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
                          Next Lesson
                          <SkipForward className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Lesson Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Enhanced Chapter Navigation */}
              <Card className="bg-white shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50/30 border-b">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <span>Chapters</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      {completedChapters}/{lesson.chapters.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {lesson.chapters.length > 0 ? (
                    <div className="space-y-1 p-4">
                      {lesson.chapters.map((chapter: any, index: number) => (
                        <div 
                          key={chapter.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                            completedChapters > index 
                              ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
                              : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              completedChapters > index 
                                ? 'bg-green-500 text-white shadow-lg' 
                                : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                            }`}>
                              {completedChapters > index ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <span className="text-xs font-bold">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-900 line-clamp-1">
                                {chapter.title}
                              </span>
                              <div className="text-xs text-slate-500 mt-0.5">
                                ~15 min
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {chapter.audioUrl && (
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Volume2 className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            {chapter.videoUrl && (
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <PlayCircle className="w-3 h-3 text-blue-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">No chapters yet</p>
                      <p className="text-xs text-slate-400 mt-1">Content is being prepared</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Instructor Info */}
              <Card className="bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-indigo-500/5 border-b border-primary/10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    Your Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {course.instructorId ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            P
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">
                            Course Instructor
                          </p>
                          <p className="text-sm text-primary font-medium">Expert Producer</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-slate-600">4.9 • 1.2k students</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                          {course.description || "Expert instructor with years of experience in music production and education."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Button asChild variant="outline" size="sm" className="w-full border-primary/30 text-primary hover:bg-primary hover:text-white">
                          <Link href={`/courses/${courseSlug}`}>
                            <User className="w-4 h-4 mr-2" />
                            View Course Details
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full text-slate-600 hover:text-primary">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Ask a Question
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm text-slate-500">Instructor information coming soon</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 