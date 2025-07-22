"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";
import { Control, UseFormRegister } from "react-hook-form";
import { OptionsSchema } from "./schema";

interface RecipientRowProps {
  flowIndex: number;
  index: number;
  control: Control<OptionsSchema>;
  register: UseFormRegister<OptionsSchema>;
  onRemove: () => void;
}

export function RecipientRow({ flowIndex, index, control, register, onRemove }: RecipientRowProps) {
  return (
    <div className="grid grid-cols-[120px_1fr_40px] gap-3 items-center py-2">
      <Input
        type="number"
        className="h-8"
        placeholder="15"
        {...register(`flows.${flowIndex}.recipients.${index}.delay` as const, { valueAsNumber: true })}
      />
      <Select defaultValue="new">
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New Customer</SelectItem>
          <SelectItem value="past">Past Customer</SelectItem>
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" onClick={onRemove} className="h-8 w-8">
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
} 