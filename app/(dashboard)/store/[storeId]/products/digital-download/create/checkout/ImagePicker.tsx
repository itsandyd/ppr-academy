"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Edit } from "lucide-react";

interface ImagePickerProps {
  onChange: (file: File | null) => void;
}

export function ImagePicker({ onChange }: ImagePickerProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setImage(file);
    onChange(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div
      className="border-dashed border-2 border-[#DDE1F7] rounded-lg p-8 flex items-center gap-8"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Image Preview */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-16 h-16 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setPreview(null);
              onChange(null);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-[#6356FF] rounded-full flex items-center justify-center text-white hover:bg-[#5248E6] transition-colors"
          >
            <Edit size={12} />
          </button>
        </div>
      ) : (
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
          <ImageIcon size={24} className="text-[#6356FF]" />
        </div>
      )}

      {/* Upload Text and Button */}
      <div className="flex-1 text-center">
        <p className="text-base font-medium text-gray-700 mb-4">
          Drag Your Image Here
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          className="rounded-lg"
        >
          Choose Image
        </Button>
      </div>
    </div>
  );
} 