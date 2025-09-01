"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CoachingPreviewContextType {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  formData: {
    style: "button" | "callout" | "preview";
    title: string;
    description?: string;
    price?: number;
    duration?: number;
  };
  updateFormData: (data: Partial<CoachingPreviewContextType['formData']>) => void;
}

const CoachingPreviewContext = createContext<CoachingPreviewContextType | undefined>(undefined);

export function CoachingPreviewProvider({ children }: { children: ReactNode }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    style: "button" as const,
    title: "1:1 Call with Me",
    description: "",
    price: 99,
    duration: 60,
  });

  const updateFormData = (data: Partial<CoachingPreviewContextType['formData']>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  return (
    <CoachingPreviewContext.Provider value={{
      imageFile,
      setImageFile,
      imagePreviewUrl,
      setImagePreviewUrl,
      formData,
      updateFormData,
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
