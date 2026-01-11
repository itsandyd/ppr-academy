"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Gift, CreditCard, Info, TrendingUp, Users } from "lucide-react";
import { usePlaylistCuration } from "../context";

export function PricingForm() {
  const { state, updateData, validateStep } = usePlaylistCuration();

  // Validate on mount and changes
  useEffect(() => {
    validateStep("pricing");
  }, [state.data.pricingModel, state.data.submissionFee]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Submission Pricing
          </CardTitle>
          <CardDescription>
            Choose how artists pay to submit tracks to your playlist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={state.data.pricingModel || "free"}
            onValueChange={(value) =>
              updateData("pricing", { pricingModel: value as "free" | "paid" })
            }
            className="space-y-4"
          >
            {/* Free Option */}
            <div
              className={`relative flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all ${
                state.data.pricingModel === "free"
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/50"
              }`}
            >
              <RadioGroupItem value="free" id="free" className="mt-1" />
              <Label htmlFor="free" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Free Submissions</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Recommended
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Artists can submit for free. Great for building your audience and discovering new
                  music.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    More submissions
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Grow faster
                  </span>
                </div>
              </Label>
            </div>

            {/* Paid Option */}
            <div
              className={`relative flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all ${
                state.data.pricingModel === "paid"
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/50"
              }`}
            >
              <RadioGroupItem value="paid" id="paid" className="mt-1" />
              <Label htmlFor="paid" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Paid Submissions</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Charge a fee per submission. Attracts more serious artists and generates revenue.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Earn money
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Serious artists
                  </span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Price Input (when paid) */}
          {state.data.pricingModel === "paid" && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-2">
                <Label htmlFor="submissionFee">
                  Submission Fee (USD) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-muted-foreground">$</span>
                  <Input
                    id="submissionFee"
                    type="number"
                    min={1}
                    max={100}
                    step={0.01}
                    value={state.data.submissionFee || ""}
                    onChange={(e) =>
                      updateData("pricing", {
                        submissionFee: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="10.00"
                    className="max-w-32 bg-white dark:bg-black"
                  />
                  <span className="text-sm text-muted-foreground">per submission</span>
                </div>
              </div>

              {/* Pricing Suggestions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Select</Label>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 50].map((price) => (
                    <Badge
                      key={price}
                      variant={state.data.submissionFee === price ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateData("pricing", { submissionFee: price })}
                    >
                      ${price}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-background p-3">
                <p className="text-sm">
                  <strong>Recommended pricing:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• $5-10 for quick consideration (3-7 day review)</li>
                  <li>• $15-25 for detailed feedback</li>
                  <li>• $25-50 for priority review with guaranteed feedback</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex gap-4 p-4">
          <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              How Payments Work
            </p>
            <ul className="space-y-1 text-blue-600/80 dark:text-blue-400/80">
              <li>• Artists pay when submitting their track</li>
              <li>• Payments are processed through Stripe Connect</li>
              <li>• Funds are deposited to your connected bank account</li>
              <li>• You can change pricing anytime</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Estimation */}
      {state.data.pricingModel === "paid" && state.data.submissionFee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Potential Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="text-2xl font-bold">
                  ${(state.data.submissionFee * 10).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">10 submissions/month</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="text-2xl font-bold">
                  ${(state.data.submissionFee * 50).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">50 submissions/month</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="text-2xl font-bold">
                  ${(state.data.submissionFee * 100).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">100 submissions/month</div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Platform fee: 10% • You keep 90% of all earnings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
