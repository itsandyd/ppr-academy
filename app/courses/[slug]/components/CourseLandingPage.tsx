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
    description: string;
    orderIndex: number;
    lessons: Array<{
      title: string;
      description: string;
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Course Info */}
            <div className="space-y-8">
              {/* Course Category & Level */}
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
                  {course.category || "Course"}
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  {course.skillLevel || "All Levels"}
                </Badge>
              </div>

              {/* Course Title */}
              <h1 className="text-5xl font-bold leading-tight">
                {course.title}
              </h1>

              {/* Course Description */}
              <p className="text-xl text-white/90 leading-relaxed">
                {course.description || "Master essential skills with this comprehensive course designed for creators like you."}
              </p>

              {/* Course Stats */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-white/80" />
                  <span className="font-medium">{totalModules} Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-white/80" />
                  <span className="font-medium">{totalLessons} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-white/80" />
                  <span className="font-medium">~{estimatedHours} Hours</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-4">
                <Button 
                  size="lg"
                  onClick={handleEnrollClick}
                  className="bg-white text-emerald-600 hover:bg-white/90 text-lg px-8 py-4 h-auto"
                >
                  {course.price && course.price > 0 ? (
                    <>Enroll Now - ${course.price}</>
                  ) : (
                    <>Enroll for Free</>
                  )}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="text-white/80">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-sm">Join thousands of students</p>
                </div>
              </div>
            </div>

            {/* Right: Course Image */}
            <div className="relative">
              <div className="w-full h-96 bg-white/10 rounded-2xl overflow-hidden backdrop-blur-sm border border-white/20">
                {course.imageUrl ? (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-24 h-24 text-white/60" />
                  </div>
                )}
              </div>
              
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{totalLessons}</div>
                  <div className="text-sm text-muted-foreground">Lessons</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">What You'll Learn</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              This comprehensive course covers everything you need to know, with hands-on examples and real-world applications.
            </p>
          </div>

          {/* Course Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {course.modules?.map((module) => (
              <Card key={module.orderIndex} className="border-emerald-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-sm">{module.orderIndex}</span>
                    </div>
                    {module.title}
                  </CardTitle>
                  <p className="text-muted-foreground">{module.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.orderIndex} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm text-emerald-800">
                            {lesson.title}
                          </h4>
                          {lesson.description && (
                            <p className="text-xs text-emerald-600 mt-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-emerald-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose This Course?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-emerald-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Practical Learning</h3>
              <p className="text-muted-foreground">
                Learn by doing with hands-on exercises and real-world examples that you can apply immediately.
              </p>
            </Card>

            <Card className="text-center p-8 border-emerald-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Instant Access</h3>
              <p className="text-muted-foreground">
                Start learning immediately after enrollment. All content is available right away with lifetime access.
              </p>
            </Card>

            <Card className="text-center p-8 border-emerald-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Level Up Skills</h3>
              <p className="text-muted-foreground">
                Transform your abilities with expert techniques and insider knowledge from industry professionals.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Instructor Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Meet Your Instructor</h2>
          </div>

          <Card className="p-8 border-emerald-200">
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={creator?.imageUrl} alt={creatorName} />
                <AvatarFallback className="text-xl font-bold bg-emerald-100 text-emerald-600">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2">{creatorName}</h3>
                <p className="text-emerald-600 font-medium mb-4">Course Creator • {store.name}</p>
                
                {creator?.bio ? (
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {creator.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Passionate educator and industry expert dedicated to helping students master their craft through practical, 
                    hands-on learning experiences.
                  </p>
                )}

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">1000+ Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">Expert Instructor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-600 fill-current" />
                    <span className="text-sm font-medium">4.9 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have transformed their skills with this comprehensive course.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              size="lg"
              onClick={handleEnrollClick}
              className="bg-white text-emerald-600 hover:bg-white/90 text-xl px-12 py-6 h-auto"
            >
              {course.price && course.price > 0 ? (
                <>Enroll Now - ${course.price}</>
              ) : (
                <>Start Learning for Free</>
              )}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">30-day money-back guarantee</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Lifetime access included</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-white/80 mb-4">Trusted by creators worldwide</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold">1,000+</div>
                <div className="text-sm text-white/80">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.9</div>
                <div className="text-sm text-white/80">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-white/80">Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={creator?.imageUrl} alt={creatorName} />
                <AvatarFallback className="bg-emerald-100 text-emerald-600">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{store.name}</p>
                <p className="text-sm text-muted-foreground">by {creatorName}</p>
              </div>
            </div>
            
            <Link href={`/${store.slug}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All Products →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
