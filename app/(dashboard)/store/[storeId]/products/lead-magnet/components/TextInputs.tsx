"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ThumbnailSchema } from "./schema";

interface TextInputsProps {
  register: UseFormRegister<ThumbnailSchema>;
  errors: FieldErrors<ThumbnailSchema>;
}

export function TextInputs({ register, errors }: TextInputsProps) {
  return (
    <div className="space-y-6">
      {/* Title Field */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Lead magnet title</Label>
        <Input
          {...register("title")}
          placeholder="Enter your lead magnet title"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      {/* Subtitle Field */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Subtitle (optional)</Label>
        <Textarea
          {...register("subtitle")}
          placeholder="Enter a subtitle or description"
          className="min-h-[80px] rounded-xl border-[#E5E7F5] px-4 py-3 resize-none"
        />
        {errors.subtitle && (
          <p className="text-sm text-red-500">{errors.subtitle.message}</p>
        )}
      </div>

      {/* Button Text Field */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Button text</Label>
        <Input
          {...register("button")}
          placeholder="Get Free Resource"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
        />
        {errors.button && (
          <p className="text-sm text-red-500">{errors.button.message}</p>
        )}
      </div>
    </div>
  );
} 