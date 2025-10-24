"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AskQuestionForm } from "./AskQuestionForm";
import { QuestionCard } from "./QuestionCard";
import { AnswerCard } from "./AnswerCard";
import { PostAnswerForm } from "./PostAnswerForm";
import { MessageSquare, ArrowLeft, Loader2 } from "lucide-react";

interface LessonQASectionProps {
  courseId: Id<"courses">;
  lessonId: string;
  chapterIndex?: number;
  lessonIndex?: number;
  isInstructor?: boolean;
}

export function LessonQASection({
  courseId,
  lessonId,
  chapterIndex,
  lessonIndex,
  isInstructor = false,
}: LessonQASectionProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<Id<"questions"> | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "votes" | "unanswered">("recent");

  const questions = useQuery(api.qa.getQuestionsByLesson, {
    courseId,
    lessonId,
    sortBy,
  });

  const selectedQuestion = useQuery(
    api.qa.getQuestion,
    selectedQuestionId ? { questionId: selectedQuestionId } : "skip"
  );

  const answers = useQuery(
    api.qa.getAnswersByQuestion,
    selectedQuestionId ? { questionId: selectedQuestionId } : "skip"
  );

  const incrementViewCount = useMutation(api.qa.incrementViewCount);

  const handleQuestionClick = (questionId: Id<"questions">) => {
    setSelectedQuestionId(questionId);
    incrementViewCount({ questionId });
  };

  const handleBackToList = () => {
    setSelectedQuestionId(null);
  };

  // Question Detail View
  if (selectedQuestionId && selectedQuestion) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={handleBackToList}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>

        <QuestionCard
          question={selectedQuestion}
          showFullContent
        />

        {/* Answers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {answers?.length || 0} {answers?.length === 1 ? "Answer" : "Answers"}
          </h3>

          {answers === undefined ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : answers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No answers yet. Be the first to help!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <AnswerCard
                  key={answer._id}
                  answer={answer}
                  questionAuthorId={selectedQuestion.authorId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Post Answer Form */}
        <PostAnswerForm
          questionId={selectedQuestionId}
          courseId={courseId}
          isInstructor={isInstructor}
          onSuccess={() => {
            // Answers will auto-refresh via Convex reactivity
          }}
        />
      </div>
    );
  }

  // Questions List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <MessageSquare className="w-6 h-6" />
          Questions & Answers
        </h2>
      </div>

      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="votes">Most Voted</TabsTrigger>
          <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
        </TabsList>

        <TabsContent value={sortBy} className="space-y-6 mt-6 focus-visible:outline-none focus-visible:ring-0">
          {/* Ask Question Form */}
          <AskQuestionForm
            courseId={courseId}
            lessonId={lessonId}
            chapterIndex={chapterIndex}
            lessonIndex={lessonIndex}
            onSuccess={() => {
              // Questions will auto-refresh via Convex reactivity
            }}
          />

          {/* Questions List */}
          {questions === undefined ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                <p className="text-muted-foreground">
                  Be the first to ask a question about this lesson!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  onClick={() => handleQuestionClick(question._id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
