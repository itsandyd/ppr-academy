"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCardEnhanced } from "@/components/ui/course-card-enhanced";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Package, BookOpen, Grid, List } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
}

interface ProductsListProps {
  products?: Product[];
  storeId?: string;
}

export function ProductsList({ products, storeId }: ProductsListProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  // Separate courses and digital products
  const courses = products.filter(isCourse);
  const digitalProducts = products.filter(p => !isCourse(p));

  return (
    <div className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="relative">
                    <CourseCardEnhanced
                      id={course._id}
                      title={course.title}
                      description={course.description}
                      imageUrl={course.imageUrl}
                      price={course.price}
                      category="Course"
                      skillLevel="Beginner"
                      slug={course.slug}
                      instructor={{
                        name: "You",
                        verified: true,
                      }}
                      stats={{
                        students: 0,
                        lessons: 0,
                        duration: "0h",
                        rating: 0,
                        reviews: 0,
                      }}
                      isEnrolled={false}
                      isNew={false}
                      isTrending={false}
                      variant="compact"
                    />
                    
                    {/* Admin Actions Overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCoursePublish(course._id, course.isPublished || false, course.title, course.userId || "")}
                        className="h-8 px-2 bg-white/90 hover:bg-white"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" asChild className="h-8 px-2 bg-white/90 hover:bg-white">
                        <Link href={`/store/${storeId}/course/create?step=course&courseId=${course._id}`}>
                          <Edit className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCourse(course._id, course.title, course.userId || "")}
                        className="text-red-600 hover:text-red-700 h-8 px-2 bg-white/90 hover:bg-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant={course.isPublished ? "default" : "secondary"}>
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <Card key={course._id} className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Course Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {course.imageUrl ? (
                          <img 
                            src={course.imageUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm truncate pr-2">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={course.isPublished ? "default" : "secondary"}>
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline">${course.price}</Badge>
                          </div>
                        </div>
                        
                        {course.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {course.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCoursePublish(course._id, course.isPublished || false, course.title, course.userId || "")}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {course.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/store/${storeId}/course/create?step=course&courseId=${course._id}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Course
                            </Link>
                          </Button>
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/store/${storeId}/courses/${course._id}`}>
                              <BookOpen className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourse(course._id, course.title, course.userId || "")}
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
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
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