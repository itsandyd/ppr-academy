"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  BookOpen, 
  Grid, 
  List, 
  Search,
  MoreVertical,
  Copy,
  ExternalLink,
  Filter,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Sparkles,
  Users,
  Bell,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isPublished?: boolean;
  style?: "button" | "card" | "minimal" | "callout" | "preview";
  slug?: string; // For courses
  userId?: string; // For courses
  _creationTime?: number;
}

interface ProductsListProps {
  products?: Product[];
  storeId?: string;
}

type SortBy = "newest" | "oldest" | "price-high" | "price-low" | "title-asc" | "title-desc";
type FilterBy = "all" | "published" | "draft";

export function ProductsList({ products, storeId }: ProductsListProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  
  const deleteProduct = useMutation(api.digitalProducts.deleteProduct);
  const updateProduct = useMutation(api.digitalProducts.updateProduct);
  const toggleCoursePublished = useMutation(api.courses.togglePublished);
  const deleteCourse = useMutation(api.courses.deleteCourse);

  const isCourse = (product: Product) => {
    // Courses have a slug property and no style property
    // Digital products have a style property and no slug property
    return product.slug !== undefined && product.style === undefined;
  };

  const handleDelete = async (productId: string, title: string) => {
    try {
      await deleteProduct({ id: productId as any });
      toast({
        title: "Product deleted",
        description: `"${title}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (productId: string, currentStatus: boolean, title: string) => {
    try {
      await updateProduct({ 
        id: productId as any, 
        isPublished: !currentStatus 
      });
      toast({
        title: currentStatus ? "Product unpublished" : "Product published",
        description: `"${title}" is now ${!currentStatus ? "published" : "unpublished"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCoursePublish = async (courseId: string, currentStatus: boolean, title: string, userId: string) => {
    try {
      console.log("🔄 Toggling course publish status:", { courseId, currentStatus, userId });
      
      const result = await toggleCoursePublished({ 
        courseId: courseId as any, 
        userId: userId
      });
      
      console.log("✅ Toggle result:", result);
      
      if (result.success) {
        toast({
          title: currentStatus ? "Course unpublished" : "Course published",
          description: `"${title}" is now ${!currentStatus ? "published" : "unpublished"}.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update course. You may not have permission to modify this course.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Course toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string, userId: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will permanently delete the course and all its content. This action cannot be undone.`)) {
      return;
    }

    try {
      console.log("🗑️ Deleting course:", { courseId, userId });
      
      const result = await deleteCourse({ 
        courseId: courseId as any, 
        userId: userId
      });
      
      console.log("✅ Delete result:", result);
      
      if (result.success) {
        toast({
          title: "Course deleted",
          description: `"${title}" has been deleted successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete course.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Course delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle copy course link
  const handleCopyLink = (slug?: string, courseId?: string) => {
    const baseUrl = window.location.origin;
    const url = slug ? `${baseUrl}/courses/${slug}` : `${baseUrl}/courses/${courseId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Course link has been copied to clipboard.",
    });
  };

  // Filtering, searching, and sorting logic
  const processedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Apply filter
    if (filterBy !== "all") {
      filtered = filtered.filter(p => 
        filterBy === "published" ? p.isPublished : !p.isPublished
      );
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b._creationTime || 0) - (a._creationTime || 0);
        case "oldest":
          return (a._creationTime || 0) - (b._creationTime || 0);
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, sortBy, filterBy]);

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products yet</p>
            <p className="text-sm">Create your first product to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate courses and digital products from processed results
  const courses = processedProducts.filter(isCourse);
  const digitalProducts = processedProducts.filter(p => !isCourse(p));

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-900"
              />
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white dark:bg-slate-900">
                  <Filter className="w-4 h-4 mr-2" />
                  {filterBy === "all" ? "All Products" : filterBy === "published" ? "Published" : "Drafts"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterBy("all")}>
                  All Products
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("published")}>
                  Published Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("draft")}>
                  Drafts Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white dark:bg-slate-900">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("price-high")}>
                  <SortDesc className="w-4 h-4 mr-2" />
                  Price: High to Low
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-low")}>
                  <SortAsc className="w-4 h-4 mr-2" />
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("title-asc")}>
                  Title: A to Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title-desc")}>
                  Title: Z to A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active filters display */}
          {(searchQuery || filterBy !== "all" || sortBy !== "newest") && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                </Badge>
              )}
              {filterBy !== "all" && (
                <Badge variant="secondary">
                  {filterBy === "published" ? "Published" : "Drafts"}
                </Badge>
              )}
              {sortBy !== "newest" && (
                <Badge variant="secondary">
                  {sortBy === "price-high" ? "Price ↓" : 
                   sortBy === "price-low" ? "Price ↑" :
                   sortBy === "title-asc" ? "A→Z" :
                   sortBy === "title-desc" ? "Z→A" :
                   sortBy === "oldest" ? "Oldest" : ""}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                  setSortBy("newest");
                }}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {processedProducts.length} of {products.length} products
          </div>
        </CardContent>
      </Card>

      {/* Show empty state if no results after filtering */}
      {processedProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilterBy("all");
                setSortBy("newest");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Courses Section */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Courses ({courses.length})
              </CardTitle>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {courses.map((course, index) => (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-purple-200 dark:hover:border-purple-800">
                        {/* Course Image */}
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-blue-900/20">
                          {course.imageUrl && course.imageUrl.startsWith('http') ? (
                            <Image 
                              src={course.imageUrl} 
                              alt={course.title}
                              width={640}
                              height={192}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-16 h-16 text-purple-300 dark:text-purple-700" />
                            </div>
                          )}
                          
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge 
                              variant={course.isPublished ? "default" : "secondary"}
                              className="shadow-lg backdrop-blur-sm bg-opacity-90"
                            >
                              {course.isPublished ? "✓ Published" : "Draft"}
                            </Badge>
                          </div>
                          
                          {/* Quick Actions Dropdown */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-9 w-9 p-0 rounded-full bg-white/95 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 shadow-lg"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-black">
                                <DropdownMenuLabel>Manage Course</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/store/${storeId}/course/create?step=course&courseId=${course._id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Course
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleCoursePublish(course._id, course.isPublished || false, course.title, course.userId || "")}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {course.isPublished ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/store/${storeId}/course/${course._id}/notifications`}>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Send Update
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyLink(course.slug, course._id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                {course.slug && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/courses/${course.slug}${!course.isPublished ? '?preview=true' : ''}`} target="_blank">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      {course.isPublished ? 'View Live' : 'Preview'}
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCourse(course._id, course.title, course.userId || "")}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Course
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* Course Content */}
                        <CardContent className="p-5">
                          {/* Title */}
                          <h3 className="font-bold text-lg mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {course.title}
                          </h3>
                          
                          {/* Description */}
                          {course.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                              {course.description}
                            </p>
                          )}
                          
                          {/* Meta Info */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>0</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>0 lessons</span>
                              </div>
                            </div>
                            
                            {/* Price */}
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-base font-bold px-3 py-1">
                                ${course.price}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Quick Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              className="flex-1"
                            >
                              <Link href={`/store/${storeId}/course/create?step=course&courseId=${course._id}`}>
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            {course.slug && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                                className="flex-1"
                              >
                                <Link href={`/courses/${course.slug}${!course.isPublished ? '?preview=true' : ''}`} target="_blank">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {course.isPublished ? 'View' : 'Preview'}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {courses.map((course, index) => (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Course Image */}
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg overflow-hidden flex-shrink-0">
                            {course.imageUrl ? (
                              <Image 
                                src={course.imageUrl} 
                                alt={course.title}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-purple-400" />
                              </div>
                            )}
                          </div>

                          {/* Course Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-base mb-1">
                                  {course.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant={course.isPublished ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {course.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    ${course.price}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/store/${storeId}/course/create?step=course&courseId=${course._id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Course
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleCoursePublish(course._id, course.isPublished || false, course.title, course.userId || "")}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {course.isPublished ? "Unpublish" : "Publish"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyLink(course.slug, course._id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  {course.slug && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/${course.slug}`} target="_blank">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Live
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteCourse(course._id, course.title, course.userId || "")}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {course.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleCoursePublish(course._id, course.isPublished || false, course.title, course.userId || "")}
                                className="h-8"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {course.isPublished ? "Unpublish" : "Publish"}
                              </Button>
                              
                              <Button variant="outline" size="sm" asChild className="h-8">
                                <Link href={`/store/${storeId}/course/create?step=course&courseId=${course._id}`}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Link>
                              </Button>
                              
                              {course.slug && (
                                <Button variant="outline" size="sm" asChild className="h-8">
                                  <Link href={`/courses/${course.slug}${!course.isPublished ? '?preview=true' : ''}`} target="_blank">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    {course.isPublished ? 'View Live' : 'Preview'}
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Digital Products Section */}
      {digitalProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Digital Products ({digitalProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {digitalProducts.map((product) => (
                <Card key={product._id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <Image 
                          src={product.imageUrl} 
                          alt={product.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm truncate pr-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={product.isPublished ? "default" : "secondary"}>
                            {product.isPublished ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline">${product.price}</Badge>
                        </div>
                      </div>
                      
                      {product.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublish(product._id, product.isPublished || false, product.title)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {product.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/store/${storeId}/products/${product._id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product._id, product.title)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 