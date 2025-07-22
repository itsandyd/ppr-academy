"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";
import { OptionsProSchema } from "./schema";

interface ReviewsProps {
  control: Control<OptionsProSchema>;
}

export function Reviews({ control }: ReviewsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "reviews",
  });

  const [newReview, setNewReview] = useState("");

  const handleAddReview = () => {
    if (newReview.trim()) {
      append({ value: newReview });
      setNewReview("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddReview();
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Reviews */}
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-center">
          <Input
            defaultValue={field.value}
            className="rounded-md border border-[#D6D9F3] h-9 px-4 flex-1"
            placeholder="Customer review"
            {...control.register(`reviews.${index}.value`)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ))}

      {/* Add New Review Input */}
      {fields.length === 0 && (
        <Input
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          onKeyPress={handleKeyPress}
          className="rounded-md border border-[#D6D9F3] h-9 px-4"
          placeholder="+ Add customer review"
        />
      )}

      {/* Add Review Button */}
      {fields.length > 0 && (
        <div className="space-y-3">
          <Input
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            onKeyPress={handleKeyPress}
            className="rounded-md border border-[#D6D9F3] h-9 px-4"
            placeholder="+ Add another review"
          />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddReview}
        disabled={!newReview.trim()}
        className="flex items-center gap-2 h-8 text-[#6356FF] border-[#6356FF] hover:bg-[#6356FF] hover:text-white"
      >
        <Plus size={14} />
        Add Review
      </Button>
    </div>
  );
} 