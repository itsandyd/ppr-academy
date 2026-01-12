"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";
import { BeatLeaseData, StepCompletion, DEFAULT_LEASE_OPTIONS, LeaseOption } from "./types";

// Helper to convert leaseOptions to beatLeaseConfig format for the database
function convertToBeatlLeaseConfig(
  leaseOptions: LeaseOption[] | undefined,
  metadata: BeatLeaseData["metadata"]
) {
  if (!leaseOptions) return undefined;

  const tiers = leaseOptions
    .filter((opt) => opt.enabled && opt.type !== "free") // Filter out free tier and disabled tiers
    .map((opt) => {
      // Map lease type to tier type
      const tierType = opt.type === "basic" ? "basic" : opt.type === "premium" ? "premium" : "exclusive";

      return {
        type: tierType as "basic" | "premium" | "exclusive" | "unlimited",
        enabled: opt.enabled,
        price: opt.price,
        name:
          opt.type === "basic"
            ? "Basic Lease"
            : opt.type === "premium"
              ? "Premium Lease"
              : "Exclusive Rights",
        distributionLimit: opt.distributionLimit,
        streamingLimit: undefined, // Not in current LeaseOption type, can add later
        commercialUse: opt.commercialUse,
        musicVideoUse: opt.commercialUse, // Assume same as commercial use
        radioBroadcasting: opt.commercialUse, // Assume same as commercial use
        stemsIncluded: opt.stemsIncluded,
        creditRequired: true, // Default to requiring credit
      };
    });

  return {
    tiers,
    bpm: metadata?.bpm,
    key: metadata?.key,
    genre: metadata?.genre,
  };
}

interface BeatLeaseCreationState {
  data: BeatLeaseData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  beatId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface BeatLeaseCreationContextType {
  state: BeatLeaseCreationState;
  updateData: (step: string, data: Partial<BeatLeaseData>) => void;
  saveBeat: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createBeat: () => Promise<{ success: boolean; error?: string; beatId?: Id<"digitalProducts"> }>;
}

const BeatLeaseCreationContext = createContext<BeatLeaseCreationContextType | undefined>(undefined);

export function BeatLeaseCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const beatId = searchParams.get("beatId") as Id<"digitalProducts"> | undefined;

