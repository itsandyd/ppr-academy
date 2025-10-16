"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Music, 
  BookOpen, 
  Users, 
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GettingStartedModalProps {
  userType?: "creator" | "student";
  onComplete?: () => void;
  storageKey?: string;
}

export function GettingStartedModal({
  userType = "creator",
  onComplete,
  storageKey = "onboarding-completed"
}: GettingStartedModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      // Show modal after a brief delay
      setTimeout(() => setIsOpen(true), 500);
    }
  }, [storageKey]);

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "skipped");
    setIsOpen(false);
  };

  const creatorSteps = [
    {
      title: "Welcome to PausePlayRepeat! 🎵",
      description: "Let's get you started on your creator journey",
      icon: Sparkles,
      gradient: "from-purple-500 to-pink-500",
      actions: [
        {
          title: "Create Your First Product",
          description: "Start with a sample pack, preset, or course",
          icon: Music,
          color: "from-purple-500 to-blue-500"
        },
        {
          title: "Set Up Payments",
          description: "Connect Stripe to start earning",
          icon: DollarSign,
          color: "from-green-500 to-emerald-500"
        },
        {
          title: "Build Your Audience",
          description: "Connect social media and email",
          icon: Users,
          color: "from-orange-500 to-red-500"
        }
      ]
    },
    {
      title: "Choose Your First Product Type",
      description: "What would you like to create?",
      icon: Music,
      gradient: "from-blue-500 to-cyan-500",
      quickPicks: [
        {
          id: "sample-pack",
          title: "Sample Pack",
          description: "Easiest to start with",
          time: "2-3 hours",
          badge: "Recommended"
        },
        {
          id: "preset-pack",
          title: "Preset Pack",
          description: "Great for sound designers",
          time: "3-4 hours",
          badge: "Popular"
        },
        {
          id: "course",
          title: "Music Course",
          description: "Share your expertise",
          time: "20-30 hours",
          badge: "High Value"
        }
      ]
    },
    {
      title: "Quick Tips for Success",
      description: "Make the most of your platform",
      icon: CheckCircle2,
      gradient: "from-green-500 to-emerald-500",
      tips: [
        "Start with one product and perfect it before scaling",
        "Join our Discord community to get feedback and support",
        "Use product type tooltips for guidance and examples",
        "Check analytics regularly to understand what works",
        "Build an email list from day one with lead magnets"
      ]
    }
  ];

  const studentSteps = [
    {
      title: "Welcome to Your Learning Hub! 📚",
      description: "Start your music production journey",
      icon: BookOpen,
      gradient: "from-blue-500 to-purple-500",
      actions: [
        {
          title: "Browse Courses",
          description: "Find courses that match your skill level",
          icon: BookOpen,
          color: "from-blue-500 to-cyan-500"
        },
        {
          title: "Earn Certificates",
          description: "Complete courses to showcase your skills",
          icon: CheckCircle2,
          color: "from-green-500 to-emerald-500"
        },
        {
          title: "Join Community",
          description: "Connect with other students and instructors",
          icon: Users,
          color: "from-purple-500 to-pink-500"
        }
      ]
    }
  ];

  const steps = userType === "creator" ? creatorSteps : studentSteps;
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!currentStepData) return null;

  const Icon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-white dark:bg-black p-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          Getting Started - Step {currentStep + 1} of {steps.length}
        </DialogTitle>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r flex items-center justify-center",
                  currentStepData.gradient
                )}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
                <p className="text-muted-foreground">{currentStepData.description}</p>
              </div>

              {/* Actions Grid */}
              {currentStepData.actions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {currentStepData.actions.map((action, i) => {
                    const ActionIcon = action.icon;
                    return (
                      <Card key={i} className="hover:shadow-lg transition-all cursor-pointer group">
                        <CardContent className="p-6 text-center">
                          <div className={cn(
                            "w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r flex items-center justify-center group-hover:scale-110 transition-transform",
                            action.color
                          )}>
                            <ActionIcon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold mb-1 text-sm">{action.title}</h3>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Quick Picks */}
              {currentStepData.quickPicks && (
                <div className="space-y-3 mb-8">
                  {currentStepData.quickPicks.map((pick) => (
                    <Card 
                      key={pick.id} 
                      className="hover:border-primary transition-all cursor-pointer"
                      onClick={() => {
                        handleComplete();
                        // Navigate to product creation
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{pick.title}</h4>
                              {pick.badge && (
                                <Badge variant="secondary">{pick.badge}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{pick.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ⏱️ {pick.time}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Tips List */}
              {currentStepData.tips && (
                <div className="space-y-3 mb-8">
                  {currentStepData.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentStep 
                      ? "bg-purple-600 w-6" 
                      : i < currentStep
                      ? "bg-green-500"
                      : "bg-slate-300 dark:bg-slate-700"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="gap-2">
                  <Play className="w-4 h-4" />
                  Get Started!
                </Button>
              )}
            </div>
          </div>

          {/* Step Counter */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

