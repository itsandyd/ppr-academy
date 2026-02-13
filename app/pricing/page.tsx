"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, Zap, BookOpen, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const pprProSubscription = useQuery(
    api.pprPro.getSubscription,
    user?.id ? { userId: user.id } : "skip"
  );

  const isProMember =
    pprProSubscription?.status === "active" ||
    pprProSubscription?.status === "trialing";

  const handleProCheckout = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setIsLoading(billingCycle);
    try {
      const response = await fetch("/api/ppr-pro/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: billingCycle,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to start checkout");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const monthlyPrice = 12;
  const yearlyPrice = 108;
  const yearlySavings = monthlyPrice * 12 - yearlyPrice;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Learn Music Production
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose how you want to learn. Start free, buy individual courses, or unlock everything with PPR Pro.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <span
            className={cn(
              "text-sm font-medium cursor-pointer",
              billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"
            )}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              billingCycle === "yearly" ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform",
                billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium cursor-pointer",
              billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"
            )}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
          </span>
          {billingCycle === "yearly" && (
            <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Save ${yearlySavings}
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
          {/* Free Tier */}
          <Card className="relative flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl">Free</CardTitle>
              </div>
              <CardDescription>Browse and preview courses</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Browse the full course marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Preview free chapters</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Access free courses with email gate</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Community access</span>
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/marketplace/courses">
                    Get Started Free
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Course */}
          <Card className="relative flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-xl">Individual Course</CardTitle>
              </div>
              <CardDescription>Buy only what you need</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">$9</span>
                <span className="text-muted-foreground">/course</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Lifetime access to the course</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>All chapters and resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Certificate of completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>One-time payment, no subscription</span>
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/marketplace/courses">
                    Browse Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PPR Pro */}
          <Card className="relative flex flex-col border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Best Value
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">PPR Pro</CardTitle>
              </div>
              <CardDescription>Access every course on the platform</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">
                  ${billingCycle === "yearly" ? Math.round(yearlyPrice / 12) : monthlyPrice}
                </span>
                <span className="text-muted-foreground">/month</span>
                {billingCycle === "yearly" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Billed ${yearlyPrice}/year
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium">Access ALL courses on the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>New courses added monthly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Certificates of completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Early access to new content</span>
                </li>
              </ul>
              <div className="mt-auto pt-6">
                {isProMember ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleProCheckout}
                    disabled={!!isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Go Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground">Can I switch between monthly and yearly?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Yes! You can switch plans anytime from your account settings. If you switch from monthly to yearly, you'll receive credit for the remaining time on your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">What happens if I cancel PPR Pro?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You'll continue to have access until the end of your billing period. After that, you can still access any courses you've purchased individually.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Do I keep my progress if I cancel?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Yes, your learning progress and certificates are saved permanently. If you resubscribe, you'll pick up right where you left off.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Is there a free trial?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Many courses have free preview chapters so you can try before you buy. PPR Pro gives you instant access to everything.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
