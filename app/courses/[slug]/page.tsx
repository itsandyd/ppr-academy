import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserFromClerk } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { CourseDetailClient } from "@/components/course/course-detail-client";
import { CourseEditHeader } from "@/components/course/course-edit-header";
import { CourseContentEditor } from "@/components/course/course-content-editor";
import { 
  Clock, 
  Star,
  PlayCircle,
  CheckCircle,
  Edit,
  Settings,
  Users,
  BookOpen,
  Award,
  Globe
} from "lucide-react";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { userId: clerkId } = await auth();
  const { slug: courseSlug } = await params;

  console.log(`Looking for course with slug: ${courseSlug}`);

  // ONLY look for exact slug match - no fallbacks that could find wrong course
  console.log(`🔍 Looking for course with exact slug: ${courseSlug}`);
  
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
      chapters: {
        where: { lessonId: null }, // Get chapters not assigned to lessons (legacy/direct course chapters)
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
      },
      category: true
    }
  });
  
  // Debug logging
  if (course) {
    console.log(`✅ Found course: "${course.title}" (ID: ${course.id})`);
    console.log(`📚 Course has ${course.modules.length} modules`);
    console.log(`📖 Course has ${course.chapters.length} legacy chapters`);
    
    const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
    const totalChapters = course.modules.reduce((total, module) => 
      total + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.chapters.length, 0), 0
    ) + course.chapters.length;
    
    console.log(`🎯 Total lessons: ${totalLessons}`);
    console.log(`📝 Total chapters: ${totalChapters}`);
  } else {
    console.log(`❌ No course found with slug: ${courseSlug}`);
    
    // Debug: Show what courses actually exist
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📚 Recent courses in database:', allCourses.map(c => ({
      title: c.title,
      slug: c.slug || 'NO_SLUG',
      published: c.isPublished,
      created: c.createdAt.toISOString()
    })));
  }
  
  if (!course) {
    notFound();
  }

  // Get current user if authenticated
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

  // Handle migration from emoji-based system to proper relational structure
  const handleLegacyChapters = () => {
    if (course.modules.length === 0 && course.chapters.length > 0) {
      // Course still uses emoji-based system, reconstruct for backward compatibility
      return reconstructModulesFromChapters(course.chapters);
    }
    return course.modules;
  };

  // Legacy reconstruction function for backward compatibility
  const reconstructModulesFromChapters = (chapters: any[]) => {
    console.log(`🔍 DEBUGGING: Reconstructing modules from ${chapters.length} chapters:`);
    chapters.forEach((ch, i) => {
      console.log(`  ${i + 1}. [${ch.position}] "${ch.title}" (ID: ${ch.id})`);
    });

    const modules: any[] = [];
    let currentModule: any = null;
    let currentLesson: any = null;

    chapters.forEach((chapter, index) => {
      if (chapter.title.startsWith('📚')) {
        // Module header
        console.log(`📚 Found module chapter: "${chapter.title}" (ID: ${chapter.id})`);
        if (currentModule && currentModule.lessons.length > 0) {
          modules.push(currentModule);
        }
        currentModule = {
          id: modules.length + 1,
          chapterId: chapter.id, // Store the actual chapter ID for editing
          title: chapter.title.replace('📚 ', ''),
          description: chapter.description || '',
          lessons: []
        };
        currentLesson = null;
      } else if (chapter.title.startsWith('🎯')) {
        // Lesson introduction
        if (currentLesson && currentModule) {
          currentModule.lessons.push(currentLesson);
        }
        const lessonTitle = chapter.title.replace('🎯 ', '').split(': ')[1] || chapter.title.replace('🎯 ', '');
        currentLesson = {
          id: currentModule ? currentModule.lessons.length + 1 : 1,
          chapterId: chapter.id, // Store the actual chapter ID for editing
          title: lessonTitle,
          description: chapter.description || '',
          chapters: []
        };
      } else {
        // Content chapter
        if (currentLesson) {
          currentLesson.chapters.push(chapter);
        } else {
          // Fallback: create a lesson if none exists
          if (!currentModule) {
            currentModule = {
              id: 1,
              chapterId: null,
              title: 'Course Content',
              description: 'Course chapters',
              lessons: []
            };
          }
          if (!currentLesson) {
            currentLesson = {
              id: 1,
              chapterId: null,
              title: 'Course Lessons',
              description: 'Course content',
              chapters: []
            };
            currentModule.lessons.push(currentLesson);
          }
          currentLesson.chapters.push(chapter);
        }
      }
    });

    // Add the last lesson and module
    if (currentLesson && currentModule) {
      currentModule.lessons.push(currentLesson);
    }
    if (currentModule) {
      modules.push(currentModule);
    }

    // Fallback for courses without proper module structure
    if (modules.length === 0) {
      modules.push({
        id: 1,
        chapterId: null,
        title: "Course Content",
        description: "All course chapters",
        lessons: [{
          id: 1,
          chapterId: null,
          title: "Course Lessons",
          description: "Complete course content",
          chapters: chapters
        }]
      });
    }

    return modules;
  };

  // Get modules (either from new structure or legacy reconstruction)
  const courseModules = handleLegacyChapters();
  
  // Create a flattened chapters array for backward compatibility
  const allChapters = course.modules.length > 0 
    ? course.modules.flatMap(module => 
        module.lessons.flatMap(lesson => lesson.chapters)
      ).concat(course.chapters)
    : course.chapters;
  
  console.log(`📚 Course structure: ${courseModules.length} modules, ${allChapters.length} total chapters`);

  const courseWithChapters = {
    ...course,
    courseChapters: allChapters,
    rating: { rating: 4.5, count: course.enrollments.length },
    modules: courseModules
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 pt-16">
      {/* Hero Section with Course Info */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-2 space-y-8">
              <CourseEditHeader 
                course={{
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  price: course.price,
                  isPublished: course.isPublished,
                  slug: course.slug
                }}
                user={user}
                isOwner={user?.id === course.instructorId}
              />
              
              {/* Course Badge */}
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold px-3 py-1">
                  ⭐ Premium Course
                </Badge>
                {course.category && (
                  <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10 backdrop-blur-sm">
                    {course.category.name}
                  </Badge>
                )}
              </div>
              
              {/* Course Title */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  {course.title}
                </h1>
                <p className="text-xl text-slate-200 leading-relaxed max-w-3xl">
                  {course.description}
                </p>
              </div>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm text-white/80">Chapters</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{allChapters.length}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-300" />
                    <span className="text-sm text-white/80">Students</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{course.enrollments.length}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-300" />
                    <span className="text-sm text-white/80">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{Math.ceil(allChapters.length * 0.25)}h</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-purple-300" />
                    <span className="text-sm text-white/80">Level</span>
                  </div>
                  <div className="text-lg font-bold text-white">All Levels</div>
                </div>
              </div>
              
              {/* Instructor Info */}
              {course.instructor && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 ring-2 ring-white/30">
                      <AvatarImage src={course.instructor.imageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg">
                        {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-white">
                          {course.instructor.firstName} {course.instructor.lastName}
                        </h3>
                        <Badge variant="outline" className="border-yellow-400/50 text-yellow-300 bg-yellow-400/10">
                          Instructor
                        </Badge>
                      </div>
                      <p className="text-slate-300">Music Production Expert</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          4.9 rating
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrollments.length} students
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="overflow-hidden shadow-2xl border-0 bg-white">
                  {/* Course Preview Image */}
                  <div className="relative">
                    <img
                      src={course.imageUrl || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop"}
                      alt={course.title}
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border border-white/30">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        Premium
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-8">
                    {/* Pricing */}
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-4xl font-bold text-slate-900">
                          ${course.price ? course.price.toFixed(0) : '0'}
                        </span>
                        <div className="text-right">
                          <div className="text-sm text-slate-500 line-through">$199</div>
                          <Badge variant="destructive" className="text-xs">75% OFF</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">One-time payment • Lifetime access</p>
                    </div>
                    
                    {/* Enrollment Component */}
                    <CourseDetailClient 
                      courseId={course.id}
                      isAuthenticated={!!user}
                      isEnrolled={!!enrollment}
                      userProgress={enrollment?.progress || 0}
                      user={user}
                    />
                    
                    {/* Course Features */}
                    <div className="mt-8 space-y-4">
                      <h4 className="font-semibold text-slate-900 mb-4">This course includes:</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700">{allChapters.length} video lessons</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700">Downloadable resources</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700">Mobile & desktop access</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700">Certificate of completion</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700">30-day money-back guarantee</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl hidden lg:block"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-xl hidden lg:block"></div>
      </div>

      {/* Course Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <CourseContentEditor
          courseId={course.id}
          modules={courseModules}
          chapters={allChapters}
          user={user}
          isOwner={user?.id === course.instructorId}
        />
        
        <CourseDetailClient 
          courseId={course.id}
          isAuthenticated={!!user}
          isEnrolled={!!enrollment}
          userProgress={enrollment?.progress || 0}
          user={user}
          course={courseWithChapters}
          showContent={true}
        />
      </div>
    </div>
  );
} 