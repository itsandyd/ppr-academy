"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Book,
  Search,
  Filter,
  Clock,
  PlayCircle,
  CheckCircle,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function LibraryCoursesPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in-progress" | "completed">("all");
  
  const courses = useQuery(
    api.library.getUserCourses,
    user?.id ? { userId: user.id } : "skip"
  );

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.storeName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "completed" && (course.progress || 0) >= 100) ||
      (filterStatus === "in-progress" && (course.progress || 0) > 0 && (course.progress || 0) < 100);

    return matchesSearch && matchesFilter;
  }) || [];

  const stats = {
    total: courses?.length || 0,
    inProgress: courses?.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length || 0,
    completed: courses?.filter(c => (c.progress || 0) >= 100).length || 0,
    notStarted: courses?.filter(c => (c.progress || 0) === 0).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground mt-2">
          Continue your learning journey with your purchased courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</div>
            <div className="text-sm text-muted-foreground">Not Started</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === "in-progress" ? "default" : "outline"}
            onClick={() => setFilterStatus("in-progress")}
            size="sm"
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            onClick={() => setFilterStatus("completed")}
            size="sm"
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted overflow-hidden">
                {course.imageUrl ? (
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {course.storeName}
                    </p>
                  </div>

                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {course.skillLevel && (
                        <Badge variant="secondary" className="text-xs">
                          {course.skillLevel}
                        </Badge>
                      )}
                      {course.category && (
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      )}
                    </div>
                    
                    {(course.progress || 0) >= 100 && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      {course.lastAccessedAt ? (
                        <>Last accessed {formatDistanceToNow(new Date(course.lastAccessedAt), { addSuffix: true })}</>
                      ) : (
                        <>Purchased {formatDistanceToNow(new Date(course.purchaseDate), { addSuffix: true })}</>
                      )}
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/library/courses/${course._id}`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {(course.progress || 0) > 0 ? "Continue Learning" : "Start Course"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            {courses && courses.length === 0 ? (
              <>
                <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No courses yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start your learning journey by purchasing your first course
                </p>
                <Button asChild>
                  <Link href="/courses">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No courses found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
