"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";
import { Control, UseFormRegister, useFieldArray } from "react-hook-form";
import { OptionsSchema } from "./schema";

interface ReviewsProps {
  control: any;
  register: UseFormRegister<OptionsSchema>;
}

export function Reviews({ control, register }: ReviewsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "reviews",
  });

  const addReview = () => {
    append("" as any);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-center">
            <Input
              {...register(`reviews.${index}` as const)}
              placeholder="Add customer review"
              className="h-9"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => remove(index)}
              className="h-9 w-9 shrink-0"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addReview}
        className="h-8 text-xs"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add customer review
      </Button>

      {fields.length === 0 && (
        <div className="text-center py-4 text-[#6B6E85] text-sm">
          No reviews added yet.
        </div>
      )}
    </div>
  );
} 