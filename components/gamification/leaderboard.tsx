"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  TrendingUp, 
  Crown, 
  Medal,
  Flame,
  DollarSign,
  Users,
  Star,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  value: number;
  valueLabel: string;
  badge?: string;
  isCurrentUser?: boolean;
  change?: number; // Position change from previous period
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  period?: "weekly" | "monthly" | "all-time";
  onPeriodChange?: (period: string) => void;
  className?: string;
}

export function Leaderboard({
  entries,
  title,
  icon: Icon = Trophy,
  period = "all-time",
  onPeriodChange,
  className
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold";
      case 2:
        return "bg-gradient-to-r from-slate-300 to-slate-500 text-white font-bold";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-800 text-white font-bold";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-purple-600" />
            {title}
          </CardTitle>
          {onPeriodChange && (
            <Tabs value={period} onValueChange={onPeriodChange}>
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                <TabsTrigger value="all-time" className="text-xs">All-Time</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const rankIcon = getRankIcon(entry.rank);
            const isTopThree = entry.rank <= 3;

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-all hover:scale-[1.02]",
                  entry.isCurrentUser 
                    ? "bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700" 
                    : "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800",
                  isTopThree && !entry.isCurrentUser && "shadow-md"
                )}
              >
                {/* Rank */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    getRankBadgeStyle(entry.rank)
                  )}>
                    {rankIcon || entry.rank}
                  </div>

                  {/* Change indicator */}
                  {entry.change !== undefined && entry.change !== 0 && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      entry.change > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      <TrendingUp className={cn(
                        "w-3 h-3",
                        entry.change < 0 && "rotate-180"
                      )} />
                      <span>{Math.abs(entry.change)}</span>
                    </div>
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className={cn(
                    "w-10 h-10",
                    isTopThree && "ring-2 ring-amber-400"
                  )}>
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback className={cn(
                      isTopThree && "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    )}>
                      {entry.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        entry.isCurrentUser && "text-purple-700 dark:text-purple-300"
                      )}>
                        {entry.name}
                        {entry.isCurrentUser && " (You)"}
                      </p>
                      {entry.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.valueLabel}
                    </p>
                  </div>
                </div>

                {/* Value */}
                <div className={cn(
                  "text-right",
                  isTopThree && "bg-white dark:bg-black px-3 py-1 rounded-lg"
                )}>
                  <p className={cn(
                    "font-bold",
                    isTopThree ? "text-lg" : "text-base",
                    entry.isCurrentUser && "text-purple-600 dark:text-purple-400"
                  )}>
                    {entry.value.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current User Position (if not in top 10) */}
        {!entries.find(e => e.isCurrentUser) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              <p>Your current position: <strong className="text-foreground">#45</strong></p>
              <p className="text-xs mt-1">Keep creating to climb the ranks!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preset Leaderboards
export function TopCreatorsLeaderboard({ className }: { className?: string }) {
  // Mock data - replace with real data from Convex
  const mockEntries: LeaderboardEntry[] = [
    {
      id: "1",
      rank: 1,
      name: "BeatMaster Pro",
      avatar: undefined,
      value: 15420,
      valueLabel: "$15,420 revenue",
      badge: "Top Seller",
      change: 0
    },
    {
      id: "2",
      rank: 2,
      name: "Sarah Sounds",
      avatar: undefined,
      value: 12850,
      valueLabel: "$12,850 revenue",
      change: 1
    },
    {
      id: "3",
      rank: 3,
      name: "DJ Nexus",
      avatar: undefined,
      value: 9340,
      valueLabel: "$9,340 revenue",
      badge: "Rising Star",
      change: 2
    },
    // Add more entries...
  ];

  return (
    <Leaderboard
      entries={mockEntries}
      title="Top Creators"
      icon={Crown}
      className={className}
    />
  );
}

export function TopStudentsLeaderboard({ className }: { className?: string }) {
  // Mock data - replace with real data from Convex
  const mockEntries: LeaderboardEntry[] = [
    {
      id: "1",
      rank: 1,
      name: "Alex Learning",
      avatar: undefined,
      value: 2450,
      valueLabel: "2,450 XP",
      badge: "Scholar",
      change: 0
    },
    {
      id: "2",
      rank: 2,
      name: "Music Enthusiast",
      avatar: undefined,
      value: 2100,
      valueLabel: "2,100 XP",
      change: -1
    },
    // Add more entries...
  ];

  return (
    <Leaderboard
      entries={mockEntries}
      title="Top Students"
      icon={Star}
      className={className}
    />
  );
}

export function ActiveUsersLeaderboard({ className }: { className?: string }) {
  // Mock data - replace with real data from Convex
  const mockEntries: LeaderboardEntry[] = [
    {
      id: "1",
      rank: 1,
      name: "Daily Grinder",
      avatar: undefined,
      value: 45,
      valueLabel: "45-day streak",
      badge: "🔥",
      change: 0
    },
    // Add more entries...
  ];

  return (
    <Leaderboard
      entries={mockEntries}
      title="Most Active"
      icon={Flame}
      className={className}
    />
  );
}

