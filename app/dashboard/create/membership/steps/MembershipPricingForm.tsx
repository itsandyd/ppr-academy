"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Save, DollarSign, Calendar, Gift } from "lucide-react";
import { useMembershipCreation } from "../context";

export function MembershipPricingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateData, saveTier, validateStep } = useMembershipCreation();

  const tierId = searchParams.get("tierId");

  const handleBack = () => {
    router.push(`/dashboard/create/membership?step=basics${tierId ? `&tierId=${tierId}` : ""}`);
  };

  const handleNext = async () => {
    await saveTier();
    router.push(`/dashboard/create/membership?step=content${tierId ? `&tierId=${tierId}` : ""}`);
  };

  const monthlyPrice = parseFloat(state.data.priceMonthly || "0");
  const yearlyPrice = parseFloat(state.data.priceYearly || "0");
  const yearlySavings =
    yearlyPrice > 0
      ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Set your membership pricing and trial options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceMonthly" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Price *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="priceMonthly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="9.99"
                  className="pl-7"
                  value={state.data.priceMonthly || ""}
                  onChange={(e) => updateData("pricing", { priceMonthly: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Billed monthly</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceYearly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Yearly Price (Optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="priceYearly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="99.99"
                  className="pl-7"
                  value={state.data.priceYearly || ""}
                  onChange={(e) => updateData("pricing", { priceYearly: e.target.value })}
                />
              </div>
              {yearlySavings > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {yearlySavings}% savings vs monthly
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="trialDays" className="text-base">
                    Free Trial
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Offer a trial period before billing
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="trialDays"
                  type="number"
                  min="0"
                  max="30"
                  className="w-20 text-center"
                  placeholder="0"
                  value={state.data.trialDays || ""}
                  onChange={(e) =>
                    updateData("pricing", { trialDays: parseInt(e.target.value) || 0 })
                  }
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          {monthlyPrice > 0 && (
            <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4">
              <h4 className="font-medium">Pricing Preview</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  Monthly: <span className="font-semibold">${monthlyPrice.toFixed(2)}/month</span>
                </p>
                {yearlyPrice > 0 && (
                  <p>
                    Yearly: <span className="font-semibold">${yearlyPrice.toFixed(2)}/year</span> (
                    {yearlySavings}% off)
                  </p>
                )}
                {state.data.trialDays && state.data.trialDays > 0 && (
                  <p className="text-green-600 dark:text-green-400">
                    + {state.data.trialDays}-day free trial
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveTier} disabled={state.isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {state.isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handleNext} disabled={!validateStep("pricing")}>
            Next: Content Access
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
