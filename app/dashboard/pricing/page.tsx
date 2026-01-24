"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  BookOpen,
  Package,
  Users,
  BarChart3,
  Palette,
  Mail,
  Globe,
  Headphones,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
  Link as LinkIcon,
  Calendar,
  Workflow,
  Rocket,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type PlanKey = "free" | "starter" | "creator" | "creator_pro" | "business";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const { user } = useUser();
  const searchParams = useSearchParams();

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success("Welcome to your new plan! Your subscription is now active.", {
        duration: 5000,
      });
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/pricing");
    } else if (canceled === "true") {
      toast.info("Checkout was canceled. No charges were made.");
      window.history.replaceState({}, "", "/dashboard/pricing");
    }
  }, [searchParams]);

  // Get user's store and current plan
  const userStores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const currentStore = userStores?.[0];
  const currentPlan = currentStore?.plan || "free";

  const handleUpgrade = async (plan: PlanKey) => {
    if (!currentStore?._id) {
      toast.error("Please set up your store first");
      return;
    }

    if (plan === "free") {
      return; // Can't upgrade to free
    }

    setIsUpgrading(plan);

    try {
      const response = await fetch("/api/creator-plans/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStore._id,
          plan,
          billingPeriod: isAnnual ? "yearly" : "monthly",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast.error(error.message || "Failed to start upgrade process");
    } finally {
      setIsUpgrading(null);
    }
  };

  // Pricing (in dollars)
  const plans = {
    free: {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      description: "Simple link-in-bio page",
      icon: Zap,
      color: "bg-muted",
      iconColor: "text-muted-foreground",
      features: [
        { text: "Up to 5 links", included: true },
        { text: "Custom profile page", included: true },
        { text: "Basic link analytics", included: true },
        { text: "Community support", included: true },
        { text: "Platform branding shown", included: true, highlight: "note" },
        { text: "Products & courses", included: false },
        { text: "Email campaigns", included: false },
        { text: "Social scheduling", included: false },
        { text: "Follow gates", included: false },
      ],
    },
    starter: {
      name: "Starter",
      monthlyPrice: 12,
      annualPrice: 9,
      description: "Start selling your products",
      icon: Rocket,
      color: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-600",
      features: [
        { text: "Up to 15 links", included: true },
        { text: "Up to 10 paid products", included: true },
        { text: "Up to 5 paid courses", included: true },
        { text: "Sell paid products", included: true, highlight: "new" },
        { text: "Email campaigns (500/mo)", included: true },
        { text: "Basic analytics", included: true },
        { text: "Email support", included: true },
        { text: "Platform branding shown", included: true, highlight: "note" },
        { text: "Social scheduling", included: false },
        { text: "Follow gates", included: false },
      ],
    },
    creator: {
      name: "Creator",
      monthlyPrice: 29,
      annualPrice: 24,
      description: "For serious creators",
      icon: Sparkles,
      color: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-600",
      popular: true,
      features: [
        { text: "Up to 50 links", included: true },
        { text: "Up to 30 products", included: true },
        { text: "Up to 15 courses", included: true },
        { text: "Email campaigns (2,500/mo)", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Social media scheduling", included: true },
        { text: "Follow gates", included: true },
        { text: "No platform branding", included: true, highlight: "good" },
        { text: "Priority email support", included: true },
        { text: "Email automations", included: false },
        { text: "Custom domain", included: false },
      ],
    },
    creator_pro: {
      name: "Pro",
      monthlyPrice: 79,
      annualPrice: 59,
      description: "Full power for professionals",
      icon: Crown,
      color: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-600",
      features: [
        { text: "Unlimited links", included: true },
        { text: "Unlimited products", included: true },
        { text: "Unlimited courses", included: true },
        { text: "Email campaigns (10,000/mo)", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Social media scheduling", included: true },
        { text: "Follow gates", included: true },
        { text: "No platform branding", included: true, highlight: "good" },
        { text: "Email automations", included: true },
        { text: "Custom domain", included: true },
        { text: "API access", included: true },
        { text: "Priority support", included: true },
      ],
    },
    business: {
      name: "Business",
      monthlyPrice: 149,
      annualPrice: 119,
      description: "For teams and agencies",
      icon: Building2,
      color: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-600",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Unlimited email sends", included: true },
        { text: "Team collaboration (10 members)", included: true },
        { text: "White-label options", included: true },
        { text: "Advanced integrations", included: true },
        { text: "SLA guarantee", included: true },
        { text: "Dedicated success manager", included: true },
      ],
    },
  };

  const getPrice = (plan: PlanKey) => {
    return isAnnual ? plans[plan].annualPrice : plans[plan].monthlyPrice;
  };

  const isCurrentPlan = (planKey: string) => {
    return currentPlan === planKey || (currentPlan === "early_access" && planKey === "creator_pro");
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Sparkles className="mr-1 h-3 w-3" />
          Creator Plans
        </Badge>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Choose the Right Plan for Your Business
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start for free and upgrade as you grow. Build your creator business with powerful tools to sell courses, sample packs, and more.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? "bg-purple-500" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
          </span>
          {isAnnual && (
            <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600">
              Save up to 25%
            </Badge>
          )}
        </div>
      </div>

      {/* Current Plan Banner */}
      {currentPlan && currentPlan !== "free" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Crown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">
                  You're on the {currentPlan === "early_access" ? "Early Access" : plans[currentPlan as PlanKey]?.name || currentPlan} Plan
                </h4>
                <p className="text-sm text-muted-foreground">
                  {currentPlan === "early_access"
                    ? "Enjoy unlimited access as an early supporter!"
                    : "Enjoy all your premium features"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Free Plan */}
        <Card className={`relative ${isCurrentPlan("free") ? "border-primary/30 bg-primary/5" : "border-border"}`}>
          {isCurrentPlan("free") && (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Current
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${plans.free.color}`}>
                <Zap className={`h-5 w-5 ${plans.free.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{plans.free.name}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">{plans.free.description}</CardDescription>
            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {plans.free.features.slice(0, 6).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className={`h-4 w-4 mt-0.5 ${feature.highlight === "note" ? "text-orange-500" : "text-green-500"}`} />
                  ) : (
                    <X className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span className={`text-xs ${!feature.included ? "text-muted-foreground" : ""}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant={isCurrentPlan("free") ? "outline" : "default"}
              className="w-full text-sm"
              size="sm"
              disabled={isCurrentPlan("free")}
            >
              {isCurrentPlan("free") ? "Current" : "Get Started"}
            </Button>
          </CardContent>
        </Card>

        {/* Starter Plan */}
        <Card className={`relative ${isCurrentPlan("starter") ? "border-primary/30 bg-primary/5" : "border-border"} ${plans.starter.color}`}>
          {isCurrentPlan("starter") && (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Current
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Rocket className={`h-5 w-5 ${plans.starter.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{plans.starter.name}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">{plans.starter.description}</CardDescription>
            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${getPrice("starter")}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              {isAnnual && (
                <p className="text-xs text-muted-foreground">Billed annually</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {plans.starter.features.slice(0, 6).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className={`h-4 w-4 mt-0.5 ${feature.highlight === "note" ? "text-orange-500" : "text-green-500"}`} />
                  ) : (
                    <X className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span className={`text-xs ${!feature.included ? "text-muted-foreground" : ""}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
            <Button
              className={`w-full text-sm ${!isCurrentPlan("starter") ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white" : ""}`}
              variant={isCurrentPlan("starter") ? "outline" : "default"}
              size="sm"
              disabled={isCurrentPlan("starter") || isUpgrading === "starter"}
              onClick={() => handleUpgrade("starter")}
            >
              {isUpgrading === "starter" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : isCurrentPlan("starter") ? "Current" : "Upgrade"}
            </Button>
          </CardContent>
        </Card>

        {/* Creator Plan */}
        <Card className={`relative ${plans.creator.popular ? "border-blue-500/50 ring-2 ring-blue-500/20" : ""} ${plans.creator.color}`}>
          {plans.creator.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs">
                <Star className="mr-1 h-3 w-3" />
                Popular
              </Badge>
            </div>
          )}
          {isCurrentPlan("creator") && (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Current
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Sparkles className={`h-5 w-5 ${plans.creator.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{plans.creator.name}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">{plans.creator.description}</CardDescription>
            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${getPrice("creator")}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              {isAnnual && (
                <p className="text-xs text-muted-foreground">Save 17%</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {plans.creator.features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className={`h-4 w-4 mt-0.5 ${feature.highlight === "good" ? "text-green-500" : "text-blue-500"}`} />
                  ) : (
                    <X className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span className={`text-xs ${!feature.included ? "text-muted-foreground" : ""}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
            <Button
              className={`w-full text-sm ${!isCurrentPlan("creator") ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white" : ""}`}
              variant={isCurrentPlan("creator") ? "outline" : "default"}
              size="sm"
              disabled={isCurrentPlan("creator") || isUpgrading === "creator"}
              onClick={() => handleUpgrade("creator")}
            >
              {isUpgrading === "creator" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : isCurrentPlan("creator") ? "Current" : "Upgrade"}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative border-purple-500/30 ${plans.creator_pro.color}`}>
          {isCurrentPlan("creator_pro") && (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Current
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Crown className={`h-5 w-5 ${plans.creator_pro.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{plans.creator_pro.name}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">{plans.creator_pro.description}</CardDescription>
            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${getPrice("creator_pro")}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              {isAnnual && (
                <p className="text-xs text-muted-foreground">Save 25%</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {plans.creator_pro.features.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className={`h-4 w-4 mt-0.5 ${feature.highlight === "good" ? "text-green-500" : "text-purple-500"}`} />
                  ) : (
                    <X className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  )}
                  <span className={`text-xs ${!feature.included ? "text-muted-foreground" : ""}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
            <Button
              className={`w-full text-sm ${!isCurrentPlan("creator_pro") ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" : ""}`}
              variant={isCurrentPlan("creator_pro") ? "outline" : "default"}
              size="sm"
              disabled={isCurrentPlan("creator_pro") || isUpgrading === "creator_pro"}
              onClick={() => handleUpgrade("creator_pro")}
            >
              {isUpgrading === "creator_pro" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : isCurrentPlan("creator_pro") ? "Current" : "Upgrade"}
            </Button>
          </CardContent>
        </Card>

        {/* Business Plan */}
        <Card className={`relative border-orange-500/30 ${plans.business.color}`}>
          {isCurrentPlan("business") && (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Current
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Building2 className={`h-5 w-5 ${plans.business.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{plans.business.name}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">{plans.business.description}</CardDescription>
            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">${getPrice("business")}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              {isAnnual && (
                <p className="text-xs text-muted-foreground">Save 20%</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {plans.business.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-orange-500" />
                  <span className="text-xs">{feature.text}</span>
                </div>
              ))}
            </div>
            <Button
              className={`w-full text-sm ${!isCurrentPlan("business") ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" : ""}`}
              variant={isCurrentPlan("business") ? "outline" : "default"}
              size="sm"
              disabled={isCurrentPlan("business") || isUpgrading === "business"}
              onClick={() => handleUpgrade("business")}
            >
              {isUpgrading === "business" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : isCurrentPlan("business") ? "Current" : "Upgrade"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feature Comparison</CardTitle>
          <CardDescription>See exactly what's included in each plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold">Feature</th>
                  <th className="text-center py-3 px-2 font-semibold">Free</th>
                  <th className="text-center py-3 px-2 font-semibold bg-green-500/5">Starter</th>
                  <th className="text-center py-3 px-2 font-semibold bg-blue-500/5">Creator</th>
                  <th className="text-center py-3 px-2 font-semibold bg-purple-500/5">Pro</th>
                  <th className="text-center py-3 px-2 font-semibold bg-orange-500/5">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <ComparisonRow
                  icon={LinkIcon}
                  feature="Links"
                  free="5"
                  starter="15"
                  creator="50"
                  pro="Unlimited"
                  business="Unlimited"
                />
                <ComparisonRow
                  icon={Package}
                  feature="Products"
                  free={false}
                  starter="10"
                  creator="30"
                  pro="Unlimited"
                  business="Unlimited"
                />
                <ComparisonRow
                  icon={BookOpen}
                  feature="Courses"
                  free={false}
                  starter="5"
                  creator="15"
                  pro="Unlimited"
                  business="Unlimited"
                />
                <ComparisonRow
                  icon={Mail}
                  feature="Emails/mo"
                  free={false}
                  starter="500"
                  creator="2,500"
                  pro="10,000"
                  business="Unlimited"
                />
                <ComparisonRow
                  icon={Workflow}
                  feature="Email Automations"
                  free={false}
                  starter={false}
                  creator={false}
                  pro={true}
                  business={true}
                />
                <ComparisonRow
                  icon={Calendar}
                  feature="Social Scheduling"
                  free={false}
                  starter={false}
                  creator={true}
                  pro={true}
                  business={true}
                />
                <ComparisonRow
                  icon={Users}
                  feature="Follow Gates"
                  free={false}
                  starter={false}
                  creator={true}
                  pro={true}
                  business={true}
                />
                <ComparisonRow
                  icon={Palette}
                  feature="Custom Branding"
                  free={false}
                  starter={false}
                  creator={true}
                  pro={true}
                  business={true}
                />
                <ComparisonRow
                  icon={Globe}
                  feature="Custom Domain"
                  free={false}
                  starter={false}
                  creator={false}
                  pro={true}
                  business={true}
                />
                <ComparisonRow
                  icon={Users}
                  feature="Team Members"
                  free="1"
                  starter="1"
                  creator="1"
                  pro="2"
                  business="10"
                />
                <ComparisonRow
                  icon={BarChart3}
                  feature="Analytics"
                  free="Basic"
                  starter="Basic"
                  creator="Advanced"
                  pro="Advanced"
                  business="Advanced"
                />
                <ComparisonRow
                  icon={Headphones}
                  feature="Support"
                  free="Community"
                  starter="Email"
                  creator="Priority"
                  pro="Priority"
                  business="Dedicated"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Keep 90% of Sales</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Only 10% platform fee on transactions. Keep more of what you earn.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">14-Day Free Trial</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Try any paid plan free for 14 days. Cancel anytime.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">No Lock-in</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade, downgrade, or cancel anytime. Your content stays yours.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">What happens if I reach my product limit?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You'll see a prompt to upgrade to the next tier. Your existing products remain active, you just can't create new ones until you upgrade.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Can I switch plans anytime?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Yes! Upgrade instantly or downgrade at the end of your billing period. Pro-rated credits apply when upgrading.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm">What's the 10% platform fee?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              We take 10% of each sale you make (+ Stripe processing fees ~2.9%). This applies to all plans equally. You keep 90% of your revenue.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      {currentPlan === "free" && (
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10">
          <CardContent className="p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Ready to grow your creator business?</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Start with Starter at just $12/mo or go all-in with Creator for serious growth.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                disabled={isUpgrading === "starter"}
                onClick={() => handleUpgrade("starter")}
              >
                {isUpgrading === "starter" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  `Start with Starter - $${isAnnual ? "9" : "12"}/mo`
                )}
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                disabled={isUpgrading === "creator"}
                onClick={() => handleUpgrade("creator")}
              >
                {isUpgrading === "creator" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <>
                    Go Creator - ${isAnnual ? "24" : "29"}/mo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for comparison table rows
function ComparisonRow({
  icon: Icon,
  feature,
  free,
  starter,
  creator,
  pro,
  business,
}: {
  icon: React.ComponentType<{ className?: string }>;
  feature: string;
  free: string | boolean;
  starter: string | boolean;
  creator: string | boolean;
  pro: string | boolean;
  business: string | boolean;
}) {
  const renderCell = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-4 w-4 text-green-600 mx-auto" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-xs">{value}</span>;
  };

  return (
    <tr>
      <td className="py-2 px-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">{feature}</span>
        </div>
      </td>
      <td className="py-2 px-2 text-center">
        {renderCell(free)}
      </td>
      <td className="py-2 px-2 text-center bg-green-500/5">
        {renderCell(starter)}
      </td>
      <td className="py-2 px-2 text-center bg-blue-500/5">
        {renderCell(creator)}
      </td>
      <td className="py-2 px-2 text-center bg-purple-500/5">
        {renderCell(pro)}
      </td>
      <td className="py-2 px-2 text-center bg-orange-500/5">
        {renderCell(business)}
      </td>
    </tr>
  );
}
