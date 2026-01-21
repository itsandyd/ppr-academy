"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { useStoresByUser, useUserFromClerk, useCourseForEdit, useCreateCourseWithData, useUpdateCourseWithModules, useToggleCoursePublished } from "@/lib/convex-typed-hooks";

export interface CourseData {
  title?: string; description?: string; category?: string; subcategory?: string; tags?: string[]; skillLevel?: string; thumbnail?: string;
  price?: string; originalPrice?: string; hasDiscount?: boolean; paymentDescription?: string; checkoutHeadline?: string; checkoutDescription?: string; guaranteeText?: string; showGuarantee?: boolean; acceptsPayPal?: boolean; acceptsStripe?: boolean;
  modules?: Array<{ title: string; description: string; orderIndex: number; lessons: Array<{ title: string; description: string; orderIndex: number; chapters: Array<{ title: string; content: string; videoUrl: string; duration: number; orderIndex: number; }>; }>; }>;
  pricingModel?: "free_with_gate" | "paid";
  followGateEnabled?: boolean; followGateRequirements?: { requireEmail?: boolean; requireInstagram?: boolean; requireTiktok?: boolean; requireYoutube?: boolean; requireSpotify?: boolean; minFollowsRequired?: number; };
  followGateSocialLinks?: { instagram?: string; tiktok?: string; youtube?: string; spotify?: string; }; followGateMessage?: string;
  enableSharing?: boolean; seoTitle?: string; seoDescription?: string; enableComments?: boolean; enableProgress?: boolean; enableCertificates?: boolean; certificateTemplate?: string; drippingEnabled?: boolean; drippingDays?: string; accessDuration?: string; welcomeEmail?: boolean; completionEmail?: boolean; reminderEmails?: boolean; enableDownloads?: boolean; enableMobileApp?: boolean; enableDiscussions?: boolean;
}

export interface StepCompletion { course: boolean; pricing: boolean; checkout: boolean; followGate: boolean; options: boolean; }
interface CourseCreationState { data: CourseData; stepCompletion: StepCompletion; isLoading: boolean; isSaving: boolean; courseId?: Id<"courses">; lastSaved?: Date; }
interface CourseCreationContextType { state: CourseCreationState; storeId: Id<"stores"> | undefined; updateData: (step: string, data: Partial<CourseData>) => void; saveCourse: () => Promise<void>; validateStep: (step: keyof StepCompletion) => boolean; canPublish: () => boolean; createCourse: () => Promise<{ success: boolean; error?: string; courseId?: Id<"courses">; slug?: string }>; togglePublished: () => Promise<{ success: boolean; isPublished?: boolean }>; }

const CourseCreationContext = createContext<CourseCreationContextType | undefined>(undefined);

const validateStepWithData = (step: keyof StepCompletion, data: CourseData): boolean => {
  switch (step) {
    case "course": return !!(data.title && data.description && data.category && data.subcategory && data.skillLevel);
    case "pricing": return !!data.pricingModel;
    case "checkout": return data.pricingModel === "paid" ? !!(data.price && data.checkoutHeadline) : true;
    case "followGate": return data.pricingModel === "free_with_gate" ? !!(data.followGateEnabled && data.followGateRequirements) : true;
    case "options": return !!(data.enableSharing !== undefined || data.seoTitle || data.seoDescription || data.enableComments !== undefined || data.enableProgress !== undefined || data.enableCertificates !== undefined);
    default: return false;
  }
};

