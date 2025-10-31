"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Crown,
  Sparkles,
  Check,
  X,
  Link as LinkIcon,
  BookOpen,
  Package,
  Mail,
  Zap,
  Globe,
  Calendar,
  BarChart3,
  Lock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: "creator" | "creator_pro";
  storeId?: string;
}

const FEATURE_INFO: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  courses: {
    title: "Host Courses",
    description: "Create and sell unlimited online courses with video lessons, quizzes, and certificates",
    icon: <BookOpen className="h-12 w-12" />,
  },
  products: {
    title: "Sell Digital Products",
    description: "Offer sample packs, presets, templates, and other digital downloads",
    icon: <Package className="h-12 w-12" />,
  },
  coaching: {
    title: "Offer Coaching",
    description: "Schedule 1-on-1 sessions, group calls, and provide personalized mentorship",
    icon: <Calendar className="h-12 w-12" />,
  },
  links: {
    title: "More Links",
    description: "Add more links to your bio page. Upgrade to get up to 20 links (or unlimited with Pro)",
    icon: <LinkIcon className="h-12 w-12" />,
  },
  email_campaigns: {
    title: "Email Campaigns",
    description: "Send broadcast emails to your audience and grow your community",
    icon: <Mail className="h-12 w-12" />,
  },
  automations: {
    title: "Email Automations",
    description: "Set up automated email sequences and workflows to nurture leads",
    icon: <Zap className="h-12 w-12" />,
  },
  custom_domain: {
    title: "Custom Domain",
    description: "Use your own domain name (yourbrand.com) instead of ppr-academy.com/yourname",
    icon: <Globe className="h-12 w-12" />,
  },
  social_scheduling: {
    title: "Social Media Scheduling",
    description: "Schedule and automate posts to Instagram, Twitter, and other platforms",
    icon: <Calendar className="h-12 w-12" />,
  },
  advanced_analytics: {
    title: "Advanced Analytics",
    description: "Get detailed insights into your audience, sales, and engagement",
    icon: <BarChart3 className="h-12 w-12" />,
  },
};

const PLAN_COMPARISON = {
  creator: {
    name: "Creator",
    price: 29,
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Up to 20 links",
      "Unlimited courses",
      "Unlimited products",
      "Coaching sessions",
      "Email campaigns (1K/mo)",
      "Social scheduling",
      "Advanced analytics",
    ],
  },
  creator_pro: {
    name: "Creator Pro",
    price: 99,
    icon: <Crown className="h-5 w-5" />,
    color: "from-yellow-500 to-orange-500",
    features: [
      "Unlimited links",
      "Unlimited courses",
      "Unlimited products",
      "Unlimited coaching",
      "Unlimited emails",
      "Email automations",
      "Custom domain",
      "Priority support",
    ],
  },
};

export function UpgradePrompt({
  isOpen,
  onClose,
  feature,
  requiredPlan,
  storeId,
}: UpgradePromptProps) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const featureInfo = FEATURE_INFO[feature] || {
    title: "Premium Feature",
    description: "This feature requires an upgrade",
    icon: <Lock className="h-12 w-12" />,
  };

  const planInfo = PLAN_COMPARISON[requiredPlan];
  const otherPlan =
    requiredPlan === "creator" ? PLAN_COMPARISON.creator_pro : PLAN_COMPARISON.creator;

  const handleUpgrade = async (plan: "creator" | "creator_pro", billingPeriod: "monthly" | "yearly") => {
    if (!storeId) {
      toast.error("Store ID is missing");
      return;
    }

    setIsUpgrading(plan);
    
    try {
      const response = await fetch("/api/creator-plans/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          plan,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast.error(error.message || "Failed to start upgrade process");
      setIsUpgrading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white dark:bg-black">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 text-primary">
              {featureInfo.icon}
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            Upgrade to Unlock {featureInfo.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {featureInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6 md:grid-cols-2">
          {/* Recommended Plan */}
          <Card className="relative overflow-hidden border-2 border-primary">
            <div className="absolute top-0 right-0">
              <Badge className="rounded-none rounded-bl-lg">Recommended</Badge>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${planInfo.color} text-white`}>
                  {planInfo.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{planInfo.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${planInfo.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    or ${planInfo.price * 10}/year (save 17%)
                  </p>
                </div>
                <ul className="space-y-2">
                  {planInfo.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleUpgrade(planInfo.name.toLowerCase().replace(" ", "_") as "creator" | "creator_pro", "monthly")}
                  disabled={!!isUpgrading}
                >
                  {isUpgrading === planInfo.name.toLowerCase().replace(" ", "_") ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to ${planInfo.name}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other Plan */}
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${otherPlan.color} text-white`}>
                  {otherPlan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{otherPlan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${otherPlan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    or ${otherPlan.price * 10}/year (save 17%)
                  </p>
                </div>
                <ul className="space-y-2">
                  {otherPlan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  size="lg"
                  onClick={() => handleUpgrade(otherPlan.name.toLowerCase().replace(" ", "_") as "creator" | "creator_pro", "monthly")}
                  disabled={!!isUpgrading}
                >
                  {isUpgrading === otherPlan.name.toLowerCase().replace(" ", "_") ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to ${otherPlan.name}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline upgrade banner component for feature gates
 */
export function UpgradeBanner({
  feature,
  requiredPlan,
  storeId,
}: {
  feature: string;
  requiredPlan: "creator" | "creator_pro";
  storeId?: string;
}) {
  const featureInfo = FEATURE_INFO[feature] || {
    title: "Premium Feature",
    description: "This feature requires an upgrade",
    icon: <Lock className="h-6 w-6" />,
  };

  const planInfo = PLAN_COMPARISON[requiredPlan];

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/30 to-muted/10">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-muted to-muted/50 text-primary">
            {featureInfo.icon}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{featureInfo.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{featureInfo.description}</p>
            <div className="flex items-center gap-4 pt-2">
              <Link href={storeId ? `/store/${storeId}/plan` : "/home"}>
                <Button size="sm" className="gap-2">
                  <div className={`flex items-center gap-1`}>
                    {planInfo.icon}
                    <span>Upgrade to {planInfo.name}</span>
                  </div>
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Starting at ${planInfo.price}/month
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

