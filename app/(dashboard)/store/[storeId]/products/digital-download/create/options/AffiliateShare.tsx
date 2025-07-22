"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Clock, Target } from "lucide-react";
import { Control, Controller, useWatch } from "react-hook-form";
import { OptionsProSchema } from "./schema";

interface AffiliateShareProps {
  control: Control<OptionsProSchema>;
}

export function AffiliateShare({ control }: AffiliateShareProps) {
  // Watch the enabled state
  const isEnabled = useWatch({
    control,
    name: "affiliateShare.enabled",
    defaultValue: false
  });

  const commissionRate = useWatch({
    control,
    name: "affiliateShare.commissionRate",
    defaultValue: 30
  });

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <Controller
        control={control}
        name="affiliateShare.enabled"
        render={({ field }) => (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Enable Affiliate Program</h4>
              <p className="text-xs text-[#6B6E85] mt-1">
                Let others promote your product and earn commissions for each sale
              </p>
            </div>
            <Switch
              checked={field.value || false}
              onCheckedChange={(checked) => {
                console.log("Affiliate toggle changed to:", checked);
                field.onChange(checked);
              }}
              className="data-[state=checked]:bg-[#6356FF]"
            />
          </div>
        )}
      />

      {/* Form Fields */}
      <div className={isEnabled ? "" : "opacity-50"}>
        {/* Commission Rate */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Commission Rate</label>
          <Controller
            control={control}
            name="affiliateShare.commissionRate"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <div className="relative w-24">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="30"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      console.log("Commission rate changed to:", value);
                      field.onChange(value);
                    }}
                    className="h-9 rounded-md border border-[#D6D9F3] pr-8 pl-4 text-right"
                    disabled={!isEnabled}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <span className="text-sm text-[#6B6E85]">of each sale</span>
              </div>
            )}
          />
          <p className="text-xs text-[#6B6E85] mt-1">
            Recommended: 20-50% for digital products
          </p>
        </div>

        {/* Minimum Payout */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Payout</label>
          <Controller
            control={control}
            name="affiliateShare.minPayout"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50.00"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      console.log("Min payout changed to:", value);
                      field.onChange(value);
                    }}
                    className="h-9 rounded-md border border-[#D6D9F3] pl-8 pr-4 text-right"
                    disabled={!isEnabled}
                  />
                </div>
                <span className="text-sm text-[#6B6E85]">minimum to withdraw</span>
              </div>
            )}
          />
        </div>

        {/* Cookie Duration */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Cookie Duration</label>
          <Controller
            control={control}
            name="affiliateShare.cookieDuration"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <div className="relative w-20">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30;
                      console.log("Cookie duration changed to:", value);
                      field.onChange(value);
                    }}
                    className="h-9 rounded-md border border-[#D6D9F3] px-4 text-center"
                    disabled={!isEnabled}
                  />
                </div>
                <span className="text-sm text-[#6B6E85]">days attribution window</span>
              </div>
            )}
          />
          <p className="text-xs text-[#6B6E85] mt-1">
            How long after clicking an affiliate link the sale is still attributed
          </p>
        </div>

        {/* Features List */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-3 block">What affiliates get:</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <DollarSign size={16} className="text-blue-600" />
              <span className="text-sm text-blue-900">Personalized referral links</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Target size={16} className="text-green-600" />
              <span className="text-sm text-green-900">Real-time analytics dashboard</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Users size={16} className="text-purple-600" />
              <span className="text-sm text-purple-900">Marketing materials & assets</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Clock size={16} className="text-orange-600" />
              <span className="text-sm text-orange-900">Automated commission payments</span>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Affiliate Dashboard Preview</label>
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Your Earnings</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  $247.50
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">15</div>
                  <div className="text-xs text-gray-500">Referrals</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">8</div>
                  <div className="text-xs text-gray-500">Conversions</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {commissionRate || 53}%
                  </div>
                  <div className="text-xs text-gray-500">Rate</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 