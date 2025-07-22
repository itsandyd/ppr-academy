"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Phone, Headphones } from "lucide-react";

interface SessionSettingsProps {
  duration: number;
  price: number;
  sessionType: 'video' | 'audio' | 'phone';
  onDurationChange: (duration: number) => void;
  onPriceChange: (price: number) => void;
  onSessionTypeChange: (type: 'video' | 'audio' | 'phone') => void;
}

const sessionTypes = [
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'audio', label: 'Audio Call', icon: Headphones },
  { value: 'phone', label: 'Phone Call', icon: Phone },
];

export function SessionSettings({
  duration,
  price,
  sessionType,
  onDurationChange,
  onPriceChange,
  onSessionTypeChange
}: SessionSettingsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Duration (minutes)</label>
        <Input
          type="number"
          min="15"
          max="480"
          step="15"
          value={duration || ""}
          onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
          placeholder="60"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
        />
        <p className="text-xs text-[#6B6E85]">15 min to 8 hours</p>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Price</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B6E85]">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price || ""}
            onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
            placeholder="99.00"
            className="h-12 rounded-xl border-[#E5E7F5] pl-8 pr-4"
          />
        </div>
        <p className="text-xs text-[#6B6E85]">Set your rate</p>
      </div>

      {/* Session Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Session Type</label>
        <Select value={sessionType} onValueChange={onSessionTypeChange}>
          <SelectTrigger className="h-12 rounded-xl border-[#E5E7F5] px-4">
            <SelectValue placeholder="Choose type" />
          </SelectTrigger>
          <SelectContent>
            {sessionTypes.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#6B6E85]" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <p className="text-xs text-[#6B6E85]">How you'll connect</p>
      </div>
    </div>
  );
} 