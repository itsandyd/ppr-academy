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
  Trophy,
  GraduationCap,
  CheckCircle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Nudge contexts for different touchpoints
type NudgeContext =
  | "course_completed"      // After completing a course
  | "milestone_xp"          // After reaching XP milestone
  | "quiz_passed"           // After passing a quiz
  | "certificate_earned"    // After earning a certificate
  | "enrollment_count"      // After enrolling in X courses
  | "first_login"           // First time user
  | "returning_learner"     // User with activity but no store
  | "first_enrollment"      // First course enrolled
  | "lessons_milestone"     // 5+ lessons completed
  | "share_progress"        // Share your progress prompt
  | "expert_level"          // Expert level (L8+)
  | "creator_profile_views" // Viewed 3+ creator profiles
  | "leaderboard_visit"     // Visited leaderboard page
  | "default";              // Default nudge

interface BecomeCreatorCardProps {
  variant?: "default" | "compact" | "banner" | "milestone" | "celebration";
  onDismiss?: () => void;
  nudgeContext?: NudgeContext;
  contextData?: {
    courseName?: string;
    xpMilestone?: number;
    quizName?: string;
    enrollmentCount?: number;
    lessonCount?: number;
    level?: number;
    expertTitle?: string;
    progressPercentage?: number;
    totalCertificates?: number;
    viewCount?: number;
    userLevel?: number;
  };
}

// Context-aware messages for different nudge points
const getNudgeMessage = (context: NudgeContext, contextData?: BecomeCreatorCardProps["contextData"]) => {
  switch (context) {
    case "course_completed":
      return {
        title: "Course Completed! Ready to Create?",
        subtitle: `You finished ${contextData?.courseName || "the course"}! Now share your knowledge.`,
        cta: "Create Your First Course",
      };
    case "milestone_xp":
      return {
        title: `Level ${contextData?.xpMilestone || "Up"}! You're Ready`,
        subtitle: "Your dedication shows expertise. Others want to learn from you!",
        cta: "Start Teaching",
      };
    case "quiz_passed":
      return {
        title: "Quiz Master! Share Your Knowledge",
        subtitle: `You aced ${contextData?.quizName || "the quiz"}. Help others succeed too!`,
        cta: "Create a Course",
      };
    case "certificate_earned":
      return {
        title: contextData?.totalCertificates && contextData.totalCertificates > 1
          ? `${contextData.totalCertificates} Certificates! Showcase Your Credentials`
          : "Certified & Ready to Teach!",
        subtitle: contextData?.totalCertificates && contextData.totalCertificates > 1
          ? "Your credentials prove your expertise. Build a store to showcase them!"
          : "Your certificate proves your skills. Now monetize them!",
        cta: "Showcase Your Credentials",
      };
    case "enrollment_count":
      return {
        title: `${contextData?.enrollmentCount || "Multiple"} Courses! You Love Learning`,
        subtitle: "Turn that passion into income by creating your own content.",
        cta: "Start Creating",
      };
    case "returning_learner":
      return {
        title: "Welcome Back, Expert!",
        subtitle: "Your learning journey shows dedication. Share what you know!",
        cta: "Become a Creator",
      };
    case "first_enrollment":
      return {
        title: "Great Choice! You Could Teach This",
        subtitle: `Learning ${contextData?.courseName || "this topic"}? Share your own unique perspective with others.`,
        cta: "Explore Creating",
      };
    case "lessons_milestone":
      return {
        title: `${contextData?.lessonCount || 5}+ Lessons! You're On a Roll`,
        subtitle: "Your dedication shows. Others want to learn from committed learners like you!",
        cta: "Share Your Progress",
      };
    case "share_progress":
      return {
        title: `${contextData?.progressPercentage || 50}% Complete! Share Your Journey`,
        subtitle: `You're making great progress on ${contextData?.courseName || "this course"}. Inspire others!`,
        cta: "Share Your Progress",
      };
    case "expert_level":
      return {
        title: `${contextData?.expertTitle || "Expert"} Level ${contextData?.level || 8}! Your Expertise is Valuable`,
        subtitle: "You've proven your dedication. Now turn that expertise into income!",
        cta: "Monetize Your Skills",
      };
    case "creator_profile_views":
      return {
        title: "Exploring Creators? Start Your Own Store!",
        subtitle: `You've viewed ${contextData?.viewCount || 3}+ creator profiles. Why not create your own?`,
        cta: "Start Your Store",
      };
    case "leaderboard_visit":
      return {
        title: `Level ${contextData?.userLevel || 1} Learner! Join Top Creators`,
        subtitle: "You're already on the leaderboard. Take it further by creating and earning!",
        cta: "Join Top Creators",
      };
    default:
      return {
        title: "Ready to share your knowledge?",
        subtitle: "Become a creator and earn 90% on every sale",
        cta: "Start Creating",
      };
  }
};

export function BecomeCreatorCard({
  variant = "default",
  onDismiss,
  nudgeContext = "default",
  contextData,
}: BecomeCreatorCardProps) {
  const router = useRouter();
  const message = getNudgeMessage(nudgeContext, contextData);

  const handleBecomeCreator = () => {
    router.push("/dashboard?mode=create");
  };

  // Celebration variant - for major milestones
  if (variant === "celebration") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="relative mx-4 max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-1"
          >
            <div className="relative rounded-xl bg-white p-6 dark:bg-gray-900">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
              </div>

              <h2 className="mb-2 text-center text-2xl font-bold">{message.title}</h2>
              <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
                {message.subtitle}
              </p>

              <div className="mb-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="font-medium">90% Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Free to Start</span>
                </div>
              </div>

              <Button
                onClick={handleBecomeCreator}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-6 text-lg hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {message.cta}
              </Button>

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Maybe later
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Milestone variant - inline celebratory card
  if (variant === "milestone") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20"
      >
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-white/50 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <Badge className="mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              Milestone Unlocked
            </Badge>
            <h3 className="font-bold text-purple-900 dark:text-purple-100">
              {message.title}
            </h3>
            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              {message.subtitle}
            </p>
            <Button
              size="sm"
              onClick={handleBecomeCreator}
              className="mt-3 bg-purple-600 hover:bg-purple-700"
            >
              {message.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-white/60 hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{message.title}</h3>
              <p className="text-sm text-white/80">{message.subtitle}</p>
            </div>
          </div>
          <Button
            onClick={handleBecomeCreator}
            className="bg-white text-purple-600 hover:bg-white/90"
          >
            {message.cta}
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
