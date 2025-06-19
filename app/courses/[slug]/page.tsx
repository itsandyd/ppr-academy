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
  Settings
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
    const modules: any[] = [];
    let currentModule: any = null;
    let currentLesson: any = null;

    chapters.forEach((chapter, index) => {
      if (chapter.title.startsWith('📚')) {
        // Module header
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
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
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
              
              <h1 className="text-4xl font-bold mb-4 text-white">{course.title}</h1>
              <p className="text-xl mb-6 text-slate-200">{course.description}</p>
              
              <div className="flex items-center space-x-6 text-slate-200">
                {course.instructor && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={course.instructor.imageUrl || undefined} />
                      <AvatarFallback className="bg-slate-700 text-white">
                        {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </p>
                      <p className="text-sm text-slate-200">Instructor</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{allChapters.length} chapters</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <div className="relative">
                  <img
                    src={course.imageUrl || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop"}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-t-lg">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-primary">
                      ${course.price ? course.price.toFixed(0) : '0'}
                    </p>
                  </div>
                  
                  <CourseDetailClient 
                    courseId={course.id}
                    isAuthenticated={!!user}
                    isEnrolled={!!enrollment}
                    userProgress={enrollment?.progress || 0}
                    user={user}
                  />
                  
                  <div className="mt-6 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Full lifetime access</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{allChapters.length} chapters</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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