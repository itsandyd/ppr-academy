"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useServiceCreation } from "../context";
import { PricingTier, DEFAULT_PRICING_TIERS } from "../types";
import { DollarSign, Plus, Trash2, Zap } from "lucide-react";

export function PricingForm() {
  const { state, updateData } = useServiceCreation();
  const [tiers, setTiers] = useState<PricingTier[]>(
    state.data.pricingTiers || DEFAULT_PRICING_TIERS
  );

  const updateTiers = (newTiers: PricingTier[]) => {
    setTiers(newTiers);
    updateData("pricing", { pricingTiers: newTiers });
  };

  const updateTier = (index: number, field: keyof PricingTier, value: string | number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    updateTiers(newTiers);
  };

  const addTier = () => {
    const newTier: PricingTier = {
      id: `tier-${Date.now()}`,
      name: "Custom",
      stemCount: "Custom",
      price: 100,
      turnaroundDays: 7,
      revisions: 2,
      description: "",
    };
    updateTiers([...tiers, newTier]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      updateTiers(tiers.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Tiers
          </CardTitle>
          <CardDescription>
            Set different prices based on project complexity (stem count, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tiers.map((tier, index) => (
            <div key={tier.id} className="relative rounded-lg border bg-card p-4 shadow-sm">
              {tiers.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTier(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tier Name</Label>
                  <Input
                    value={tier.name}
                    onChange={(e) => updateTier(index, "name", e.target.value)}
                    placeholder="e.g., Basic, Standard, Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stem Count Range</Label>
                  <Input
                    value={tier.stemCount}
                    onChange={(e) => updateTier(index, "stemCount", e.target.value)}
                    placeholder="e.g., 1-8 stems"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTier(index, "price", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Turnaround (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tier.turnaroundDays}
                    onChange={(e) => updateTier(index, "turnaroundDays", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Revisions Included</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tier.revisions}
                    onChange={(e) => updateTier(index, "revisions", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label>Description (optional)</Label>
                  <Input
                    value={tier.description || ""}
                    onChange={(e) => updateTier(index, "description", e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addTier}>
            <Plus className="mr-2 h-4 w-4" />
            Add Pricing Tier
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Rush Delivery
          </CardTitle>
          <CardDescription>Offer expedited turnaround for an additional fee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Rush Delivery</Label>
              <p className="text-sm text-muted-foreground">
                Let clients pay extra for faster turnaround
              </p>
            </div>
            <Switch
              checked={state.data.rushAvailable || false}
              onCheckedChange={(checked) => updateData("pricing", { rushAvailable: checked })}
            />
          </div>

          {state.data.rushAvailable && (
            <div className="space-y-2">
              <Label>Rush Price Multiplier</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="3"
                  step="0.1"
                  value={state.data.rushMultiplier || 1.5}
                  onChange={(e) =>
                    updateData("pricing", { rushMultiplier: Number(e.target.value) })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">× base price</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: A $100 mix with 1.5× multiplier = $150 rush price
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
