"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { BeatLeaseData, StepCompletion, DEFAULT_LEASE_OPTIONS, LeaseOption } from "./types";
import { useStoresByUser, useCreateUniversalProduct, useUpdateDigitalProduct } from "@/lib/convex-typed-hooks";

function convertToBeatlLeaseConfig(leaseOptions: LeaseOption[] | undefined, metadata: BeatLeaseData["metadata"]) {
  if (!leaseOptions) return undefined;
  const tiers = leaseOptions.filter(opt => opt.enabled && opt.type !== "free").map(opt => ({
    type: (opt.type === "basic" ? "basic" : opt.type === "premium" ? "premium" : "exclusive") as "basic" | "premium" | "exclusive" | "unlimited",
    enabled: opt.enabled, price: opt.price, name: opt.type === "basic" ? "Basic Lease" : opt.type === "premium" ? "Premium Lease" : "Exclusive Rights",
    distributionLimit: opt.distributionLimit, commercialUse: opt.commercialUse, musicVideoUse: opt.commercialUse, radioBroadcasting: opt.commercialUse, stemsIncluded: opt.stemsIncluded, creditRequired: true,
  }));
  return { tiers, bpm: metadata?.bpm, key: metadata?.key, genre: metadata?.genre };
}

interface BeatLeaseState { data: BeatLeaseData; stepCompletion: StepCompletion; isLoading: boolean; isSaving: boolean; beatId?: string; lastSaved?: Date; }
interface BeatLeaseContextType { state: BeatLeaseState; updateData: (step: string, data: Partial<BeatLeaseData>) => void; saveBeat: () => Promise<void>; validateStep: (step: keyof StepCompletion) => boolean; canPublish: () => boolean; createBeat: () => Promise<{ success: boolean; error?: string; beatId?: string }>; }

const BeatLeaseCreationContext = createContext<BeatLeaseContextType | undefined>(undefined);

const validateStep = (step: keyof StepCompletion, data: BeatLeaseData): boolean => {
  switch (step) {
    case "basics": return !!(data.title && data.description);
    case "metadata": return !!(data.metadata?.bpm && data.metadata?.key && data.metadata?.genre);
    case "files": return !!(data.files?.mp3Url || data.files?.wavUrl);
    case "licensing": return !!(data.leaseOptions?.some(opt => opt.enabled));
    default: return false;
  }
};

export function BeatLeaseCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const beatId = searchParams.get("beatId") || undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;
  const createBeatMutation = useCreateUniversalProduct();
  const updateBeatMutation = useUpdateDigitalProduct();

  const [state, setState] = useState<BeatLeaseState>(() => {
    const initialData: BeatLeaseData = { leaseOptions: DEFAULT_LEASE_OPTIONS, metadata: { bpm: 140, key: "C minor", genre: "trap", tagged: true, duration: 180 }, producerTag: `Prod. by ${user?.firstName || 'Producer'}` };
    return { data: initialData, stepCompletion: { basics: false, metadata: !!(initialData.metadata?.bpm && initialData.metadata?.key && initialData.metadata?.genre), files: false, licensing: !!(initialData.leaseOptions?.some(opt => opt.enabled)) }, isLoading: false, isSaving: false, beatId };
  });

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", description: "Set up a store first.", variant: "destructive" });
      router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  const updateData = useCallback((step: string, newData: Partial<BeatLeaseData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      return { ...prev, data: updatedData, stepCompletion: { basics: validateStep("basics", updatedData), metadata: validateStep("metadata", updatedData), files: validateStep("files", updatedData), licensing: validateStep("licensing", updatedData) } };
    });
  }, []);

  const saveBeat = useCallback(async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      const beatLeaseConfig = convertToBeatlLeaseConfig(state.data.leaseOptions, state.data.metadata);
      if (state.beatId) {
        await updateBeatMutation({ id: state.beatId as Id<"digitalProducts">, title: state.data.title, description: state.data.description, imageUrl: state.data.thumbnail, tags: state.data.tags, bpm: state.data.metadata?.bpm, musicalKey: state.data.metadata?.key, genre: state.data.metadata?.genre ? [state.data.metadata.genre] : undefined, beatLeaseConfig, downloadUrl: state.data.files?.mp3Url, demoAudioUrl: state.data.files?.mp3Url, wavUrl: state.data.files?.wavUrl, stemsUrl: state.data.files?.stemsUrl, trackoutsUrl: state.data.files?.trackoutsUrl });
      } else {
        const result = await createBeatMutation({ title: state.data.title || "Untitled Beat", description: state.data.description, storeId, userId: user.id, productType: "digital", productCategory: "beat-lease", pricingModel: "paid", price: state.data.leaseOptions?.find(opt => opt.enabled)?.price || 25, imageUrl: state.data.thumbnail, tags: state.data.tags, beatLeaseConfig, downloadUrl: state.data.files?.mp3Url });
        if (result) { setState(prev => ({ ...prev, beatId: result as string })); router.replace(`/dashboard/create/beat-lease?beatId=${result}&step=${searchParams.get("step") || "basics"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() }));
      toast({ title: "Beat Saved" });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state, user?.id, storeId, createBeatMutation, updateBeatMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => state.stepCompletion.basics && state.stepCompletion.metadata && state.stepCompletion.files && state.stepCompletion.licensing, [state.stepCompletion]);

  const createBeat = useCallback(async () => {
    if (!user?.id || !storeId) return { success: false, error: "Invalid user/store." };
    if (!canPublish()) return { success: false, error: "Complete all steps." };
    try {
      const beatLeaseConfig = convertToBeatlLeaseConfig(state.data.leaseOptions, state.data.metadata);
      if (state.beatId) {
        await updateBeatMutation({ id: state.beatId as Id<"digitalProducts">, isPublished: true, title: state.data.title, description: state.data.description, imageUrl: state.data.thumbnail, tags: state.data.tags, bpm: state.data.metadata?.bpm, musicalKey: state.data.metadata?.key, genre: state.data.metadata?.genre ? [state.data.metadata.genre] : undefined, beatLeaseConfig, downloadUrl: state.data.files?.mp3Url, demoAudioUrl: state.data.files?.mp3Url, wavUrl: state.data.files?.wavUrl, stemsUrl: state.data.files?.stemsUrl, trackoutsUrl: state.data.files?.trackoutsUrl });
        toast({ title: "Beat Published!" });
        return { success: true, beatId: state.beatId };
      }
      return { success: false, error: "Beat ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, storeId, state, canPublish, updateBeatMutation, toast]);

  return <BeatLeaseCreationContext.Provider value={{ state, updateData, saveBeat, validateStep: (s) => validateStep(s, state.data), canPublish, createBeat }}>{children}</BeatLeaseCreationContext.Provider>;
}

export function useBeatLeaseCreation() {
  const ctx = useContext(BeatLeaseCreationContext);
  if (!ctx) throw new Error("useBeatLeaseCreation must be used within BeatLeaseCreationProvider");
  return ctx;
}
