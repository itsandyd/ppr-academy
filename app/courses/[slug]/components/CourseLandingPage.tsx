"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Award,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourseQAChat } from "@/components/course/CourseQAChat";

interface Course {
  _id: string;
  slug?: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  skillLevel?: string;
  storeId?: string;
  userId: string;
  modules?: Array<{
    title: string;
    description?: string;
    orderIndex: number;
    lessons: Array<{
      title: string;
      description?: string;
      orderIndex: number;
    }>;
  }>;
}

interface Store {
  _id: string;
  name: string;
  slug: string;
  userId: string;
}

interface Creator {
  _id: string;
  name?: string;
  imageUrl?: string;
  bio?: string;
}

interface CourseLandingPageProps {
  course: Course;
  store: Store;
  creator: Creator | null;
}

export function CourseLandingPage({ course, store, creator }: CourseLandingPageProps) {
  const router = useRouter();
  
  // Calculate course stats
  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const estimatedHours = Math.round(totalLessons * 0.75); // Rough estimate

  const creatorName = creator?.name || "Course Creator";
  const creatorInitials = creatorName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleEnrollClick = () => {
    router.push(`/courses/${course.slug || course._id}/checkout`);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Left: Course Info */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0">
              {/* Course Category & Level */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20 text-xs sm:text-sm shrink-0">
                  {course.category || "Course"}
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10 text-xs sm:text-sm shrink-0">
                  {course.skillLevel || "All Levels"}
                </Badge>
              </div>

              {/* Course Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight break-words">
                {course.title}
              </h1>

              {/* Course Description */}
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90 leading-relaxed break-words">
                {course.description || "Master essential skills with this comprehensive course designed for creators like you."}
              </p>

              {/* Course Stats */}
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">{totalModules} Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">{totalLessons} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">~{estimatedHours} Hours</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-4 w-full">
              <Button 
                size="lg"
                onClick={handleEnrollClick}
                className="bg-white text-gray-900 hover:bg-white/90 hover:shadow-xl font-semibold text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 h-auto w-full max-w-xs mx-auto sm:mx-0 sm:max-w-none sm:w-auto"
              >
                  <span className="truncate">
                    {course.price && course.price > 0 ? (
                      <>Enroll Now - ${course.price}</>
                    ) : (
                      <>Enroll for Free</>
                    )}
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                </Button>
                
                <div className="text-white/80 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                  </div>
                  <p className="text-xs sm:text-sm">Join thousands of students</p>
                </div>
              </div>
            </div>

            {/* Right: Course Image */}
            <div className="relative mt-6 sm:mt-8 lg:mt-0 min-w-0">
              <div className="w-full h-48 sm:h-64 lg:h-80 xl:h-96 bg-white/10 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm border border-white/20">
                {course.imageUrl ? (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-white/60" />
                  </div>
                )}
              </div>
              
              {/* Floating Stats - Hidden on mobile to prevent overflow */}
              <div className="hidden lg:block absolute -bottom-4 -right-4 xl:-bottom-6 xl:-right-6 bg-card rounded-xl p-3 xl:p-4 shadow-2xl border border-border">
                <div className="text-center">
                  <div className="text-xl xl:text-2xl font-bold text-primary">{totalLessons}</div>
                  <div className="text-xs xl:text-sm text-muted-foreground">Lessons</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn Section */}
      <div className="py-12 sm:py-16 bg-background overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground mb-4 break-words">What You'll Learn</h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto break-words">
              This comprehensive course covers everything you need to know, with hands-on examples and real-world applications.
            </p>
          </div>

          {/* Course Modules - Masonry Grid */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {course.modules?.map((module, idx) => (
              <div key={module.orderIndex} className="break-inside-avoid mb-6">
                <Card className="border-border bg-card/50 hover:bg-card transition-colors">
                  <CardContent className="p-5">
                    {/* Module Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground leading-tight">{module.title}</h3>
                        <p className="text-xs text-muted-foreground">{module.lessons.length} lessons</p>
                      </div>
                    </div>
                    
                    {/* Lessons List */}
                    <div className="space-y-2.5">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.orderIndex} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground/90 leading-snug">{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-12 sm:py-16 bg-muted/20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground mb-4 break-words">Why Choose This Course?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center p-6 sm:p-8 border-border">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">Practical Learning</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Learn by doing with hands-on exercises and real-world examples that you can apply immediately.
              </p>
            </Card>

            <Card className="text-center p-6 sm:p-8 border-border">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">Instant Access</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Start learning immediately after enrollment. All content is available right away with lifetime access.
              </p>
            </Card>

            <Card className="text-center p-6 sm:p-8 border-border sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">Level Up Skills</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Transform your abilities with expert techniques and insider knowledge from industry professionals.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Instructor Section */}
      <div className="py-12 sm:py-16 bg-card overflow-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground mb-4 break-words">Meet Your Instructor</h2>
          </div>

          <Card className="p-4 sm:p-6 lg:p-8 border-border min-w-0">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <Avatar className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto sm:mx-0 flex-shrink-0">
                <AvatarImage src={creator?.imageUrl} alt={creatorName} />
                <AvatarFallback className="text-base sm:text-lg lg:text-xl font-bold bg-primary/10 text-primary">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2 break-words">{creatorName}</h3>
                <p className="text-primary font-medium mb-4 text-xs sm:text-sm lg:text-base break-words">Course Creator • {store.name}</p>
                
                {creator?.bio ? (
                  <p className="text-muted-foreground leading-relaxed mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base break-words">
                    {creator.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base break-words">
                    Passionate educator and industry expert dedicated to helping students master their craft through practical, 
                    hands-on learning experiences.
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:gap-2 lg:gap-0 lg:flex-row items-center justify-center sm:justify-start lg:gap-4 xl:gap-6">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">1000+ Students</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">Expert Instructor</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-primary fill-current flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">4.9 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-16 bg-gradient-to-r from-primary to-purple-600 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 break-words">Ready to Start Learning?</h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto break-words">
            Join thousands of students who have transformed their skills with this comprehensive course.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
            <Button 
              size="lg"
              onClick={handleEnrollClick}
              className="bg-white text-gray-900 hover:bg-white/90 hover:shadow-2xl font-bold text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 h-auto w-full max-w-xs sm:max-w-sm"
            >
              <span className="truncate">
                {course.price && course.price > 0 ? (
                  <>Enroll Now - ${course.price}</>
                ) : (
                  <>Start Learning for Free</>
                )}
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ml-2 flex-shrink-0" />
            </Button>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">30-day money-back guarantee</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Lifetime access included</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20">
            <p className="text-white/80 mb-4 text-sm sm:text-base">Trusted by creators worldwide</p>
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">1,000+</div>
                <div className="text-xs sm:text-sm text-white/80">Students</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">4.9</div>
                <div className="text-xs sm:text-sm text-white/80">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">98%</div>
                <div className="text-xs sm:text-sm text-white/80">Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 sm:py-8 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={creator?.imageUrl} alt={creatorName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <p className="font-medium text-foreground text-sm sm:text-base">{store.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">by {creatorName}</p>
              </div>
            </div>
            
            <Link href={`/${store.slug}`} className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium">
              View All Products →
            </Link>
          </div>
        </div>
      </div>

      {/* Q&A Chat Component */}
      <CourseQAChat 
        courseId={course._id}
        courseTitle={course.title}
        userId={course.userId}
      />
    </div>
  );
}
