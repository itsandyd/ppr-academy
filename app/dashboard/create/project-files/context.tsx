"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";
import { DAWType } from "../types";

// Types for project file data
export interface ProjectFileData {
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

  // Project specific
  genre?: string[];
  bpm?: number;
  musicalKey?: string;
  installationNotes?: string;
  thirdPartyPlugins?: string[];
  includedContent?: string[]; // e.g., ["MIDI files", "Audio stems", "Mixer settings"]

  // Metadata
  downloadUrl?: string;
}

export interface StepCompletion {
  basics: boolean;
  files: boolean;
  pricing: boolean;
  followGate: boolean;
}

interface ProjectFileCreationState {
  data: ProjectFileData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  projectId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface ProjectFileCreationContextType {
  state: ProjectFileCreationState;
  updateData: (step: string, data: Partial<ProjectFileData>) => void;
  saveProject: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createProject: () => Promise<{ success: boolean; error?: string; projectId?: Id<"digitalProducts"> }>;
}

const ProjectFileCreationContext = createContext<ProjectFileCreationContextType | undefined>(undefined);

export function ProjectFileCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const projectId = searchParams.get("projectId") as Id<"digitalProducts"> | undefined;
  const initialDAW = searchParams.get("daw") as DAWType | undefined;

  // Fetch user's stores
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stores: any = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  const storeId = stores?.[0]?._id;

  // Redirect if no store found
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      console.error('No store found for project file creation');
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating products.",
        variant: "destructive",
      });
      router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createProjectMutation: any = useMutation(api.universalProducts.createUniversalProduct as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProjectMutation: any = useMutation(api.digitalProducts.updateProduct as any);

  // Get existing project if editing
  // @ts-ignore TS2589
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingProject: any = useQuery(
    api.digitalProducts.getProductById,
    projectId ? { productId: projectId } : "skip"
  );

  const [state, setState] = useState<ProjectFileCreationState>({
    data: {
      pricingModel: "paid",
      dawType: initialDAW || "ableton",
      price: "24.99",
      includedContent: ["Complete DAW project", "All MIDI patterns", "Audio samples used", "Mixer settings"],
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

  // Load existing project if editing
  useEffect(() => {
    if (existingProject && existingProject._id === projectId) {
      const newData: ProjectFileData = {
        title: existingProject.title || "",
        description: existingProject.description || "",
        dawType: existingProject.dawType || "ableton",
        dawVersion: existingProject.dawVersion,
        tags: existingProject.tags || [],
        thumbnail: existingProject.imageUrl || "",
        price: existingProject.price?.toString() || "24.99",
        pricingModel: existingProject.followGateEnabled ? "free_with_gate" : "paid",
        downloadUrl: existingProject.downloadUrl || "",
        genre: existingProject.genre,
        bpm: existingProject.bpm,
        musicalKey: existingProject.musicalKey,
        installationNotes: existingProject.installationNotes,
        thirdPartyPlugins: existingProject.thirdPartyPlugins,
        followGateEnabled: existingProject.followGateEnabled,
        followGateRequirements: existingProject.followGateRequirements,
        followGateSocialLinks: existingProject.followGateSocialLinks,
        followGateMessage: existingProject.followGateMessage,
        files: existingProject.packFiles ? JSON.parse(existingProject.packFiles) : [],
      };

      const stepCompletion = {
        basics: !!(newData.title && newData.description && newData.dawType),
        files: true,
        pricing: !!newData.pricingModel,
        followGate: newData.pricingModel === "free_with_gate" ? !!newData.followGateRequirements : true,
      };

      setState(prev => ({
        ...prev,
        projectId: existingProject._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingProject, projectId]);

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

  const updateData = (step: string, newData: Partial<ProjectFileData>) => {
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

  const saveProject = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      if (state.projectId) {
        // Update existing
        const updateData = {
          id: state.projectId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          price: state.data.price ? parseFloat(state.data.price) : undefined,
          tags: state.data.tags,
          downloadUrl: state.data.downloadUrl,
          dawType: state.data.dawType,
          dawVersion: state.data.dawVersion,
          genre: state.data.genre,
          bpm: state.data.bpm,
          musicalKey: state.data.musicalKey,
          installationNotes: state.data.installationNotes,
          thirdPartyPlugins: state.data.thirdPartyPlugins,
          packFiles: state.data.files ? JSON.stringify(state.data.files) : undefined,
        };

        console.log('Updating project file with data:', updateData);
        await updateProjectMutation(updateData);
      } else {
        // Create new
        const createData = {
          title: state.data.title || "Untitled Project File",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "digital" as const,
          productCategory: "project-files" as const,
          pricingModel: (state.data.pricingModel || "paid") as "free_with_gate" | "paid",
          price: state.data.pricingModel === "free_with_gate" ? 0 : parseFloat(state.data.price || "24.99"),
          imageUrl: state.data.thumbnail || undefined,
          downloadUrl: state.data.downloadUrl || undefined,
          tags: state.data.tags || undefined,
          dawType: state.data.dawType || "ableton",
          dawVersion: state.data.dawVersion || undefined,
          genre: state.data.genre || undefined,
        };

        console.log('Creating project file with data:', JSON.stringify(createData, null, 2));
        const result = await createProjectMutation(createData);

        if (result) {
          setState(prev => ({ ...prev, projectId: result }));
          const currentStep = searchParams.get("step") || "basics";
          const dawType = state.data.dawType || "ableton";
          router.replace(`/dashboard/create/project-files?daw=${dawType}&projectId=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date()
      }));

      toast({
        title: "Project File Saved",
        description: "Your project file has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save project:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your project file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && state.stepCompletion.pricing;
  };

  const createProject = async () => {
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
      if (state.projectId) {
        await updateProjectMutation({
          id: state.projectId,
          isPublished: true,
        });

        toast({
          title: "Project File Published!",
          description: "Your project file is now live.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, projectId: state.projectId };
      }

      return { success: false, error: "Project ID not found" };
    } catch (error) {
      return {
        success: false,
        error: "Failed to publish project file."
      };
    }
  };

  return (
    <ProjectFileCreationContext.Provider
      value={{
        state,
        updateData,
        saveProject,
        validateStep,
        canPublish,
        createProject,
      }}
    >
      {children}
    </ProjectFileCreationContext.Provider>
  );
}

export function useProjectFileCreation() {
  const context = useContext(ProjectFileCreationContext);
  if (context === undefined) {
    throw new Error("useProjectFileCreation must be used within a ProjectFileCreationProvider");
  }
  return context;
}
