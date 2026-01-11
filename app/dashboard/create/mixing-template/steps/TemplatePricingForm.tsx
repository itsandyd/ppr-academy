"use client";

import { useMixingTemplateCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Gift } from "lucide-react";

export function TemplatePricingForm() {
  const { state, updateData, saveTemplate } = useMixingTemplateCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveTemplate();
    if (state.data.pricingModel === "free_with_gate") {
      router.push(`/dashboard/create/mixing-template?step=followGate${state.templateId ? `&templateId=${state.templateId}` : ''}`);
    } else {
      router.push(`/dashboard/create/mixing-template?step=files${state.templateId ? `&templateId=${state.templateId}` : ''}`);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/create/mixing-template?step=files${state.templateId ? `&templateId=${state.templateId}` : ''}`);
  };

  const canProceed = !!(
    state.data.pricingModel &&
    (state.data.pricingModel === "free_with_gate" ||
     (state.data.price && parseFloat(state.data.price) > 0))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pricing Model</h2>
        <p className="text-muted-foreground mt-1">
          Choose how you want to offer your mixing template
        </p>
      </div>

      {/* Pricing Model Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            state.data.pricingModel === "paid"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:border-primary/50"
          }`}
          onClick={() => updateData("pricing", { pricingModel: "paid", price: state.data.price || "14.99" })}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Paid</CardTitle>
                <CardDescription>Sell directly for a set price</CardDescription>
              </div>
            </div>
          </CardHeader>
          {state.data.pricingModel === "paid" && (
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="14.99"
                    value={state.data.price || ""}
                    onChange={(e) => updateData("pricing", { price: e.target.value })}
                    className="pl-7 bg-background"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            state.data.pricingModel === "free_with_gate"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:border-primary/50"
          }`}
          onClick={() => updateData("pricing", { pricingModel: "free_with_gate", price: "0" })}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Free with Download Gate</CardTitle>
                <CardDescription>Require follows to unlock</CardDescription>
              </div>
            </div>
          </CardHeader>
          {state.data.pricingModel === "free_with_gate" && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Users will follow you on social media or provide their email to download this mixing template for free.
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </div>
  );
}
