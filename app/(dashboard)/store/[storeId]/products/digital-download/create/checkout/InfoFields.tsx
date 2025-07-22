"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";
import { CheckoutSchema } from "./schema";

interface InfoFieldsProps {
  control: Control<CheckoutSchema>;
}

export function InfoFields({ control }: InfoFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });

  return (
    <div className="space-y-6">
      {/* Base Fields (Always Present) */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
          <Input
            value="Name"
            disabled
            className="h-12 rounded-xl border-[#E5E7F5] px-4 bg-gray-50 text-gray-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
          <Input
            value="Email"
            disabled
            className="h-12 rounded-xl border-[#E5E7F5] px-4 bg-gray-50 text-gray-400"
          />
        </div>
      </div>

      {/* Additional Fields Section */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-4">
          Collect additional customer info
        </p>
        
        {/* Add Field Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: "" })}
          className="w-full h-8 rounded-lg border-[#E5E7F5] text-[#6356FF] border-[#6356FF] hover:bg-[#6356FF] hover:text-white md:w-auto"
        >
          <Plus size={16} className="mr-2" />
          Add Field
        </Button>

        {/* Dynamic Fields */}
        {fields.length > 0 && (
          <div className="mt-4 space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="Field name"
                  className="h-10 rounded-lg border-[#E5E7F5] px-3 flex-1"
                  {...control.register(`fields.${index}.name`)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                  className="h-10 px-3 text-red-500 border-red-200 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 