"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface ImagePickerProps {
  onChange: (file: File | null) => void;
}

export function ImagePicker({ onChange }: ImagePickerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      onChange(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="border-dashed border-2 border-[#DDE1F7] rounded-lg p-8 flex items-center gap-8">
      {/* Thumbnail Preview */}
      <div className="relative">
        <div className="w-16 h-16 bg-[#FFF6DD] rounded-lg flex items-center justify-center overflow-hidden">
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          )}
        </div>
        {file && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#6356FF] rounded-full flex items-center justify-center">
            <Edit size={12} className="text-white" />
          </div>
        )}
      </div>

      {/* File Input Section */}
      <div className="flex-1">
        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
          {file ? file.name : "Select image"}
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          className="text-sm"
        >
          Choose Image
        </Button>
      </div>
    </div>
  );
} 