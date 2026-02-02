"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";
import { useStoresByUser, useCreateBundle, useUpdateBundle, usePublishBundle } from "@/lib/convex-typed-hooks";
import { FollowGateConfig } from "../types";

export interface BundleProduct {
  id: Id<"digitalProducts"> | Id<"courses">;
  type: "digital" | "course";
  title: string;
  price: number;
  imageUrl?: string;
  productCategory?: string;
}

export interface BundleData {
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  products?: BundleProduct[];
  price?: string;
  originalPrice?: string;
  discountPercentage?: number;
  showSavings?: boolean;
  // Follow Gate for free bundles
  followGateEnabled?: boolean;
  followGateConfig?: FollowGateConfig;
}

export interface StepCompletion { basics: boolean; products: boolean; pricing: boolean; followGate: boolean; }

interface BundleState {
  data: BundleData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  bundleId?: string;
  lastSaved?: Date;
}

interface BundleContextType {
  state: BundleState;
  updateData: (step: string, data: Partial<BundleData>) => void;
  saveBundle: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createBundle: () => Promise<{ success: boolean; error?: string; bundleId?: string }>;
}

const BundleCreationContext = createContext<BundleContextType | undefined>(undefined);

const validateStep = (step: keyof StepCompletion, data: BundleData): boolean => {
  switch (step) {
    case "basics": return !!(data.title && data.description);
    case "products": return !!(data.products && data.products.length >= 2);
    case "pricing": {
      const price = parseFloat(data.price || "0");
      // Allow $0 for free bundles (Follow Gate will be required)
      return data.price !== undefined && data.price !== "" && price >= 0;
    }
    case "followGate": {
      // Only required if bundle is free
      const isFree = parseFloat(data.price || "0") === 0;
      if (!isFree) return true; // Paid bundles skip this step
      // For free bundles, need at least email or one social platform
      const config = data.followGateConfig;
      if (!config) return false;
      const hasEmail = config.requireEmail;
      const hasSocial = config.requireInstagram || config.requireTiktok || config.requireYoutube || config.requireSpotify;
      return hasEmail || hasSocial;
    }
    default: return false;
  }
};

