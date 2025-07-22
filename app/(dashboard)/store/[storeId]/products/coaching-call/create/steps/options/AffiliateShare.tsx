"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Control, UseFormRegister, UseFormWatch } from "react-hook-form";
import { OptionsSchema } from "./schema";

interface AffiliateShareProps {
  control: Control<OptionsSchema>;
  register: UseFormRegister<OptionsSchema>;
  watch: UseFormWatch<OptionsSchema>;
}

export function AffiliateShare({ control, register, watch }: AffiliateShareProps) {
  const isEnabled = watch("affiliateShare.enabled");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch
          {...register("affiliateShare.enabled")}
        />
        <span className="text-sm">Enable affiliate sharing</span>
      </div>

      {isEnabled && (
        <div className="space-y-3 ml-6">
          <Input
            {...register("affiliateShare.percentage", { valueAsNumber: true })}
            type="number"
            placeholder="Commission percentage"
            className="h-9"
            min="0"
            max="100"
          />
        </div>
      )}
    </div>
  );
} 