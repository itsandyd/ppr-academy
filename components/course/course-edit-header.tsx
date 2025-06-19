"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Settings } from "lucide-react";
import { updateCourse } from "@/app/actions/course-actions";

interface CourseEditHeaderProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    isPublished: boolean;
    slug: string | null;
  };
  user: {
    id: string;
    admin: boolean;
  } | null;
  isOwner: boolean;
}

export function CourseEditHeader({ course, user, isOwner }: CourseEditHeaderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: course.title,
    description: course.description || "",
    price: course.price?.toString() || "",
    isPublished: course.isPublished
  });

  // Only show edit button to course owner or admin
  const canEdit = user && (isOwner || user.admin);

  const handleSaveCourse = async () => {
    if (!editForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a course title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCourse(course.id, {
        title: editForm.title,
        description: editForm.description,
        price: editForm.price ? parseFloat(editForm.price) : 0,
        thumbnail: undefined, // We're not updating the thumbnail in this form
        isPublished: editForm.isPublished
      });
      
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

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditForm({
      title: course.title,
      description: course.description || "",
      price: course.price?.toString() || "",
      isPublished: course.isPublished
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">Music Production</Badge>
          <Badge variant="outline" className="border-white/30 text-white">
            {course.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
        
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Course
          </Button>
        )}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Course
            </DialogTitle>
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
                rows={4}
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
    </>
  );
} 