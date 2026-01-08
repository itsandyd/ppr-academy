"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
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
  Target,
  Headphones,
  Mic2,
  Sliders,
  Wand2,
  Layers,
  Radio,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Heart,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LearnerOnboardingProps {
  onComplete?: () => void;
}

type SkillLevel = "beginner" | "intermediate" | "advanced";
type LearningGoal = "hobby" | "career" | "skills" | "certification";
type Interest = "mixing" | "mastering" | "sound_design" | "composition" | "recording" | "djing" | "production" | "vocals";

interface OnboardingData {
  skillLevel: SkillLevel | null;
  interests: Interest[];
  goal: LearningGoal | null;
  weeklyHours: number;
}

const STORAGE_KEY = "learner-onboarding-completed";

export function LearnerOnboarding({ onComplete }: LearnerOnboardingProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    skillLevel: null,
    interests: [],
    goal: null,
    weeklyHours: 5,
  });

  const saveLearnerPreferences = useMutation(api.users.saveLearnerPreferences);
  const existingPreferences = useQuery(
    api.users.getLearnerPreferences,
    user?.id ? { userId: user.id } : "skip"
  );

  // Check if user needs onboarding
  useEffect(() => {
    if (!user) return;

    const hasCompletedLocal = localStorage.getItem(STORAGE_KEY);
    const hasExistingPreferences = existingPreferences !== undefined && existingPreferences !== null;

    if (!hasCompletedLocal && !hasExistingPreferences && existingPreferences !== undefined) {
      setTimeout(() => setIsOpen(true), 800);
    }
  }, [user, existingPreferences]);

  const handleComplete = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await saveLearnerPreferences({
        userId: user.id,
        skillLevel: data.skillLevel || "beginner",
        interests: data.interests,
        goal: data.goal || "hobby",
        weeklyHours: data.weeklyHours,
      });

      localStorage.setItem(STORAGE_KEY, "true");
      setIsOpen(false);
      toast.success("Welcome aboard! Your learning journey begins now.");
      onComplete?.();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "skipped");
    setIsOpen(false);
  };

  const skillLevels = [
    {
      id: "beginner" as SkillLevel,
      title: "Beginner",
      description: "Just starting out with music production",
      icon: Sparkles,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "intermediate" as SkillLevel,
      title: "Intermediate",
      description: "Know the basics, ready to level up",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "advanced" as SkillLevel,
      title: "Advanced",
      description: "Experienced producer seeking mastery",
      icon: Target,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const interests = [
    { id: "mixing" as Interest, title: "Mixing", icon: Sliders },
    { id: "mastering" as Interest, title: "Mastering", icon: Wand2 },
    { id: "sound_design" as Interest, title: "Sound Design", icon: Layers },
    { id: "composition" as Interest, title: "Composition", icon: Music },
    { id: "recording" as Interest, title: "Recording", icon: Mic2 },
    { id: "djing" as Interest, title: "DJing", icon: Radio },
    { id: "production" as Interest, title: "Beat Making", icon: Headphones },
    { id: "vocals" as Interest, title: "Vocals", icon: Mic2 },
  ];

  const goals = [
    {
      id: "hobby" as LearningGoal,
      title: "Hobby & Fun",
      description: "Make music for personal enjoyment",
      icon: Heart,
    },
    {
      id: "career" as LearningGoal,
      title: "Career Change",
      description: "Transition into music professionally",
      icon: Briefcase,
    },
    {
      id: "skills" as LearningGoal,
      title: "Skill Building",
      description: "Improve specific production skills",
      icon: Zap,
    },
    {
      id: "certification" as LearningGoal,
      title: "Certification",
      description: "Get certified in music production",
      icon: GraduationCap,
    },
  ];

  const steps = [
    {
      title: "Welcome to PPR Academy!",
      subtitle: "Let's personalize your learning experience",
    },
    {
      title: "What's your skill level?",
      subtitle: "This helps us recommend the right courses",
    },
    {
      title: "What interests you?",
      subtitle: "Select all that apply",
    },
    {
      title: "What's your goal?",
      subtitle: "Help us tailor your learning path",
    },
    {
      title: "You're all set!",
      subtitle: "Let's start your learning journey",
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return data.skillLevel !== null;
      case 2:
        return data.interests.length > 0;
      case 3:
        return data.goal !== null;
      default:
        return true;
    }
  };

  const toggleInterest = (interest: Interest) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <DialogTitle className="sr-only">
          Learner Onboarding - Step {currentStep + 1} of {steps.length}
        </DialogTitle>

        <div className="p-6 md:p-8">
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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
                <p className="text-muted-foreground">{currentStepData.subtitle}</p>
              </div>

              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        icon: BookOpen,
                        title: "Personalized Learning",
                        description: "Courses tailored to your level",
                      },
                      {
                        icon: Target,
                        title: "Track Progress",
                        description: "Earn XP and level up",
                      },
                      {
                        icon: GraduationCap,
                        title: "Get Certified",
                        description: "Showcase your skills",
                      },
                    ].map((item, i) => (
                      <Card key={i} className="text-center">
                        <CardContent className="p-6">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Skill Level */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {skillLevels.map((level) => (
                    <Card
                      key={level.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        data.skillLevel === level.id && "border-primary ring-2 ring-primary/20"
                      )}
                      onClick={() => setData((prev) => ({ ...prev, skillLevel: level.id }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r",
                              level.color
                            )}
                          >
                            <level.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{level.title}</h4>
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                          </div>
                          {data.skillLevel === level.id && (
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 2: Interests */}
              {currentStep === 2 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {interests.map((interest) => (
                    <Card
                      key={interest.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        data.interests.includes(interest.id) &&
                          "border-primary bg-primary/5 ring-2 ring-primary/20"
                      )}
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <interest.icon
                          className={cn(
                            "mx-auto mb-2 h-8 w-8",
                            data.interests.includes(interest.id)
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <p className="text-sm font-medium">{interest.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 3: Goals */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <Card
                      key={goal.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        data.goal === goal.id && "border-primary ring-2 ring-primary/20"
                      )}
                      onClick={() => setData((prev) => ({ ...prev, goal: goal.id }))}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <goal.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{goal.title}</h4>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                          {data.goal === goal.id && (
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 4: Summary */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Your Learning Profile</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Skill Level</span>
                          <Badge variant="secondary">
                            {skillLevels.find((s) => s.id === data.skillLevel)?.title}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goal</span>
                          <Badge variant="secondary">
                            {goals.find((g) => g.id === data.goal)?.title}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-muted-foreground mr-2">Interests:</span>
                          {data.interests.map((i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {interests.find((int) => int.id === i)?.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <p className="text-center text-muted-foreground">
                    Based on your preferences, we'll recommend courses and track your progress.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t mt-8">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                      ? "w-2 bg-green-500"
                      : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {currentStep === 0 ? (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? "Saving..." : "Start Learning"}
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
