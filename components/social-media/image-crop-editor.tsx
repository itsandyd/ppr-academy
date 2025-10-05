"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crop, ZoomIn, RotateCw } from "lucide-react";

interface ImageCropEditorProps {
  image: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  suggestedAspectRatio?: number;
  postType?: "post" | "story" | "reel";
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ASPECT_RATIOS = {
  "1:1 (Square)": 1,
  "4:5 (Portrait)": 4 / 5,
  "9:16 (Stories/Reels)": 9 / 16,
  "16:9 (Landscape)": 16 / 9,
  "3:4 (Portrait)": 3 / 4,
  "Free": undefined,
};

export function ImageCropEditor({
  image,
  open,
  onOpenChange,
  onCropComplete,
  suggestedAspectRatio,
  postType,
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(() => {
    // Set default based on post type
    if (postType === "story" || postType === "reel") return 9 / 16;
    if (postType === "post") return 1;
    return suggestedAspectRatio;
  });

  const onCropAreaChange = useCallback((croppedArea: any, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageElement = new Image();
      // Only set crossOrigin for external URLs, not blob URLs
      if (!image.startsWith("blob:")) {
        imageElement.crossOrigin = "anonymous";
      }
      imageElement.src = image;

      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });

      // Set canvas size to cropped dimensions
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply rotation
      const rad = (rotation * Math.PI) / 180;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);

      // Draw the cropped region
      ctx.drawImage(
        imageElement,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        -croppedAreaPixels.width / 2,
        -croppedAreaPixels.height / 2,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      ctx.restore();

      return new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
          },
          "image/jpeg",
          0.95
        );
      });
    } catch (error) {
      console.error("Error creating cropped image:", error);
      throw error;
    }
  }, [image, croppedAreaPixels, rotation]);

  const handleSave = async () => {
    const result = await createCroppedImage();
    if (result) {
      onCropComplete(result.blob, result.url);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white dark:bg-black h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop & Adjust Image</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Cropper */}
          <div className="relative flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropAreaChange}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select
                value={aspectRatio?.toString() || "free"}
                onValueChange={(value) => {
                  if (value === "free") {
                    setAspectRatio(undefined);
                  } else {
                    const ratio = Object.entries(ASPECT_RATIOS).find(
                      ([_, val]) => val?.toString() === value
                    );
                    if (ratio) setAspectRatio(ratio[1]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASPECT_RATIOS).map(([label, value]) => (
                    <SelectItem key={label} value={value?.toString() || "free"}>
                      {label}
                      {postType === "story" && label.includes("9:16") && " ⭐ Recommended"}
                      {postType === "reel" && label.includes("9:16") && " ⭐ Recommended"}
                      {postType === "post" && (label.includes("1:1") || label.includes("4:5")) && " ⭐"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </Label>
                <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation
                </Label>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={([value]) => setRotation(value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Crop className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
