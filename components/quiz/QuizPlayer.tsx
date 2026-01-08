"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trophy,
  RotateCcw,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizPlayerProps {
  quizId: Id<"quizzes">;
  courseId: Id<"courses">;
  onComplete?: (passed: boolean, score: number) => void;
}

type QuestionType = "multiple_choice" | "true_false" | "fill_blank" | "short_answer" | "essay" | "matching";

interface Question {
  _id: Id<"quizQuestions">;
  questionType: QuestionType;
  questionText: string;
  questionImage?: string;
  explanation?: string;
  points: number;
  answers: any;
  order: number;
}

interface Answer {
  questionId: Id<"quizQuestions">;
  answer: any;
}

export function QuizPlayer({ quizId, courseId, onComplete }: QuizPlayerProps) {
  const { user } = useUser();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [attemptId, setAttemptId] = useState<Id<"quizAttempts"> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    percentage: number;
    passed: boolean;
  } | null>(null);

  // Fetch quiz with questions
  const quizData = useQuery(api.quizzes.getQuizWithQuestions, { quizId });

  // Fetch existing results (when quizId is provided, returns single object)
  const existingResultsRaw = useQuery(
    api.quizzes.getUserQuizResults,
    user?.id ? { userId: user.id, quizId } : "skip"
  );
  // Handle the union type - when quizId is provided, it's a single object
  const existingResults = existingResultsRaw && !Array.isArray(existingResultsRaw)
    ? existingResultsRaw
    : null;

  // Mutations
  const startAttempt = useMutation(api.quizzes.startQuizAttempt);
  const submitAttempt = useMutation(api.quizzes.submitQuizAttempt);

  // Timer effect
  useEffect(() => {
    if (attemptId && quizData?.timeLimit && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev !== null && prev <= 1) {
            // Auto-submit when time runs out
            handleSubmit();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [attemptId, quizData?.timeLimit, timeLeft]);

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get questions (optionally shuffled)
  const questions: Question[] = quizData?.questions
    ? quizData.shuffleQuestions
      ? shuffleArray(quizData.questions)
      : quizData.questions.sort((a: Question, b: Question) => a.order - b.order)
    : [];

  const currentQuestion = questions[currentQuestionIndex];

  // Start quiz
  const handleStartQuiz = async () => {
    if (!user?.id) {
      toast.error("Please sign in to take this quiz");
      return;
    }

    try {
      const result = await startAttempt({
        quizId,
        userId: user.id,
        courseId,
      });

      if (result.success && result.attemptId) {
        setAttemptId(result.attemptId);
        if (quizData?.timeLimit) {
          setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
        }
        toast.success("Quiz started! Good luck!");
      } else {
        toast.error(result.error || "Failed to start quiz");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz");
    }
  };

  // Handle answer change
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }, []);

  // Submit quiz
  const handleSubmit = async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formattedAnswers: Answer[] = Array.from(answers.entries()).map(([questionId, answer]) => ({
        questionId: questionId as Id<"quizQuestions">,
        answer,
      }));

      const result = await submitAttempt({
        attemptId,
        answers: formattedAnswers,
      });

      if (result.success) {
        setResults({
          score: result.score || 0,
          percentage: result.percentage || 0,
          passed: result.passed || false,
        });
        setShowResults(true);
        onComplete?.(result.passed || false, result.score || 0);

        if (result.passed) {
          toast.success("Congratulations! You passed the quiz!");
        } else {
          toast.info("Quiz completed. Review your results.");
        }
      } else {
        toast.error(result.error || "Failed to submit quiz");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (!quizData) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="py-12 text-center">
          <div className="animate-pulse">Loading quiz...</div>
        </CardContent>
      </Card>
    );
  }

  // Results view
  if (showResults && results) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {results.passed ? (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {results.passed ? "Congratulations!" : "Quiz Complete"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{results.score}</p>
                <p className="text-sm text-muted-foreground">Points Earned</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{results.percentage.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={results.percentage} className="h-3" />
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Passing score: {quizData.passingScore}%
              </p>
            </div>
          </div>

          {results.passed ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <p className="text-center text-green-700 dark:text-green-300">
                You passed the quiz! Your progress has been saved.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-center text-amber-700 dark:text-amber-300">
                You need {quizData.passingScore}% to pass.
                {quizData.maxAttempts
                  ? ` You have ${quizData.maxAttempts - (existingResults?.totalAttempts || 0)} attempts remaining.`
                  : " You can retry this quiz."}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {!results.passed && (quizData.maxAttempts === undefined ||
            (existingResults?.totalAttempts || 0) < quizData.maxAttempts) && (
            <Button
              onClick={() => {
                setShowResults(false);
                setAttemptId(null);
                setAnswers(new Map());
                setCurrentQuestionIndex(0);
                setResults(null);
              }}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button onClick={() => onComplete?.(results.passed, results.score)}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Pre-quiz view
  if (!attemptId) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            {quizData.title}
          </CardTitle>
          {quizData.description && (
            <p className="text-muted-foreground">{quizData.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{quizData.totalPoints}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{quizData.passingScore}%</p>
              <p className="text-sm text-muted-foreground">Pass Score</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">
                {quizData.timeLimit ? `${quizData.timeLimit}m` : "∞"}
              </p>
              <p className="text-sm text-muted-foreground">Time Limit</p>
            </div>
          </div>

          {existingResults && (
            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/30">
              <h4 className="mb-2 font-semibold">Your Previous Attempts</h4>
              <p className="text-sm text-muted-foreground">
                Best score: {existingResults.bestPercentage?.toFixed(1)}% |
                Attempts: {existingResults.totalAttempts}
                {quizData.maxAttempts && ` / ${quizData.maxAttempts}`}
              </p>
            </div>
          )}

          <div className="space-y-2 rounded-lg border p-4">
            <h4 className="font-semibold">Quiz Rules</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {quizData.timeLimit && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  You have {quizData.timeLimit} minutes to complete this quiz
                </li>
              )}
              {quizData.maxAttempts && (
                <li className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Maximum {quizData.maxAttempts} attempts allowed
                </li>
              )}
              {quizData.showScoreImmediately && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Your score will be shown immediately after submission
                </li>
              )}
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartQuiz} className="w-full" size="lg">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Question view
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <Progress
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            className="h-2 w-32"
          />
        </div>
        {timeLeft !== null && (
          <Badge
            variant={timeLeft < 60 ? "destructive" : "secondary"}
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.questionText}
              </CardTitle>
            </div>
            <Badge variant="outline">{currentQuestion.points} pts</Badge>
          </div>
          {currentQuestion.questionImage && (
            <img
              src={currentQuestion.questionImage}
              alt="Question illustration"
              className="mt-4 max-h-64 rounded-lg object-contain"
            />
          )}
        </CardHeader>
        <CardContent>
          {/* Render question based on type */}
          {currentQuestion.questionType === "multiple_choice" && (
            <MultipleChoiceQuestion
              question={currentQuestion}
              answer={answers.get(currentQuestion._id)}
              onChange={(value) => handleAnswerChange(currentQuestion._id, value)}
              shuffleAnswers={quizData.shuffleAnswers}
            />
          )}
          {currentQuestion.questionType === "true_false" && (
            <TrueFalseQuestion
              question={currentQuestion}
              answer={answers.get(currentQuestion._id)}
              onChange={(value) => handleAnswerChange(currentQuestion._id, value)}
            />
          )}
          {currentQuestion.questionType === "fill_blank" && (
            <FillBlankQuestion
              question={currentQuestion}
              answer={answers.get(currentQuestion._id)}
              onChange={(value) => handleAnswerChange(currentQuestion._id, value)}
            />
          )}
          {(currentQuestion.questionType === "short_answer" ||
            currentQuestion.questionType === "essay") && (
            <TextQuestion
              question={currentQuestion}
              answer={answers.get(currentQuestion._id)}
              onChange={(value) => handleAnswerChange(currentQuestion._id, value)}
              isLong={currentQuestion.questionType === "essay"}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <Button
                key={q._id}
                variant={currentQuestionIndex === index ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0",
                  answers.has(q._id) && currentQuestionIndex !== index && "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                )}
                onClick={() => goToQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            {answers.size} of {questions.length} questions answered
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Question Type Components
function MultipleChoiceQuestion({
  question,
  answer,
  onChange,
  shuffleAnswers,
}: {
  question: Question;
  answer?: string;
  onChange: (value: string) => void;
  shuffleAnswers?: boolean;
}) {
  const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([]);

  useEffect(() => {
    if (shuffleAnswers) {
      setOptions(shuffleArray(question.answers));
    } else {
      setOptions(question.answers);
    }
  }, [question._id, shuffleAnswers]);

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return (
    <RadioGroup value={answer || ""} onValueChange={onChange} className="space-y-3">
      {options.map((option, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center space-x-3 rounded-lg border p-4 transition-colors",
            answer === option.text
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50"
          )}
        >
          <RadioGroupItem value={option.text} id={`option-${index}`} />
          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
            {option.text}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function TrueFalseQuestion({
  question,
  answer,
  onChange,
}: {
  question: Question;
  answer?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-4">
      <Button
        variant={answer === true ? "default" : "outline"}
        className="flex-1 gap-2 py-6"
        onClick={() => onChange(true)}
      >
        <CheckCircle className="h-5 w-5" />
        True
      </Button>
      <Button
        variant={answer === false ? "default" : "outline"}
        className="flex-1 gap-2 py-6"
        onClick={() => onChange(false)}
      >
        <XCircle className="h-5 w-5" />
        False
      </Button>
    </div>
  );
}

function FillBlankQuestion({
  question,
  answer,
  onChange,
}: {
  question: Question;
  answer?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Type your answer..."
        value={answer || ""}
        onChange={(e) => onChange(e.target.value)}
        className="text-lg"
      />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        Enter your answer in the field above
      </p>
    </div>
  );
}

function TextQuestion({
  question,
  answer,
  onChange,
  isLong,
}: {
  question: Question;
  answer?: string;
  onChange: (value: string) => void;
  isLong?: boolean;
}) {
  return (
    <div className="space-y-4">
      {isLong ? (
        <Textarea
          placeholder="Write your answer..."
          value={answer || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
        />
      ) : (
        <Input
          placeholder="Type your answer..."
          value={answer || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {isLong && (
        <p className="text-sm text-muted-foreground">
          This is an essay question. Write a detailed response.
        </p>
      )}
    </div>
  );
}
