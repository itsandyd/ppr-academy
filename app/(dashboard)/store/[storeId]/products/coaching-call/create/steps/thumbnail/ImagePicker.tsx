"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Pencil, ImageIcon } from "lucide-react";

interface ImagePickerProps {
  value?: File;
  onChange: (file: File | undefined) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onChange(undefined);
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      handleFileChange(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="border-dashed border-2 border-[#DDE1F7] rounded-lg p-8 flex items-center gap-8"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {preview || value ? (
        <div className="relative">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FFE8F5] flex items-center justify-center">
            {preview ? (
              <img 
                src={preview} 
                alt="Thumbnail preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={24} className="text-[#6356FF]" />
            )}
          </div>
          <button
            type="button"
            onClick={() => handleFileChange(null)}
            className="absolute -top-1 -right-1 w-6 h-6 bg-[#6356FF] rounded-full flex items-center justify-center text-white hover:bg-[#5248E6] transition-colors"
          >
            <Pencil size={12} />
          </button>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[#FFE8F5] flex items-center justify-center">
          <ImageIcon size={24} className="text-[#6356FF]" />
        </div>
      )}
      
      <div className="flex-1 text-center">
        <p className="text-sm text-[#6B6E85] mb-2">Thumbnail 400×400</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleFileChange(file || null);
          }}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('image-upload')?.click()}
          className="border-[#E5E7F5] text-[#6B6E85] hover:border-[#6356FF] hover:text-[#6356FF]"
        >
          <Upload size={14} className="mr-2" />
          Choose Image
        </Button>
      </div>
    </div>
  );
} 