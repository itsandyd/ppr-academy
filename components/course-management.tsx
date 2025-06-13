"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  DollarSign, 
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  Star,
  MoreHorizontal,
  Archive,
  Copy
} from "lucide-react";
import { CourseWithDetails } from "@/lib/types";
import { generateSlug } from "@/lib/utils";
import Link from "next/link";
import { updateCourse, deleteCourse, bulkUpdateCourses } from "@/app/actions/admin-actions";

interface CourseManagementProps {
  courses: CourseWithDetails[];
}

export default function CourseManagement({ courses }: CourseManagementProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    skillLevel: "",
    isPublished: false
  });

  const handleSelectCourse = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses(prev => [...prev, courseId]);
    } else {
      setSelectedCourses(prev => prev.filter(id => id !== courseId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCourses(courses.map(course => course.id));
    } else {
      setSelectedCourses([]);
    }
  };

  const handleEditCourse = (course: CourseWithDetails) => {
    setSelectedCourse(course);
    setEditForm({
      title: course.title,
      description: course.description || "",
      price: course.price?.toString() || "",
      category: (course as any).category || "",
      skillLevel: (course as any).skillLevel || "",
      isPublished: course.isPublished
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!selectedCourse) return;

    setIsLoading(true);
    try {
      const result = await updateCourse(selectedCourse.id, editForm);
      
      if (result.success) {
        toast({
          title: "Course Updated",
          description: "Course has been updated successfully.",
        });
        setIsEditDialogOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    setIsLoading(true);
    try {
      const result = await deleteCourse(selectedCourse.id);
      
      if (result.success) {
        toast({
          title: "Course Deleted",
          description: "Course has been deleted successfully.",
        });
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedCourses.length === 0) return;

    setIsLoading(true);
    try {
      const result = await bulkUpdateCourses(selectedCourses, action);
      
      if (result.success) {
        toast({
          title: "Bulk Action Completed",
          description: `${result.count || selectedCourses.length} courses have been ${action}ed.`,
        });
        setSelectedCourses([]);
        router.refresh();
      } else {
        toast({
          title: "Bulk Action Failed",
          description: result.error || "Failed to perform bulk action",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedCourse(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedCourses.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCourses([])}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('publish')}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('unpublish')}
                  disabled={isLoading}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Unpublish
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Course Management</CardTitle>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCourses.length === courses.length && courses.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                id="select-all"
                className="rounded"
              />
              <Label htmlFor="select-all" className="text-sm">Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center space-x-4 p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course.id)}
                  onChange={(e) => handleSelectCourse(course.id, e.target.checked)}
                  className="rounded"
                />
                
                <div className="flex items-center space-x-4 flex-1">
                  <img
                    src={course.imageUrl || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89"}
                    alt={course.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {course.title}
                      </h3>
                      <Badge 
                        variant={course.isPublished ? "default" : "secondary"}
                        className={course.isPublished ? "bg-green-500" : "bg-yellow-500"}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-600 truncate mb-2">
                      {course.description || "No description"}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      {course.instructor && (
                        <div className="flex items-center space-x-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={course.instructor.imageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{course._count?.enrollments || 0} students</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${course.price?.toFixed(0) || '0'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link href={`/courses/${course.slug || generateSlug(course.title)}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCourse(course)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course information and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Course Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter course description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hip-Hop Production">Hip-Hop Production</SelectItem>
                    <SelectItem value="Electronic Music">Electronic Music</SelectItem>
                    <SelectItem value="Mixing & Mastering">Mixing & Mastering</SelectItem>
                    <SelectItem value="Sound Design">Sound Design</SelectItem>
                    <SelectItem value="DAWs">DAWs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-skill-level">Skill Level</Label>
                <Select
                  value={editForm.skillLevel}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, skillLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-published">Publication Status</Label>
                <Select
                  value={editForm.isPublished.toString()}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, isPublished: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Published</SelectItem>
                    <SelectItem value="false">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCourse?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 