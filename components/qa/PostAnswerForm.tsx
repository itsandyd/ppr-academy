"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface PostAnswerFormProps {
  questionId: Id<"questions">;
  courseId: Id<"courses">;
  isInstructor?: boolean;
  onSuccess?: () => void;
}

export function PostAnswerForm({
  questionId,
  courseId,
  isInstructor = false,
  onSuccess,
}: PostAnswerFormProps) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postAnswer = useMutation(api.qa.postAnswer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to post an answer");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write an answer");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await postAnswer({
        questionId,
        courseId,
        content: content.trim(),
        authorId: user.id,
        authorName: user.fullName || user.firstName || "Anonymous",
        authorAvatar: user.imageUrl,
        isInstructor,
      });

      if (result.success) {
        toast.success("Answer posted successfully!");
        setContent("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to post answer");
      }
    } catch (error) {
      console.error("Error posting answer:", error);
      toast.error("Failed to post answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to post answers
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Your Answer</CardTitle>
        <CardDescription className="text-muted-foreground">
          {isInstructor
            ? "Share your expertise to help this student"
            : "Help answer this question"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Write your answer here... Be clear, helpful, and provide examples if possible."
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

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Provide step-by-step instructions and explain why
            </p>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post Answer
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
