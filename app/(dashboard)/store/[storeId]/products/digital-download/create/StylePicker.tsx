"use client";

import { Card } from "@/components/ui/card";
import { Square, CreditCard, Eye } from "lucide-react";

interface StylePickerProps {
  value: "button" | "callout" | "preview";
  onSelect: (style: "button" | "callout" | "preview") => void;
}

const styles = [
  {
    id: "button" as const,
    label: "Button",
    icon: Square,
  },
  {
    id: "callout" as const,
    label: "Callout",
    icon: CreditCard,
  },
  {
    id: "preview" as const,
    label: "Preview",
    icon: Eye,
  },
];

export function StylePicker({ value, onSelect }: StylePickerProps) {
  return (
    <div className="flex gap-4">
      {styles.map((style) => {
        const Icon = style.icon;
        const isSelected = value === style.id;
        
        return (
          <Card
            key={style.id}
            className={`w-[72px] h-[72px] rounded-xl border cursor-pointer transition-all ${
              isSelected
                ? "bg-[#6356FF]/5 border-[#6356FF]"
                : "border-[#E5E7F5] hover:border-[#6356FF]"
            }`}
            onClick={() => onSelect(style.id)}
          >
            <div className="w-full h-full grid place-content-center">
              <div className="text-center">
                <Icon 
                  size={24} 
                  className={`mx-auto mb-1 ${
                    isSelected ? "text-[#6356FF]" : "text-[#6B6E85]"
                  }`} 
                />
                <span className={`text-xs font-medium ${
                  isSelected ? "text-[#6356FF]" : "text-[#6B6E85]"
                }`}>
                  {style.label}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
} 