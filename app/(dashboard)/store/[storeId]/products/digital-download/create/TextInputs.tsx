"use client";

import { Input } from "@/components/ui/input";
import { UseFormRegister } from "react-hook-form";
import { ThumbnailStyleSchema } from "./schema";

interface TextInputsProps {
  register: UseFormRegister<ThumbnailStyleSchema>;
  char: {
    title: number;
    subtitle: number;
    button: number;
  };
}

export function TextInputs({ register, char }: TextInputsProps) {
  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <span className={`text-xs ${char.title >= 50 ? 'text-red-500' : 'text-[#6B6E85]'}`}>
            {char.title}/50
          </span>
        </div>
        <Input
          {...register("title")}
          placeholder="Enter title"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
        />
      </div>

      {/* Subtitle Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Subtitle</label>
          <span className={`text-xs ${char.subtitle >= 100 ? 'text-red-500' : 'text-[#6B6E85]'}`}>
            {char.subtitle}/100
          </span>
        </div>
        <Input
          {...register("subtitle")}
          placeholder="Enter subtitle (optional)"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
        />
      </div>

      {/* Button Label Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Button</label>
          <span className={`text-xs ${char.button >= 30 ? 'text-red-500' : 'text-[#6B6E85]'}`}>
            {char.button}/30
          </span>
        </div>
        <Input
          {...register("buttonLabel")}
          placeholder="Enter button text"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
        />
      </div>
    </div>
  );
} 