"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";
import { AvailabilitySchema } from "./schema";
import { TimeRow } from "./TimeRow";

const days = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

interface DaysGridProps {
  control: Control<AvailabilitySchema>;
  name: keyof AvailabilitySchema;
}

export function DaysGrid({ control, name }: DaysGridProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-[#6B6E85] mb-4">Your Availability</div>
      
      {days.map((day) => {
        const fieldArray = useFieldArray({
          control,
          name: `${name}.${day.key}` as any,
        });

        const isEnabled = fieldArray.fields.length > 0;

        const toggleDay = () => {
          if (isEnabled) {
            // Remove all slots for this day
            fieldArray.remove();
          } else {
            // Add default slot
            fieldArray.append({ from: '09:00', to: '17:00' });
          }
        };

        const addSlot = () => {
          fieldArray.append({ from: '09:00', to: '17:00' });
        };

        return (
          <div key={day.key} className="flex items-start gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={toggleDay}
              className={`min-w-[100px] h-9 rounded-full transition-colors ${
                isEnabled 
                  ? 'bg-[#6356FF] text-white border-[#6356FF] hover:bg-[#5145E6]' 
                  : 'bg-[#F8F9FB] text-[#6B6E85] border-[#E5E7F5] hover:bg-[#F0F2F5]'
              }`}
            >
              {day.label}
            </Button>
            
            {isEnabled && (
              <div className="flex-1 space-y-2">
                {fieldArray.fields.map((field, index) => {
                  const slot = field as { from: string; to: string; id: string };
                  return (
                    <TimeRow
                      key={field.id}
                      day={day.key}
                      slot={{ from: slot.from, to: slot.to }}
                      onChange={(key, value) => {
                        fieldArray.update(index, { ...slot, [key]: value });
                      }}
                      onRemove={() => fieldArray.remove(index)}
                    />
                  );
                })}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSlot}
                  className="h-8 text-[#6356FF] hover:text-[#5145E6] hover:bg-[#F8F9FB]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add time
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 