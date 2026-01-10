"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";

export interface IncludedContent {
  id: string;
  type: "course" | "product";
  title: string;
  imageUrl?: string;
}

export interface MembershipData {
  tierName?: string;
  description?: string;
  priceMonthly?: string;
  priceYearly?: string;
  benefits?: string[];
  trialDays?: number;
  includedContent?: IncludedContent[];
  includeAllContent?: boolean;
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  content: boolean;
}

interface MembershipCreationState {
  data: MembershipData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  tierId?: Id<"creatorSubscriptionTiers">;
  lastSaved?: Date;
}

interface MembershipCreationContextType {
  state: MembershipCreationState;
  updateData: (step: string, data: Partial<MembershipData>) => void;
  saveTier: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  publishTier: () => Promise<{
    success: boolean;
    error?: string;
    tierId?: Id<"creatorSubscriptionTiers">;
  }>;
  storeId?: string;
  availableCourses: any[];
  availableProducts: any[];
}

const MembershipCreationContext = createContext<MembershipCreationContextType | undefined>(
  undefined
);

export function MembershipCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const tierId = searchParams.get("tierId") as Id<"creatorSubscriptionTiers"> | undefined;

  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const storeId = stores?.[0]?._id;
  const storeUserId = stores?.[0]?.userId;

  const contentData = useQuery(
    api.memberships.getCreatorCoursesAndProducts,
    storeUserId ? { storeId: storeUserId } : "skip"
  );

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating memberships.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast]);

  const createTierMutation = useMutation(api.memberships.createMembershipTier);
  const updateTierMutation = useMutation(api.memberships.updateMembershipTier);
  const publishTierMutation = useMutation(api.memberships.publishMembershipTier);

  const existingTier = useQuery(
    api.memberships.getMembershipTierDetails,
    tierId ? { tierId } : "skip"
  );

  const [state, setState] = useState<MembershipCreationState>({
    data: {
      benefits: [],
      includedContent: [],
      includeAllContent: false,
      trialDays: 0,
    },
    stepCompletion: {
      basics: false,
      pricing: false,
      content: false,
    },
    isLoading: false,
    isSaving: false,
  });

  useEffect(() => {
    if (existingTier && existingTier._id === tierId) {
      const includedContent: IncludedContent[] = [];

      existingTier.courses?.forEach((c: any) => {
        if (c) {
          includedContent.push({
            id: c._id,
            type: "course",
            title: c.title,
            imageUrl: c.imageUrl,
          });
        }
      });

      existingTier.products?.forEach((p: any) => {
        if (p) {
          includedContent.push({
            id: p._id,
            type: "product",
            title: p.title,
            imageUrl: p.imageUrl,
          });
        }
      });

      const newData: MembershipData = {
        tierName: existingTier.tierName || "",
        description: existingTier.description || "",
        priceMonthly: existingTier.priceMonthly?.toString() || "",
        priceYearly: existingTier.priceYearly?.toString() || "",
        benefits: existingTier.benefits || [],
        trialDays: (existingTier as any).trialDays || 0,
        includedContent,
        includeAllContent: existingTier.maxCourses === null,
      };

      const stepCompletion = {
        basics: validateStepWithData("basics", newData),
        pricing: validateStepWithData("pricing", newData),
        content: validateStepWithData("content", newData),
      };

      setState((prev) => ({
        ...prev,
        tierId: existingTier._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingTier, tierId]);

  const validateStepWithData = (step: keyof StepCompletion, data: MembershipData): boolean => {
    switch (step) {
      case "basics":
        return !!(data.tierName && data.description);
      case "pricing":
        return !!(data.priceMonthly && parseFloat(data.priceMonthly) > 0);
      case "content":
        return !!(
          data.includeAllContent ||
          (data.includedContent && data.includedContent.length > 0)
        );
      default:
        return false;
    }
  };

  const validateStep = (step: keyof StepCompletion): boolean => {
    return validateStepWithData(step, state.data);
  };

  const updateData = (step: string, newData: Partial<MembershipData>) => {
    setState((prev) => {
      const updatedData = { ...prev.data, ...newData };

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

  const saveTier = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const includedCourseIds =
        state.data.includedContent?.filter((c) => c.type === "course").map((c) => c.id) || [];

      const includedProductIds =
        state.data.includedContent?.filter((c) => c.type === "product").map((c) => c.id) || [];

      if (state.tierId) {
        await updateTierMutation({
          tierId: state.tierId,
          tierName: state.data.tierName,
          description: state.data.description,
          priceMonthly: state.data.priceMonthly ? parseFloat(state.data.priceMonthly) : undefined,
          priceYearly: state.data.priceYearly ? parseFloat(state.data.priceYearly) : undefined,
          benefits: state.data.benefits,
          trialDays: state.data.trialDays,
          includedCourseIds,
          includedProductIds,
        });
      } else {
        const result = await createTierMutation({
          creatorId: user.id,
          storeId: storeId as string,
          tierName: state.data.tierName || "Untitled Tier",
          description: state.data.description || "",
          priceMonthly: state.data.priceMonthly ? parseFloat(state.data.priceMonthly) : 0,
          priceYearly: state.data.priceYearly ? parseFloat(state.data.priceYearly) : undefined,
          benefits: state.data.benefits || [],
          trialDays: state.data.trialDays,
          includedCourseIds,
          includedProductIds,
          includeAllContent: state.data.includeAllContent,
        });

        if (result?.tierId) {
          setState((prev) => ({ ...prev, tierId: result.tierId }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(
            `/dashboard/create/membership?tierId=${result.tierId}&step=${currentStep}`
          );
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Membership Saved",
        description: "Your membership tier has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save membership:", error);
      setState((prev) => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    }
  };

  const canPublish = (): boolean => {
    return (
      state.stepCompletion.basics && state.stepCompletion.pricing && state.stepCompletion.content
    );
  };

  const publishTier = async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete all required steps before publishing." };
    }

    try {
      await saveTier();

      if (state.tierId) {
        await publishTierMutation({ tierId: state.tierId });

        toast({
          title: "Membership Published!",
          description: "Your membership tier is now live.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, tierId: state.tierId };
      }

      return { success: false, error: "Tier ID not found" };
    } catch (error) {
      return { success: false, error: "Failed to publish membership." };
    }
  };

  return (
    <MembershipCreationContext.Provider
      value={{
        state,
        updateData,
        saveTier,
        validateStep,
        canPublish,
        publishTier,
        storeId: storeId as string,
        availableCourses: contentData?.courses || [],
        availableProducts: contentData?.products || [],
      }}
    >
      {children}
    </MembershipCreationContext.Provider>
  );
}

export function useMembershipCreation() {
  const context = useContext(MembershipCreationContext);
  if (context === undefined) {
    throw new Error("useMembershipCreation must be used within a MembershipCreationProvider");
  }
  return context;
}
