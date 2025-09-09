import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserFromClerk } from "@/lib/data";
// Prisma removed - using Convex instead
import Link from "next/link";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import { 
  Clock, 
  PlayCircle,
  ArrowLeft,
  Volume2,
  FileText,
  BookOpen,
  Eye,
  Lock,
  CheckCircle
} from "lucide-react";

export default async function ChaptersIndexPage({ 
  params 
}: { 
  params: Promise<{ slug: string; lessonId: string }> 
}) {
  const { userId: clerkId } = await auth();
  const { slug: courseSlug, lessonId } = await params;

  // Get the course and find the specific lesson
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug },
    include: {
      instructor: true,
      enrollments: true,
      category: true,
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' },
            include: {
              chapters: {
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  videoUrl: true,
                  audioUrl: true,
                  position: true,
                  isPublished: true,
                  isFree: true,
                }
              }
            }
          }
        }
      }
    }
  });

  if (!course) {
    notFound();
  }

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

  if (!lesson || !moduleWithLesson) {
    notFound();
  }

  // Get current user and enrollment
  let user = null;
  let enrollment = null;
  
  if (clerkId) {
    user = await getUserFromClerk(clerkId);
    if (user) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id
          }
        }
      });
    }
  }

  // Check access permissions
  const isAdmin = user?.admin === true;
  const isEnrolled = !!enrollment;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <Link 
              href={`/courses/${courseSlug}/lessons/${lessonId}`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lesson
            </Link>
            {isAdmin && (
              <Badge className="bg-orange-100 text-orange-800">
                🔑 Admin Access
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                All Chapters
              </h1>
              <p className="text-xl text-white/90 mb-6 drop-shadow">
                {lesson.title}
              </p>
              
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{lesson.chapters.length} chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>~{lesson.chapters.length * 15} minutes total</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>Course: {course.title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lesson.chapters.map((chapter: any, chapterIndex: number) => {
            const canAccessChapter = isAdmin || isEnrolled || chapter.isFree;
            
            return (
              <Card key={chapter.id} className="overflow-hidden shadow-lg border-0 bg-white group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
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
                            <Lock className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors duration-300">
                        {chapter.title}
                      </h3>
                      
                      {chapter.description && (
                        <p className="text-slate-600 mb-4 line-clamp-2">
                          {chapter.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                        </p>
                      )}
                      
                      {/* Chapter ID for reference */}
                      <div className="text-xs text-slate-400 font-mono mb-4">
                        ID: {chapter.id}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chapter Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>~15 min</span>
                    </div>
                    {chapter.videoUrl && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <PlayCircle className="w-4 h-4" />
                        <span>Video</span>
                      </div>
                    )}
                    {chapter.audioUrl && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Volume2 className="w-4 h-4" />
                        <span>Audio</span>
                      </div>
                    )}
                    {!chapter.videoUrl && !chapter.audioUrl && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <FileText className="w-4 h-4" />
                        <span>Text only</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-400">
                      Position: {chapter.position}
                    </div>
                    <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                      <Link href={canAccessChapter ? `/courses/${courseSlug}/lessons/${lessonId}/chapters/${chapter.id}` : `/courses/${courseSlug}`}>
                        {canAccessChapter ? (
                          <>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Watch Chapter
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Enroll to Access
                          </>
                        )}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {lesson.chapters.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-600 mb-2">No chapters yet</h3>
            <p className="text-slate-500 mb-8">This lesson doesn't have any chapters yet. Check back soon!</p>
            <Button asChild>
              <Link href={`/courses/${courseSlug}/lessons/${lessonId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lesson
              </Link>
            </Button>
          </div>
        )}
        
        {/* Summary Stats */}
        {lesson.chapters.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-primary/5 via-purple-500/5 to-indigo-500/5 rounded-2xl p-8 border border-primary/10">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Lesson Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{lesson.chapters.length}</div>
                <div className="text-sm text-slate-600">Total Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {lesson.chapters.filter((c: any) => c.isFree).length}
                </div>
                <div className="text-sm text-slate-600">Free Previews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {lesson.chapters.filter((c: any) => c.videoUrl).length}
                </div>
                <div className="text-sm text-slate-600">With Video</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  ~{lesson.chapters.length * 15}m
                </div>
                <div className="text-sm text-slate-600">Total Duration</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 