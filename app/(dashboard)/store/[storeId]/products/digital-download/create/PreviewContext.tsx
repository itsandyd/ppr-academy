"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PreviewContextType {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  return (
    <PreviewContext.Provider value={{
      imageFile,
      setImageFile,
      imagePreviewUrl,
      setImagePreviewUrl,
    }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
}
