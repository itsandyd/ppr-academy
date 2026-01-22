"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Download,
  CreditCard,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Zap,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustSignal {
  icon: React.ElementType;
  title: string;
  description: string;
}

const trustSignals: TrustSignal[] = [
  {
    icon: Download,
    title: "Instant Access",
    description: "Get immediate access to all purchases",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Protected by Stripe encryption",
  },
  {
    icon: CreditCard,
    title: "Money Back",
    description: "30-day satisfaction guarantee",
  },
  {
    icon: HeartHandshake,
    title: "Creator Support",
    description: "Direct support from the creator",
  },
];

interface TrustSignalsProps {
  variant?: "compact" | "full" | "minimal";
  className?: string;
}

/**
 * TrustSignals - Displays trust badges and guarantees
 * Helps build credibility and reduce purchase anxiety
 */
export function TrustSignals({ variant = "compact", className }: TrustSignalsProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center gap-6 text-xs text-muted-foreground", className)}>
        {trustSignals.slice(0, 3).map((signal) => (
          <span key={signal.title} className="flex items-center gap-1.5">
            <signal.icon className="h-3.5 w-3.5 text-emerald-500" />
            {signal.title}
          </span>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
        {trustSignals.map((signal) => (
          <div
            key={signal.title}
            className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
              <signal.icon className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-sm font-medium">{signal.title}</span>
          </div>
        ))}
      </div>
    );
  }

  // Full variant
  return (
    <Card className={cn("border-emerald-500/20 bg-emerald-500/5", className)}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold">Shop with Confidence</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {trustSignals.map((signal) => (
            <div key={signal.title} className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <signal.icon className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-sm font-medium">{signal.title}</span>
              <span className="text-xs text-muted-foreground">{signal.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SocialProofProps {
  totalSales?: number;
  totalStudents?: number;
  totalProducts?: number;
  rating?: number;
  className?: string;
}

/**
 * SocialProof - Displays social proof metrics
 * Shows sales counts, student numbers, and ratings
 */
export function SocialProof({
  totalSales = 0,
  totalStudents = 0,
  totalProducts = 0,
  rating,
  className,
}: SocialProofProps) {
  const metrics = [
    totalSales > 0 && {
      value: totalSales,
      label: "Sales",
      icon: Zap,
    },
    totalStudents > 0 && {
      value: totalStudents,
      label: "Students",
      icon: Users,
    },
    totalProducts > 0 && {
      value: totalProducts,
      label: "Products",
      icon: Download,
    },
    rating && {
      value: rating.toFixed(1),
      label: "Rating",
      icon: Star,
    },
  ].filter(Boolean);

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      {metrics.map((metric: any) => (
        <div key={metric.label} className="flex items-center gap-2">
          <metric.icon className="h-4 w-4 text-muted-foreground" />
          <div className="text-center">
            <span className="font-bold">{metric.value}</span>
            <span className="ml-1 text-xs text-muted-foreground">{metric.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface VerifiedCreatorBadgeProps {
  creatorName: string;
  className?: string;
}

/**
 * VerifiedCreatorBadge - Shows creator verification status
 */
export function VerifiedCreatorBadge({ creatorName, className }: VerifiedCreatorBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3" />
      Verified Creator
    </Badge>
  );
}

interface RecentActivityProps {
  activities: Array<{
    type: "purchase" | "enrollment" | "review";
    name: string;
    product: string;
    time: string;
  }>;
  className?: string;
}

/**
 * RecentActivity - Shows recent purchases/enrollments for social proof
 */
export function RecentActivity({ activities, className }: RecentActivityProps) {
  if (activities.length === 0) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return Download;
      case "enrollment":
        return Users;
      case "review":
        return Star;
      default:
        return Zap;
    }
  };

  const getActivityVerb = (type: string) => {
    switch (type) {
      case "purchase":
        return "purchased";
      case "enrollment":
        return "enrolled in";
      case "review":
        return "reviewed";
      default:
        return "got";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {activities.slice(0, 3).map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        return (
          <div
            key={index}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>
              <span className="font-medium">{activity.name}</span>
              <span className="text-muted-foreground">
                {" "}
                {getActivityVerb(activity.type)}{" "}
              </span>
              <span className="font-medium">{activity.product}</span>
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{activity.time}</span>
          </div>
        );
      })}
    </div>
  );
}
