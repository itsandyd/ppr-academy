import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { getUserFromClerk } from "@/lib/data";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  Clock,
  Star,
  PlayCircle,
  CheckCircle,
  Users,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Volume2,
  FileText,
  Search,
  Filter,
  Grid,
  List,
  Play,
  Lock,
} from "lucide-react";

export default async function LessonsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { userId: clerkId } = await auth();
  const { slug: courseSlug } = await params;

  // Get course by slug from Convex
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
    description: courseData.description,
    category: courseData.category ? { name: courseData.category } : null,
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
            videoUrl: ch.videoUrl,
            audioUrl: ch.audioUrl,
            position: ch.position,
            isPublished: ch.isPublished ?? true,
            isFree: ch.isFree ?? false,
          }))
      }))
    }))
  };

  // Get current user and enrollment
  let user = null;
  let enrollment: { progress: number } | null = null;

  if (clerkId) {
    user = await getUserFromClerk(clerkId);
    if (user) {
      // Check enrollment via Convex
      const accessCheck = await fetchQuery(api.library.verifyCourseAccess, {
        userId: clerkId,
        slug: courseSlug
      });

      if (accessCheck?.hasAccess) {
        enrollment = { progress: accessCheck.progress || 0 };
      }
    }
  }

  // Check if user is admin
  const isAdmin = user?.admin === true;

  // Calculate total lessons and chapters
  const totalLessons = course.modules.reduce(
    (total: number, module: any) => total + module.lessons.length,
    0
  );
  const totalChapters = course.modules.reduce(
    (total: number, module: any) =>
      total +
      module.lessons.reduce(
        (lessonTotal: number, lesson: any) => lessonTotal + lesson.chapters.length,
        0
      ),
    0
  );

  // Get completed chapters if enrolled
  let completedChapters = 0;
  if (enrollment) {
    // This would need to be implemented with a UserProgress model
    // For now, we'll use mock data based on enrollment progress
    completedChapters = Math.floor((enrollment.progress / 100) * totalChapters);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Back to course link */}
          <Link
            href={`/courses/${courseSlug}`}
            className="mb-8 inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Course Info */}
            <div className="lg:col-span-3">
              <div className="mb-6 flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 font-semibold text-black">
                  📚 Course Lessons
                </Badge>
                {course.category && (
                  <Badge
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white/90 backdrop-blur-sm"
                  >
                    {course.category.name}
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="bg-gradient-to-r from-red-400 to-pink-400 font-semibold text-white">
                    🔑 Admin Access
                  </Badge>
                )}
                {enrollment && (
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 font-semibold text-black">
                    ✓ Enrolled
                  </Badge>
                )}
              </div>

              <h1 className="mb-4 text-4xl font-bold text-white">{course.title}</h1>
              <p className="mb-6 text-xl text-slate-200">{course.description}</p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm text-white/80">Modules</span>
                  </div>
                  <div className="text-xl font-bold text-white">{course.modules.length}</div>
                </div>

                <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-blue-300" />
                    <span className="text-sm text-white/80">Lessons</span>
                  </div>
                  <div className="text-xl font-bold text-white">{totalLessons}</div>
                </div>

                <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-300" />
                    <span className="text-sm text-white/80">Chapters</span>
                  </div>
                  <div className="text-xl font-bold text-white">{totalChapters}</div>
                </div>

                <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-300" />
                    <span className="text-sm text-white/80">Duration</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {Math.ceil(totalChapters * 0.25)}h
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="lg:col-span-1">
              <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Your Progress</h3>
                  {enrollment ? (
                    <div className="space-y-6">
                      <div>
                        <div className="mb-2 flex justify-between text-sm text-white/80">
                          <span>Course Progress</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="bg-white/20" />
                      </div>

                      <div className="space-y-3 text-sm text-white/80">
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-medium text-green-300">
                            {completedChapters}/{totalChapters} chapters
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time invested:</span>
                          <span className="font-medium text-blue-300">
                            {Math.ceil(completedChapters * 0.25)}h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated remaining:</span>
                          <span className="font-medium text-yellow-300">
                            {Math.ceil((totalChapters - completedChapters) * 0.25)}h
                          </span>
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        <Play className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="mb-4 text-white/80">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                          <Lock className="h-8 w-8 text-white/60" />
                        </div>
                        <p>Enroll to track your progress and access all lessons</p>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        Enroll Now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
            <Input
              placeholder="Search lessons..."
              className="border-slate-200 bg-white pl-10 focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="bg-white">
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-12">
          {course.modules.map((module: any, moduleIndex: number) => (
            <div key={module.id} className="space-y-6">
              {/* Module Header */}
              <div className="rounded-xl border-0 bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      Module {moduleIndex + 1}
                    </Badge>
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <Badge variant="secondary" className="text-xs">
                      {module.lessons.length} lessons
                    </Badge>
                  </div>

                  {enrollment && (
                    <Badge className="bg-green-100 text-green-800">
                      {Math.round((completedChapters / totalChapters) * 100)}% complete
                    </Badge>
                  )}
                </div>

                <h2 className="mb-3 text-2xl font-bold text-slate-900">{module.title}</h2>
                {module.description && (
                  <p className="leading-relaxed text-slate-600">
                    {module.description.replace(/<[^>]*>/g, "").substring(0, 300)}...
                  </p>
                )}
              </div>

              {/* Lessons Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {module.lessons.map((lesson: any, lessonIndex: number) => {
                  const isLocked =
                    !isAdmin && !enrollment && !lesson.chapters.some((ch: any) => ch.isFree);
                  const hasAudio = lesson.chapters.some((ch: any) => ch.audioUrl);
                  const hasVideo = lesson.chapters.some((ch: any) => ch.videoUrl);

                  if (isLocked) {
                    return (
                      <div key={lesson.id} className="group cursor-not-allowed">
                        <Card className="h-full transform overflow-hidden border-0 bg-white opacity-75 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                          {/* Lesson Header */}
                          <div className="relative">
                            <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600">
                              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
                                    <Lock className="h-6 w-6 text-white" />
                                  </div>
                                  <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                                    Lesson {lessonIndex + 1}
                                  </Badge>
                                </div>
                              </div>
                              <div className="absolute right-4 top-4">
                                <div className="flex items-center gap-1">
                                  {hasAudio && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-green-500/80 backdrop-blur-sm">
                                      <Volume2 className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                  {hasVideo && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-red-500/80 backdrop-blur-sm">
                                      <PlayCircle className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Lesson Content */}
                          <CardContent className="p-6">
                            <h3 className="mb-3 line-clamp-2 text-xl font-semibold text-slate-500">
                              {lesson.title}
                            </h3>

                            {lesson.description && (
                              <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                                {lesson.description.replace(/<[^>]*>/g, "").substring(0, 120)}...
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-slate-500">
                                  <FileText className="h-4 w-4" />
                                  <span>{lesson.chapters.length} chapters</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Clock className="h-4 w-4" />
                                  <span>~{lesson.chapters.length * 15}min</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isAdmin ? (
                                  <Badge className="bg-red-100 text-xs text-red-800">
                                    🔑 Admin Access
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Locked
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
                      className="group"
                    >
                      <Card className="h-full transform cursor-pointer overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                        {/* Lesson Header */}
                        <div className="relative">
                          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/80 via-purple-600/80 to-indigo-600/80">
                            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
                                  <PlayCircle className="h-6 w-6 text-white" />
                                </div>
                                <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                                  Lesson {lessonIndex + 1}
                                </Badge>
                              </div>
                            </div>
                            <div className="absolute right-4 top-4">
                              <div className="flex items-center gap-1">
                                {hasAudio && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-green-500/80 backdrop-blur-sm">
                                    <Volume2 className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {hasVideo && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-red-500/80 backdrop-blur-sm">
                                    <PlayCircle className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
                                  <ChevronRight className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lesson Content */}
                        <CardContent className="p-6">
                          <h3 className="mb-3 line-clamp-2 text-xl font-semibold text-slate-900 transition-colors group-hover:text-primary">
                            {lesson.title}
                          </h3>

                          {lesson.description && (
                            <p className="mb-4 line-clamp-3 text-sm text-slate-600">
                              {lesson.description.replace(/<[^>]*>/g, "").substring(0, 120)}...
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-slate-500">
                                <FileText className="h-4 w-4" />
                                <span>{lesson.chapters.length} chapters</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500">
                                <Clock className="h-4 w-4" />
                                <span>~{lesson.chapters.length * 15}min</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {enrollment && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-primary">
                                <span className="text-xs font-medium">Start</span>
                                <ChevronRight className="h-3 w-3" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* No lessons state */}
        {course.modules.length === 0 && (
          <Card className="border-2 border-dashed border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-slate-600">No lessons available yet</h3>
              <p className="mb-6 text-slate-500">
                Course content is being prepared by our expert instructors.
              </p>
              <Badge variant="outline" className="text-slate-500">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Course Completion CTA */}
        {enrollment && course.modules.length > 0 && (
          <Card className="mt-12 border-primary/20 bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10">
            <CardContent className="p-8 text-center">
              <div className="mx-auto max-w-2xl">
                <h3 className="mb-4 text-2xl font-bold text-slate-900">
                  Ready to accelerate your learning?
                </h3>
                <p className="mb-6 text-slate-600">
                  You're making great progress! Complete all {totalLessons} lessons to earn your
                  certificate and unlock advanced course materials.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                    <Play className="mr-2 h-4 w-4" />
                    Continue Learning
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Download Study Guide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
