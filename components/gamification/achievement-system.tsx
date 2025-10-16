"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  TrendingUp,
  Heart,
  Users,
  DollarSign,
  Package,
  BookOpen,
  Flame,
  Crown,
  Sparkles,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "creator" | "student" | "social" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  progress?: {
    current: number;
    target: number;
  };
  unlocked?: boolean;
  unlockedAt?: Date;
}

export const creatorAchievements: Achievement[] = [
  {
    id: "first-product",
    title: "Content Creator",
    description: "Published your first product",
    icon: Package,
    category: "creator",
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "first-sale",
    title: "First Sale",
    description: "Made your first sale",
    icon: DollarSign,
    category: "milestone",
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "revenue-100",
    title: "Hundred Club",
    description: "Earned $100 in total revenue",
    icon: TrendingUp,
    category: "milestone",
    rarity: "rare",
    xpReward: 150,
  },
  {
    id: "revenue-1000",
    title: "Four Figures",
    description: "Earned $1,000 in total revenue",
    icon: Trophy,
    category: "milestone",
    rarity: "epic",
    xpReward: 300,
  },
  {
    id: "ten-products",
    title: "Prolific Creator",
    description: "Published 10 products",
    icon: Sparkles,
    category: "creator",
    rarity: "rare",
    xpReward: 200,
  },
  {
    id: "five-star-review",
    title: "Five Star Excellence",
    description: "Received your first 5-star review",
    icon: Star,
    category: "social",
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "100-students",
    title: "Educator",
    description: "100 students enrolled in your courses",
    icon: Users,
    category: "milestone",
    rarity: "epic",
    xpReward: 250,
  },
  {
    id: "7-day-streak",
    title: "Week Warrior",
    description: "Logged in 7 days in a row",
    icon: Flame,
    category: "milestone",
    rarity: "common",
    xpReward: 75,
  },
  {
    id: "30-day-streak",
    title: "Monthly Momentum",
    description: "Logged in 30 days in a row",
    icon: Flame,
    category: "milestone",
    rarity: "epic",
    xpReward: 500,
  },
  {
    id: "top-seller",
    title: "Chart Topper",
    description: "Appeared on the Top 10 sellers list",
    icon: Crown,
    category: "milestone",
    rarity: "legendary",
    xpReward: 1000,
  }
];

export const studentAchievements: Achievement[] = [
  {
    id: "first-course",
    title: "Student Begins",
    description: "Enrolled in your first course",
    icon: BookOpen,
    category: "student",
    rarity: "common",
    xpReward: 25,
  },
  {
    id: "first-completion",
    title: "Course Complete",
    description: "Completed your first course",
    icon: Trophy,
    category: "student",
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "five-courses",
    title: "Dedicated Learner",
    description: "Completed 5 courses",
    icon: Award,
    category: "student",
    rarity: "epic",
    xpReward: 250,
  },
  {
    id: "first-certificate",
    title: "Certified",
    description: "Earned your first certificate",
    icon: Award,
    category: "milestone",
    rarity: "rare",
    xpReward: 100,
  },
  {
    id: "student-streak-7",
    title: "Study Streak",
    description: "Learned for 7 days in a row",
    icon: Flame,
    category: "milestone",
    rarity: "common",
    xpReward: 50,
  },
  {
    id: "community-contributor",
    title: "Community Star",
    description: "Posted 10 helpful comments",
    icon: Heart,
    category: "social",
    rarity: "rare",
    xpReward: 150,
  }
];

const rarityStyles = {
  common: {
    bg: "from-slate-500 to-slate-700",
    border: "border-slate-500",
    text: "text-slate-800 dark:text-slate-200",
    glow: "shadow-slate-500/50"
  },
  rare: {
    bg: "from-blue-500 to-blue-700",
    border: "border-blue-500",
    text: "text-blue-800 dark:text-blue-200",
    glow: "shadow-blue-500/50"
  },
  epic: {
    bg: "from-purple-500 to-purple-700",
    border: "border-purple-500",
    text: "text-purple-800 dark:text-purple-200",
    glow: "shadow-purple-500/50"
  },
  legendary: {
    bg: "from-amber-500 to-amber-700",
    border: "border-amber-500",
    text: "text-amber-800 dark:text-amber-200",
    glow: "shadow-amber-500/50"
  }
};

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export function AchievementCard({ 
  achievement, 
  onClick,
  size = "md" 
}: AchievementCardProps) {
  const Icon = achievement.icon;
  const styles = rarityStyles[achievement.rarity];
  const isLocked = !achievement.unlocked;

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 group",
        achievement.unlocked && `hover:shadow-lg ${styles.glow}`,
        isLocked && "opacity-60"
      )}
      onClick={onClick}
    >
      {achievement.unlocked && (
        <div className={cn(
          "absolute top-0 right-0 w-20 h-20 bg-gradient-to-br opacity-10 blur-2xl",
          styles.bg
        )} />
      )}

      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative",
            isLocked ? "bg-slate-200 dark:bg-slate-800" : `bg-gradient-to-br ${styles.bg}`
          )}>
            {isLocked ? (
              <Lock className="w-6 h-6 text-slate-400" />
            ) : (
              <Icon className="w-6 h-6 text-white" />
            )}
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-black">
                <Sparkles className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={cn(
                "font-semibold text-sm",
                isLocked ? "text-muted-foreground" : styles.text
              )}>
                {achievement.title}
              </h4>
              <Badge 
                variant="secondary" 
                className={cn("text-xs capitalize", !isLocked && styles.text)}
              >
                {achievement.rarity}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-2">
              {achievement.description}
            </p>

            {/* Progress Bar */}
            {achievement.progress && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {achievement.progress.current} / {achievement.progress.target}
                  </span>
                </div>
                <Progress 
                  value={(achievement.progress.current / achievement.progress.target) * 100} 
                  className="h-1.5"
                />
              </div>
            )}

            {/* XP Reward */}
            <div className="flex items-center gap-1 mt-2">
              <Zap className="w-3 h-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementUnlockedToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementUnlockedToast({ 
  achievement, 
  onClose 
}: AchievementUnlockedToastProps) {
  const Icon = achievement.icon;
  const styles = rarityStyles[achievement.rarity];

  useEffect(() => {
    // Trigger confetti with delay to prevent overlap
    const confettiTimer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });
    }, 100);

    // Auto close after 4 seconds (reduced to prevent overlap)
    const closeTimer = setTimeout(onClose, 4000);
    
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-96"
    >
      <Card className={cn("border-2 shadow-2xl", styles.border, styles.glow)}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className={cn(
              "w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br flex items-center justify-center",
              styles.bg
            )}>
              <Icon className="w-10 h-10 text-white" />
            </div>

            <Badge className={cn("mb-2", styles.text)} variant="secondary">
              🎉 Achievement Unlocked!
            </Badge>

            <h3 className="text-xl font-bold mb-1">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {achievement.description}
            </p>

            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-lg text-yellow-700 dark:text-yellow-400">
                +{achievement.xpReward} XP
              </span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={onClose}
            >
              Awesome!
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AchievementsGridProps {
  achievements: Achievement[];
  title?: string;
  className?: string;
}

export function AchievementsGrid({ 
  achievements, 
  title = "Achievements",
  className 
}: AchievementsGridProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = (unlockedCount / totalCount) * 100;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              {title}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {unlockedCount} / {totalCount} unlocked
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-2" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onClick={() => setSelectedAchievement(achievement)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Detail Modal (optional) */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementUnlockedToast
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

