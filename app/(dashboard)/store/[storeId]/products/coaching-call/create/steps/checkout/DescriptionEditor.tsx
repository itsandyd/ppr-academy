"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function DescriptionEditor({ value, onChange, maxLength = 2000 }: DescriptionEditorProps) {
  const characterCount = value.length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what clients can expect from this coaching session..."
          className="min-h-[120px] resize-none rounded-xl border-[#E5E7F5] px-4 py-3"
          maxLength={maxLength}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute top-3 right-3 text-xs border-[#E5E7F5] text-[#6B6E85] hover:border-[#6356FF] hover:text-[#6356FF]"
        >
          <Sparkles size={12} className="mr-1" />
          Generate with AI
        </Button>
      </div>
      
      <div className="flex justify-end">
        <span 
          className={`text-xs ${
            characterCount > maxLength * 0.9 ? "text-red-500" : "text-[#6B6E85]"
          }`}
        >
          {characterCount}/{maxLength}
        </span>
      </div>
    </div>
  );
} 