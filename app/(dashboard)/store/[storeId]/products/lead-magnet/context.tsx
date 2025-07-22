"use client";

import { createContext, useContext } from "react";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea";
  required: boolean;
  placeholder: string;
}

// Create context to share lead magnet data between page and layout
interface LeadMagnetContextType {
  leadMagnetData: {
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    formFields: FormField[];
  };
  updateLeadMagnetData: (data: Partial<{
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    formFields: FormField[];
  }>) => void;
}

export const LeadMagnetContext = createContext<LeadMagnetContextType | null>(null);

export const useLeadMagnetContext = () => {
  const context = useContext(LeadMagnetContext);
  if (!context) {
    throw new Error("useLeadMagnetContext must be used within LeadMagnetProvider");
  }
  return context;
}; 