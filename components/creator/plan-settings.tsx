"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Crown,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
  Package,
  Mail,
  Zap,
  Globe,
  BarChart3,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface PlanSettingsProps {
  storeId: Id<"stores">;
}

export function PlanSettings({ storeId }: PlanSettingsProps) {
  const { user } = useUser();
  const planData = useQuery(api.creatorPlans.getStorePlan, { storeId });
  const usageStats = useQuery(api.creatorPlans.getPlanUsageStats, { storeId });
  const storeData = useQuery(api.stores.getStoreById, { storeId });
  const updateVisibility = useMutation(api.creatorPlans.updateStoreVisibility);
  
  // Check if user is admin
  const adminStatus = useQuery(
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get isPublic from actual store data, not from plan status
  const isPublicFromDb = storeData?.isPublic ?? false;
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  console.log('Store data:', { 
    storeId, 
    isPublic: storeData?.isPublic, 
    isPublishedProfile: storeData?.isPublishedProfile,
    plan: storeData?.plan 
  });

  if (!planData || !usageStats || !storeData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  const isAdmin = adminStatus?.isAdmin === true;

  const handleVisibilityToggle = async (checked: boolean) => {
    try {
      console.log('Updating visibility to:', checked);
      const result = await updateVisibility({
        storeId,
        isPublic: checked,
        isPublishedProfile: checked,
        clerkId: user?.id,
      });
      
      console.log('Update result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast.success(result.message);
    } catch (error: any) {
      console.error('Visibility toggle error:', error);
      toast.error(error.message || "Failed to update visibility");
    }
  };

  const handleUpgrade = async (targetPlan: "creator" | "creator_pro", billingPeriod: "monthly" | "yearly" = "monthly") => {
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/creator-plans/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          plan: targetPlan,
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
      setIsUpgrading(false);
    }
  };

  const currentPlan = planData.pricing;
  const limits = planData.limits;

  return (
    <div className="space-y-6">
      {/* Current Plan Header */}
      <Card className="border-2 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                {planData.plan === "creator_pro" && <Crown className="h-6 w-6 text-yellow-500" />}
                {planData.plan === "creator" && <Sparkles className="h-6 w-6 text-blue-500" />}
                {currentPlan.name} Plan
              </CardTitle>
              <CardDescription>{currentPlan.description}</CardDescription>
            </div>
            <Badge variant={planData.isActive ? "default" : "destructive"} className="text-lg px-4 py-2">
              {planData.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                ${planData.plan === "free" ? "0" : (currentPlan.monthlyPrice / 100).toFixed(0)}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              {planData.plan !== "free" && (
                <p className="text-sm text-muted-foreground mt-1">
                  or ${(currentPlan.yearlyPrice / 100).toFixed(0)}/year (save{" "}
                  {Math.round((1 - currentPlan.yearlyPrice / 12 / currentPlan.monthlyPrice) * 100)}%)
                </p>
              )}
            </div>
            {planData.plan !== "creator_pro" && (
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => handleUpgrade(planData.plan === "free" ? "creator" : "creator_pro")}
                disabled={isUpgrading}
              >
                {isUpgrading ? "Processing..." : "Upgrade"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPublicFromDb ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            Profile Visibility
            {isAdmin && <Badge variant="secondary" className="ml-2"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
          </CardTitle>
          <CardDescription>
            Control whether your creator profile appears in the public marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-profile" className="text-base">
                Make Profile Public
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublicFromDb
                  ? "Your profile is visible to everyone on the marketplace"
                  : "Your profile is private and only accessible via direct link"}
              </p>
            </div>
            <Switch
              id="public-profile"
              checked={isPublicFromDb}
              onCheckedChange={handleVisibilityToggle}
              disabled={!isAdmin && planData.plan === "free"}
            />
          </div>

          {!isAdmin && planData.plan === "free" && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Upgrade to Go Public</p>
                <p className="text-xs text-muted-foreground">
                  Public profile visibility is available on Creator and Creator Pro plans
                </p>
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Admin Access</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  You have admin privileges and can bypass all plan restrictions
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
          <CardDescription>Track your usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Links */}
          <UsageBar
            icon={<LinkIcon className="h-4 w-4" />}
            label="Links"
            current={usageStats.usage.links.current}
            limit={usageStats.usage.links.limit}
          />

          {/* Courses */}
          <UsageBar
            icon={<BookOpen className="h-4 w-4" />}
            label="Courses"
            current={usageStats.usage.courses.current}
            limit={usageStats.usage.courses.limit}
          />

          {/* Products */}
          <UsageBar
            icon={<Package className="h-4 w-4" />}
            label="Digital Products"
            current={usageStats.usage.products.current}
            limit={usageStats.usage.products.limit}
          />

          {/* Email Sends */}
          <UsageBar
            icon={<Mail className="h-4 w-4" />}
            label="Email Sends (This Month)"
            current={usageStats.usage.emailsSentThisMonth.current}
            limit={usageStats.usage.emailsSentThisMonth.limit}
          />
        </CardContent>
      </Card>

      {/* Available Plans Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Plans</CardTitle>
          <CardDescription>See what's available at each tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <PlanCard
              name="Free"
              price={0}
              description="Perfect for getting started"
              features={[
                "5 custom links",
                "3 courses",
                "3 digital products",
                "10 coaching sessions",
                "100 emails/month",
                "Basic analytics",
              ]}
              current={planData.plan === "free"}
              onUpgrade={() => {}}
              isUpgrading={isUpgrading}
            />
            <PlanCard
              name="Creator"
              price={29}
              description="For creators ready to monetize"
              features={[
                "20 custom links",
                "Unlimited courses",
                "Unlimited products",
                "Unlimited coaching",
                "Email campaigns (1K/mo)",
                "Social scheduling",
                "Advanced analytics",
              ]}
              current={planData.plan === "creator"}
              popular
              onUpgrade={() => handleUpgrade("creator")}
              isUpgrading={isUpgrading}
            />
            <PlanCard
              name="Creator Pro"
              price={99}
              description="Full power for professionals"
              features={[
                "Unlimited links",
                "Unlimited emails",
                "Email automations",
                "Custom domain",
                "Priority support",
                "Advanced integrations",
              ]}
              current={planData.plan === "creator_pro"}
              onUpgrade={() => handleUpgrade("creator_pro")}
              isUpgrading={isUpgrading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageBar({
  icon,
  label,
  current,
  limit,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const isAtLimit = !isUnlimited && current >= limit;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current} {isUnlimited ? "" : `/ ${limit}`}
          {isUnlimited && <Badge variant="secondary" className="ml-2">Unlimited</Badge>}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${isAtLimit ? "bg-destructive/20" : ""}`}
        />
      )}
      {isAtLimit && (
        <p className="text-xs text-destructive">
          You've reached your limit. Upgrade to add more.
        </p>
      )}
    </div>
  );
}

function PlanCard({
  name,
  price,
  description,
  features,
  current = false,
  popular = false,
  onUpgrade,
  isUpgrading = false,
}: {
  name: string;
  price: number;
  description: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
  onUpgrade: () => void;
  isUpgrading?: boolean;
}) {
  return (
    <Card className={`relative ${popular ? "border-2 border-primary" : ""} ${current ? "bg-muted/50" : ""}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">Most Popular</Badge>
        </div>
      )}
      {current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary">Current Plan</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="pt-4">
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full mt-6"
          variant={current ? "outline" : "default"}
          disabled={current || isUpgrading}
          onClick={onUpgrade}
        >
          {current ? "Current Plan" : isUpgrading ? "Processing..." : "Upgrade"}
        </Button>
      </CardContent>
    </Card>
  );
}

