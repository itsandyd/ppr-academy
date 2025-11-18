"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";
import { PDFType } from "../types";

export interface PDFData {
  // Basic info
  title?: string;
  description?: string;
  pdfType?: PDFType;
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
  
  // PDF-specific
  pageCount?: number;
  fileSize?: number;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  followGate: boolean;
  files: boolean;
}

interface PDFCreationState {
  data: PDFData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  pdfId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface PDFCreationContextType {
  state: PDFCreationState;
  updateData: (step: string, data: Partial<PDFData>) => void;
  savePDF: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createPDF: () => Promise<{ success: boolean; error?: string; pdfId?: Id<"digitalProducts"> }>;
}

const PDFCreationContext = createContext<PDFCreationContextType | undefined>(undefined);

export function PDFCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const pdfId = searchParams.get("pdfId") as Id<"digitalProducts"> | undefined;
  const initialType = searchParams.get("type") as PDFType | undefined;

  // Fetch user's stores
  // @ts-ignore
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  
  const storeId = stores?.[0]?._id;

  // Redirect if no store
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating products.",
        variant: "destructive",
      });
      router.push('/dashboard?mode=create');
    }
  }, [user, stores, router, toast]);

  // @ts-ignore
  const createPDFMutation: any = useMutation(api.universalProducts.createUniversalProduct as any);
  // @ts-ignore
  const updatePDFMutation: any = useMutation(api.digitalProducts.updateProduct as any);
  
  // Get existing PDF if editing
  // @ts-ignore
  const existingPDF: any = useQuery(
    api.digitalProducts.getProductById,
    pdfId ? { productId: pdfId } : "skip"
  );

  const [state, setState] = useState<PDFCreationState>({
    data: {
      pricingModel: "paid",
      pdfType: initialType || "guide",
      price: "9.99",
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

  // Load existing PDF if editing
  useEffect(() => {
    if (existingPDF && existingPDF._id === pdfId) {
      const newData: PDFData = {
        title: existingPDF.title || "",
        description: existingPDF.description || "",
        pdfType: existingPDF.pdfType || "guide",
        tags: existingPDF.tags || [],
        thumbnail: existingPDF.imageUrl || "",
        price: existingPDF.price?.toString() || "9.99",
        pricingModel: existingPDF.followGateEnabled ? "free_with_gate" : "paid",
        downloadUrl: existingPDF.downloadUrl || "",
        pageCount: existingPDF.pageCount,
        fileSize: existingPDF.fileSize,
        followGateEnabled: existingPDF.followGateEnabled,
        followGateRequirements: existingPDF.followGateRequirements,
        followGateSocialLinks: existingPDF.followGateSocialLinks,
        followGateMessage: existingPDF.followGateMessage,
      };
      
      const stepCompletion = {
        basics: !!(newData.title && newData.description),
        pricing: !!newData.pricingModel,
        followGate: newData.pricingModel === "free_with_gate" ? !!newData.followGateRequirements : true,
        files: true,
      };
      
      setState(prev => ({
        ...prev,
        pdfId: existingPDF._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingPDF, pdfId]);

  const validateStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "basics":
        return !!(state.data.title && state.data.description);
      case "pricing":
        return !!state.data.pricingModel;
      case "followGate":
        if (state.data.pricingModel === "free_with_gate") {
          return !!(state.data.followGateEnabled && state.data.followGateRequirements);
        }
        return true;
      case "files":
        return true;
      default:
        return false;
    }
  };

  const updateData = (step: string, newData: Partial<PDFData>) => {
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

  const savePDF = async () => {
    if (state.isSaving || !user?.id || !storeId) return;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      if (state.pdfId) {
        // Update existing
        await updatePDFMutation({
          id: state.pdfId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          price: state.data.price ? parseFloat(state.data.price) : undefined,
          tags: state.data.tags,
          downloadUrl: state.data.downloadUrl,
        });
      } else {
        // Create new
        const result = await createPDFMutation({
          title: state.data.title || "Untitled PDF",
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "digital",
          productCategory: "pdf",
          pricingModel: state.data.pricingModel || "paid",
          price: state.data.pricingModel === "free_with_gate" ? 0 : parseFloat(state.data.price || "9.99"),
          imageUrl: state.data.thumbnail,
          downloadUrl: state.data.downloadUrl,
          tags: state.data.tags,
        });

        if (result) {
          setState(prev => ({ ...prev, pdfId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(`/dashboard/create/pdf?pdfId=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }));

      toast({
        title: "PDF Saved",
        description: "Your PDF has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save PDF:", error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && state.stepCompletion.pricing;
  };

  const createPDF = async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete required steps before publishing." };
    }

    try {
      if (state.pdfId) {
        await updatePDFMutation({
          id: state.pdfId,
          isPublished: true,
        });
        
        toast({
          title: "PDF Published!",
          description: "Your PDF is now live.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, pdfId: state.pdfId };
      }

      return { success: false, error: "PDF ID not found" };
    } catch (error) {
      return { success: false, error: "Failed to publish PDF." };
    }
  };

  return (
    <PDFCreationContext.Provider
      value={{
        state,
        updateData,
        savePDF,
        validateStep,
        canPublish,
        createPDF,
      }}
    >
      {children}
    </PDFCreationContext.Provider>
  );
}

export function usePDFCreation() {
  const context = useContext(PDFCreationContext);
  if (context === undefined) {
    throw new Error("usePDFCreation must be used within a PDFCreationProvider");
  }
  return context;
}

