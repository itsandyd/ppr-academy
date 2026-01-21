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

// Types for mixing template data
export interface MixingTemplateData {
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

  // Mixing Template specific
  templateType?: "mixing" | "mastering" | "vocal" | "stem" | "full-project";
  channelCount?: number;  // Number of tracks in the template
  busTypes?: string[];  // e.g., ["drums", "bass", "vocals", "fx"]
  includesPlugins?: boolean;
  thirdPartyPlugins?: string[];  // Plugins required
  genre?: string[];
  installationNotes?: string;

  // Metadata
  downloadUrl?: string;
}

export interface StepCompletion {
  basics: boolean;
  files: boolean;
  pricing: boolean;
  followGate: boolean;
}

interface MixingTemplateCreationState {
  data: MixingTemplateData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  templateId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface MixingTemplateCreationContextType {
  state: MixingTemplateCreationState;
  updateData: (step: string, data: Partial<MixingTemplateData>) => void;
  saveTemplate: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createTemplate: () => Promise<{ success: boolean; error?: string; templateId?: Id<"digitalProducts"> }>;
}

const MixingTemplateCreationContext = createContext<MixingTemplateCreationContextType | undefined>(undefined);

export function MixingTemplateCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const templateId = searchParams.get("templateId") as Id<"digitalProducts"> | undefined;
  const initialDAW = searchParams.get("daw") as DAWType | undefined;

  // Fetch user's stores
  const stores = useStoresByUser(user?.id);

  const storeId = stores?.[0]?._id;

  // Redirect if no store found
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      console.error('No store found for mixing template creation');
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating products.",
        variant: "destructive",
      });
      router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  const createTemplateMutation = useCreateUniversalProduct();
  const updateTemplateMutation = useUpdateDigitalProduct();

  // Get existing template if editing
  const existingTemplate = useDigitalProductById(templateId);

  const [state, setState] = useState<MixingTemplateCreationState>({
    data: {
      pricingModel: "paid",
      dawType: initialDAW || "ableton",
      price: "14.99",
      templateType: "mixing",
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

  // Load existing template if editing
  useEffect(() => {
    if (existingTemplate && existingTemplate._id === templateId) {
      const newData: MixingTemplateData = {
        title: existingTemplate.title || "",
        description: existingTemplate.description || "",
        dawType: (existingTemplate.dawType as DAWType) || "ableton",
        dawVersion: existingTemplate.dawVersion as string | undefined,
        tags: existingTemplate.tags || [],
        thumbnail: existingTemplate.imageUrl || "",
        price: existingTemplate.price?.toString() || "14.99",
        pricingModel: existingTemplate.followGateEnabled ? "free_with_gate" : "paid",
        downloadUrl: existingTemplate.downloadUrl || "",
        templateType: (existingTemplate.templateType as MixingTemplateData["templateType"]) || "mixing",
        channelCount: existingTemplate.channelCount as number | undefined,
        busTypes: existingTemplate.busTypes as string[] | undefined,
        includesPlugins: existingTemplate.includesPlugins as boolean | undefined,
        thirdPartyPlugins: existingTemplate.thirdPartyPlugins as string[] | undefined,
        genre: existingTemplate.genre as string[] | undefined,
        installationNotes: existingTemplate.installationNotes as string | undefined,
        followGateEnabled: existingTemplate.followGateEnabled,
        followGateRequirements: existingTemplate.followGateRequirements,
        followGateSocialLinks: existingTemplate.followGateSocialLinks,
        followGateMessage: existingTemplate.followGateMessage,
        files: existingTemplate.packFiles ? JSON.parse(existingTemplate.packFiles as string) : [],
      };

      const stepCompletion = {
        basics: !!(newData.title && newData.description && newData.dawType),
        files: true,
        pricing: !!newData.pricingModel,
        followGate: newData.pricingModel === "free_with_gate" ? !!newData.followGateRequirements : true,
      };

      setState(prev => ({
        ...prev,
        templateId: existingTemplate._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingTemplate, templateId]);

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

  const updateData = (step: string, newData: Partial<MixingTemplateData>) => {
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

  const saveTemplate = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      if (state.templateId) {
        // Update existing
        const updateData = {
          id: state.templateId,
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

        await updateTemplateMutation(updateData);
      } else {
        // Create new
        const createData = {
          title: state.data.title || "Untitled Mixing Template",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "digital" as const,
          productCategory: "mixing-template" as const,
          pricingModel: (state.data.pricingModel || "paid") as "free_with_gate" | "paid",
          price: state.data.pricingModel === "free_with_gate" ? 0 : parseFloat(state.data.price || "14.99"),
          imageUrl: state.data.thumbnail || undefined,
          downloadUrl: state.data.downloadUrl || undefined,
          tags: state.data.tags || undefined,
          dawType: state.data.dawType || "ableton",
          dawVersion: state.data.dawVersion || undefined,
        };

        const result = await createTemplateMutation(createData);

        if (result) {
          setState(prev => ({ ...prev, templateId: result }));
          const currentStep = searchParams.get("step") || "basics";
          const dawType = state.data.dawType || "ableton";
          router.replace(`/dashboard/create/mixing-template?daw=${dawType}&templateId=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date()
      }));

      toast({
        title: "Mixing Template Saved",
        description: "Your mixing template has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save template:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your mixing template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && state.stepCompletion.pricing;
  };

  const createTemplate = async () => {
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
      if (state.templateId) {
        await updateTemplateMutation({
          id: state.templateId,
          isPublished: true,
        });

        toast({
          title: "Mixing Template Published!",
          description: "Your mixing template is now live.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, templateId: state.templateId };
      }

      return { success: false, error: "Template ID not found" };
    } catch (error) {
      return {
        success: false,
        error: "Failed to publish mixing template."
      };
    }
  };

  return (
    <MixingTemplateCreationContext.Provider
      value={{
        state,
        updateData,
        saveTemplate,
        validateStep,
        canPublish,
        createTemplate,
      }}
    >
      {children}
    </MixingTemplateCreationContext.Provider>
  );
}

export function useMixingTemplateCreation() {
  const context = useContext(MixingTemplateCreationContext);
  if (context === undefined) {
    throw new Error("useMixingTemplateCreation must be used within a MixingTemplateCreationProvider");
  }
  return context;
}
