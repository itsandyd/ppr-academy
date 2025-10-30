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

export default function CoursesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all published courses from Convex
  const allCourses = useQuery(api.courses.getCourses);

  // Filter courses based on search
  const filteredCourses = allCourses?.filter(course => 
    course.isPublished && 
    (searchTerm === "" || 
     course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     course.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Check if user is admin
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const isAdmin = convexUser?.admin || false;

  // Loading state
  if (allCourses === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Explore Courses
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover expert-led courses to master music production techniques
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCourses.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {searchTerm ? "No courses found" : "No courses available"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search or browse all courses."
                  : "Be the first to create a course and share your knowledge!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="hover:shadow-lg transition-shadow">
                <div className="w-full h-48 bg-emerald-100 rounded-t-lg overflow-hidden">
                  {course.imageUrl ? (
                    <Image 
                      src={course.imageUrl} 
                      alt={course.title}
                      width={640}
                      height={192}
                      className="w-full h-full object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-emerald-600" />
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800">
                        {course.category || "Course"}
                      </Badge>
                      <Badge variant="secondary">
                        {course.skillLevel || "All Levels"}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-xl text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {course.description || "Learn essential skills with this comprehensive course."}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-2xl font-bold text-emerald-600">
                        {course.price && course.price > 0 ? `$${course.price}` : "FREE"}
                      </div>
                      
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href={`/courses/${course.slug || course._id}`}>
                          View Course
                        </Link>
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