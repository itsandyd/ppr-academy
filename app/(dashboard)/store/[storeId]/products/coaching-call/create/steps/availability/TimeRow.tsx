"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";

type Slot = { from: string; to: string };

// Generate time options in 15-minute intervals
const timeOptions: { value: string; label: string }[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 15) {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const displayTime = hour === 0 && minute === 0 ? '12:00 AM' : 
                       hour < 12 ? `${hour === 0 ? 12 : hour}:${minute.toString().padStart(2, '0')} AM` :
                       hour === 12 ? `12:${minute.toString().padStart(2, '0')} PM` :
                       `${hour - 12}:${minute.toString().padStart(2, '0')} PM`;
    timeOptions.push({ value: timeString, label: displayTime });
  }
}

export function TimeRow({
  day,
  slot,
  onChange,
  onRemove,
}: {
  day: string;
  slot: Slot;
  onChange: (key: keyof Slot, val: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={slot.from} onValueChange={(v) => onChange('from', v)}>
        <SelectTrigger className="w-20 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="text-muted-foreground text-sm">to</span>
      
      <Select value={slot.to} onValueChange={(v) => onChange('to', v)}>
        <SelectTrigger className="w-20 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button variant="ghost" size="icon" onClick={onRemove} className="h-9 w-9">
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
} 