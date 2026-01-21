"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";

export interface IncludedContent { id: string; type: "course" | "product"; title: string; imageUrl?: string; }
export interface MembershipData { tierName?: string; description?: string; priceMonthly?: string; priceYearly?: string; benefits?: string[]; trialDays?: number; includedContent?: IncludedContent[]; includeAllContent?: boolean; }
export interface StepCompletion { basics: boolean; pricing: boolean; content: boolean; }

interface MembershipState { data: MembershipData; stepCompletion: StepCompletion; isLoading: boolean; isSaving: boolean; tierId?: string; lastSaved?: Date; }
interface MembershipContextType { state: MembershipState; updateData: (step: string, data: Partial<MembershipData>) => void; saveTier: () => Promise<void>; validateStep: (step: keyof StepCompletion) => boolean; canPublish: () => boolean; publishTier: () => Promise<{ success: boolean; error?: string; tierId?: string }>; storeId?: string; availableCourses: any[]; availableProducts: any[]; }

const MembershipCreationContext = createContext<MembershipContextType | undefined>(undefined);

const validateStep = (step: keyof StepCompletion, data: MembershipData): boolean => {
  switch (step) {
    case "basics": return !!(data.tierName && data.description);
    case "pricing": return !!(data.priceMonthly && parseFloat(data.priceMonthly) > 0);
    case "content": return !!(data.includeAllContent || (data.includedContent && data.includedContent.length > 0));
    default: return false;
  }
};

export function MembershipCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const tierId = searchParams.get("tierId") || undefined;

  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const storeId = stores?.[0]?._id;
  const storeUserId = stores?.[0]?.userId;
  const contentData = useQuery(api.memberships.getCreatorCoursesAndProducts, storeUserId ? { storeId: storeUserId } : "skip");

  const createTierMutation = useMutation(api.memberships.createMembershipTier);
  const updateTierMutation = useMutation(api.memberships.updateMembershipTier);
  const publishTierMutation = useMutation(api.memberships.publishMembershipTier);
  const existingTier = useQuery(api.memberships.getMembershipTierDetails, tierId ? { tierId: tierId as Id<"creatorSubscriptionTiers"> } : "skip");

  const [state, setState] = useState<MembershipState>({ data: { benefits: [], includedContent: [], includeAllContent: false, trialDays: 0 }, stepCompletion: { basics: false, pricing: false, content: false }, isLoading: false, isSaving: false });

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({ title: "Store Required", description: "Set up a store first.", variant: "destructive" });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast]);

  useEffect(() => {
    if (existingTier && (existingTier as any)._id === tierId) {
      const includedContent: IncludedContent[] = [];
      (existingTier as any).courses?.forEach((c: any) => c && includedContent.push({ id: c._id, type: "course", title: c.title, imageUrl: c.imageUrl }));
      (existingTier as any).products?.forEach((p: any) => p && includedContent.push({ id: p._id, type: "product", title: p.title, imageUrl: p.imageUrl }));
      const newData: MembershipData = { tierName: (existingTier as any).tierName || "", description: (existingTier as any).description || "", priceMonthly: (existingTier as any).priceMonthly?.toString() || "", priceYearly: (existingTier as any).priceYearly?.toString() || "", benefits: (existingTier as any).benefits || [], trialDays: (existingTier as any).trialDays || 0, includedContent, includeAllContent: (existingTier as any).maxCourses === null };
      setState(prev => ({ ...prev, tierId: (existingTier as any)._id, data: newData, stepCompletion: { basics: validateStep("basics", newData), pricing: validateStep("pricing", newData), content: validateStep("content", newData) } }));
    }
  }, [existingTier, tierId]);

  const updateData = useCallback((step: string, newData: Partial<MembershipData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData };
      return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStep(step as keyof StepCompletion, updatedData) } };
    });
  }, []);

  const saveTier = useCallback(async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      const includedCourseIds = state.data.includedContent?.filter(c => c.type === "course").map(c => c.id) || [];
      const includedProductIds = state.data.includedContent?.filter(c => c.type === "product").map(c => c.id) || [];
      if (state.tierId) {
        await updateTierMutation({ tierId: state.tierId as Id<"creatorSubscriptionTiers">, tierName: state.data.tierName, description: state.data.description, priceMonthly: state.data.priceMonthly ? parseFloat(state.data.priceMonthly) : undefined, priceYearly: state.data.priceYearly ? parseFloat(state.data.priceYearly) : undefined, benefits: state.data.benefits, trialDays: state.data.trialDays, includedCourseIds, includedProductIds });
      } else {
        const result = await createTierMutation({ creatorId: user.id, storeId: storeId as string, tierName: state.data.tierName || "Untitled Tier", description: state.data.description || "", priceMonthly: state.data.priceMonthly ? parseFloat(state.data.priceMonthly) : 0, priceYearly: state.data.priceYearly ? parseFloat(state.data.priceYearly) : undefined, benefits: state.data.benefits || [], trialDays: state.data.trialDays, includedCourseIds, includedProductIds, includeAllContent: state.data.includeAllContent });
        if (result?.tierId) { setState(prev => ({ ...prev, tierId: result.tierId })); router.replace(`/dashboard/create/membership?tierId=${result.tierId}&step=${searchParams.get("step") || "basics"}`); }
      }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() }));
      toast({ title: "Membership Saved" });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state, user?.id, storeId, createTierMutation, updateTierMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => state.stepCompletion.basics && state.stepCompletion.pricing && state.stepCompletion.content, [state.stepCompletion]);

  const publishTier = useCallback(async () => {
    if (!user?.id || !storeId) return { success: false, error: "Invalid user/store." };
    if (!canPublish()) return { success: false, error: "Complete all steps." };
    try {
      await saveTier();
      if (state.tierId) { await publishTierMutation({ tierId: state.tierId as Id<"creatorSubscriptionTiers"> }); toast({ title: "Membership Published!" }); return { success: true, tierId: state.tierId }; }
      return { success: false, error: "Tier ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, storeId, state.tierId, canPublish, saveTier, publishTierMutation, toast]);

  return <MembershipCreationContext.Provider value={{ state, updateData, saveTier, validateStep: (s) => validateStep(s, state.data), canPublish, publishTier, storeId: storeId as string, availableCourses: contentData?.courses || [], availableProducts: contentData?.products || [] }}>{children}</MembershipCreationContext.Provider>;
}

export function useMembershipCreation() {
  const ctx = useContext(MembershipCreationContext);
  if (!ctx) throw new Error("useMembershipCreation must be used within MembershipCreationProvider");
  return ctx;
}
