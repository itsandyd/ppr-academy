"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Crown, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface PprProUpsellProps {
  variant?: "banner" | "inline" | "card";
  courseCount?: number;
  className?: string;
}

export function PprProUpsell({ variant = "banner", courseCount, className }: PprProUpsellProps) {
  const { user, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const pprProSubscription = useQuery(
    api.pprPro.getSubscription,
    user?.id ? { userId: user.id } : "skip"
  );

  const monthlyPlan = useQuery(api.pprPro.getPlanByInterval, { interval: "month" });

  // Don't show upsell if already a Pro member
  const isProMember =
    pprProSubscription?.status === "active" ||
    pprProSubscription?.status === "trialing";

  if (isProMember) return null;

  const planName = monthlyPlan?.name?.replace(/ Monthly$/, "") || "Pro";
  const monthlyPrice = monthlyPlan ? `$${(monthlyPlan.price / 100).toFixed(0)}/month` : "$12/month";

  const handleCheckout = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ppr-pro/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly", userId: user?.id }),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to start checkout");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3", className)}>
        <Crown className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Or get this {courseCount ? `+ ${courseCount} more courses` : "+ all courses"} for{" "}
          <span className="font-semibold text-foreground">{monthlyPrice}</span> with {planName}
        </p>
        <Button size="sm" variant="outline" className="ml-auto shrink-0" asChild>
          <Link href="/pricing">
            Go Pro
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6", className)}>
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Unlock Everything with {planName}</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Get unlimited access to every course for just {monthlyPrice}.
          {courseCount ? ` That's ${courseCount}+ courses and counting.` : " New courses added monthly."}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleCheckout} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Go {planName} — {monthlyPrice}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">
              Learn more
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Default: banner
  return (
    <div className={cn("rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Want access to all courses?
            </p>
            <p className="text-xs text-muted-foreground">
              Upgrade to {planName} for {monthlyPrice}
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/pricing">
            Upgrade to Pro
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * PPR Pro badge shown next to user name or in headers when user is a Pro member
 */
export function PprProBadge({ className }: { className?: string }) {
  const { user } = useUser();
  const pprProSubscription = useQuery(
    api.pprPro.getSubscription,
    user?.id ? { userId: user.id } : "skip"
  );

  const isProMember =
    pprProSubscription?.status === "active" ||
    pprProSubscription?.status === "trialing";

  if (!isProMember) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
        className
      )}
    >
      <Crown className="h-3 w-3" />
      PRO
    </span>
  );
}
