"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";

interface PublishToggleProps {
  courseId: Id<"courses">;
  initialPublishedState?: boolean;
}

export function PublishToggle({ courseId, initialPublishedState = false }: PublishToggleProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  
  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get course data to check current published status
  const course = useQuery(
    api.courses.getCourseForEdit,
    convexUser?._id ? { courseId, userId: convexUser._id } : "skip"
  );

  const togglePublishedMutation = useMutation(api.courses.togglePublished);

  const isPublished = course?.isPublished ?? initialPublishedState;

  const handleToggle = async () => {
    if (!convexUser?._id) return;

    setIsToggling(true);
    try {
      const result = await togglePublishedMutation({
        courseId,
        userId: convexUser._id,
      });

      if (result.success) {
        toast({
          title: result.isPublished ? "Course Published!" : "Course Unpublished",
          description: result.isPublished 
            ? "Your course is now live and visible to students."
            : "Your course has been unpublished and is no longer visible.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update course status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course status.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant={isPublished ? "default" : "secondary"}>
        {isPublished ? "Published" : "Draft"}
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isToggling}
        className="gap-2"
      >
        {isPublished ? (
          <>
            <EyeOff className="w-4 h-4" />
            {isToggling ? "Unpublishing..." : "Unpublish"}
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            {isToggling ? "Publishing..." : "Publish"}
          </>
        )}
      </Button>
    </div>
  );
} 