"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Target,
  Flame,
  Calendar,
  BarChart3,
  Trophy,
  BookOpen,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StudentLearningDashboardProps {
  userId: string;
}

export function StudentLearningDashboard({ userId }: StudentLearningDashboardProps) {
  // Get user's progress across all courses
  const allProgress = useQuery(
    api.analytics.getStudentProgress,
    { userId }
  ) as any[];

  // Get learning streak
  const learningStreak = useQuery(
    api.analytics.getLearningStreak,
    { userId }
  );

  if (!allProgress || !learningStreak) {
    return <div>Loading your learning dashboard...</div>;
  }

  // Calculate overall stats
  const totalCourses = allProgress?.length || 0;
  const completedCourses = allProgress?.filter(p => p.completionPercentage === 100).length || 0;
  const totalTimeSpent = allProgress?.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) || 0;
  const avgCompletionRate = totalCourses > 0
    ? allProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / totalCourses
    : 0;

  // Get engagement score (weighted average)
  const avgEngagementScore = totalCourses > 0
    ? allProgress.reduce((sum, p) => sum + (p.engagementScore || 0), 0) / totalCourses
    : 0;

  // Find next milestone for streak
  const streakMilestones = [7, 30, 100, 365];
  const nextMilestone = streakMilestones.find(m => m > learningStreak.currentStreak) || 365;

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {learningStreak.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {nextMilestone - learningStreak.currentStreak} days to {nextMilestone}-day milestone
            </p>
            <Progress 
              value={(learningStreak.currentStreak / nextMilestone) * 100}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        {/* Total Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Learned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(totalTimeSpent / 60)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalCourses} courses
            </p>
          </CardContent>
        </Card>

        {/* Courses Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {totalCourses} enrolled
            </p>
            <Progress 
              value={(completedCourses / Math.max(totalCourses, 1)) * 100}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        {/* Engagement Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(avgEngagementScore)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgEngagementScore >= 80 ? "Excellent!" : avgEngagementScore >= 60 ? "Good" : "Keep going!"}
            </p>
            <Progress 
              value={avgEngagementScore}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Streak Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Streak Milestones
          </CardTitle>
          <CardDescription>
            Keep your learning streak alive!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {streakMilestones.map((milestone) => {
              const achieved = learningStreak.streakMilestones.includes(milestone);
              const current = learningStreak.currentStreak >= milestone;
              
              return (
                <div 
                  key={milestone}
                  className={`p-4 rounded-lg text-center ${
                    achieved ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'
                  }`}
                >
                  <div className="text-2xl font-bold mb-1">{milestone}</div>
                  <div className="text-sm text-muted-foreground mb-2">days</div>
                  {achieved && (
                    <Badge variant="default" className="text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      Achieved!
                    </Badge>
                  )}
                  {!achieved && current && (
                    <Badge variant="secondary" className="text-xs">
                      In Progress
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Longest Streak:</span>
              <span className="font-bold">{learningStreak.longestStreak} days</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Total Days Active:</span>
              <span className="font-bold">{learningStreak.totalDaysActive} days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Course Progress</CardTitle>
          <CardDescription>
            Track your progress across all enrolled courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allProgress && allProgress.length > 0 ? (
            <div className="space-y-4">
              {allProgress
                .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
                .slice(0, 5)
                .map((progress) => (
                  <div key={progress._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">Course #{progress.courseId.slice(-6)}</div>
                        <div className="text-sm text-muted-foreground">
                          {progress.completedChapters} of {progress.totalChapters} chapters completed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{progress.completionPercentage}%</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(progress.lastAccessedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <Progress value={progress.completionPercentage} className="h-2" />
                    
                    {/* Additional Metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(progress.totalTimeSpent / 60)}h spent
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {progress.chaptersPerWeek.toFixed(1)} chapters/week
                      </div>
                      {progress.performancePercentile && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Top {100 - progress.performancePercentile}%
                        </div>
                      )}
                    </div>

                    {/* Warning badges */}
                    <div className="flex gap-2">
                      {progress.isAtRisk && (
                        <Badge variant="destructive" className="text-xs">
                          At Risk - Resume Learning
                        </Badge>
                      )}
                      {progress.needsHelp && (
                        <Badge variant="secondary" className="text-xs">
                          May Need Help
                        </Badge>
                      )}
                      {progress.engagementScore >= 80 && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          High Engagement
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No courses started yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Insights</CardTitle>
          <CardDescription>
            Personalized insights based on your activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {learningStreak.currentStreak >= 7 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Flame className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      Amazing Streak! 🎉
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      You've been learning for {learningStreak.currentStreak} days in a row. Keep it up!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {avgCompletionRate >= 50 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Great Progress!
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      You're {avgCompletionRate.toFixed(0)}% through your courses on average. You're doing great!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {allProgress?.some(p => p.isAtRisk) && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-900 dark:text-orange-100">
                      Time to Resume!
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      You have courses that need attention. Resume learning to keep your momentum!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {completedCourses >= 3 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2">
                  <Award className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-purple-900 dark:text-purple-100">
                      Achievement Unlocked!
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      You've completed {completedCourses} courses. You're becoming an expert!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