  // Get user's stores (using helper to avoid TS2589)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStoresByUserFn: any = (() => {
    // @ts-ignore TS2589 - Type instantiation is excessively deep
    return api.stores.getStoresByUser as any;
  })();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stores: any = useQuery(
    getStoresByUserFn,
    user?.id ? { userId: user.id } : "skip"
  );
  
  const storeId = stores?.[0]?._id;

  // Redirect if no store
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating beat leases.",
        variant: "destructive",
      });
      router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  // @ts-ignore - Type instantiation depth issue
  const createBeatMutation: any = useMutation(api.universalProducts.createUniversalProduct as any);
  // @ts-ignore - Type instantiation depth issue
  const updateBeatMutation: any = useMutation(api.digitalProducts.updateProduct as any);

  const [state, setState] = useState<BeatLeaseCreationState>({
    data: {
      leaseOptions: DEFAULT_LEASE_OPTIONS,
      metadata: {
        bpm: 140,
        key: "C minor",
        genre: "trap",
        tagged: true,
        duration: 180, // 3 minutes default
      },
      producerTag: `Prod. by ${user?.firstName || 'Producer'}`,
    },
    stepCompletion: {
      basics: false,
      metadata: false,
      files: false,
      licensing: false,
    },
    isLoading: false,
    isSaving: false,
  });

  const validateStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "basics":
        return !!(state.data.title && state.data.description);
      case "metadata":
        return !!(state.data.metadata?.bpm && state.data.metadata?.key && state.data.metadata?.genre);
      case "files":
        return !!(state.data.files?.mp3Url || state.data.files?.wavUrl);
      case "licensing":
        return !!(state.data.leaseOptions?.some(opt => opt.enabled));
      default:
        return false;
    }
  };

  const updateData = (step: string, newData: Partial<BeatLeaseData>) => {
    setState(prev => {
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

  const saveBeat = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // Convert lease options to beatLeaseConfig format
      const beatLeaseConfig = convertToBeatlLeaseConfig(
        state.data.leaseOptions,
        state.data.metadata
      );

      if (state.beatId) {
        // Update existing beat with all data including beatLeaseConfig and file URLs
        await updateBeatMutation({
          id: state.beatId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          tags: state.data.tags,
          bpm: state.data.metadata?.bpm,
          musicalKey: state.data.metadata?.key,
          genre: state.data.metadata?.genre ? [state.data.metadata.genre] : undefined,
          // Beat lease config with tiers
          beatLeaseConfig,
          // File URLs - mp3 goes to downloadUrl (main file), wav/stems/trackouts to their own fields
          downloadUrl: state.data.files?.mp3Url,
          demoAudioUrl: state.data.files?.mp3Url, // Use mp3 as preview audio
          wavUrl: state.data.files?.wavUrl,
          stemsUrl: state.data.files?.stemsUrl,
          trackoutsUrl: state.data.files?.trackoutsUrl,
        });
      } else {
        // Create new beat with all data including beatLeaseConfig
        const result = await createBeatMutation({
          title: state.data.title || "Untitled Beat",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "digital",
          productCategory: "beat-lease",
          pricingModel: "paid",
          price: state.data.leaseOptions?.find(opt => opt.enabled)?.price || 25,
          imageUrl: state.data.thumbnail,
          tags: state.data.tags,
          // Beat lease config with tiers
          beatLeaseConfig,
          // File URLs
          downloadUrl: state.data.files?.mp3Url,
        });

        if (result) {
          setState(prev => ({ ...prev, beatId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(`/dashboard/create/beat-lease?beatId=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date()
      }));

      toast({
        title: "Beat Saved",
        description: "Your beat has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save beat:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your beat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && 
           state.stepCompletion.metadata && 
           state.stepCompletion.files &&
           state.stepCompletion.licensing;
  };

  const createBeat = async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete required steps before publishing." };
    }

    try {
      if (state.beatId) {
        // Convert lease options to beatLeaseConfig format
        const beatLeaseConfig = convertToBeatlLeaseConfig(
          state.data.leaseOptions,
          state.data.metadata
        );

        // Save all data and publish in one update
        await updateBeatMutation({
          id: state.beatId,
          isPublished: true,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          tags: state.data.tags,
          bpm: state.data.metadata?.bpm,
          musicalKey: state.data.metadata?.key,
          genre: state.data.metadata?.genre ? [state.data.metadata.genre] : undefined,
          // Beat lease config with tiers
          beatLeaseConfig,
          // File URLs
          downloadUrl: state.data.files?.mp3Url,
          demoAudioUrl: state.data.files?.mp3Url,
          wavUrl: state.data.files?.wavUrl,
          stemsUrl: state.data.files?.stemsUrl,
          trackoutsUrl: state.data.files?.trackoutsUrl,
        });

        toast({
          title: "Beat Lease Published!",
          description: "Your beat is now live and available for lease.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, beatId: state.beatId };
      }

      return { success: false, error: "Beat ID not found" };
    } catch (error) {
      console.error("Failed to publish beat lease:", error);
      return { success: false, error: "Failed to publish beat lease." };
    }
  };

  return (
    <BeatLeaseCreationContext.Provider
      value={{
        state,
        updateData,
        saveBeat,
        validateStep,
        canPublish,
        createBeat,
      }}
    >
      {children}
    </BeatLeaseCreationContext.Provider>
  );
}

export function useBeatLeaseCreation() {
  const context = useContext(BeatLeaseCreationContext);
  if (context === undefined) {
    throw new Error("useBeatLeaseCreation must be used within a BeatLeaseCreationProvider");
  }
  return context;
}
