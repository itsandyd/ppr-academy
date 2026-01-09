"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileQuestion,
  Clock,
  Trophy,
  Target,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import { QuizPlayer } from "./QuizPlayer";

interface Quiz {
  _id: Id<"quizzes">;
  title: string;
  description?: string;
  courseId: Id<"courses">;
  chapterId?: string;
  instructorId: string;
  quizType: "practice" | "assessment" | "final_exam";
  timeLimit?: number;
  maxAttempts?: number;
  passingScore: number;
  requiredToPass: boolean;
  totalPoints: number;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  isPublished: boolean;
  availableFrom?: number;
  availableUntil?: number;
  createdAt: number;
  updatedAt: number;
}

interface CourseQuizzesProps {
  courseId: Id<"courses">;
  chapterId?: string;
  compact?: boolean;
}

export function CourseQuizzes({ courseId, chapterId, compact = false }: CourseQuizzesProps) {
  const { user } = useUser();
  const [selectedQuizId, setSelectedQuizId] = useState<Id<"quizzes"> | null>(null);

  const quizzes = useQuery(api.quizzes.getQuizzesForCourse, {
    courseId,
    includeUnpublished: false,
  });

  const userResults = useQuery(
    api.quizzes.getUserQuizResults,
    user?.id ? { userId: user.id, courseId } : "skip"
  );

  if (!quizzes || quizzes.length === 0) {
    return null;
  }

  const filteredQuizzes = chapterId
    ? quizzes.filter((q: Quiz) => q.chapterId === chapterId)
    : quizzes;

  if (filteredQuizzes.length === 0) {
    return null;
  }

  // Get results map for quick lookup
  const resultsMap = new Map(
    Array.isArray(userResults) ? userResults.map((r) => [r.quizId, r]) : []
  );

  const handleQuizComplete = (passed: boolean) => {
    setSelectedQuizId(null);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredQuizzes.map((quiz: Quiz) => {
          const result = resultsMap.get(quiz._id);
          const isPassed = result?.hasPassed;

          return (
            <Dialog
              key={quiz._id}
              open={selectedQuizId === quiz._id}
              onOpenChange={(open) => setSelectedQuizId(open ? quiz._id : null)}
            >
              <DialogTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    isPassed
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-primary/10"
                  }`}>
                    {isPassed ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <FileQuestion className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{quiz.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {quiz.quizType.replace("_", " ")}
                      </Badge>
                      {quiz.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {quiz.timeLimit}m
                        </span>
                      )}
                    </div>
                  </div>
                  {isPassed ? (
                    <Badge className="bg-green-600 text-white">
                      {result.bestPercentage?.toFixed(0)}%
                    </Badge>
                  ) : result ? (
                    <Badge variant="secondary">
                      Best: {result.bestPercentage?.toFixed(0)}%
                    </Badge>
                  ) : (
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="sr-only">{quiz.title}</DialogTitle>
                </DialogHeader>
                <QuizPlayer
                  quizId={quiz._id}
                  courseId={courseId}
                  onComplete={handleQuizComplete}
                />
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-primary" />
          Course Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredQuizzes.map((quiz: Quiz) => {
          const result = resultsMap.get(quiz._id);
          const isPassed = result?.hasPassed;

          return (
            <Dialog
              key={quiz._id}
              open={selectedQuizId === quiz._id}
              onOpenChange={(open) => setSelectedQuizId(open ? quiz._id : null)}
            >
              <DialogTrigger asChild>
                <div className="cursor-pointer rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">{quiz.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {quiz.quizType.replace("_", " ")}
                        </Badge>
                        {quiz.requiredToPass && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      {quiz.description && (
                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Pass: {quiz.passingScore}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {quiz.totalPoints} points
                        </span>
                        {quiz.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {quiz.timeLimit} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isPassed ? (
                        <div className="flex flex-col items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-4 py-2 dark:border-green-800 dark:bg-green-950/30">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {result.bestPercentage?.toFixed(0)}%
                          </span>
                        </div>
                      ) : result ? (
                        <div className="flex flex-col items-center gap-1 rounded-lg border bg-muted/50 px-4 py-2">
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                          <span className="text-sm font-bold">
                            {result.bestPercentage?.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <Button className="gap-2">
                          <Play className="h-4 w-4" />
                          Take Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                  {result && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Best Score</span>
                        <span className="font-semibold">
                          {result.bestPercentage?.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={result.bestPercentage} className="mt-2 h-2" />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>
                          {result.totalAttempts} attempt{result.totalAttempts !== 1 ? "s" : ""}
                        </span>
                        {quiz.maxAttempts && (
                          <span>Max: {quiz.maxAttempts}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="sr-only">{quiz.title}</DialogTitle>
                </DialogHeader>
                <QuizPlayer
                  quizId={quiz._id}
                  courseId={courseId}
                  onComplete={handleQuizComplete}
                />
              </DialogContent>
            </Dialog>
          );
        })}
      </CardContent>
    </Card>
  );
}
