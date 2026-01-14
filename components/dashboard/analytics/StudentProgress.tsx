"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Flame,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentProgressProps {
  userId: string;
  className?: string;
}

interface StudentData {
  id: string;
  name?: string;
  email?: string;
  courseTitle: string;
  progress: number;
  lastActivity?: number;
  isAtRisk: boolean;
  enrolledAt: number;
  streak?: number;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getProgressColor(progress: number): string {
  if (progress >= 75) return "bg-emerald-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-amber-500";
  return "bg-rose-500";
}

export function StudentProgress({ userId, className }: StudentProgressProps) {
  const progressData = useQuery(api.analytics.getCreatorStudentProgress, {
    userId,
    limit: 15,
  });

  if (progressData === undefined) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Student Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (progressData.totalStudents === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Student Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No students enrolled yet</p>
            <p className="text-sm">Student progress will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          Student Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{progressData.totalStudents}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="font-semibold">{progressData.activeStudents}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">At Risk</p>
              <p className="font-semibold">{progressData.atRiskStudents}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
              <p className="font-semibold">{progressData.avgProgress}%</p>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {progressData.students.map((student: StudentData) => (
            <div
              key={`${student.id}-${student.courseTitle}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                student.isAtRisk
                  ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className={student.isAtRisk ? "bg-amber-200 text-amber-800" : ""}>
                  {student.name?.[0]?.toUpperCase() ||
                    student.email?.[0]?.toUpperCase() ||
                    "?"}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {student.name || student.email?.split("@")[0] || "Anonymous"}
                  </p>
                  {student.isAtRisk && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 border-amber-300 text-xs"
                    >
                      At Risk
                    </Badge>
                  )}
                  {student.streak && student.streak >= 3 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-3 w-3" />
                      <span className="text-xs font-medium">{student.streak}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {student.courseTitle}
                </p>

                {/* Progress Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        getProgressColor(student.progress)
                      )}
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">
                    {student.progress}%
                  </span>
                </div>
              </div>

              {/* Last Activity */}
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">
                  {student.lastActivity
                    ? formatTimeAgo(student.lastActivity)
                    : "Never"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>75%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>50-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>25-49%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span>&lt;25%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
