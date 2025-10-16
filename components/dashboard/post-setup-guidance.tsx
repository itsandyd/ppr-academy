"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  DollarSign, 
  Users, 
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PostSetupGuidanceProps {
  storeId: string;
  storageKey?: string;
  className?: string;
}

export function PostSetupGuidance({
  storeId,
  storageKey = "store-setup-guidance-dismissed",
  className
}: PostSetupGuidanceProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Check if guidance has been dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed) {
      setIsVisible(false);
    }
  }, [storageKey]);

  const setupSteps = [
    {
      id: "product",
      title: "Add Your First Product",
      description: "Upload a sample pack, course, or preset to start earning",
      icon: Package,
      color: "from-purple-500 to-blue-500",
      href: `/store/${storeId}/products`,
      completed: false // TODO: Check if user has products
    },
    {
      id: "payments",
      title: "Connect Stripe",
      description: "Set up payments to receive earnings from sales",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      href: `/store/${storeId}/settings/payouts`,
      completed: false // TODO: Check if Stripe connected
    },
    {
      id: "promote",
      title: "Share Your Store",
      description: "Connect social media and start promoting your content",
      icon: Users,
      color: "from-orange-500 to-red-500",
      href: `/store/${storeId}/social`,
      completed: false // TODO: Check if social connected
    }
  ];

  const completionPercentage = (completedSteps.length / setupSteps.length) * 100;

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("sticky top-4 z-40", className)}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Complete Your Store Setup
                    <Badge variant="secondary" className="text-xs">
                      {completedSteps.length}/{setupSteps.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Follow these steps to start earning
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <Progress value={completionPercentage} className="h-2 mb-4" />

            {/* Setup Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {setupSteps.map((step) => {
                const Icon = step.icon;
                const isCompleted = completedSteps.includes(step.id);

                return (
                  <Link key={step.id} href={step.href}>
                    <div className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02]",
                      isCompleted 
                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                        : "bg-white dark:bg-black hover:border-purple-300 dark:hover:border-purple-700"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          isCompleted 
                            ? "bg-green-500"
                            : `bg-gradient-to-r ${step.color}`
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <Icon className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {step.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Celebration Message */}
            {completionPercentage === 100 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <p className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  🎉 All set! Your store is ready to make sales
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

