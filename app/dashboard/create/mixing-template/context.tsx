"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { DAWType } from "../types";
import { useStoresByUser, useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct } from "@/lib/convex-typed-hooks";

export interface MixingTemplateData {
  title?: string; description?: string; dawType?: DAWType; dawVersion?: string; tags?: string[]; thumbnail?: string;
  price?: string; pricingModel?: "free_with_gate" | "paid";
  followGateEnabled?: boolean; followGateMessage?: string;
  followGateRequirements?: { requireEmail?: boolean; requireInstagram?: boolean; requireTiktok?: boolean; requireYoutube?: boolean; requireSpotify?: boolean; minFollowsRequired?: number; };
  followGateSocialLinks?: { instagram?: string; tiktok?: string; youtube?: string; spotify?: string; };
  files?: Array<{ id: string; name: string; storageId: string; size: number; type: string; }>;
  downloadUrl?: string;
  genre?: string[];
  templateType?: string;
  channelCount?: number;
  installationNotes?: string;
  thirdPartyPlugins?: string[];
}

export interface StepCompletion { basics: boolean; files: boolean; pricing: boolean; }
interface MixingTemplateState { data: MixingTemplateData; stepCompletion: StepCompletion; isLoading: boolean; isSaving: boolean; templateId?: string; lastSaved?: Date; }
interface MixingTemplateContextType { state: MixingTemplateState; updateData: (step: string, data: Partial<MixingTemplateData>) => void; saveTemplate: () => Promise<void>; validateStep: (step: keyof StepCompletion) => boolean; canPublish: () => boolean; createTemplate: () => Promise<{ success: boolean; error?: string; templateId?: string }>; }

const MixingTemplateCreationContext = createContext<MixingTemplateContextType | undefined>(undefined);

const validateStep = (step: keyof StepCompletion, data: MixingTemplateData): boolean => {
  switch (step) {
    case "basics": return !!(data.title && data.description && data.dawType);
    case "files": return !!(data.files && data.files.length > 0);
    case "pricing": return data.pricingModel === "free_with_gate" || !!(data.pricingModel === "paid" && data.price && parseFloat(data.price) > 0);
    default: return false;
  }
};

export function MixingTemplateCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const templateId = searchParams.get("templateId") || undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;
  const existingTemplate = useDigitalProductById(templateId as Id<"digitalProducts"> | undefined);
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();

  const [state, setState] = useState<MixingTemplateState>({ data: { pricingModel: "paid" }, stepCompletion: { basics: false, files: false, pricing: false }, isLoading: false, isSaving: false, templateId });

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", variant: "destructive" }); router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  useEffect(() => {
    if (existingTemplate && templateId) {
      const newData: MixingTemplateData = { title: existingTemplate.title, description: existingTemplate.description, dawType: existingTemplate.dawType as DAWType, dawVersion: existingTemplate.dawVersion as string | undefined, thumbnail: existingTemplate.imageUrl, price: existingTemplate.price?.toString(), pricingModel: (existingTemplate.pricingModel || "paid") as "free_with_gate" | "paid", tags: existingTemplate.tags, genre: (existingTemplate as any).genre as string[] | undefined };
      setState(prev => ({ ...prev, templateId, data: newData, stepCompletion: { basics: validateStep("basics", newData), files: validateStep("files", newData), pricing: validateStep("pricing", newData) } }));
    }
  }, [existingTemplate, templateId]);

  const updateData = useCallback((step: string, newData: Partial<MixingTemplateData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStep(step as keyof StepCompletion, updatedData) } };
    });
  }, []);

  const saveTemplate = useCallback(async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      const params = { title: state.data.title, description: state.data.description, imageUrl: state.data.thumbnail, price: state.data.price ? parseFloat(state.data.price) : undefined, pricingModel: state.data.pricingModel, dawType: state.data.dawType, dawVersion: state.data.dawVersion, tags: state.data.tags, genre: state.data.genre ? [state.data.genre] : undefined };
      if (state.templateId) { await updateMutation({ id: state.templateId as Id<"digitalProducts">, ...params }); }
      else {
        const result = await createMutation({ ...params, title: state.data.title || "Untitled Template", storeId, userId: user.id, productType: "digital", productCategory: "mixing-template", price: state.data.price ? parseFloat(state.data.price) : 0 });
        if (result) { setState(prev => ({ ...prev, templateId: result as string })); router.replace(`/dashboard/create/mixing-template?templateId=${result}&step=${searchParams.get("step") || "basics"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() })); toast({ title: "Template Saved" });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state, user?.id, storeId, createMutation, updateMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => state.stepCompletion.basics && state.stepCompletion.files && state.stepCompletion.pricing, [state.stepCompletion]);

  const createTemplate = useCallback(async () => {
    if (!user?.id || !storeId) return { success: false, error: "Invalid user/store." };
    if (!canPublish()) return { success: false, error: "Complete all steps." };
    try {
      if (state.templateId) { await updateMutation({ id: state.templateId as Id<"digitalProducts">, isPublished: true }); toast({ title: "Template Published!" }); return { success: true, templateId: state.templateId }; }
      return { success: false, error: "Template ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, storeId, state.templateId, canPublish, updateMutation, toast]);

  return <MixingTemplateCreationContext.Provider value={{ state, updateData, saveTemplate, validateStep: (s) => validateStep(s, state.data), canPublish, createTemplate }}>{children}</MixingTemplateCreationContext.Provider>;
}

export function useMixingTemplateCreation() {
  const ctx = useContext(MixingTemplateCreationContext);
  if (!ctx) throw new Error("useMixingTemplateCreation must be used within MixingTemplateCreationProvider");
  return ctx;
}
