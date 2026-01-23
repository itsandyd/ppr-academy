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
  Filter,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
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

interface StudentProduct {
  productId: string;
  productTitle: string;
  productType: string;
  purchasedAt: number;
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
  products: StudentProduct[];
}

export default function StudentsPage() {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [productFilter, setProductFilter] = useState<string>("all");

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

  // Extract all unique products from students for the filter dropdown
  // Must be called before any early returns to follow React hooks rules
  const allProducts = useMemo(() => {
    if (!students) return [];
    const productMap = new Map<string, { id: string; title: string; type: string }>();
    for (const student of students) {
      for (const product of student.products || []) {
        if (!productMap.has(product.productId)) {
          productMap.set(product.productId, {
            id: product.productId,
            title: product.productTitle,
            type: product.productType,
          });
        }
      }
    }
    return Array.from(productMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [students]);

  // Filter students based on search and product filter
  // Must be called before any early returns to follow React hooks rules
  const filteredStudents: Student[] = useMemo(() => {
    if (!students) return [];
    return students.filter((student) => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          student.name?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Apply product filter
      if (productFilter && productFilter !== "all") {
        const hasProduct = student.products?.some(p => p.productId === productFilter);
        if (!hasProduct) return false;
      }

      return true;
    });
  }, [students, searchQuery, productFilter]);

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
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No store yet
  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="mt-1 text-muted-foreground">Manage your students and customers</p>
        </div>
        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-muted-foreground">
                Set up your store to start tracking students
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="mt-1 text-muted-foreground">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>
                All students who have purchased from your store
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Product Filter */}
              <div className="flex items-center gap-2">
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="mr-2 h-4 w-4 text-zinc-400" />
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {allProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          {product.type === "course" ? (
                            <BookOpen className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Package className="h-3 w-3 text-purple-500" />
                          )}
                          <span className="truncate">{product.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {productFilter !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProductFilter("all")}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Search */}
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
                    <TableHead>Products</TableHead>
                    <TableHead>Progress</TableHead>
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
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {student.products?.slice(0, 3).map((product) => (
                                <Badge
                                  key={product.productId}
                                  variant="secondary"
                                  className={cn(
                                    "text-xs truncate max-w-[100px]",
                                    product.productType === "course"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  )}
                                >
                                  {product.productType === "course" ? (
                                    <BookOpen className="mr-1 h-3 w-3" />
                                  ) : (
                                    <Package className="mr-1 h-3 w-3" />
                                  )}
                                  <span className="truncate">{product.productTitle}</span>
                                </Badge>
                              ))}
                              {(student.products?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(student.products?.length || 0) - 3} more
                                </Badge>
                              )}
                              {(!student.products || student.products.length === 0) && (
                                <span className="text-sm text-zinc-400">-</span>
                              )}
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
                        {/* Expanded Row - Products & Course Progress Details */}
                        {isExpanded && (student.products?.length > 0 || student.courseProgress.length > 0) && (
                          <TableRow key={`${student.clerkId}-expanded`}>
                            <TableCell colSpan={6} className="bg-muted/20 p-0">
                              <div className="px-6 py-4 space-y-4">
                                {/* All Products Section */}
                                {student.products && student.products.length > 0 && (
                                  <div>
                                    <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                      All Products ({student.products.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {student.products.map((product) => (
                                        <Badge
                                          key={product.productId}
                                          variant="secondary"
                                          className={cn(
                                            "text-sm py-1.5 px-3",
                                            product.productType === "course"
                                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                          )}
                                        >
                                          {product.productType === "course" ? (
                                            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                          ) : (
                                            <Package className="mr-1.5 h-3.5 w-3.5" />
                                          )}
                                          {product.productTitle}
                                          <span className="ml-2 text-xs opacity-60">
                                            {formatDate(product.purchasedAt)}
                                          </span>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Course Progress Section */}
                                {student.courseProgress.length > 0 && (
                                  <div>
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
                                )}
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
                  {searchQuery || productFilter !== "all" ? "No students found" : "No students yet"}
                </h3>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  {searchQuery || productFilter !== "all"
                    ? "Try a different search term or filter"
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
