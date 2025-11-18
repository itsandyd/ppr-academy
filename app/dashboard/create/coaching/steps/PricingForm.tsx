"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PricingForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveCoaching();
    // If free, go to follow gate; if paid, go to discord
    const nextStep = state.data.pricingModel === 'free_with_gate' ? 'followGate' : 'discord';
    router.push(`/dashboard/create/coaching?step=${nextStep}${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const handleBack = () => {
    router.push(`/dashboard/create/coaching?step=basics${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const canProceed = !!state.data.pricingModel;

  // Suggested pricing based on session type and duration
  const suggestedPricing = {
    'production-coaching': { min: 50, max: 150, rate: state.data.duration || 60 },
    'mixing-service': { min: 100, max: 300, rate: 'per track' },
    'mastering-service': { min: 50, max: 150, rate: 'per track' },
    'feedback-session': { min: 25, max: 75, rate: state.data.duration || 30 },
    'custom': { min: 50, max: 200, rate: state.data.duration || 60 },
  };

  const suggested = suggestedPricing[state.data.sessionType as keyof typeof suggestedPricing] || suggestedPricing.custom;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pricing Model</h2>
        <p className="text-muted-foreground mt-1">
          Choose how you want to offer your coaching sessions
        </p>
      </div>

      {/* Pricing Model Selection */}
      <div className="grid md:grid-cols-2 gap-4">
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
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Free Session</CardTitle>
                <CardDescription>Build portfolio & get testimonials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Great for building credibility</li>
              <li>• Collect testimonials</li>
              <li>• Lead generation</li>
              <li>• Can require email/social follows</li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            state.data.pricingModel === "paid"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:border-primary/50"
          }`}
          onClick={() => updateData("pricing", { pricingModel: "paid", price: state.data.price || "50" })}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Paid Session</CardTitle>
                <CardDescription>Charge for your expertise</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Direct revenue</li>
              <li>• Professional service</li>
              <li>• Instant Stripe payouts</li>
              <li>• Set your own rates</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Pricing (if paid) */}
      {state.data.pricingModel === "paid" && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Market Rate</h4>
              <p className="text-sm text-muted-foreground">
                Similar {state.data.sessionType?.replace('-', ' ')} sessions typically range from 
                <strong className="text-foreground"> ${suggested.min} - ${suggested.max}</strong>
                {typeof suggested.rate === 'number' && ` for ${suggested.rate} minutes`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Price Input (only for paid) */}
      {state.data.pricingModel === "paid" && (
        <Card>
        <CardHeader>
          <CardTitle>Your Price *</CardTitle>
          <CardDescription>
            {state.data.sessionType === 'mixing-service' || state.data.sessionType === 'mastering-service'
              ? 'Price per track'
              : `Price for ${state.data.duration || 60} minute session`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative max-w-xs">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                $
              </div>
              <Input
                type="number"
                min="0"
                step="5"
                value={state.data.price || ""}
                onChange={(e) => updateData("pricing", { price: e.target.value })}
                className="pl-8 text-2xl font-bold h-14 bg-background"
                placeholder="50"
              />
            </div>

            {state.data.price && parseFloat(state.data.price) > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your earnings (after fees)</span>
                  <span className="font-semibold">~${(parseFloat(state.data.price) * 0.97).toFixed(2)}</span>
                </div>
                {state.data.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hourly rate</span>
                    <span className="font-semibold">
                      ${((parseFloat(state.data.price) / state.data.duration) * 60).toFixed(2)}/hour
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Quick Pricing Buttons (only for paid) */}
      {state.data.pricingModel === "paid" && (
        <Card>
        <CardHeader>
          <CardTitle>Quick Select</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[25, 50, 75, 100, 150, 200].map((price) => (
              <Button
                key={price}
                variant={state.data.price === price.toString() ? "default" : "outline"}
                onClick={() => updateData("pricing", { price: price.toString() })}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <div className="font-bold">${price}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Free Session Info */}
      {state.data.pricingModel === "free_with_gate" && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Free Session Strategy</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Offering free sessions is a great way to build your portfolio and get testimonials. 
                  You can require students to follow you on social media in the next step.
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Perfect for new coaches building credibility</li>
                  <li>✓ Collect testimonials and case studies</li>
                  <li>✓ Grow your email list and social following</li>
                  <li>✓ Can upgrade to paid later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Discord Setup →
        </Button>
      </div>
    </div>
  );
}

