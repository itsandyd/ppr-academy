"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscribeCheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const planIdTyped = planId as Id<"subscriptionPlans">;
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const billingCycle = (searchParams.get("billing") as "monthly" | "yearly") || "monthly";
  
  const [loading, setLoading] = useState(false);

  const plan = useQuery(api.subscriptions.getSubscriptionPlanDetails, { planId: planIdTyped });
  const activeSubscription = useQuery(
    api.subscriptions.getActiveSubscription,
    user && plan?.storeId ? { userId: user.id, storeId: plan.storeId as Id<"stores"> } : "skip"
  );

  useEffect(() => {
    if (!user) {
      router.push("/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading subscription details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSubscription) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Already Subscribed</CardTitle>
            <CardDescription>
              You already have an active subscription to this creator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Current Plan: <strong>{activeSubscription.plan?.name}</strong>
            </p>
            <Button onClick={() => router.push("/library")} className="w-full">
              Go to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const priceDisplay = (price / 100).toFixed(2);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan._id,
          userId: user.id,
          userEmail: user.emailAddresses[0]?.emailAddress,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{plan.name}</h1>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.hasAllCourses && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">All Courses</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.courses?.length || 0} courses available now, plus all future courses
                      </p>
                    </div>
                  </div>
                )}
                {plan.hasAllProducts && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">All Digital Products</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.products?.length || 0} products available now, plus all future products
                      </p>
                    </div>
                  </div>
                )}
                {!plan.hasAllCourses && plan.courses && plan.courses.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Selected Courses</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {plan.courses.map((course: any) => (
                          <li key={course._id}>{course.title}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {!plan.hasAllProducts && plan.products && plan.products.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Selected Products</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {plan.products.map((product: any) => (
                          <li key={product._id}>{product.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {plan.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>{feature}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Checkout Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Subscription Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Billing Cycle */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Cycle</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={billingCycle === "monthly" ? "default" : "outline"}
                      onClick={() => router.push(`/subscribe/${planId}?billing=monthly`)}
                      className="w-full"
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={billingCycle === "yearly" ? "default" : "outline"}
                      onClick={() => router.push(`/subscribe/${planId}?billing=yearly`)}
                      className="w-full"
                    >
                      Yearly
                    </Button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {plan.name} ({billingCycle})
                    </span>
                    <span className="font-medium">${priceDisplay}</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Effective monthly</span>
                      <span className="text-green-600">
                        ${((plan.yearlyPrice / 100) / 12).toFixed(2)}/mo
                      </span>
                    </div>
                  )}
                  {plan.trialDays && plan.trialDays > 0 && (
                    <Badge variant="secondary" className="w-full justify-center">
                      {plan.trialDays}-day free trial included
                    </Badge>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-bold pt-4 border-t">
                  <span>
                    {plan.trialDays && plan.trialDays > 0 ? "After trial" : "Total"}
                  </span>
                  <span>${priceDisplay}/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : plan.trialDays && plan.trialDays > 0 ? (
                    "Start Free Trial"
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>

                {/* Terms */}
                <p className="text-xs text-muted-foreground text-center">
                  By subscribing, you agree to our Terms of Service and Privacy Policy.
                  Cancel anytime from your library.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

