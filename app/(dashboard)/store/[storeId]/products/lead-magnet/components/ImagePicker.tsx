"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-hooks";
import { useToast } from "@/hooks/use-toast";

interface ImagePickerProps {
  file: File | null;
  onChange: (file: File | null, url?: string) => void;
}

export function ImagePicker({ file, onChange }: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Debug: Log previewUrl changes
  console.log("🔍 ImagePicker render - previewUrl:", previewUrl ? `${previewUrl.substring(0, 50)}...` : "empty");

  // Handle existing file prop (if passed from parent)
  useEffect(() => {
    if (file && !currentFile) {
      console.log("📁 Loading existing file prop:", file.name);
      setCurrentFile(file);
      // Create preview for existing file
      const reader = new FileReader();
      reader.onload = (e) => {
        const localUrl = e.target?.result as string;
        setPreviewUrl(localUrl);
        console.log("✅ Existing file preview loaded");
      };
      reader.readAsDataURL(file);
    }
  }, [file, currentFile]);

  // UploadThing hook
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        const uploadedUrl = res[0].url;
        console.log("✅ Upload complete:", uploadedUrl);
        setPreviewUrl(uploadedUrl);
        onChange(currentFile, uploadedUrl); // Use currentFile from state
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("❌ Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log("📁 File selected:", selectedFile.name, selectedFile.size);
      setCurrentFile(selectedFile); // Store file in state
      
      // Create local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const localUrl = e.target?.result as string;
        console.log("🖼️ FileReader result:", localUrl ? `${localUrl.substring(0, 50)}...` : "null");
        setPreviewUrl(localUrl);
        console.log("✅ Local preview URL set in state");
      };
      reader.onerror = (error) => {
        console.error("❌ FileReader error:", error);
      };
      reader.readAsDataURL(selectedFile);

      // Start upload to UploadThing
      onChange(selectedFile, undefined); // Pass file but no URL yet
      setIsUploading(true);
      console.log("☁️ Starting upload...");
      
      try {
        await startUpload([selectedFile]);
      } catch (error) {
        console.error("❌ Upload failed:", error);
        setIsUploading(false);
        // Fallback to local preview if upload fails
        onChange(selectedFile, previewUrl);
      }
    }
  };

  return (
    <div className="border border-dashed border-[#DDE1F7] rounded-lg p-6 flex items-center gap-8">
      {/* Thumbnail Preview */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 bg-[#E9FFD9] rounded-full overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Thumbnail preview" 
                className="w-full h-full object-cover"
                onLoad={() => console.log("🖼️ Image loaded in preview")}
                onError={(e) => console.error("❌ Image failed to load:", e)}
              />
            ) : isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            ) : (
              <span className="text-green-600 text-sm font-medium">IMG</span>
            )}
          </div>
          
          {/* Edit Badge */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#6356FF] rounded-full flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
            ) : (
              <Edit className="w-2.5 h-2.5 text-white" />
            )}
          </div>
        </div>
        
        <span className="text-xs text-muted-foreground mt-2">
          Thumbnail 400×400
        </span>
        
        {/* Debug info */}
        {previewUrl && (
          <span className="text-xs text-green-600 mt-1">
            ✓ Image loaded
          </span>
        )}
      </div>

      {/* Choose Image Button */}
      <div className="flex-1">
        <Button 
          variant="outline" 
          className="border-primary text-primary rounded-lg px-5 py-1.5 relative"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Choose Image"}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </Button>
        
        {isUploading && (
          <p className="text-xs text-muted-foreground mt-2">
            Uploading image to cloud storage...
          </p>
        )}
      </div>
    </div>
  );
} 