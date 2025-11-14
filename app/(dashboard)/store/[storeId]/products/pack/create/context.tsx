"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";
import { useValidStoreId } from "@/hooks/useStoreId";

// Types for pack data
export interface PackData {
  // Basic info
  title?: string;
  description?: string;
  packType?: "sample-pack" | "midi-pack" | "preset-pack";
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
    storageId?: string; // Convex storage ID
    size?: number;
    type?: string;
  }>;
  
  // Metadata
  genre?: string;
  bpm?: number;
  key?: string;
  downloadUrl?: string;
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  followGate: boolean;
  files: boolean;
}

interface PackCreationState {
  data: PackData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  packId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface PackCreationContextType {
  state: PackCreationState;
  updateData: (step: string, data: Partial<PackData>) => void;
  savePack: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createPack: () => Promise<{ success: boolean; error?: string; packId?: Id<"digitalProducts"> }>;
}

const PackCreationContext = createContext<PackCreationContextType | undefined>(undefined);

export function PackCreationProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const storeId = useValidStoreId();
  const packId = searchParams.get("packId") as Id<"digitalProducts"> | undefined;

  // Redirect if storeId is invalid
  useEffect(() => {
    if (!storeId) {
      toast({
        title: "Invalid Store",
        description: "The store you're trying to access could not be found.",
        variant: "destructive",
      });
      router.push('/store');
    }
  }, [storeId, router, toast]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createPackMutation: any = useMutation(api.universalProducts.createUniversalProduct as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePackMutation: any = useMutation(api.digitalProducts.updateProduct as any);
  
  // Get existing pack if editing
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingPack: any = useQuery(
    api.digitalProducts.getProductById,
    packId ? { productId: packId } : "skip"
  );

  const [state, setState] = useState<PackCreationState>({
    data: {
      pricingModel: "paid",
      packType: "sample-pack",
      price: "9.99", // Default price
    },
    stepCompletion: {
      basics: false,
      pricing: false,
      followGate: false,
      files: false,
    },
    isLoading: false,
    isSaving: false,
  });

  // Load existing pack data if editing
  useEffect(() => {
    if (existingPack && existingPack._id === packId) {
      console.log("Loading existing pack data:", existingPack);
      
      const newData: PackData = {
        title: existingPack.title || "",
        description: existingPack.description || "",
        packType: existingPack.productCategory as any || "sample-pack",
        tags: existingPack.tags || [],
        thumbnail: existingPack.imageUrl || "",
        price: existingPack.price?.toString() || "9.99",
        pricingModel: existingPack.followGateEnabled ? "free_with_gate" : "paid",
        downloadUrl: existingPack.downloadUrl || "",
        // Load metadata
        genre: existingPack.genre?.[0] || "",
        bpm: existingPack.bpm,
        key: existingPack.musicalKey,
        // Load follow gate config
        followGateEnabled: existingPack.followGateEnabled,
        followGateRequirements: existingPack.followGateRequirements,
        followGateSocialLinks: existingPack.followGateSocialLinks,
        followGateMessage: existingPack.followGateMessage,
        // Load files
        files: existingPack.packFiles ? JSON.parse(existingPack.packFiles) : [],
      };
      
      console.log("Loaded pack data:", newData);
      
      // Calculate step completion based on loaded data
      const stepCompletion = {
        basics: validateStepWithData("basics", newData),
        pricing: validateStepWithData("pricing", newData),
        followGate: validateStepWithData("followGate", newData),
        files: validateStepWithData("files", newData),
      };
      
      setState(prev => ({
        ...prev,
        packId: existingPack._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingPack, packId]);

  const validateStepWithData = (step: keyof StepCompletion, data: PackData): boolean => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description && data.packType);
      case "pricing":
        return !!(data.pricingModel);
      case "followGate":
        if (data.pricingModel === "free_with_gate") {
          return !!(data.followGateEnabled && data.followGateRequirements);
        }
        return true;
      case "files":
        return true; // Files are optional
      default:
        return false;
    }
  };

  const validateStep = (step: keyof StepCompletion): boolean => {
    return validateStepWithData(step, state.data);
  };

  const updateData = (step: string, newData: Partial<PackData>) => {
    setState(prev => {
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

  const savePack = async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      if (state.packId) {
        // Update existing pack
        const updateData: any = {
          id: state.packId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          price: state.data.price ? parseFloat(state.data.price) : undefined,
          tags: state.data.tags,
          downloadUrl: state.data.downloadUrl,
          // Save metadata
          genre: state.data.genre ? [state.data.genre] : undefined,
          bpm: state.data.bpm,
          musicalKey: state.data.key,
          // Save files metadata (storage IDs, names, sizes)
          packFiles: state.data.files ? JSON.stringify(state.data.files) : undefined,
        };

        // Update pricing model and follow gate if needed
        if (state.data.pricingModel === "free_with_gate" && state.data.followGateRequirements) {
          updateData.price = 0;
          updateData.followGateEnabled = true;
          updateData.followGateRequirements = state.data.followGateRequirements;
          updateData.followGateSocialLinks = state.data.followGateSocialLinks;
          updateData.followGateMessage = state.data.followGateMessage;
        }

        await updatePackMutation(updateData);
      } else {
        // Create new pack (draft)
        // If free with gate but no follow gate config yet, save as paid temporarily
        const effectivePricingModel = 
          state.data.pricingModel === "free_with_gate" && !state.data.followGateRequirements
            ? "paid"
            : state.data.pricingModel || "paid";
        
        const packPrice = effectivePricingModel === "free_with_gate" 
          ? 0 
          : (state.data.price ? parseFloat(state.data.price) : 9.99); // Default to $9.99 for paid packs
        
        const result = await createPackMutation({
          title: state.data.title || "Untitled Pack",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "digital",
          productCategory: state.data.packType || "sample-pack",
          pricingModel: effectivePricingModel,
          price: packPrice,
          imageUrl: state.data.thumbnail,
          downloadUrl: state.data.downloadUrl,
          tags: state.data.tags,
          followGateConfig: state.data.pricingModel === "free_with_gate" && state.data.followGateRequirements
            ? {
                requireEmail: state.data.followGateRequirements.requireEmail || false,
                requireInstagram: state.data.followGateRequirements.requireInstagram || false,
                requireTiktok: state.data.followGateRequirements.requireTiktok || false,
                requireYoutube: state.data.followGateRequirements.requireYoutube || false,
                requireSpotify: state.data.followGateRequirements.requireSpotify || false,
                minFollowsRequired: state.data.followGateRequirements.minFollowsRequired || 0,
                socialLinks: state.data.followGateSocialLinks || {},
                customMessage: state.data.followGateMessage,
              }
            : undefined,
        });

        if (result) {
          setState(prev => ({ ...prev, packId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(`/store/${storeId}/products/pack/create?packId=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }));

      toast({
        title: "Pack Saved",
        description: "Your pack has been saved as a draft.",
      });
    } catch (error) {
      console.error("Failed to save pack:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && state.stepCompletion.pricing;
  };

  const createPack = async () => {
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
      // Publish the pack
      if (state.packId) {
        // If pricing model is free with gate, ensure we have follow gate config
        const updateData: any = {
          id: state.packId,
          isPublished: true,
        };

        // Update pricing model to free_with_gate if configured
        if (state.data.pricingModel === "free_with_gate" && state.data.followGateRequirements) {
          // The pricing model was already set during save, just publish
        }

        await updatePackMutation(updateData);
        
        toast({
          title: "Pack Published!",
          description: "Your pack is now live.",
        });

        return { success: true, packId: state.packId };
      }

      return { success: false, error: "Pack ID not found" };
    } catch (error) {
      return { 
        success: false, 
        error: "Failed to publish pack." 
      };
    }
  };

  return (
    <PackCreationContext.Provider
      value={{
        state,
        updateData,
        savePack,
        validateStep,
        canPublish,
        createPack,
      }}
    >
      {children}
    </PackCreationContext.Provider>
  );
}

export function usePackCreation() {
  const context = useContext(PackCreationContext);
  if (context === undefined) {
    throw new Error("usePackCreation must be used within a PackCreationProvider");
  }
  return context;
}

