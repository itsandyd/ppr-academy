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
  TrendingUp,
  Heart,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CourseQAChat } from "@/components/course/CourseQAChat";
import { SocialProofWidget } from "@/components/social-proof/SocialProofWidget";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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
  const { isSignedIn } = useUser();
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const isInWishlist = useQuery(
    api.wishlists.isCourseInWishlist,
    course._id ? { courseId: course._id as Id<"courses"> } : "skip"
  );
  const addToWishlist = useMutation(api.wishlists.addCourseToWishlist);
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);

  const handleWishlistToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save to wishlist");
      return;
    }

    setIsTogglingWishlist(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist({ courseId: course._id as Id<"courses"> });
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist({ courseId: course._id as Id<"courses"> });
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Calculate course stats
  const totalModules = course.modules?.length || 0;
  const totalLessons =
    course.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const estimatedHours = Math.round(totalLessons * 0.75); // Rough estimate

  const creatorName = creator?.name || "Course Creator";
  const creatorInitials = creatorName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleEnrollClick = () => {
    router.push(`/courses/${course.slug || course._id}/checkout`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="overflow-hidden bg-gradient-to-r from-chart-1 to-chart-4 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-12 lg:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Course Info */}
            <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Course Category & Level */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Badge className="shrink-0 border-white/30 bg-white/20 text-xs text-white hover:bg-white/20 sm:text-sm">
                  {course.category || "Course"}
                </Badge>
                <Badge
                  variant="outline"
                  className="shrink-0 border-white/30 text-xs text-white hover:bg-white/10 sm:text-sm"
                >
                  {course.skillLevel || "All Levels"}
                </Badge>
              </div>

              {/* Course Title */}
              <h1 className="break-words text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl">
                {course.title}
              </h1>

              {/* Course Description */}
              <p className="break-words text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg xl:text-xl">
                {course.description ||
                  "Master essential skills with this comprehensive course designed for creators like you."}
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 flex-shrink-0 text-white/80 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium text-white sm:text-base">
                    {totalModules} Modules
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 flex-shrink-0 text-white/80 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium text-white sm:text-base">
                    {totalLessons} Lessons
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 text-white/80 sm:h-5 sm:w-5" />
                  <span className="text-sm font-medium text-white sm:text-base">
                    ~{estimatedHours} Hours
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex w-full flex-col gap-4">
                <div className="mx-auto flex w-full max-w-xs items-center gap-3 sm:mx-0 sm:w-auto sm:max-w-none">
                  <Button
                    size="lg"
                    onClick={handleEnrollClick}
                    className="h-auto flex-1 bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-background/90 hover:shadow-xl sm:px-6 sm:py-4 sm:text-base lg:px-8 lg:text-lg"
                  >
                    <span className="truncate">
                      {course.price && course.price > 0 ? (
                        <>Enroll Now - ${course.price}</>
                      ) : (
                        <>Enroll for Free</>
                      )}
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleWishlistToggle}
                    disabled={isTogglingWishlist}
                    className="h-auto border-white/30 px-3 py-3 text-white hover:bg-white/10 sm:px-4 sm:py-4"
                    title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isTogglingWishlist ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart
                        className={`h-5 w-5 ${isInWishlist ? "fill-pink-500 text-pink-500" : ""}`}
                      />
                    )}
                  </Button>
                </div>

                <SocialProofWidget
                  type="course"
                  id={course._id}
                  variant="badge"
                  className="justify-center sm:justify-start [&_span]:text-white [&_div]:bg-white/20 [&_div]:text-white"
                />
              </div>
            </div>

            {/* Right: Course Image */}
            <div className="relative mt-6 min-w-0 sm:mt-8 lg:mt-0">
              <div className="h-48 w-full overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm sm:h-64 sm:rounded-2xl lg:h-80 xl:h-96">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    width={1200}
                    height={630}
                    className="h-full w-full object-cover"
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-white/60 sm:h-16 sm:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24" />
                  </div>
                )}
              </div>

              {/* Floating Stats - Hidden on mobile to prevent overflow */}
              <div className="absolute -bottom-4 -right-4 hidden rounded-xl border border-border bg-card p-3 shadow-2xl lg:block xl:-bottom-6 xl:-right-6 xl:p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary xl:text-2xl">{totalLessons}</div>
                  <div className="text-xs text-muted-foreground xl:text-sm">Lessons</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn Section */}
      <div className="overflow-hidden bg-muted/30 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 break-words text-xl font-bold text-foreground sm:text-2xl lg:text-3xl xl:text-4xl">
              What You'll Learn
            </h2>
            <p className="mx-auto max-w-3xl break-words text-sm text-muted-foreground sm:text-base lg:text-lg xl:text-xl">
              This comprehensive course covers everything you need to know, with hands-on examples
              and real-world applications.
            </p>
          </div>

          {/* Course Modules - Masonry Grid */}
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {course.modules?.map((module, idx) => (
              <div key={module.orderIndex} className="mb-6 break-inside-avoid">
                <Card className="border-border bg-card transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    {/* Module Header */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-chart-1">
                        <span className="text-sm font-bold text-primary-foreground">{idx + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold leading-tight text-foreground">{module.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {module.lessons.length} lessons
                        </p>
                      </div>
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-2.5">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.orderIndex} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="leading-snug text-foreground/90">{lesson.title}</span>
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
      <div className="overflow-hidden bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 break-words text-xl font-bold text-foreground sm:text-2xl lg:text-3xl xl:text-4xl">
              Why Choose This Course?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            <Card className="border-border bg-card p-6 text-center transition-shadow hover:shadow-lg sm:p-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-chart-1/10 sm:h-16 sm:w-16">
                <Target className="h-6 w-6 text-chart-1 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground sm:text-xl">
                Practical Learning
              </h3>
              <p className="text-sm text-muted-foreground sm:text-base">
                Learn by doing with hands-on exercises and real-world examples that you can apply
                immediately.
              </p>
            </Card>

            <Card className="border-border bg-card p-6 text-center transition-shadow hover:shadow-lg sm:p-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10 sm:h-16 sm:w-16">
                <Zap className="h-6 w-6 text-chart-2 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground sm:text-xl">Instant Access</h3>
              <p className="text-sm text-muted-foreground sm:text-base">
                Start learning immediately after enrollment. All content is available right away
                with lifetime access.
              </p>
            </Card>

            <Card className="border-border bg-card p-6 text-center sm:col-span-2 sm:p-8 lg:col-span-1">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/10 sm:h-16 sm:w-16">
                <TrendingUp className="h-6 w-6 text-chart-3 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground sm:text-xl">Level Up Skills</h3>
              <p className="text-sm text-muted-foreground sm:text-base">
                Transform your abilities with expert techniques and insider knowledge from industry
                professionals.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Instructor Section */}
      <div className="overflow-hidden bg-slate-50 py-12 dark:bg-slate-900 sm:py-16">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-4 break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl lg:text-3xl xl:text-4xl">
              Meet Your Instructor
            </h2>
          </div>

          <Card className="min-w-0 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6 lg:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
              <Avatar className="mx-auto h-14 w-14 flex-shrink-0 sm:mx-0 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
                <AvatarImage src={creator?.imageUrl} alt={creatorName} />
                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary sm:text-lg lg:text-xl">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h3 className="mb-2 break-words text-lg font-bold text-slate-900 dark:text-white sm:text-xl lg:text-2xl">
                  {creatorName}
                </h3>
                <p className="mb-4 break-words text-xs font-medium text-primary sm:text-sm lg:text-base">
                  Course Creator • {store.name}
                </p>

                {creator?.bio ? (
                  <p className="mb-4 break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:mb-6 sm:text-sm lg:text-base">
                    {creator.bio}
                  </p>
                ) : (
                  <p className="mb-4 break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:mb-6 sm:text-sm lg:text-base">
                    Passionate educator and industry expert dedicated to helping students master
                    their craft through practical, hands-on learning experiences.
                  </p>
                )}

                <div className="flex flex-col items-center justify-center gap-3 sm:justify-start sm:gap-2 lg:flex-row lg:gap-0 lg:gap-4 xl:gap-6">
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Users className="h-3 w-3 flex-shrink-0 text-primary sm:h-4 sm:w-4" />
                    <span className="whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
                      1000+ Students
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Award className="h-3 w-3 flex-shrink-0 text-primary sm:h-4 sm:w-4" />
                    <span className="whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
                      Expert Instructor
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Star className="h-3 w-3 flex-shrink-0 fill-current text-primary sm:h-4 sm:w-4" />
                    <span className="whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm">
                      4.9 Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="overflow-hidden bg-gradient-to-r from-chart-1 to-chart-4 py-12 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-4xl px-3 text-center sm:px-4 lg:px-6">
          <h2 className="mb-4 break-words text-xl font-bold text-primary-foreground sm:text-2xl lg:text-3xl xl:text-4xl">
            Ready to Start Learning?
          </h2>
          <p className="mx-auto mb-6 max-w-2xl break-words text-sm text-primary-foreground/90 sm:mb-8 sm:text-base lg:text-lg xl:text-xl">
            Join thousands of students who have transformed their skills with this comprehensive
            course.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
            <Button
              size="lg"
              onClick={handleEnrollClick}
              className="h-auto w-full max-w-xs bg-white px-6 py-3 text-base font-bold text-gray-900 hover:bg-white/90 hover:shadow-2xl sm:max-w-sm sm:px-8 sm:py-4 sm:text-lg lg:px-12 lg:py-6 lg:text-xl"
            >
              <span className="truncate">
                {course.price && course.price > 0 ? (
                  <>Enroll Now - ${course.price}</>
                ) : (
                  <>Start Learning for Free</>
                )}
              </span>
              <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </Button>

            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm text-white">30-day money-back guarantee</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm text-white">Lifetime access included</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-8 border-t border-white/20 pt-6 sm:mt-12 sm:pt-8">
            <p className="mb-4 text-sm text-white/80 sm:text-base">Trusted by creators worldwide</p>
            <SocialProofWidget
              type="course"
              id={course._id}
              variant="inline"
              className="justify-center text-white [&_svg]:text-white [&_span]:text-white"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-100 py-6 dark:border-slate-700 dark:bg-slate-900 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={creator?.imageUrl} alt={creatorName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white sm:text-base">
                  {store.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                  by {creatorName}
                </p>
              </div>
            </div>

            <Link
              href={`/${store.slug}`}
              className="text-xs font-medium text-primary hover:text-primary/80 sm:text-sm"
            >
              View All Products →
            </Link>
          </div>
        </div>
      </div>

      {/* Q&A Chat Component */}
      <CourseQAChat courseId={course._id} courseTitle={course.title} userId={course.userId} />

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background p-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden">
        <Button
          size="lg"
          onClick={handleEnrollClick}
          className="h-auto w-full bg-chart-1 py-3 text-sm font-semibold text-white hover:bg-chart-1/90"
        >
          <span className="truncate">
            {course.price && course.price > 0 ? (
              <>Enroll Now - ${course.price}</>
            ) : (
              <>Enroll for Free</>
            )}
          </span>
          <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
        </Button>
      </div>
    </div>
  );
}
