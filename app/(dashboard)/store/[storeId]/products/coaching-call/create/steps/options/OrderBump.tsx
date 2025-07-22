"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Control, UseFormRegister, UseFormWatch } from "react-hook-form";
import { OptionsSchema } from "./schema";

interface OrderBumpProps {
  control: Control<OptionsSchema>;
  register: UseFormRegister<OptionsSchema>;
  watch: UseFormWatch<OptionsSchema>;
}

export function OrderBump({ control, register, watch }: OrderBumpProps) {
  const isEnabled = watch("orderBump.enabled");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          {...register("orderBump.enabled")}
        />
        <span className="text-sm">Enable order bump</span>
      </div>

      {isEnabled && (
        <div className="space-y-3 ml-6">
          <Input
            {...register("orderBump.title")}
            placeholder="Order bump title"
            className="h-9"
          />
          <Input
            {...register("orderBump.price", { valueAsNumber: true })}
            type="number"
            placeholder="Price"
            className="h-9"
          />
        </div>
      )}
    </div>
  );
} 