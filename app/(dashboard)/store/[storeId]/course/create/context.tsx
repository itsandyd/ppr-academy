"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useValidStoreId } from "@/hooks/useStoreId";

// Types for course data
export interface CourseData {
  // Thumbnail step
  title?: string;
  description?: string;
  category?: string;
  skillLevel?: string;
  thumbnail?: string;
  
  // Checkout step
  price?: string;
  originalPrice?: string;
  hasDiscount?: boolean;
  paymentDescription?: string;
  checkoutHeadline?: string;
  checkoutDescription?: string;
  guaranteeText?: string;
  showGuarantee?: boolean;
  acceptsPayPal?: boolean;
  acceptsStripe?: boolean;
  
  // Course content step
  modules?: Array<{
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      title: string;
      description: string;
      orderIndex: number;
      chapters: Array<{
        title: string;
        content: string;
        videoUrl: string;
        duration: number;
        orderIndex: number;
      }>;
    }>;
  }>;
  
  // Options step
  enableSharing?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  enableComments?: boolean;
  enableProgress?: boolean;
  enableCertificates?: boolean;
  certificateTemplate?: string;
  drippingEnabled?: boolean;
  drippingDays?: string;
  accessDuration?: string;
  welcomeEmail?: boolean;
  completionEmail?: boolean;
  reminderEmails?: boolean;
  enableDownloads?: boolean;
  enableMobileApp?: boolean;
  enableDiscussions?: boolean;
}

export interface StepCompletion {
  course: boolean;
  checkout: boolean;
  options: boolean;
}

interface CourseCreationState {
  data: CourseData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  courseId?: Id<"courses">;
  lastSaved?: Date;
}

interface CourseCreationContextType {
  state: CourseCreationState;
  updateData: (step: string, data: Partial<CourseData>) => void;
  saveCourse: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createCourse: () => Promise<{ success: boolean; error?: string; courseId?: Id<"courses">; slug?: string }>;
  togglePublished: () => Promise<{ success: boolean; isPublished?: boolean }>;
}

const CourseCreationContext = createContext<CourseCreationContextType | undefined>(undefined);

