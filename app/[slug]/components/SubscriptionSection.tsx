"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SubscriptionSectionProps {
  storeId: Id<"stores">;
  storeName: string;
}

export function SubscriptionSection({ storeId, storeName }: SubscriptionSectionProps) {
  const { user } = useUser();
  const router = useRouter();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<Record<string, "monthly" | "yearly">>({});
  
  const plans = useQuery(api.subscriptions.getSubscriptionPlans, { storeId });
  const activeSubscription = user
    ? useQuery(api.subscriptions.getActiveSubscription, {
        userId: user.id,
        storeId,
      })
    : null;

  if (!plans || plans.length === 0) {
    return null; // Don't show section if no plans
  }

  const handleSubscribe = async (planId: Id<"subscriptionPlans">) => {
    if (!user) {
      router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    const billingCycle = selectedBillingCycle[planId] || "monthly";

    try {
      // Navigate to checkout page
      router.push(`/subscribe/${planId}?billing=${billingCycle}`);
    } catch (error) {
      toast.error("Failed to start subscription checkout");
    }
  };

  const getBillingCycle = (planId: string) => selectedBillingCycle[planId] || "monthly";
  const setBillingCycle = (planId: string, cycle: "monthly" | "yearly") => {
    setSelectedBillingCycle((prev) => ({ ...prev, [planId]: cycle }));
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthly = (monthlyPrice / 100) * 12;
    const yearly = yearlyPrice / 100;
    if (monthly === 0) return 0;
    return Math.round(((monthly - yearly) / monthly) * 100);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Subscribe to {storeName}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get unlimited access to all content with a subscription plan
          </p>
          {activeSubscription && (
            <Badge variant="default" className="mt-4">
              You're subscribed to {activeSubscription.plan?.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isActive = activeSubscription?.planId === plan._id;
            const billingCycle = getBillingCycle(plan._id.toString());
            const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const priceDisplay = (price / 100).toFixed(2);
            const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);

            return (
              <Card
                key={plan._id}
                className={`flex flex-col relative ${
                  plan.tier === 2 ? "border-primary shadow-lg scale-105" : ""
                } ${isActive ? "opacity-60" : ""}`}
              >
                {plan.tier === 2 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-primary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  {/* Billing Toggle */}
                  <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => setBillingCycle(plan._id.toString(), "monthly")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        billingCycle === "monthly"
                          ? "bg-background shadow-sm"
                          : "hover:bg-background/50"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle(plan._id.toString(), "yearly")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        billingCycle === "yearly"
                          ? "bg-background shadow-sm"
                          : "hover:bg-background/50"
                      }`}
                    >
                      Yearly
                      {savings > 0 && (
                        <span className="ml-1 text-primary">(-{savings}%)</span>
                      )}
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">${priceDisplay}</span>
                      <span className="text-muted-foreground">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${((plan.yearlyPrice / 100) / 12).toFixed(2)}/month when billed yearly
                      </p>
                    )}
                    {plan.trialDays && plan.trialDays > 0 && !isActive && (
                      <Badge variant="secondary" className="mt-2">
                        {plan.trialDays}-day free trial
                      </Badge>
                    )}
                  </div>

                  {/* What's Included */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      What's Included
                    </p>
                    <div className="space-y-2">
                      {plan.hasAllCourses && (
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">All current and future courses</span>
                        </div>
                      )}
                      {plan.hasAllProducts && (
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">All current and future digital products</span>
                        </div>
                      )}
                      {!plan.hasAllCourses && plan.courseAccess.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Access to {plan.courseAccess.length} selected course{plan.courseAccess.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {!plan.hasAllProducts && plan.digitalProductAccess.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Access to {plan.digitalProductAccess.length} selected product{plan.digitalProductAccess.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSubscribe(plan._id)}
                    className="w-full"
                    variant={plan.tier === 2 ? "default" : "outline"}
                    disabled={isActive}
                  >
                    {isActive ? "Current Plan" : plan.trialDays ? "Start Free Trial" : "Subscribe Now"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </section>
  );
}

