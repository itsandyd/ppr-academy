"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { CoachingData, StepCompletion } from "./types";
import {
  useStoresByUser,
  useCreateUniversalProduct,
  useUpdateDigitalProduct,
} from "@/lib/convex-typed-hooks";

interface CoachingCreationState {
  data: CoachingData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  coachingId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface CoachingCreationContextType {
  state: CoachingCreationState;
  updateData: (step: string, data: Partial<CoachingData>) => void;
  saveCoaching: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createCoaching: () => Promise<{
    success: boolean;
    error?: string;
    coachingId?: Id<"digitalProducts">;
  }>;
}

const CoachingCreationContext = createContext<CoachingCreationContextType | undefined>(undefined);

export function CoachingCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const coachingId = searchParams.get("coachingId") as Id<"digitalProducts"> | undefined;

  // Fetch user's stores
  const stores = useStoresByUser(user?.id);

  const storeId = stores?.[0]?._id;

  // Redirect if no store
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating coaching sessions.",
        variant: "destructive",
      });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast]);

  const createCoachingMutation = useCreateUniversalProduct();
  const updateCoachingMutation = useUpdateDigitalProduct();

  const [state, setState] = useState<CoachingCreationState>({
    data: {
      pricingModel: "paid",
      sessionType: "production-coaching",
      duration: 60,
      price: "50",
      discordConfig: {
        requireDiscord: true,
        autoCreateChannel: true,
        notifyOnBooking: true,
      },
      bufferTime: 15,
      maxBookingsPerDay: 3,
      advanceBookingDays: 30,
      sessionFormat: "video",
    },
    stepCompletion: {
      basics: false,
      pricing: false,
      followGate: true,
      discord: true,
      availability: false,
    },
    isLoading: false,
    isSaving: false,
  });

  const validateStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "basics":
        return !!(
          state.data.title &&
          state.data.description &&
          state.data.sessionType &&
          state.data.duration
        );
      case "pricing":
        return !!state.data.pricingModel;
      case "followGate":
        if (state.data.pricingModel === "free_with_gate") {
          return !!(state.data.followGateEnabled && state.data.followGateRequirements);
        }
        return true;
      case "discord":
        return true; // Discord is optional
      case "availability":
        return !!state.data.weekSchedule;
      default:
        return false;
    }
  };

  const updateData = (step: string, newData: Partial<CoachingData>) => {
    setState((prev) => {
      const updatedData = { ...prev.data, ...newData };
      const stepCompletion = {
        ...prev.stepCompletion,
        [step]: validateStep(step as keyof StepCompletion),
      };
      return {
        ...prev,
        data: updatedData,
        stepCompletion,
      };
    });
  };

  const saveCoaching = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      if (state.coachingId) {
        // Update existing
        await updateCoachingMutation({
          id: state.coachingId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          price: state.data.price ? parseFloat(state.data.price) : undefined,
          duration: state.data.duration,
          sessionType: state.data.sessionType,
        });
      } else {
        // Create new
        const result = await createCoachingMutation({
          title: state.data.title || "Untitled Coaching Session",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "coaching",
          productCategory: "coaching",
          pricingModel: "paid",
          price: parseFloat(state.data.price || "50"),
          imageUrl: state.data.thumbnail,
          tags: state.data.tags,
          duration: state.data.duration,
          sessionType: state.data.sessionType,
        });

        if (result) {
          setState((prev) => ({ ...prev, coachingId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(`/dashboard/create/coaching?coachingId=${result}&step=${currentStep}`);
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Coaching Session Saved",
        description: "Your coaching session has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save coaching:", error);
      setState((prev) => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return (
      state.stepCompletion.basics &&
      state.stepCompletion.availability &&
      state.stepCompletion.pricing
    );
  };

  const createCoaching = async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete required steps before publishing." };
    }

    try {
      if (state.coachingId) {
        await updateCoachingMutation({
          id: state.coachingId,
          isPublished: true,
        });

        toast({
          title: "Coaching Session Published!",
          description: "Your coaching session is now live and bookable.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, coachingId: state.coachingId };
      }

      return { success: false, error: "Coaching ID not found" };
    } catch (error) {
      return { success: false, error: "Failed to publish coaching session." };
    }
  };

  return (
    <CoachingCreationContext.Provider
      value={{
        state,
        updateData,
        saveCoaching,
        validateStep,
        canPublish,
        createCoaching,
      }}
    >
      {children}
    </CoachingCreationContext.Provider>
  );
}

export function useCoachingCreation() {
  const context = useContext(CoachingCreationContext);
  if (context === undefined) {
    throw new Error("useCoachingCreation must be used within a CoachingCreationProvider");
  }
  return context;
}
