"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { DAWType } from "../types";
import { useStoresByUser, useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct } from "@/lib/convex-typed-hooks";

export interface EffectChainData {
  title?: string; description?: string; dawType?: DAWType; dawVersion?: string; tags?: string[]; thumbnail?: string;
  price?: string; pricingModel?: "free_with_gate" | "paid";
  followGateEnabled?: boolean; followGateMessage?: string;
  followGateRequirements?: { requireEmail?: boolean; requireInstagram?: boolean; requireTiktok?: boolean; requireYoutube?: boolean; requireSpotify?: boolean; minFollowsRequired?: number; };
  followGateSocialLinks?: { instagram?: string; tiktok?: string; youtube?: string; spotify?: string; };
  files?: Array<{ id: string; name: string; storageId: string; size: number; type: string; }>;
  downloadUrl?: string;
  genre?: string[];
}

export interface StepCompletion { basics: boolean; files: boolean; pricing: boolean; }
interface EffectChainState { data: EffectChainData; stepCompletion: StepCompletion; isLoading: boolean; isSaving: boolean; chainId?: string; lastSaved?: Date; }
interface EffectChainContextType { state: EffectChainState; updateData: (step: string, data: Partial<EffectChainData>) => void; saveChain: () => Promise<void>; validateStep: (step: keyof StepCompletion) => boolean; canPublish: () => boolean; createChain: () => Promise<{ success: boolean; error?: string; chainId?: string }>; }

const EffectChainCreationContext = createContext<EffectChainContextType | undefined>(undefined);

const validateStep = (step: keyof StepCompletion, data: EffectChainData): boolean => {
  switch (step) {
    case "basics": return !!(data.title && data.description && data.dawType);
    case "files": return !!(data.files && data.files.length > 0);
    case "pricing": return data.pricingModel === "free_with_gate" || !!(data.pricingModel === "paid" && data.price && parseFloat(data.price) > 0);
    default: return false;
  }
};

export function EffectChainCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const chainId = searchParams.get("chainId") || undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;
  const existingChain = useDigitalProductById(chainId as Id<"digitalProducts"> | undefined);
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();

  const [state, setState] = useState<EffectChainState>({ data: { pricingModel: "paid" }, stepCompletion: { basics: false, files: false, pricing: false }, isLoading: false, isSaving: false, chainId });

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", variant: "destructive" }); router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  useEffect(() => {
    if (existingChain && chainId) {
      const newData: EffectChainData = { title: existingChain.title, description: existingChain.description, dawType: existingChain.dawType as DAWType, dawVersion: existingChain.dawVersion as string | undefined, thumbnail: existingChain.imageUrl, price: existingChain.price?.toString(), pricingModel: (existingChain.pricingModel || "paid") as "free_with_gate" | "paid", tags: existingChain.tags, genre: (existingChain as any).genre as string[] | undefined };
      setState(prev => ({ ...prev, chainId, data: newData, stepCompletion: { basics: validateStep("basics", newData), files: validateStep("files", newData), pricing: validateStep("pricing", newData) } }));
    }
  }, [existingChain, chainId]);

  const updateData = useCallback((step: string, newData: Partial<EffectChainData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStep(step as keyof StepCompletion, updatedData) } };
    });
  }, []);

  const saveChain = useCallback(async () => {
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

      const params = { title: state.data.title, description: state.data.description, imageUrl: state.data.thumbnail, price: state.data.pricingModel === "free_with_gate" ? 0 : (state.data.price ? parseFloat(state.data.price) : undefined), pricingModel: state.data.pricingModel, dawType: state.data.dawType, dawVersion: state.data.dawVersion, tags: state.data.tags, genre: state.data.genre ? [state.data.genre] : undefined, followGateConfig };
      if (state.chainId) { await updateMutation({ id: state.chainId as Id<"digitalProducts">, ...params }); }
      else {
        const result = await createMutation({ ...params, title: state.data.title || "Untitled Chain", storeId, userId: user.id, productType: "digital", productCategory: "effect-chain", price: state.data.pricingModel === "free_with_gate" ? 0 : (state.data.price ? parseFloat(state.data.price) : 0), followGateConfig });
        if (result) { setState(prev => ({ ...prev, chainId: result as string })); router.replace(`/dashboard/create/chain?chainId=${result}&step=${searchParams.get("step") || "basics"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() })); toast({ title: "Chain Saved" });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state, user?.id, storeId, createMutation, updateMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => state.stepCompletion.basics && state.stepCompletion.files && state.stepCompletion.pricing, [state.stepCompletion]);

  const createChain = useCallback(async () => {
    if (!user?.id || !storeId) return { success: false, error: "Invalid user/store." };
    if (!canPublish()) return { success: false, error: "Complete all steps." };
    try {
      if (state.chainId) { await updateMutation({ id: state.chainId as Id<"digitalProducts">, isPublished: true }); toast({ title: "Chain Published!" }); return { success: true, chainId: state.chainId }; }
      return { success: false, error: "Chain ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, storeId, state.chainId, canPublish, updateMutation, toast]);

  return <EffectChainCreationContext.Provider value={{ state, updateData, saveChain, validateStep: (s) => validateStep(s, state.data), canPublish, createChain }}>{children}</EffectChainCreationContext.Provider>;
}

export function useEffectChainCreation() {
  const ctx = useContext(EffectChainCreationContext);
  if (!ctx) throw new Error("useEffectChainCreation must be used within EffectChainCreationProvider");
  return ctx;
}
