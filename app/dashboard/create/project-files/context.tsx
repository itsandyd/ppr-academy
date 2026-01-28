"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { DAWType } from "../types";
import { useStoresByUser, useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct } from "@/lib/convex-typed-hooks";

export interface ProjectFileData {
  title?: string; description?: string; dawType?: DAWType; dawVersion?: string; tags?: string[]; thumbnail?: string;
  price?: string; pricingModel?: "free_with_gate" | "paid";
  followGateEnabled?: boolean; followGateMessage?: string;
  followGateRequirements?: { requireEmail?: boolean; requireInstagram?: boolean; requireTiktok?: boolean; requireYoutube?: boolean; requireSpotify?: boolean; minFollowsRequired?: number; };
  followGateSocialLinks?: { instagram?: string; tiktok?: string; youtube?: string; spotify?: string; };
  files?: Array<{ id: string; name: string; storageId: string; size: number; type: string; }>;
  downloadUrl?: string;
  genre?: string[];
  bpm?: number;
  musicalKey?: string;
  installationNotes?: string;
  thirdPartyPlugins?: string[];
}

export interface StepCompletion { basics: boolean; files: boolean; pricing: boolean; }
interface ProjectFileState { data: ProjectFileData; stepCompletion: StepCompletion; isLoading: boolean; isSaving: boolean; projectId?: string; lastSaved?: Date; }
interface ProjectFileContextType { state: ProjectFileState; updateData: (step: string, data: Partial<ProjectFileData>) => void; saveProject: () => Promise<void>; validateStep: (step: keyof StepCompletion) => boolean; canPublish: () => boolean; createProject: () => Promise<{ success: boolean; error?: string; projectId?: string }>; }

const ProjectFileCreationContext = createContext<ProjectFileContextType | undefined>(undefined);

const validateStep = (step: keyof StepCompletion, data: ProjectFileData): boolean => {
  switch (step) {
    case "basics": return !!(data.title && data.description && data.dawType);
    case "files": return !!(data.files && data.files.length > 0);
    case "pricing": return data.pricingModel === "free_with_gate" || !!(data.pricingModel === "paid" && data.price && parseFloat(data.price) > 0);
    default: return false;
  }
};

export function ProjectFileCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const projectId = searchParams.get("projectId") || undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;
  const existingProject = useDigitalProductById(projectId as Id<"digitalProducts"> | undefined);
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();

  const [state, setState] = useState<ProjectFileState>({ data: { pricingModel: "paid" }, stepCompletion: { basics: false, files: false, pricing: false }, isLoading: false, isSaving: false, projectId });
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", variant: "destructive" }); router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  useEffect(() => {
    if (existingProject && projectId && !hasLoadedFromDb) {
      const newData: ProjectFileData = { title: existingProject.title, description: existingProject.description, dawType: existingProject.dawType as DAWType, dawVersion: existingProject.dawVersion as string | undefined, thumbnail: existingProject.imageUrl, price: existingProject.price?.toString(), pricingModel: (existingProject.pricingModel || "paid") as "free_with_gate" | "paid", tags: existingProject.tags, genre: (existingProject as any).genre as string[] | undefined, downloadUrl: existingProject.downloadUrl };
      setState(prev => ({ ...prev, projectId, data: newData, stepCompletion: { basics: validateStep("basics", newData), files: validateStep("files", newData), pricing: validateStep("pricing", newData) } }));
      setHasLoadedFromDb(true);
    }
  }, [existingProject, projectId, hasLoadedFromDb]);

  const updateData = useCallback((step: string, newData: Partial<ProjectFileData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStep(step as keyof StepCompletion, updatedData) } };
    });
  }, []);

  const saveProject = useCallback(async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      // Build followGateConfig if pricing model is free_with_gate
      const followGateConfig = state.data.pricingModel === "free_with_gate" ? {
        requireEmail: state.data.followGateRequirements?.requireEmail ?? true,
        requireInstagram: state.data.followGateRequirements?.requireInstagram ?? false,
        requireTiktok: state.data.followGateRequirements?.requireTiktok ?? false,
        requireYoutube: state.data.followGateRequirements?.requireYoutube ?? false,
        requireSpotify: state.data.followGateRequirements?.requireSpotify ?? false,
        minFollowsRequired: state.data.followGateRequirements?.minFollowsRequired ?? 0,
        socialLinks: state.data.followGateSocialLinks || {},
        customMessage: state.data.followGateMessage,
      } : undefined;

      const baseParams = { title: state.data.title, description: state.data.description, imageUrl: state.data.thumbnail, price: state.data.pricingModel === "free_with_gate" ? 0 : (state.data.price ? parseFloat(state.data.price) : undefined), pricingModel: state.data.pricingModel, dawType: state.data.dawType, dawVersion: state.data.dawVersion, tags: state.data.tags, genre: state.data.genre ? [state.data.genre] : undefined };

      if (state.projectId) {
        await updateMutation({
          id: state.projectId as Id<"digitalProducts">,
          ...baseParams,
          followGateEnabled: state.data.pricingModel === "free_with_gate",
          followGateRequirements: state.data.pricingModel === "free_with_gate" ? state.data.followGateRequirements : undefined,
          followGateSocialLinks: state.data.pricingModel === "free_with_gate" ? state.data.followGateSocialLinks : undefined,
          followGateMessage: state.data.pricingModel === "free_with_gate" ? state.data.followGateMessage : undefined,
        });
      } else {
        const result = await createMutation({ ...baseParams, title: state.data.title || "Untitled Project", storeId, userId: user.id, productType: "digital", productCategory: "project-file", price: state.data.pricingModel === "free_with_gate" ? 0 : (state.data.price ? parseFloat(state.data.price) : 0), followGateConfig });
        if (result) { setState(prev => ({ ...prev, projectId: result as string })); router.replace(`/dashboard/create/project-files?projectId=${result}&step=${searchParams.get("step") || "basics"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() })); toast({ title: "Project Saved" });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state, user?.id, storeId, createMutation, updateMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => state.stepCompletion.basics && state.stepCompletion.files && state.stepCompletion.pricing, [state.stepCompletion]);

  const createProject = useCallback(async () => {
    if (!user?.id || !storeId) return { success: false, error: "Invalid user/store." };
    if (!canPublish()) return { success: false, error: "Complete all steps." };
    try {
      if (state.projectId) { await updateMutation({ id: state.projectId as Id<"digitalProducts">, isPublished: true }); toast({ title: "Project Published!" }); return { success: true, projectId: state.projectId }; }
      return { success: false, error: "Project ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, storeId, state.projectId, canPublish, updateMutation, toast]);

  return <ProjectFileCreationContext.Provider value={{ state, updateData, saveProject, validateStep: (s) => validateStep(s, state.data), canPublish, createProject }}>{children}</ProjectFileCreationContext.Provider>;
}

export function useProjectFileCreation() {
  const ctx = useContext(ProjectFileCreationContext);
  if (!ctx) throw new Error("useProjectFileCreation must be used within ProjectFileCreationProvider");
  return ctx;
}
