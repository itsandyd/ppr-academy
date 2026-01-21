"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { DAWType } from "../types";
import {
  useStoresByUser,
  useDigitalProductById,
  useCreateUniversalProduct,
  useUpdateDigitalProduct,
} from "@/lib/convex-typed-hooks";

// Types for effect chain data
export interface EffectChainData {
  // Basic info
  title?: string;
  description?: string;
  dawType?: DAWType;
  dawVersion?: string;
  tags?: string[];
  thumbnail?: string;
  
  // Pricing
  price?: string;
  pricingModel?: "free_with_gate" | "paid";
  
  // Follow Gate (if free)
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;
  
  // Files
  files?: Array<{
    id: string;
    name: string;
    url: string;
    storageId?: string;
    size?: number;
    type?: string;
  }>;
  
  // Effect Chain specific
  chainType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack" | "mixer";
  effectType?: string[];  // e.g., ["compression", "eq", "saturation"]
  cpuLoad?: "low" | "medium" | "high";
  requiresPlugins?: string[];  // Third-party plugins needed
  demoAudioUrl?: string;
  installationNotes?: string;
  
  // Metadata
  genre?: string;
  bpm?: number;
  downloadUrl?: string;
}

export interface StepCompletion {
  basics: boolean;
  files: boolean;
  pricing: boolean;
  followGate: boolean;
}

interface EffectChainCreationState {
  data: EffectChainData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  chainId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface EffectChainCreationContextType {
  state: EffectChainCreationState;
  updateData: (step: string, data: Partial<EffectChainData>) => void;
  saveChain: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createChain: () => Promise<{ success: boolean; error?: string; chainId?: Id<"digitalProducts"> }>;
}

const EffectChainCreationContext = createContext<EffectChainCreationContextType | undefined>(undefined);

export function EffectChainCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const chainId = searchParams.get("chainId") as Id<"digitalProducts"> | undefined;
  const initialDAW = searchParams.get("daw") as DAWType | undefined;

  // Fetch user's stores
  const stores = useStoresByUser(user?.id);

  const storeId = stores?.[0]?._id;

  // Redirect if no store found
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      console.error('No store found for chain creation');
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating products.",
        variant: "destructive",
      });
      router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  const createChainMutation = useCreateUniversalProduct();
  const updateChainMutation = useUpdateDigitalProduct();

  // Get existing chain if editing
  const existingChain = useDigitalProductById(chainId);

  const [state, setState] = useState<EffectChainCreationState>({
    data: {
      pricingModel: "paid",
      dawType: initialDAW || "ableton",
      price: "9.99",
    },
    stepCompletion: {
      basics: false,
      files: false,
      pricing: false,
      followGate: false,
    },
    isLoading: false,
    isSaving: false,
  });

  // Load existing chain if editing
  useEffect(() => {
    if (existingChain && existingChain._id === chainId) {
      const newData: EffectChainData = {
        title: existingChain.title || "",
        description: existingChain.description || "",
        dawType: (existingChain.dawType as DAWType) || "ableton",
        dawVersion: existingChain.dawVersion as string | undefined,
        tags: existingChain.tags || [],
        thumbnail: existingChain.imageUrl || "",
        price: existingChain.price?.toString() || "9.99",
        pricingModel: existingChain.followGateEnabled ? "free_with_gate" : "paid",
        downloadUrl: existingChain.downloadUrl || "",
        chainType: existingChain.rackType as EffectChainData["chainType"],
        effectType: existingChain.effectType as string[] | undefined,
        cpuLoad: existingChain.cpuLoad as EffectChainData["cpuLoad"],
        requiresPlugins: existingChain.thirdPartyPlugins as string[] | undefined,
        demoAudioUrl: existingChain.demoAudioUrl as string | undefined,
        installationNotes: existingChain.installationNotes as string | undefined,
        followGateEnabled: existingChain.followGateEnabled,
        followGateRequirements: existingChain.followGateRequirements,
        followGateSocialLinks: existingChain.followGateSocialLinks,
        followGateMessage: existingChain.followGateMessage,
        files: existingChain.packFiles ? JSON.parse(existingChain.packFiles as string) : [],
      };
      
      const stepCompletion = {
        basics: !!(newData.title && newData.description && newData.dawType),
        files: true,
        pricing: !!newData.pricingModel,
        followGate: newData.pricingModel === "free_with_gate" ? !!newData.followGateRequirements : true,
      };
      
      setState(prev => ({
        ...prev,
        chainId: existingChain._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingChain, chainId]);

  const validateStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "basics":
        return !!(state.data.title && state.data.description && state.data.dawType);
      case "pricing":
        return !!state.data.pricingModel;
      case "followGate":
        if (state.data.pricingModel === "free_with_gate") {
          return !!(state.data.followGateEnabled && state.data.followGateRequirements);
        }
        return true;
      case "files":
        return true; // Files are optional
      default:
        return false;
    }
  };

  const updateData = (step: string, newData: Partial<EffectChainData>) => {
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

  const saveChain = async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      if (state.chainId) {
        // Update existing
        const updateData = {
          id: state.chainId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          price: state.data.price ? parseFloat(state.data.price) : undefined,
          tags: state.data.tags,
          downloadUrl: state.data.downloadUrl,
          dawType: state.data.dawType,
          dawVersion: state.data.dawVersion,
          packFiles: state.data.files ? JSON.stringify(state.data.files) : undefined,
        };

        await updateChainMutation(updateData);
      } else {
        // Create new
        const createData = {
          title: state.data.title || "Untitled Effect Chain",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "effectChain" as const,
          productCategory: "effect-chain" as const,  // Ensure this is always effect-chain
          pricingModel: (state.data.pricingModel || "paid") as "free_with_gate" | "paid",
          price: state.data.pricingModel === "free_with_gate" ? 0 : parseFloat(state.data.price || "9.99"),
          imageUrl: state.data.thumbnail || undefined,
          downloadUrl: state.data.downloadUrl || undefined,
          tags: state.data.tags || undefined,
          dawType: state.data.dawType || "ableton",  // Default to ableton
          dawVersion: state.data.dawVersion || undefined,
        };

        const result = await createChainMutation(createData);

        if (result) {
          setState(prev => ({ ...prev, chainId: result }));
          const currentStep = searchParams.get("step") || "basics";
          const dawType = state.data.dawType || "ableton";
          router.replace(`/dashboard/create/chain?daw=${dawType}&chainId=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }));

      toast({
        title: "Effect Chain Saved",
        description: "Your effect chain has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save chain:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your effect chain. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && state.stepCompletion.pricing;
  };

  const createChain = async () => {
    if (!user?.id || !storeId) {
      return {
        success: false,
        error: "User not found or invalid store.",
      };
    }

    if (!canPublish()) {
      return { 
        success: false, 
        error: "Please complete required steps before publishing." 
      };
    }

    try {
      if (state.chainId) {
        await updateChainMutation({
          id: state.chainId,
          isPublished: true,
        });
        
        toast({
          title: "Effect Chain Published!",
          description: "Your effect chain is now live.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, chainId: state.chainId };
      }

      return { success: false, error: "Chain ID not found" };
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to publish effect chain." 
      };
    }
  };

  return (
    <EffectChainCreationContext.Provider
      value={{
        state,
        updateData,
        saveChain,
        validateStep,
        canPublish,
        createChain,
      }}
    >
      {children}
    </EffectChainCreationContext.Provider>
  );
}

export function useEffectChainCreation() {
  const context = useContext(EffectChainCreationContext);
  if (context === undefined) {
    throw new Error("useEffectChainCreation must be used within a EffectChainCreationProvider");
  }
  return context;
}


