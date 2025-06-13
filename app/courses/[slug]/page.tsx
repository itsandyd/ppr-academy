import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserFromClerk } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { CourseDetailClient } from "@/components/course/course-detail-client";
import { 
  Clock, 
  Star,
  PlayCircle,
  CheckCircle
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
      },
      category: true
    }
  });
  
  // Debug logging
  if (course) {
    console.log(`✅ Found course: "${course.title}" (ID: ${course.id}) with ${course.chapters.length} chapters`);
    console.log(`📝 First chapter: ${course.chapters[0]?.title || 'No chapters'}`);
    console.log(`📝 Description preview: ${course.chapters[0]?.description?.substring(0, 100) || 'No content'}...`);
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

  // Use chapters from the relation (already fetched and ordered)
  const chapters = course.chapters;

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

  const courseWithChapters = {
    ...course,
    courseChapters: chapters,
    rating: { rating: 4.5, count: course.enrollments.length },
    modules: [{
      id: 1,
      title: "Course Content",
      description: "All course chapters",
      lessons: [{
        id: 1,
        title: "Course Lessons",
        description: "Complete course content",
        chapters: chapters
      }]
    }]
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary">Music Production</Badge>
                <Badge variant="outline" className="border-white/30 text-white">
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              
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
                  <span>{chapters.length} chapters</span>
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
                      <span>{chapters.length} chapters</span>
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