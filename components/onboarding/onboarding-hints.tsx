"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OnboardingHint {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "info" | "success" | "warning" | "tip";
}

interface OnboardingHintsProps {
  hints: OnboardingHint[];
  storageKey?: string;
  dismissible?: boolean;
  autoRotate?: boolean;
  rotateInterval?: number;
  className?: string;
}

export function OnboardingHints({
  hints,
  storageKey = "onboarding-hints-dismissed",
  dismissible = true,
  autoRotate = false,
  rotateInterval = 10000,
  className
}: OnboardingHintsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedHints, setDismissedHints] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Load dismissed hints from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      setDismissedHints(JSON.parse(dismissed));
    }
  }, [storageKey]);

  // Auto-rotate hints
  useEffect(() => {
    if (!autoRotate || activeHints.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeHints.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, dismissedHints]);

  // Filter out dismissed hints
  const activeHints = hints.filter((hint) => !dismissedHints.includes(hint.id));

  // Get current hint
  const currentHint = activeHints[currentIndex];

  // Handle dismiss
  const handleDismiss = (hintId: string) => {
    const updated = [...dismissedHints, hintId];
    setDismissedHints(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // If this was the last hint, hide the component
    if (updated.length >= hints.length) {
      setIsVisible(false);
    }
  };

  // Handle dismiss all
  const handleDismissAll = () => {
    const allIds = hints.map((h) => h.id);
    setDismissedHints(allIds);
    localStorage.setItem(storageKey, JSON.stringify(allIds));
    setIsVisible(false);
  };

  if (!isVisible || activeHints.length === 0 || !currentHint) {
    return null;
  }

  const Icon = currentHint.icon || Lightbulb;

  const variantStyles = {
    info: "from-blue-500 to-cyan-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-orange-500 to-red-500",
    tip: "from-purple-500 to-pink-500",
  };

  const gradientClass = variantStyles[currentHint.variant || "tip"];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentHint.id}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("relative", className)}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center flex-shrink-0",
                gradientClass
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      {currentHint.title}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Tip
                    </Badge>
                  </div>
                  {dismissible && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      onClick={() => handleDismiss(currentHint.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {currentHint.description}
                </p>

                <div className="flex items-center justify-between gap-4">
                  {/* Action Button */}
                  {currentHint.action && (
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-2"
                      onClick={currentHint.action.onClick}
                      asChild={!!currentHint.action.href}
                    >
                      {currentHint.action.href ? (
                        <a href={currentHint.action.href}>
                          {currentHint.action.label}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <>
                          {currentHint.action.label}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Progress Indicators */}
                  {activeHints.length > 1 && (
                    <div className="flex items-center gap-2 ml-auto">
                      {activeHints.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            index === currentIndex
                              ? "bg-purple-600 w-6"
                              : "bg-purple-300 dark:bg-purple-700 hover:bg-purple-400"
                          )}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        {currentIndex + 1} / {activeHints.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dismiss All */}
            {dismissible && activeHints.length > 1 && (
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleDismissAll}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Dismiss all tips
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Preset hints for common scenarios
export const creatorOnboardingHints: OnboardingHint[] = [
  {
    id: "creator-first-product",
    title: "Create your first product",
    description: "Start earning by creating a sample pack, preset collection, or course. It takes less than 30 minutes!",
    action: {
      label: "Create Product",
      href: "/home"
    },
    icon: Sparkles,
    variant: "tip"
  },
  {
    id: "creator-setup-payments",
    title: "Connect Stripe to receive payments",
    description: "Set up your payment account to start receiving revenue from your products.",
    action: {
      label: "Setup Payments",
      href: "/home/settings"
    },
    icon: Lightbulb,
    variant: "warning"
  },
  {
    id: "creator-analytics",
    title: "Track your performance",
    description: "View detailed analytics about your sales, views, and audience engagement.",
    action: {
      label: "View Analytics",
      href: "/home/analytics"
    },
    icon: Lightbulb,
    variant: "info"
  },
  {
    id: "creator-social-media",
    title: "Connect social accounts",
    description: "Schedule posts across Instagram, Twitter, and Facebook to promote your products automatically.",
    action: {
      label: "Connect Accounts",
      href: "/home/social-media"
    },
    icon: Lightbulb,
    variant: "tip"
  }
];

export const studentOnboardingHints: OnboardingHint[] = [
  {
    id: "student-browse-courses",
    title: "Browse courses to start learning",
    description: "Explore music production courses from beginner to advanced levels.",
    action: {
      label: "Browse Courses",
      href: "/"
    },
    icon: Sparkles,
    variant: "tip"
  },
  {
    id: "student-preview-lessons",
    title: "Preview lessons before buying",
    description: "Watch free preview videos to see if a course is right for you before purchasing.",
    icon: Lightbulb,
    variant: "info"
  },
  {
    id: "student-earn-certificates",
    title: "Earn certificates",
    description: "Complete courses to earn certificates you can showcase on your portfolio or social media.",
    action: {
      label: "View My Certificates",
      href: "/library?tab=certificates"
    },
    icon: Lightbulb,
    variant: "success"
  }
];