export function CourseCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const courseId = (searchParams.get("courseId") || searchParams.get("edit")) as Id<"courses"> | undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;
  const convexUser = useUserFromClerk(user?.id);
  const existingCourse = useCourseForEdit(courseId, convexUser?.clerkId);

  const updateCourseWithModulesMutation = useUpdateCourseWithModules();
  const createCourseMutation = useCreateCourseWithData();
  const togglePublishedMutation = useToggleCoursePublished();

  const [state, setState] = useState<CourseCreationState>({ data: { pricingModel: "paid" }, stepCompletion: { course: false, pricing: false, checkout: false, followGate: false, options: false }, isLoading: false, isSaving: false });

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", description: "You need to set up a store before creating courses.", variant: "destructive" }); router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  useEffect(() => {
    if (existingCourse && !state.courseId) {
      const newData = { title: existingCourse.title || "", description: existingCourse.description || "", thumbnail: existingCourse.imageUrl || "", price: existingCourse.price?.toString() || "", category: existingCourse.category || "", subcategory: existingCourse.subcategory || "", tags: existingCourse.tags || [], skillLevel: existingCourse.skillLevel || "", checkoutHeadline: existingCourse.checkoutHeadline || "", checkoutDescription: existingCourse.checkoutDescription || "", paymentDescription: existingCourse.paymentDescription || "", guaranteeText: existingCourse.guaranteeText || "", showGuarantee: existingCourse.showGuarantee ?? true, acceptsPayPal: existingCourse.acceptsPayPal ?? true, acceptsStripe: existingCourse.acceptsStripe ?? true, modules: existingCourse.modules || [] };
      setState(prev => ({ ...prev, courseId: existingCourse._id, data: newData, stepCompletion: { course: validateStepWithData("course", newData), pricing: validateStepWithData("pricing", newData), checkout: validateStepWithData("checkout", newData), followGate: validateStepWithData("followGate", newData), options: validateStepWithData("options", newData) } }));
    }
  }, [existingCourse]);

  const validateStep = useCallback((step: keyof StepCompletion): boolean => validateStepWithData(step, state.data), [state.data]);

  const updateData = useCallback((step: string, newData: Partial<CourseData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStepWithData(step as keyof StepCompletion, updatedData) } };
    });
  }, []);

  const saveCourse = useCallback(async () => {
    if (state.isSaving || !convexUser?.clerkId || !storeId) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      if (state.courseId) {
        await updateCourseWithModulesMutation({ courseId: state.courseId, courseData: { title: state.data.title, description: state.data.description, imageUrl: state.data.thumbnail, price: state.data.price ? parseFloat(state.data.price) : undefined, category: state.data.category, subcategory: state.data.subcategory, skillLevel: state.data.skillLevel, checkoutHeadline: state.data.checkoutHeadline, checkoutDescription: state.data.checkoutDescription, paymentDescription: state.data.paymentDescription, guaranteeText: state.data.guaranteeText, showGuarantee: state.data.showGuarantee, acceptsPayPal: state.data.acceptsPayPal, acceptsStripe: state.data.acceptsStripe }, modules: state.data.modules });
      } else {
        const result = await createCourseMutation({ userId: convexUser.clerkId, storeId, data: { title: state.data.title || "Untitled Course", description: state.data.description || "", checkoutHeadline: state.data.checkoutHeadline || "Get this course", price: state.data.price || "0", category: state.data.category, subcategory: state.data.subcategory, skillLevel: state.data.skillLevel, thumbnail: state.data.thumbnail, modules: state.data.modules } });
        if (result.success && result.courseId) { setState(prev => ({ ...prev, courseId: result.courseId })); router.replace(`/dashboard/create/course?courseId=${result.courseId}&step=${searchParams.get("step") || "thumbnail"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() })); toast({ title: "Course Saved", description: "Your course has been saved successfully." });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", description: "Failed to save your course. Please try again.", variant: "destructive" }); }
  }, [state, convexUser?.clerkId, storeId, updateCourseWithModulesMutation, createCourseMutation, router, searchParams, toast]);

  const canPublish = useCallback((): boolean => Object.values(state.stepCompletion).every(completed => completed), [state.stepCompletion]);

  const createCourse = useCallback(async () => {
    if (!convexUser?.clerkId || !storeId) return { success: false, error: "User not found or invalid store." };
    if (!canPublish()) return { success: false, error: "Please complete all required steps." };
    try {
      const requiredData = { title: state.data.title!, description: state.data.description!, checkoutHeadline: state.data.checkoutHeadline!, price: state.data.price!, category: state.data.category, subcategory: state.data.subcategory, skillLevel: state.data.skillLevel, thumbnail: state.data.thumbnail, modules: state.data.modules };
      if (state.courseId) {
        const result = await updateCourseWithModulesMutation({ courseId: state.courseId, courseData: { title: requiredData.title, description: requiredData.description, checkoutHeadline: requiredData.checkoutHeadline, price: parseFloat(requiredData.price), category: requiredData.category, subcategory: requiredData.subcategory, skillLevel: requiredData.skillLevel, imageUrl: requiredData.thumbnail }, modules: requiredData.modules });
        if (result.success) { toast({ title: "Course Updated!" }); return { success: true, courseId: state.courseId, slug: state.data?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }; }
        return { success: false, error: result.error || "Failed to update course" };
      }
      const result = await createCourseMutation({ userId: convexUser.clerkId, storeId, data: requiredData });
      if (result.success) { toast({ title: "Course Created!" }); return { success: true, courseId: result.courseId, slug: result.slug }; }
      return { success: false, error: "Failed to create course" };
    } catch { return { success: false, error: "Failed to create course." }; }
  }, [convexUser?.clerkId, storeId, state, canPublish, updateCourseWithModulesMutation, createCourseMutation, toast]);

  const togglePublished = useCallback(async () => {
    if (!state.courseId || !convexUser?.clerkId) return { success: false };
    try {
      const result = await togglePublishedMutation({ courseId: state.courseId, userId: convexUser.clerkId });
      if (result.success) toast({ title: result.isPublished ? "Course Published!" : "Course Unpublished", description: result.isPublished ? "Your course is now live." : "Your course has been unpublished." });
      return result;
    } catch { return { success: false }; }
  }, [state.courseId, convexUser?.clerkId, togglePublishedMutation, toast]);

  return <CourseCreationContext.Provider value={{ state, storeId, updateData, saveCourse, validateStep, canPublish, createCourse, togglePublished }}>{children}</CourseCreationContext.Provider>;
}

export function useCourseCreation() {
  const context = useContext(CourseCreationContext);
  if (context === undefined) throw new Error("useCourseCreation must be used within a CourseCreationProvider");
  return context;
}
