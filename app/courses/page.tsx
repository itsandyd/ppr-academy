"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { BookOpen, Loader2, Search, Filter } from "lucide-react";
import { CourseCardEnhanced } from "@/components/ui/course-card-enhanced";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";

export default function CoursesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all published courses from Convex
  const allCourses = useQuery(api.courses.getCourses);

  // Filter courses based on search
  const filteredCourses =
    allCourses?.filter(
      (course: any) =>
        course.isPublished &&
        (searchTerm === "" ||
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  // Check if user is admin
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");
  const isAdmin = convexUser?.admin || false;

  // Loading state
  if (allCourses === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">Explore Courses</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Discover expert-led courses to master music production techniques
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto max-w-md">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filteredCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={searchTerm ? "No courses found" : "No courses available"}
            description={
              searchTerm
                ? "Try adjusting your search or browse all courses."
                : "Be the first to create a course and share your knowledge!"
            }
            action={!searchTerm ? { label: "Create Course", href: "/dashboard/create/course" } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course: any, index: number) => (
              <Card key={course._id} className="transition-shadow hover:shadow-lg">
                <div className="h-48 w-full overflow-hidden rounded-t-lg bg-emerald-100">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      width={640}
                      height={192}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-16 w-16 text-emerald-600" />
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800">
                        {course.category || "Course"}
                      </Badge>
                      <Badge variant="secondary">{course.skillLevel || "All Levels"}</Badge>
                    </div>

                    <h3 className="line-clamp-2 text-xl font-bold text-foreground">
                      {course.title}
                    </h3>

                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {course.description ||
                        "Learn essential skills with this comprehensive course."}
                    </p>

                    <div className="flex items-center justify-between pt-4">
                      <div className="text-2xl font-bold text-emerald-600">
                        {course.price && course.price > 0 ? `$${course.price}` : "FREE"}
                      </div>

                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href={`/courses/${course.slug || course._id}`}>View Course</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
