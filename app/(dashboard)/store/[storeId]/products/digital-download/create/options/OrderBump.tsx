"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageIcon, Upload } from "lucide-react";
import { Control, Controller, useWatch } from "react-hook-form";
import { OptionsProSchema } from "./schema";

interface OrderBumpProps {
  control: Control<OptionsProSchema>;
}

export function OrderBump({ control }: OrderBumpProps) {
  const [preview, setPreview] = useState<string | null>(null);
  
  // Watch the enabled state
  const isEnabled = useWatch({
    control,
    name: "orderBump.enabled",
    defaultValue: false
  });

  const productName = useWatch({
    control,
    name: "orderBump.productName",
    defaultValue: ""
  });

  const price = useWatch({
    control,
    name: "orderBump.price",
    defaultValue: 0
  });

  const handleImageChange = (file: File | null, onChange: (value: File | null) => void) => {
    onChange(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <Controller
        control={control}
        name="orderBump.enabled"
        render={({ field }) => (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Enable Order Bump</h4>
              <p className="text-xs text-[#6B6E85] mt-1">
                Offer complementary products during checkout to increase revenue
              </p>
            </div>
            <Switch
              checked={field.value || false}
              onCheckedChange={(checked) => {
                console.log("Toggle changed to:", checked);
                field.onChange(checked);
              }}
              className="data-[state=checked]:bg-[#6356FF]"
            />
          </div>
        )}
      />

      {/* Form Fields */}
      <div className={isEnabled ? "" : "opacity-50"}>
        {/* Product Name */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Product Name</label>
          <Controller
            control={control}
            name="orderBump.productName"
            render={({ field }) => (
              <Input
                value={field.value || ""}
                onChange={(e) => {
                  console.log("Product name changed to:", e.target.value);
                  field.onChange(e.target.value);
                }}
                placeholder="Enter complementary product name"
                className="h-9 rounded-md border border-[#D6D9F3] px-4"
                maxLength={100}
                disabled={!isEnabled}
              />
            )}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
          <Controller
            control={control}
            name="orderBump.description"
            render={({ field }) => (
              <Textarea
                value={field.value || ""}
                onChange={(e) => {
                  console.log("Description changed to:", e.target.value);
                  field.onChange(e.target.value);
                }}
                placeholder="Describe why customers should add this to their order..."
                className="rounded-md border border-[#D6D9F3] px-4 py-3 min-h-[80px] resize-none"
                maxLength={300}
                disabled={!isEnabled}
              />
            )}
          />
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Price</label>
          <Controller
            control={control}
            name="orderBump.price"
            render={({ field }) => (
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    console.log("Price changed to:", value);
                    field.onChange(value);
                  }}
                  className="h-9 rounded-md border border-[#D6D9F3] pl-8 pr-4 text-right"
                  disabled={!isEnabled}
                />
              </div>
            )}
          />
        </div>

        {/* Product Image */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Product Image</label>
          <Controller
            control={control}
            name="orderBump.image"
            render={({ field }) => (
              <div className="border-dashed border-2 border-[#DDE1F7] rounded-lg p-4 flex items-center gap-4">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Order bump preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageChange(null, field.onChange)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <ImageIcon size={20} className="text-[#6356FF]" />
                  </div>
                )}
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Upload product image
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleImageChange(file, field.onChange);
                    }}
                    className="hidden"
                    id="order-bump-image"
                    disabled={!isEnabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("order-bump-image")?.click()}
                    disabled={!isEnabled}
                  >
                    <Upload size={14} className="mr-2" />
                    Choose Image
                  </Button>
                </div>
              </div>
            )}
          />
        </div>

        {/* Preview Card */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Preview</label>
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <ImageIcon size={16} className="text-[#6356FF]" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900">
                  {productName || "Complementary Product"}
                </h5>
                <p className="text-xs text-gray-600 mt-1">
                  Perfect addition to your purchase!
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-green-600">
                  +${(price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 