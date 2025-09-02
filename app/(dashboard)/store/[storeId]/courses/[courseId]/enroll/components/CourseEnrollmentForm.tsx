"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  Clock, 
  BookOpen, 
  Users, 
  Star,
  CheckCircle,
  ArrowLeft,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Course {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  skillLevel?: string;
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

interface CourseEnrollmentFormProps {
  course: Course;
  store: Store;
  storeId: string;
}

export function CourseEnrollmentForm({ course, store, storeId }: CourseEnrollmentFormProps) {
  const router = useRouter();
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate course stats
  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const estimatedHours = Math.round(totalLessons * 0.5); // Rough estimate

  const handleEnrollment = async () => {
    if (!customerData.name.trim() || !customerData.email.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement course enrollment/purchase logic
      // This would create a customer record and handle payment
      console.log("Course enrollment:", {
        courseId: course._id,
        storeId,
        customerData,
        amount: course.price || 0,
      });

      alert(`Enrollment functionality coming soon!\n\nCourse: ${course.title}\nPrice: $${course.price}\nCustomer: ${customerData.name} (${customerData.email})`);
      
      // TODO: Redirect to payment or course access page
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Failed to enroll. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-emerald-50 border-b border-emerald-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/${store.slug}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to {store.name}
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start gap-6">
            {/* Course Image */}
            <div className="w-32 h-32 bg-emerald-100 rounded-xl overflow-hidden flex-shrink-0">
              {course.imageUrl ? (
                <img 
                  src={course.imageUrl} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-emerald-600" />
                </div>
              )}
            </div>
            
            {/* Course Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-emerald-100 text-emerald-800">Course</Badge>
                {course.category && (
                  <Badge variant="secondary">{course.category}</Badge>
                )}
                {course.skillLevel && (
                  <Badge variant="outline">{course.skillLevel}</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-emerald-800 mb-3">
                {course.title}
              </h1>
              
              {course.description && (
                <p className="text-lg text-emerald-700 leading-relaxed mb-4">
                  {course.description}
                </p>
              )}
              
              {/* Course Stats */}
              <div className="flex items-center gap-6 text-sm text-emerald-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{totalModules} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span>~{estimatedHours} hours</span>
                </div>
              </div>
            </div>
            
            {/* Price */}
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-800">
                ${course.price || 0}
              </div>
              <p className="text-sm text-emerald-600">One-time purchase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Course Content Preview */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">What You'll Learn</h2>
              
              {/* Course Modules */}
              <div className="space-y-6">
                {course.modules?.map((module) => (
                  <Card key={module.orderIndex} className="border-emerald-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg text-emerald-800">
                        Module {module.orderIndex}: {module.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.orderIndex} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-emerald-800">
                                Lesson {lesson.orderIndex}: {lesson.title}
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

          {/* Enrollment Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <GraduationCap className="w-5 h-5" />
                  Enroll Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Summary */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-emerald-800">Course Price</span>
                    <span className="text-2xl font-bold text-emerald-800">${course.price || 0}</span>
                  </div>
                  <p className="text-xs text-emerald-600">One-time payment • Lifetime access</p>
                </div>

                {/* What's Included */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">What's Included:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{totalModules} comprehensive modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{totalLessons} detailed lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Self-paced learning</span>
                    </div>
                  </div>
                </div>

                {/* Customer Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Full Name *
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Enroll Button */}
                <Button
                  onClick={handleEnrollment}
                  disabled={isSubmitting || !customerData.name.trim() || !customerData.email.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Enroll for ${course.price || 0}
                    </>
                  )}
                </Button>

                {/* Trust Indicators */}
                <div className="text-center space-y-2 pt-4 border-t border-emerald-200">
                  <div className="flex items-center justify-center gap-4 text-xs text-emerald-600">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Instant access</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Powered by PausePlayRepeat Academy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
