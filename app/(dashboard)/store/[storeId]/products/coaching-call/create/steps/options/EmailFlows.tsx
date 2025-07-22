"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Control, UseFormRegister, useFieldArray } from "react-hook-form";
import { OptionsSchema } from "./schema";
import { FlowCard } from "./FlowCard";

interface EmailFlowsProps {
  control: Control<OptionsSchema>;
  register: UseFormRegister<OptionsSchema>;
}

export function EmailFlows({ control, register }: EmailFlowsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "flows",
  });

  const addFlow = () => {
    append({
      id: Date.now().toString(),
      subject: "",
      body: "",
      recipients: [{ delay: 15, audience: 'new' as const }],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#6B6E85]">Email automation flows</span>
        <Button
          type="button"
          onClick={addFlow}
          className="h-6 px-3 text-xs bg-[#6356FF] hover:bg-[#5145E6] text-white rounded-full"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Flow
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <FlowCard
            key={field.id}
            flow={field}
            index={index}
            control={control}
            register={register}
            onDelete={() => remove(index)}
          />
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-[#6B6E85] text-sm">
          No email flows configured. Add one to get started.
        </div>
      )}
    </div>
  );
} 