"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";
import { OptionsProSchema } from "./schema";

interface EmailFlowsProps {
  control: Control<OptionsProSchema>;
}

export function EmailFlows({ control }: EmailFlowsProps) {
  const { fields, append } = useFieldArray({
    control,
    name: "emailFlows",
  });

  const handleAddFlow = () => {
    append({ value: `Email Flow ${fields.length + 1}` });
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-[#6B6E85] leading-relaxed">
        Send an automatic email drip sequence to nurture your customers and increase lifetime value.
      </p>

      {/* Existing Flows */}
      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E5E7F5]">
              <Mail size={16} className="text-[#6356FF]" />
              <span className="flex-1 text-sm font-medium">{field.value}</span>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Add Flow Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleAddFlow}
          className="bg-[#6356FF] hover:bg-[#5248E6] text-white text-xs px-4 h-6 rounded-full"
        >
          <Plus size={12} className="mr-1" />
          Add Flow
        </Button>
      </div>
    </div>
  );
} 