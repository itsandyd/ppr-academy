"use client";

import { useTipJarCreation } from "../context";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Coffee, Heart, Check } from "lucide-react";

export function TipJarPublishForm() {
  const { state, updateData } = useTipJarCreation();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Ready to Launch?</h2>
          <p className="text-muted-foreground">
            Set your suggested tip amount and publish your tip jar
          </p>
        </div>

        {/* Suggested Amount Card */}
        <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Pay What You Want</h3>
                <p className="text-sm text-muted-foreground">
                  Supporters can tip any amount. You set the suggested default.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Fans choose how much to give
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  One-time support payments
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Instant Stripe checkout
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Thank supporters with a custom message
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="suggestedAmount" className="text-lg font-semibold">
                  Suggested Tip Amount (USD)
                </Label>
                <div className="relative max-w-xs mt-2">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </div>
                  <Input
                    id="suggestedAmount"
                    type="number"
                    min="1"
                    step="1"
                    value={state.data.suggestedAmount || "5"}
                    onChange={(e) =>
                      updateData("publish", {
                        suggestedAmount: Math.max(1, Number(e.target.value)).toString(),
                      })
                    }
                    className="pl-8 text-2xl font-bold h-14"
                    placeholder="5"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This is the default shown to supporters. They can adjust up or down.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="flex items-start gap-4">
              {state.data.thumbnail ? (
                <img
                  src={state.data.thumbnail}
                  alt="Tip jar thumbnail"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-lg">{state.data.title || "Untitled Tip Jar"}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {state.data.description || "No description"}
                </p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  ${state.data.suggestedAmount || "5"} suggested
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
