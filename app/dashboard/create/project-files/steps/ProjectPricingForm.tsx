"use client";

import { useProjectFileCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Gift } from "lucide-react";

export function ProjectPricingForm() {
  const { state, updateData, saveProject } = useProjectFileCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveProject();
    if (state.data.pricingModel === "free_with_gate") {
      const dawType = state.data.dawType || "ableton";
      router.push(`/dashboard/create/project-files?daw=${dawType}&step=followGate${state.projectId ? `&projectId=${state.projectId}` : ''}`);
    }
  };

  const handleBack = () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/project-files?daw=${dawType}&step=files${state.projectId ? `&projectId=${state.projectId}` : ''}`);
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
          Choose how you want to offer your project file
        </p>
      </div>

      {/* Pricing Model Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            state.data.pricingModel === "paid"
              ? "ring-2 ring-purple-500 bg-purple-500/5"
              : "hover:border-purple-500/50"
          }`}
          onClick={() => updateData("pricing", { pricingModel: "paid", price: state.data.price || "24.99" })}
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
                    placeholder="24.99"
                    value={state.data.price || ""}
                    onChange={(e) => updateData("pricing", { price: e.target.value })}
                    className="pl-7 bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Project files typically sell for $15-$50 depending on complexity
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            state.data.pricingModel === "free_with_gate"
              ? "ring-2 ring-purple-500 bg-purple-500/5"
              : "hover:border-purple-500/50"
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
                Users will follow you on social media or provide their email to download this project file for free.
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Pricing Tips */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-purple-900 dark:from-purple-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle className="text-purple-700 dark:text-purple-300">Pricing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-purple-600 dark:text-purple-400">
            <li>• Simple projects (1-2 synths, basic arrangement): $10-20</li>
            <li>• Intermediate projects (full arrangement, mixing): $20-35</li>
            <li>• Complex projects (advanced sound design, mastered): $35-50+</li>
            <li>• Consider offering free projects to build your audience</li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {state.data.pricingModel === "free_with_gate" ? "Continue to Download Gate" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
