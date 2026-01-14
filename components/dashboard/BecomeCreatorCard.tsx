"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Store,
  Music,
  Video,
  Headphones,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface BecomeCreatorCardProps {
  variant?: "default" | "compact" | "banner";
  onDismiss?: () => void;
}

export function BecomeCreatorCard({ variant = "default", onDismiss }: BecomeCreatorCardProps) {
  const router = useRouter();

  const handleBecomeCreator = () => {
    router.push("/dashboard?mode=create");
  };

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Ready to share your knowledge?</h3>
              <p className="text-sm text-white/80">
                Become a creator and earn 90% on every sale
              </p>
            </div>
          </div>
          <Button
            onClick={handleBecomeCreator}
            className="bg-white text-purple-600 hover:bg-white/90"
          >
            Start Creating
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                Become a Creator
              </h4>
              <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                Share your skills & earn 90% revenue
              </p>
              <Button
                size="sm"
                onClick={handleBecomeCreator}
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default full variant
  return (
    <Card className="overflow-hidden border-purple-200 dark:border-purple-800">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-4">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Become a Creator</h3>
            <p className="text-sm text-white/80">Share what you know, earn while you grow</p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          You've been learning - now it's time to teach! Turn your music production skills into income.
        </p>

        {/* What you can create */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
            <Video className="h-4 w-4 text-blue-500" />
            <span>Courses</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
            <Music className="h-4 w-4 text-purple-500" />
            <span>Sample Packs</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
            <Store className="h-4 w-4 text-green-500" />
            <span>Presets</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
            <Headphones className="h-4 w-4 text-orange-500" />
            <span>Coaching</span>
          </div>
        </div>

        {/* Key benefits */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <DollarSign className="h-3 w-3 text-green-600" />
            </div>
            <span className="font-medium text-green-700 dark:text-green-400">
              Keep 90% of every sale
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Store className="h-3 w-3 text-blue-600" />
            </div>
            <span>Your own branded storefront</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-3 w-3 text-purple-600" />
            </div>
            <span>Built-in audience of learners</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <TrendingUp className="h-3 w-3 text-orange-600" />
            </div>
            <span>Analytics & marketing tools</span>
          </div>
        </div>

        <Button onClick={handleBecomeCreator} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Sparkles className="mr-2 h-4 w-4" />
          Start Your Creator Journey
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Free to set up • No monthly fees • Get paid instantly via Stripe
        </p>
      </CardContent>
    </Card>
  );
}
