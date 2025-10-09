"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface CoachingPreviewData {
  // Thumbnail step
  imageFile?: File | null;
  imagePreviewUrl?: string | null;
  thumbnail?: string;
  thumbnailStyle?: string;
  style?: "button" | "callout" | "preview";
  
  // Checkout step
  title?: string;
  description?: string;
  duration?: number;
  price?: number;
  sessionType?: "video" | "audio" | "phone";
  customFields?: Array<{
    label: string;
    type: "text" | "email" | "phone" | "textarea";
    required: boolean;
  }>;
  
  // Availability step
  availability?: any;
  timezone?: string;
  leadTimeHours?: number;
  maxAttendees?: number;
  advanceDays?: number;
  
  // Options step
  orderBump?: any;
  affiliate?: any;
  emailFlows?: any;
  
  // Product ID (once created)
  productId?: Id<"digitalProducts">;
  
  // Discord verification
  isDiscordVerified?: boolean;
}

interface CoachingPreviewContextType {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  formData: CoachingPreviewData;
  updateFormData: (data: Partial<CoachingPreviewData>) => void;
  resetFormData: () => void;
}

const CoachingPreviewContext = createContext<CoachingPreviewContextType | undefined>(undefined);

export function CoachingPreviewProvider({ children }: { children: ReactNode }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<CoachingPreviewData>({
    style: "button",
    title: "1:1 Call with Me",
    description: "",
    price: 99,
    duration: 60,
    sessionType: "video",
  });

  const updateFormData = (data: Partial<CoachingPreviewData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData({
      style: "button",
      title: "1:1 Call with Me",
      description: "",
      price: 99,
      duration: 60,
      sessionType: "video",
    });
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  return (
    <CoachingPreviewContext.Provider value={{
      imageFile,
      setImageFile,
      imagePreviewUrl,
      setImagePreviewUrl,
      formData,
      updateFormData,
      resetFormData,
    }}>
      {children}
    </CoachingPreviewContext.Provider>
  );
}

export function useCoachingPreview() {
  const context = useContext(CoachingPreviewContext);
  if (!context) {
    throw new Error("useCoachingPreview must be used within a CoachingPreviewProvider");
  }
  return context;
}