export function CourseCreationProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const storeId = useValidStoreId();
  const courseId = (searchParams.get("courseId") || searchParams.get("edit")) as Id<"courses"> | undefined;
  

  // Redirect if storeId is invalid
  useEffect(() => {
    if (!storeId) {
      toast({
        title: "Invalid Store",
        description: "The store you're trying to access could not be found.",
        variant: "destructive",
      });
      router.push('/store');
    }
  }, [storeId, router, toast]);

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );


  // Get existing course if editing (using clerkId since courses.userId stores clerkId)
  const existingCourse = useQuery(
    api.courses.getCourseForEdit,
    courseId && convexUser?.clerkId ? { courseId, userId: convexUser.clerkId } : "skip"
  );


  // Convex mutations
  const updateCourseWithModulesMutation = useMutation(api.courses.updateCourseWithModules);
  const createCourseMutation = useMutation(api.courses.createCourseWithData);
  const togglePublishedMutation = useMutation(api.courses.togglePublished);

  const [state, setState] = useState<CourseCreationState>({
    data: {},
    stepCompletion: {
      course: false,
      checkout: false,
      options: false,
    },
    isLoading: false,
    isSaving: false,
  });

  // Helper function to validate step with specific data
  const validateStepWithData = (step: keyof StepCompletion, data: CourseData): boolean => {
    switch (step) {
      case "course":
        // Course step now includes both basic info (formerly thumbnail) and modules
        const hasBasicInfo = !!(data.title && data.description && data.category && data.skillLevel);
        const hasModules = !!(data.modules && data.modules.length > 0 && 
                           data.modules.some(module => 
                             module.lessons.length > 0 && 
                             module.lessons.some(lesson => lesson.chapters.length > 0)
                           ));
        // For now, require only basic info (modules are optional)
        return hasBasicInfo;
      case "checkout":
        return !!(data.price && data.checkoutHeadline);
      case "options":
        // Mark as complete if user has set any options field
        return !!(data.enableSharing !== undefined || 
                 data.seoTitle || 
                 data.seoDescription ||
                 data.enableComments !== undefined ||
                 data.enableProgress !== undefined ||
                 data.enableCertificates !== undefined);
      default:
        return false;
    }
  };

  // Load existing course data if editing
  useEffect(() => {
    if (existingCourse && !state.courseId) {
      
      const newData = {
        title: existingCourse.title || "",
        description: existingCourse.description || "",
        thumbnail: existingCourse.imageUrl || "",
        price: existingCourse.price?.toString() || "",
        category: existingCourse.category || "",
        skillLevel: existingCourse.skillLevel || "",
        checkoutHeadline: existingCourse.checkoutHeadline || "",
        checkoutDescription: existingCourse.checkoutDescription || "",
        paymentDescription: existingCourse.paymentDescription || "",
        guaranteeText: existingCourse.guaranteeText || "",
        showGuarantee: existingCourse.showGuarantee ?? true,
        acceptsPayPal: existingCourse.acceptsPayPal ?? true,
        acceptsStripe: existingCourse.acceptsStripe ?? true,
        modules: existingCourse.modules || [], // Load the modules!
      };
      
      // Calculate step completion based on loaded data
      const stepCompletion = {
        course: validateStepWithData("course", newData),
        checkout: validateStepWithData("checkout", newData),
        options: validateStepWithData("options", newData),
      };
      
      setState(prev => ({
        ...prev,
        courseId: existingCourse._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingCourse]); // Remove state.isLoading dependency to avoid circular updates

  const validateStep = (step: keyof StepCompletion): boolean => {
    return validateStepWithData(step, state.data);
  };

  const updateData = (step: string, newData: Partial<CourseData>) => {
    console.log("📊 Context updateData called:", { step, newData });
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      
      console.log("📊 Context data updated:", { 
        previous: prev.data, 
        new: newData, 
        merged: updatedData 
      });
      
      // Only recalculate completion for the current step
      const stepCompletion = {
        ...prev.stepCompletion,
        [step]: validateStepWithData(step as keyof StepCompletion, updatedData),
      };
      
      return {
        ...prev,
        data: updatedData,
        stepCompletion,
      };
    });
  };

  const saveCourse = async () => {
    if (state.isSaving || !convexUser?._id || !storeId) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      if (state.courseId) {
        // Update existing course with modules
        console.log("🔥 Saving existing course with modules:", state.data.modules);
        await updateCourseWithModulesMutation({
          courseId: state.courseId,
          courseData: {
            title: state.data.title,
            description: state.data.description,
            imageUrl: state.data.thumbnail,
            price: state.data.price ? parseFloat(state.data.price) : undefined,
            category: state.data.category,
            skillLevel: state.data.skillLevel,
            checkoutHeadline: state.data.checkoutHeadline,
            checkoutDescription: state.data.checkoutDescription,
            paymentDescription: state.data.paymentDescription,
            guaranteeText: state.data.guaranteeText,
            showGuarantee: state.data.showGuarantee,
            acceptsPayPal: state.data.acceptsPayPal,
            acceptsStripe: state.data.acceptsStripe,
          },
          modules: state.data.modules,
        });
      } else {
        // Create new course (unpublished by default)
        const requiredData = {
          title: state.data.title || "Untitled Course",
          description: state.data.description || "",
          checkoutHeadline: state.data.checkoutHeadline || "Get this course",
          price: state.data.price || "0",
          category: state.data.category,
          skillLevel: state.data.skillLevel,
          thumbnail: state.data.thumbnail,
          modules: state.data.modules,
        };

        const result = await createCourseMutation({
          userId: convexUser._id,
          storeId,
          data: requiredData,
        });

        if (result.success && result.courseId) {
          setState(prev => ({ ...prev, courseId: result.courseId }));
          // Redirect to edit mode with the courseId in URL
          const currentStep = searchParams.get("step") || "thumbnail";
          router.replace(`/store/${storeId}/course/create?courseId=${result.courseId}&step=${currentStep}`);
        }
      }

      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }));

      toast({
        title: "Course Saved",
        description: "Your course has been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save course:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return Object.values(state.stepCompletion).every(completed => completed);
  };

  const createCourse = async () => {
    if (!convexUser?._id || !storeId) {
      return {
        success: false,
        error: "User not found or invalid store. Please try again.",
      };
    }

    if (!canPublish()) {
      return { 
        success: false, 
        error: "Please complete all required steps before creating the course." 
      };
    }

    try {
      const requiredData = {
        title: state.data.title!,
        description: state.data.description!,
        checkoutHeadline: state.data.checkoutHeadline!,
        price: state.data.price!,
        category: state.data.category,
        skillLevel: state.data.skillLevel,
        thumbnail: state.data.thumbnail,
        modules: state.data.modules,
      };

      // Check if we're editing an existing course or creating a new one
      if (state.courseId) {
        // Update existing course
        const result = await updateCourseWithModulesMutation({
          courseId: state.courseId,
          courseData: {
            title: requiredData.title,
            description: requiredData.description,
            checkoutHeadline: requiredData.checkoutHeadline,
            price: parseFloat(requiredData.price),
            category: requiredData.category,
            skillLevel: requiredData.skillLevel,
            imageUrl: requiredData.thumbnail,
          },
          modules: requiredData.modules,
        });

        if (result.success) {
          toast({
            title: "Course Updated!",
            description: "Your course has been updated successfully.",
          });
          return { success: true, courseId: state.courseId, slug: state.data?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') };
        } else {
          return { success: false, error: result.error || "Failed to update course" };
        }
      } else {
        // Create new course
        const result = await createCourseMutation({
          userId: convexUser._id,
          storeId,
          data: requiredData,
        });

        if (result.success) {
          toast({
            title: "Course Created!",
            description: "Your course has been created successfully.",
          });
          return { success: true, courseId: result.courseId, slug: result.slug };
        } else {
          return { success: false, error: "Failed to create course" };
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to create course. Please try again." 
      };
    }
  };

  const togglePublished = async () => {
    if (!state.courseId || !convexUser?._id) {
      return { success: false };
    }

    try {
      const result = await togglePublishedMutation({
        courseId: state.courseId,
        userId: convexUser._id,
      });

      if (result.success) {
        toast({
          title: result.isPublished ? "Course Published!" : "Course Unpublished",
          description: result.isPublished 
            ? "Your course is now live and visible to students."
            : "Your course has been unpublished and is no longer visible.",
        });
      }

      return result;
    } catch (error) {
      return { success: false };
    }
  };


  return (
    <CourseCreationContext.Provider
      value={{
        state,
        updateData,
        saveCourse,
        validateStep,
        canPublish,
        createCourse,
        togglePublished,
      }}
    >
      {children}
    </CourseCreationContext.Provider>
  );
}

export function useCourseCreation() {
  const context = useContext(CourseCreationContext);
  if (context === undefined) {
    throw new Error("useCourseCreation must be used within a CourseCreationProvider");
  }
  return context;
} 