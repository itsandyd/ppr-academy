"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  BookOpen,
  Clock,
  BarChart,
  Users,
  Play,
  CheckCircle,
  Star,
  Share2,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CoursePageProps {
  params: Promise<{
    slug: string;
    courseSlug: string;
  }>;
}

export default function CourseLandingPage({ params }: CoursePageProps) {
  const { slug, courseSlug } = use(params);
  const router = useRouter();

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch course by slug
  const course = useQuery(
    api.courses.getCourseBySlug,
    store && courseSlug ? { slug: courseSlug } : "skip"
  );

  // Loading state
  if (store === undefined || (store && (user === undefined || course === undefined))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!store || !course) {
    notFound();
  }

  const displayName = user?.name || "Creator";
  const avatarUrl = user?.imageUrl || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isFree = course.price === 0;
  const price = course.price || 0;

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: course.title,
        text: course.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Handle enroll
  const handleEnroll = () => {
    // Navigate to the course enrollment/checkout page
    router.push(`/courses/${course.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {store.name}
          </Link>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Course Image/Preview */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              {course.imageUrl ? (
                <>
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  {/* Play overlay for course preview */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-xl">
                      <Play className="h-8 w-8 text-blue-600 ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <GraduationCap className="h-24 w-24 text-blue-500/50" />
                </div>
              )}
            </div>

            {/* Creator info card */}
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">@{slug}</p>
                </div>
                <Link href={`/${slug}`}>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Course Stats */}
            {((course as any).lessonsCount || (course as any).duration || course.skillLevel) && (
              <Card>
                <CardContent className="grid grid-cols-3 gap-4 p-4">
                  {(course as any).lessonsCount && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-bold">{(course as any).lessonsCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                  )}
                  {(course as any).duration && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-bold">{(course as any).duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                  )}
                  {course.skillLevel && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <BarChart className="h-4 w-4" />
                        <span className="font-bold capitalize">{course.skillLevel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Level</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <GraduationCap className="mr-1 h-3 w-3" />
                Course
              </Badge>
              {course.skillLevel && (
                <Badge variant="secondary" className="capitalize">
                  {course.skillLevel}
                </Badge>
              )}
              {course.category && (
                <Badge variant="outline">{course.category}</Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{course.title}</h1>
              {course.description && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className={cn("text-4xl font-bold", isFree ? "text-emerald-500" : "text-blue-600")}>
                {isFree ? "FREE" : `$${price}`}
              </span>
              <span className="text-sm text-muted-foreground">one-time payment</span>
            </div>

            <Separator />

            {/* What you'll learn */}
            {(course as any).whatYoullLearn && (course as any).whatYoullLearn.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">What you'll learn</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {(course as any).whatYoullLearn.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA Section */}
            <Card className="border-2 border-blue-200 dark:border-blue-900/50">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Ready to start learning?</h3>
                  <p className="text-sm text-muted-foreground">
                    {isFree
                      ? "Enroll now and get instant access to all lessons"
                      : "Get lifetime access to this course"
                    }
                  </p>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleEnroll}
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  {isFree ? "Enroll for Free" : `Enroll Now - $${price}`}
                </Button>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    Lifetime access
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    Learn at your pace
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Quality content
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Join other students
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
