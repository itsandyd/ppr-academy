"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Control, UseFormRegister } from "react-hook-form";
import { CheckoutSchema } from "./schema";

interface PriceSectionProps {
  control: Control<CheckoutSchema>;
  register: UseFormRegister<CheckoutSchema>;
}

export function PriceSection({ control, register }: PriceSectionProps) {
  const [discountEnabled, setDiscountEnabled] = useState(false);

  return (
    <div className="space-y-6">
      {/* Price Input */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <Input
            {...register("price", { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="h-12 rounded-xl border-[#E5E7F5] pl-8 pr-4 w-28 text-right"
          />
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Discount Price</label>
          <Switch
            checked={discountEnabled}
            onCheckedChange={setDiscountEnabled}
            className="data-[state=checked]:bg-[#6356FF]"
          />
        </div>

        {discountEnabled ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              {...register("discountPrice", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-12 rounded-xl border-[#E5E7F5] pl-8 pr-4 w-28 text-right"
            />
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Discount pricing</p>
                <p className="text-xs text-gray-400">Offer limited-time discounts</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[#6356FF] border-[#6356FF] hover:bg-[#6356FF] hover:text-white"
              >
                <Lock size={14} className="mr-1" />
                Upgrade to Unlock
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 