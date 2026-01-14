"use client";

import { Fragment } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Search,
  Loader2,
  BookOpen,
  Package,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Explicit types to avoid TypeScript deep recursion with Convex
interface Store {
  _id: string;
  slug: string;
  name?: string;
}

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  chaptersCompleted: number;
  totalChapters: number;
  lastAccessedAt?: number;
  enrolledAt: number;
}

interface Student {
  clerkId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  totalPurchases: number;
  totalSpent: number;
  coursesEnrolled: number;
  productsOwned: number;
  firstPurchaseDate: number;
  lastPurchaseDate: number;
  overallProgress: number;
  coursesCompleted: number;
  chaptersCompleted: number;
  totalChapters: number;
  lastActivityAt?: number;
  courseProgress: CourseProgress[];
}

export default function StudentsPage() {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  // Get user's store
  const store = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  ) as Store | null | undefined;

  // Get students with progress data
  const students = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.storeStats.getStudentsWithProgress,
    store?._id ? { storeId: store._id, limit: 100 } : "skip"
  ) as Student[] | undefined;

  // Get quick stats
  const stats = useQuery(
    api.storeStats.getQuickStoreStats,
    store?._id ? { storeId: store._id } : "skip"
  );

  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Loading state
  if (!isLoaded || store === undefined) {
    return (
      <div className="container mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // No store yet
  if (!store) {
    return (
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">Students</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Manage your students and customers</p>
        </div>
        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                Set up your store to start tracking students
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter students based on search
  const filteredStudents: Student[] = students?.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
  }) ?? [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (timestamp: number | undefined) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-zinc-400";
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">Students</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your students and customers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents ?? 0}</div>
            <p className="text-xs text-zinc-500">Enrolled learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students?.filter((s) => {
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                return s.lastActivityAt && s.lastActivityAt > weekAgo;
              }).length ?? 0}
            </div>
            <p className="text-xs text-zinc-500">Learning recently</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students && students.length > 0
                ? Math.round(
                    students.reduce((sum, s) => sum + s.overallProgress, 0) / students.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-zinc-500">Course completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students?.reduce((sum, s) => sum + s.coursesCompleted, 0) ?? 0}
            </div>
            <p className="text-xs text-zinc-500">Courses completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>
                All students who have purchased from your store
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Total Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudents.has(student.clerkId);
                    return (
                      <Fragment key={student.clerkId}>
                        <TableRow
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/50",
                            isExpanded && "bg-muted/30"
                          )}
                          onClick={() => toggleStudentExpanded(student.clerkId)}
                        >
                          <TableCell className="w-8 pr-0">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={student.imageUrl} />
                                <AvatarFallback>
                                  {student.name?.[0]?.toUpperCase() ||
                                    student.email?.[0]?.toUpperCase() ||
                                    "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-white">
                                  {student.name || "Anonymous"}
                                </p>
                                <p className="text-sm text-zinc-500">
                                  {student.email || "No email"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-24">
                                <Progress
                                  value={student.overallProgress}
                                  className="h-2"
                                />
                              </div>
                              <span className="text-sm font-medium tabular-nums">
                                {student.overallProgress}%
                              </span>
                              {student.overallProgress === 100 && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4 text-blue-500" />
                              <span>
                                {student.coursesCompleted}/{student.coursesEnrolled}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-zinc-500">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">
                                {formatRelativeTime(student.lastActivityAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              ${(student.totalSpent / 100).toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {/* Expanded Row - Course Progress Details */}
                        {isExpanded && student.courseProgress.length > 0 && (
                          <TableRow key={`${student.clerkId}-expanded`}>
                            <TableCell colSpan={6} className="bg-muted/20 p-0">
                              <div className="px-6 py-4">
                                <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                  Course Progress
                                </h4>
                                <div className="space-y-3">
                                  {student.courseProgress.map((course) => (
                                    <div
                                      key={course.courseId}
                                      className="flex items-center gap-4 rounded-lg border bg-background p-3"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                          {course.courseTitle}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                          {course.chaptersCompleted} of {course.totalChapters}{" "}
                                          chapters completed
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-32">
                                          <Progress value={course.progress} className="h-2" />
                                        </div>
                                        <span
                                          className={cn(
                                            "text-sm font-medium tabular-nums w-12 text-right",
                                            course.progress === 100 && "text-green-600"
                                          )}
                                        >
                                          {course.progress}%
                                        </span>
                                        {course.progress === 100 ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <div className="h-4 w-4" />
                                        )}
                                      </div>
                                      <div className="text-xs text-zinc-500 w-20 text-right">
                                        {formatRelativeTime(course.lastAccessedAt)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                                  <span>
                                    Enrolled {formatDate(student.firstPurchaseDate)}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {student.chaptersCompleted} of {student.totalChapters} total
                                    chapters completed
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {searchQuery ? "No students found" : "No students yet"}
                </h3>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  {searchQuery
                    ? "Try a different search term"
                    : "Students will appear here once they purchase your products"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
