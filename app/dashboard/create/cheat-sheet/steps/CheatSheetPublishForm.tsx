"use client";

import { useCheatSheetCreation } from "../context";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, DollarSign, Gift, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheatSheetPublishForm() {
  const { state, updateData } = useCheatSheetCreation();

  const pricingModel = state.data.pricingModel || "paid";

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Ready to Publish?</h2>
          <p className="text-muted-foreground">
            Choose how you want to offer your cheat sheet
          </p>
        </div>

        {/* Pricing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Option */}
          <Card
            className={cn(
              "cursor-pointer border-2 transition-all hover:border-primary/50",
              pricingModel === "free_with_gate" && "border-green-500 bg-green-50 dark:bg-green-950/20"
            )}
            onClick={() => updateData("publish", { pricingModel: "free_with_gate", price: 0 })}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Free Download</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Grow your audience by requiring email signup
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      Collect email addresses
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      Build your mailing list
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500" />
                      Great for lead magnets
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paid Option */}
          <Card
            className={cn(
              "cursor-pointer border-2 transition-all hover:border-primary/50",
              pricingModel === "paid" && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            )}
            onClick={() => updateData("publish", { pricingModel: "paid", price: state.data.price || 5 })}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Paid Download</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sell your cheat sheet for a one-time price
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-blue-500" />
                      Instant revenue
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-blue-500" />
                      Secure Stripe checkout
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-blue-500" />
                      Automatic delivery
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Input (for paid) */}
        {pricingModel === "paid" && (
          <Card className="border-2 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-6">
              <Label htmlFor="price" className="text-lg font-semibold">
                Price (USD)
              </Label>
              <div className="relative max-w-xs mt-2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </div>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="1"
                  value={state.data.price || 5}
                  onChange={(e) =>
                    updateData("publish", {
                      price: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="pl-8 text-2xl font-bold h-14"
                  placeholder="5"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Set your price. You keep 90% after payment processing fees.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Preview Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="flex items-start gap-4">
              {state.data.thumbnail ? (
                <img
                  src={state.data.thumbnail}
                  alt="Cheat sheet thumbnail"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-lg">{state.data.title || "Untitled Cheat Sheet"}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {state.data.description || "No description"}
                </p>
                <p className={cn(
                  "text-lg font-bold mt-2",
                  pricingModel === "free_with_gate" ? "text-green-600" : "text-blue-600"
                )}>
                  {pricingModel === "free_with_gate" ? "Free" : `$${state.data.price || 5}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
