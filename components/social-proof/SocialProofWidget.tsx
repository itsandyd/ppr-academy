"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Users, Star, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SocialProofWidgetProps {
  type: "course" | "product";
  id: string;
  variant?: "inline" | "badge" | "full";
  className?: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return "recently";
}

function anonymizeName(firstName?: string): string {
  if (!firstName) return "Someone";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

export function SocialProofWidget({ type, id, variant = "full", className }: SocialProofWidgetProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationIndex, setNotificationIndex] = useState(0);

  const courseProof = useQuery(
    api.storeStats.getCourseSocialProof,
    type === "course" ? { courseId: id as Id<"courses"> } : "skip"
  );

  const productProof = useQuery(
    api.storeStats.getProductSocialProof,
    type === "product" ? { productId: id as Id<"digitalProducts"> } : "skip"
  );

  const proof = type === "course" ? courseProof : productProof;

  // Cycle through recent enrollments/purchases for live notifications
  useEffect(() => {
    if (!proof || variant !== "full") return;

    const recentItems = type === "course"
      ? (proof as typeof courseProof)?.recentEnrollments
      : (proof as typeof productProof)?.recentPurchases;

    if (!recentItems || recentItems.length === 0) return;

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(() => {
      setShowNotification(true);
    }, 3000);

    // Rotate through notifications every 8 seconds
    const interval = setInterval(() => {
      setShowNotification(false);
      setTimeout(() => {
        setNotificationIndex(prev => (prev + 1) % recentItems.length);
        setShowNotification(true);
      }, 500);
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [proof, type, variant]);

  if (!proof) return null;

  const totalCount = type === "course"
    ? (proof as typeof courseProof)?.totalEnrollments || 0
    : (proof as typeof productProof)?.totalPurchases || 0;

  const weeklyCount = type === "course"
    ? (proof as typeof courseProof)?.enrollmentsThisWeek || 0
    : (proof as typeof productProof)?.purchasesThisWeek || 0;

  const recentItems = type === "course"
    ? (proof as typeof courseProof)?.recentEnrollments || []
    : (proof as typeof productProof)?.recentPurchases || [];

  const rating = proof?.averageRating || 4.8;
  const reviewCount = proof?.totalReviews || 0;

  // Badge variant - just shows key stats
  if (variant === "badge") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {totalCount > 0 && (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            <Users className="mr-1 h-3 w-3" />
            {totalCount} {type === "course" ? "enrolled" : "sold"}
          </Badge>
        )}
        {weeklyCount > 0 && (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            {weeklyCount} this week
          </Badge>
        )}
      </div>
    );
  }

  // Inline variant - compact stats row
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", className)}>
        {totalCount > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {totalCount.toLocaleString()} {type === "course" ? "students" : "purchases"}
          </span>
        )}
        {rating > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            {rating} {reviewCount > 0 && `(${reviewCount})`}
          </span>
        )}
        {weeklyCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <TrendingUp className="h-4 w-4" />
            {weeklyCount} this week
          </span>
        )}
      </div>
    );
  }

  // Full variant - includes live notifications
  const currentItem = recentItems[notificationIndex];
  const currentItemName = currentItem
    ? anonymizeName(type === "course"
        ? (currentItem as { firstName?: string }).firstName
        : (currentItem as { firstName?: string }).firstName)
    : null;
  const currentItemTime = currentItem
    ? type === "course"
        ? (currentItem as { enrolledAt: number }).enrolledAt
        : (currentItem as { purchasedAt: number }).purchasedAt
    : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4">
        {totalCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {totalCount.toLocaleString()} {type === "course" ? "students" : "customers"}
            </span>
          </div>
        )}
        {rating > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1.5">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">
              {rating} rating
            </span>
          </div>
        )}
        {weeklyCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1.5">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              {weeklyCount} this week
            </span>
          </div>
        )}
      </div>

      {/* Live Notification */}
      {recentItems.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 transition-all duration-500 dark:border-green-800 dark:bg-green-900/20",
            showNotification ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {currentItemName} just {type === "course" ? "enrolled" : "purchased"}!
            </p>
            {currentItemTime && (
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(currentItemTime)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Static social proof for when real data isn't available yet
 */
export function StaticSocialProof({
  students = 1000,
  rating = 4.9,
  completionRate = 98,
  className
}: {
  students?: number;
  rating?: number;
  completionRate?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-6 sm:gap-8", className)}>
      <div className="text-center">
        <div className="text-xl font-bold sm:text-2xl">{students.toLocaleString()}+</div>
        <div className="text-xs sm:text-sm opacity-80">Students</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold sm:text-2xl">{rating}</div>
        <div className="text-xs sm:text-sm opacity-80">Rating</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold sm:text-2xl">{completionRate}%</div>
        <div className="text-xs sm:text-sm opacity-80">Completion</div>
      </div>
    </div>
  );
}
