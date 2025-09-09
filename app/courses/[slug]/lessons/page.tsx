import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { getUserFromClerk } from "@/lib/data";
// Prisma removed - using Convex instead

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
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
  Lock
} from "lucide-react";

export default async function LessonsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { userId: clerkId } = await auth();
  const { slug: courseSlug } = await params;

  // Get course with lessons and modules
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug },
    include: {
      instructor: true,
      enrollments: true,
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
      },
      category: true
    }
  });

  if (!course) {
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

  // Check if user is admin
  const isAdmin = user?.admin === true;

  // Calculate total lessons and chapters
  const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const totalChapters = course.modules.reduce((total, module) => 
    total + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.chapters.length, 0), 0
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
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back to course link */}
          <Link 
            href={`/courses/${courseSlug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold">
                  📚 Course Lessons
                </Badge>
                {course.category && (
                  <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10 backdrop-blur-sm">
                    {course.category.name}
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="bg-gradient-to-r from-red-400 to-pink-400 text-white font-semibold">
                    🔑 Admin Access
                  </Badge>
                )}
                {enrollment && (
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-black font-semibold">
                    ✓ Enrolled
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
              <p className="text-xl text-slate-200 mb-6">{course.description}</p>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm text-white/80">Modules</span>
                  </div>
                  <div className="text-xl font-bold text-white">{course.modules.length}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayCircle className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-white/80">Lessons</span>
                  </div>
                  <div className="text-xl font-bold text-white">{totalLessons}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-purple-300" />
                    <span className="text-sm text-white/80">Chapters</span>
                  </div>
                  <div className="text-xl font-bold text-white">{totalChapters}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-300" />
                    <span className="text-sm text-white/80">Duration</span>
                  </div>
                  <div className="text-xl font-bold text-white">{Math.ceil(totalChapters * 0.25)}h</div>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
                  {enrollment ? (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2 text-white/80">
                          <span>Course Progress</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="bg-white/20" />
                      </div>
                      
                      <div className="space-y-3 text-sm text-white/80">
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="text-green-300 font-medium">{completedChapters}/{totalChapters} chapters</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time invested:</span>
                          <span className="text-blue-300 font-medium">{Math.ceil(completedChapters * 0.25)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated remaining:</span>
                          <span className="text-yellow-300 font-medium">{Math.ceil((totalChapters - completedChapters) * 0.25)}h</span>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="text-white/80 mb-4">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Lock className="w-8 h-8 text-white/60" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search lessons..." 
              className="pl-10 bg-white border-slate-200 focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="bg-white">
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-12">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="space-y-6">
              {/* Module Header */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Module {moduleIndex + 1}
                    </Badge>
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
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
                
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{module.title}</h2>
                {module.description && (
                  <p className="text-slate-600 leading-relaxed">
                    {module.description.replace(/<[^>]*>/g, '').substring(0, 300)}...
                  </p>
                )}
              </div>

              {/* Lessons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {module.lessons.map((lesson, lessonIndex) => {
                   const isLocked = !isAdmin && !enrollment && !lesson.chapters.some(ch => ch.isFree);
                   const hasAudio = lesson.chapters.some(ch => ch.audioUrl);
                   const hasVideo = lesson.chapters.some(ch => ch.videoUrl);
                   
                   if (isLocked) {
                     return (
                       <div key={lesson.id} className="group cursor-not-allowed">
                         <Card className="h-full transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg bg-white opacity-75">
                           {/* Lesson Header */}
                           <div className="relative">
                             <div className="h-32 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 relative overflow-hidden">
                               <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="text-center">
                                   <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-white/30">
                                     <Lock className="w-6 h-6 text-white" />
                                   </div>
                                   <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                                     Lesson {lessonIndex + 1}
                                   </Badge>
                                 </div>
                               </div>
                               <div className="absolute top-4 right-4">
                                 <div className="flex items-center gap-1">
                                   {hasAudio && (
                                     <div className="w-6 h-6 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                       <Volume2 className="w-3 h-3 text-white" />
                                     </div>
                                   )}
                                   {hasVideo && (
                                     <div className="w-6 h-6 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                       <PlayCircle className="w-3 h-3 text-white" />
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           {/* Lesson Content */}
                           <CardContent className="p-6">
                             <h3 className="text-xl font-semibold mb-3 line-clamp-2 text-slate-500">
                               {lesson.title}
                             </h3>
                             
                             {lesson.description && (
                               <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                                 {lesson.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                               </p>
                             )}
                             
                             <div className="flex items-center justify-between text-sm">
                               <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-1 text-slate-500">
                                   <FileText className="w-4 h-4" />
                                   <span>{lesson.chapters.length} chapters</span>
                                 </div>
                                 <div className="flex items-center gap-1 text-slate-500">
                                   <Clock className="w-4 h-4" />
                                   <span>~{lesson.chapters.length * 15}min</span>
                                 </div>
                               </div>
                               
                                                            <div className="flex items-center gap-2">
                               {isAdmin ? (
                                 <Badge className="bg-red-100 text-red-800 text-xs">
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
                       <Card className="h-full cursor-pointer transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg bg-white">
                         {/* Lesson Header */}
                         <div className="relative">
                           <div className="h-32 bg-gradient-to-br from-primary/80 via-purple-600/80 to-indigo-600/80 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                             <div className="absolute inset-0 flex items-center justify-center">
                               <div className="text-center">
                                 <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 border border-white/30">
                                   <PlayCircle className="w-6 h-6 text-white" />
                                 </div>
                                 <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                                   Lesson {lessonIndex + 1}
                                 </Badge>
                               </div>
                             </div>
                             <div className="absolute top-4 right-4">
                               <div className="flex items-center gap-1">
                                 {hasAudio && (
                                   <div className="w-6 h-6 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                     <Volume2 className="w-3 h-3 text-white" />
                                   </div>
                                 )}
                                 {hasVideo && (
                                   <div className="w-6 h-6 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                     <PlayCircle className="w-3 h-3 text-white" />
                                   </div>
                                 )}
                                 <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                   <ChevronRight className="w-4 h-4 text-white" />
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                         
                         {/* Lesson Content */}
                         <CardContent className="p-6">
                           <h3 className="text-xl font-semibold mb-3 line-clamp-2 transition-colors text-slate-900 group-hover:text-primary">
                             {lesson.title}
                           </h3>
                           
                           {lesson.description && (
                             <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                               {lesson.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                             </p>
                           )}
                           
                           <div className="flex items-center justify-between text-sm">
                             <div className="flex items-center gap-4">
                               <div className="flex items-center gap-1 text-slate-500">
                                 <FileText className="w-4 h-4" />
                                 <span>{lesson.chapters.length} chapters</span>
                               </div>
                               <div className="flex items-center gap-1 text-slate-500">
                                 <Clock className="w-4 h-4" />
                                 <span>~{lesson.chapters.length * 15}min</span>
                               </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               {enrollment && (
                                 <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                   <CheckCircle className="w-3 h-3 text-green-600" />
                                 </div>
                               )}
                               <div className="flex items-center gap-1 text-primary">
                                 <span className="text-xs font-medium">Start</span>
                                 <ChevronRight className="w-3 h-3" />
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
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No lessons available yet</h3>
              <p className="text-slate-500 mb-6">Course content is being prepared by our expert instructors.</p>
              <Badge variant="outline" className="text-slate-500">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        )}
        
        {/* Course Completion CTA */}
        {enrollment && course.modules.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 border-primary/20 mt-12">
            <CardContent className="p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to accelerate your learning?</h3>
                <p className="text-slate-600 mb-6">
                  You're making great progress! Complete all {totalLessons} lessons to earn your certificate 
                  and unlock advanced course materials.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                    <Play className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
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