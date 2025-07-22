"use client";

import { Card } from "@/components/ui/card";
import { Megaphone, Eye, CreditCard } from "lucide-react";

interface StylePickerProps {
  value: 'button' | 'callout' | 'preview';
  onSelect: (style: 'button' | 'callout' | 'preview') => void;
}

const styles = [
  {
    id: 'button' as const,
    label: 'Button',
    icon: CreditCard,
    description: 'Simple call-to-action button'
  },
  {
    id: 'callout' as const,
    label: 'Callout',
    icon: Megaphone,
    description: 'Eye-catching banner style'
  },
  {
    id: 'preview' as const,
    label: 'Preview',
    icon: Eye,
    description: 'Detailed preview card'
  }
];

export function StylePicker({ value, onSelect }: StylePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {styles.map((style) => {
        const Icon = style.icon;
        const isSelected = value === style.id;
        
        return (
          <Card
            key={style.id}
            className={`w-[72px] h-[72px] cursor-pointer transition-all border rounded-xl flex flex-col items-center justify-center p-2 ${
              isSelected
                ? "border-[#6356FF] bg-[#6356FF]/5"
                : "border-[#E5E7F5] hover:border-[#6356FF]/50"
            }`}
            onClick={() => onSelect(style.id)}
          >
            <Icon 
              size={20} 
              className={`mb-1 ${
                isSelected ? "text-[#6356FF]" : "text-[#6B6E85]"
              }`} 
            />
            <span 
              className={`text-xs font-medium ${
                isSelected ? "text-[#6356FF]" : "text-[#6B6E85]"
              }`}
            >
              {style.label}
            </span>
          </Card>
        );
      })}
    </div>
  );
} 