export function BundleCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const bundleId = searchParams.get("bundleId") || undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;
  const createBundleMutation = useCreateBundle();
  const updateBundleMutation = useUpdateBundle();
  const publishBundleMutation = usePublishBundle();

  const existingBundle = useQuery(api.bundles.getBundleDetails, bundleId ? { bundleId: bundleId as Id<"bundles"> } : "skip") as any;

  const [state, setState] = useState<BundleState>({
    data: { products: [], showSavings: true },
    stepCompletion: { basics: false, products: false, pricing: false, followGate: true },
    isLoading: false, isSaving: false, bundleId,
  });
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", description: "Set up a store first.", variant: "destructive" });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast]);

  useEffect(() => {
    if (existingBundle && existingBundle._id === bundleId && !hasLoadedFromDb) {
      const bundleProducts: BundleProduct[] = [];
      existingBundle.courses?.forEach((c: any) => c && bundleProducts.push({ id: c._id, type: "course", title: c.title, price: c.price || 0, imageUrl: c.imageUrl, productCategory: "course" }));
      existingBundle.products?.forEach((p: any) => p && bundleProducts.push({ id: p._id, type: "digital", title: p.title, price: p.price || 0, imageUrl: p.imageUrl, productCategory: p.productCategory }));

      // Load Follow Gate config if exists
      const followGateConfig: FollowGateConfig | undefined = existingBundle.followGateEnabled ? {
        requireEmail: existingBundle.followGateRequirements?.requireEmail ?? true,
        requireInstagram: existingBundle.followGateRequirements?.requireInstagram ?? false,
        requireTiktok: existingBundle.followGateRequirements?.requireTiktok ?? false,
        requireYoutube: existingBundle.followGateRequirements?.requireYoutube ?? false,
        requireSpotify: existingBundle.followGateRequirements?.requireSpotify ?? false,
        minFollowsRequired: existingBundle.followGateRequirements?.minFollowsRequired ?? 0,
        socialLinks: existingBundle.followGateSocialLinks || {},
        customMessage: existingBundle.followGateMessage,
      } : undefined;

      const newData: BundleData = {
        title: existingBundle.name || "",
        description: existingBundle.description || "",
        thumbnail: existingBundle.imageUrl || "",
        products: bundleProducts,
        price: existingBundle.bundlePrice?.toString() || "",
        originalPrice: existingBundle.originalPrice?.toString() || "",
        discountPercentage: existingBundle.discountPercentage,
        showSavings: true,
        followGateEnabled: existingBundle.followGateEnabled,
        followGateConfig,
      };
      setState(prev => ({ ...prev, bundleId: existingBundle._id, data: newData, stepCompletion: { basics: validateStep("basics", newData), products: validateStep("products", newData), pricing: validateStep("pricing", newData), followGate: validateStep("followGate", newData) } }));
      setHasLoadedFromDb(true);
    }
  }, [existingBundle, bundleId, hasLoadedFromDb]);

  const updateData = useCallback((step: string, newData: Partial<BundleData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      if (newData.products) {
        const total = newData.products.reduce((sum, p) => sum + p.price, 0);
        updatedData.originalPrice = total.toFixed(2);
        if (updatedData.price) updatedData.discountPercentage = Math.round(((total - parseFloat(updatedData.price)) / total) * 100);
      }
      return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStep(step as keyof StepCompletion, updatedData) } };
    });
  }, []);

  const saveBundle = useCallback(async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      const courseIds = (state.data.products?.filter(p => p.type === "course").map(p => p.id) as Id<"courses">[]) || [];
      const productIds = (state.data.products?.filter(p => p.type === "digital").map(p => p.id) as Id<"digitalProducts">[]) || [];
      const bundleType = courseIds.length > 0 && productIds.length > 0 ? "mixed" : courseIds.length > 0 ? "course_bundle" : "product_bundle";

      // Prepare Follow Gate settings
      const isFreeBundle = parseFloat(state.data.price || "0") === 0;
      const followGateConfig = state.data.followGateConfig;
      const followGateEnabled = isFreeBundle && state.data.followGateEnabled;

      if (state.bundleId) {
        await updateBundleMutation({
          bundleId: state.bundleId as Id<"bundles">,
          name: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          bundlePrice: state.data.price ? parseFloat(state.data.price) : undefined,
          courseIds: courseIds.length > 0 ? courseIds : undefined,
          productIds: productIds.length > 0 ? productIds : undefined,
          // Follow Gate settings
          followGateEnabled,
          followGateRequirements: followGateEnabled && followGateConfig ? {
            requireEmail: followGateConfig.requireEmail,
            requireInstagram: followGateConfig.requireInstagram,
            requireTiktok: followGateConfig.requireTiktok,
            requireYoutube: followGateConfig.requireYoutube,
            requireSpotify: followGateConfig.requireSpotify,
            minFollowsRequired: followGateConfig.minFollowsRequired,
          } : undefined,
          followGateSocialLinks: followGateEnabled && followGateConfig ? followGateConfig.socialLinks : undefined,
          followGateMessage: followGateEnabled && followGateConfig ? followGateConfig.customMessage : undefined,
        });
      } else {
        const result = await createBundleMutation({ storeId, creatorId: user.id, name: state.data.title || "Untitled Bundle", description: state.data.description || "", bundleType, courseIds: courseIds.length > 0 ? courseIds : undefined, productIds: productIds.length > 0 ? productIds : undefined, bundlePrice: state.data.price ? parseFloat(state.data.price) : 0, imageUrl: state.data.thumbnail });
        if (result?.bundleId) { setState(prev => ({ ...prev, bundleId: result.bundleId as string })); router.replace(`/dashboard/create/bundle?bundleId=${result.bundleId}&step=${searchParams.get("step") || "basics"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() }));
      toast({ title: "Bundle Saved", description: "Saved as draft." });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state, user?.id, storeId, createBundleMutation, updateBundleMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => {
    const { basics, products, pricing, followGate } = state.stepCompletion;
    return basics && products && pricing && followGate;
  }, [state.stepCompletion]);

  const createBundle = useCallback(async () => {
    if (!user?.id || !storeId) return { success: false, error: "Invalid user/store." };
    if (!canPublish()) return { success: false, error: "Complete all steps." };
    try {
      await saveBundle();
      if (state.bundleId) { await publishBundleMutation({ bundleId: state.bundleId as Id<"bundles"> }); toast({ title: "Bundle Published!" }); return { success: true, bundleId: state.bundleId }; }
      return { success: false, error: "Bundle ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, storeId, state.bundleId, canPublish, saveBundle, publishBundleMutation, toast]);

  return <BundleCreationContext.Provider value={{ state, updateData, saveBundle, validateStep: (s) => validateStep(s, state.data), canPublish, createBundle }}>{children}</BundleCreationContext.Provider>;
}

export function useBundleCreation() {
  const ctx = useContext(BundleCreationContext);
  if (!ctx) throw new Error("useBundleCreation must be used within BundleCreationProvider");
  return ctx;
}
