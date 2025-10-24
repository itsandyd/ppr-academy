"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus } from "lucide-react";

interface AskQuestionFormProps {
  courseId: Id<"courses">;
  lessonId: string;
  chapterIndex?: number;
  lessonIndex?: number;
  onSuccess?: () => void;
}

export function AskQuestionForm({
  courseId,
  lessonId,
  chapterIndex,
  lessonIndex,
  onSuccess,
}: AskQuestionFormProps) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const askQuestion = useMutation(api.qa.askQuestion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to ask a question");
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and question");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await askQuestion({
        courseId,
        lessonId,
        chapterIndex,
        lessonIndex,
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        authorName: user.fullName || user.firstName || "Anonymous",
        authorAvatar: user.imageUrl,
      });

      if (result.success) {
        toast.success("Question posted successfully!");
        setTitle("");
        setContent("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to post question");
      }
    } catch (error) {
      console.error("Error posting question:", error);
      toast.error("Failed to post question");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to ask questions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageSquarePlus className="w-5 h-5" />
          Ask a Question
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Get help from instructors and other students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question-title" className="text-sm font-medium mb-2 block text-foreground">
              Question Title <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Input
              id="question-title"
              placeholder="e.g., How do I use the EQ Eight in Ableton?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={200}
              className={`bg-background text-foreground ${!title.trim() && title !== "" ? "border-red-500 dark:border-red-400" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="question-content" className="text-sm font-medium mb-2 block text-foreground">
              Question Details <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Textarea
              id="question-content"
              placeholder="Describe your question in detail. Include any relevant context or what you've tried so far..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={6}
              maxLength={2000}
              className={`bg-background text-foreground ${!content.trim() && content !== "" ? "border-red-500 dark:border-red-400" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/2000 characters
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Be specific and provide context for better answers
            </p>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Question"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
