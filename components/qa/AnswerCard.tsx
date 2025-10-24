"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, CheckCircle2, Award, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface AnswerCardProps {
  answer: {
    _id: Id<"answers">;
    questionId: Id<"questions">;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    isInstructor: boolean;
    isAccepted: boolean;
    upvotes: number;
    createdAt: number;
  };
  questionAuthorId: string;
  onAccept?: () => void;
}

export function AnswerCard({ answer, questionAuthorId, onAccept }: AnswerCardProps) {
  const { user } = useUser();
  const [isVoting, setIsVoting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const userVote = useQuery(
    api.qa.getUserVote,
    user
      ? {
          userId: user.id,
          targetType: "answer",
          targetId: answer._id,
        }
      : "skip"
  );

  const vote = useMutation(api.qa.vote);
  const acceptAnswer = useMutation(api.qa.acceptAnswer);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    setIsVoting(true);

    try {
      const result = await vote({
        userId: user.id,
        targetType: "answer",
        targetId: answer._id,
        voteType,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }

    setIsAccepting(true);

    try {
      const result = await acceptAnswer({
        questionId: answer.questionId,
        answerId: answer._id,
        userId: user.id,
      });

      if (result.success) {
        toast.success("Answer marked as best answer!");
        onAccept?.();
      } else {
        toast.error(result.error || "Failed to accept answer");
      }
    } catch (error) {
      console.error("Error accepting answer:", error);
      toast.error("Failed to accept answer");
    } finally {
      setIsAccepting(false);
    }
  };

  const isUpvoted = userVote?.voteType === "upvote";
  const isDownvoted = userVote?.voteType === "downvote";
  const canAccept = user?.id === questionAuthorId && !answer.isAccepted;

  return (
    <Card className={`bg-card border-border ${answer.isAccepted ? "border-green-500 dark:border-green-600 border-2" : ""}`}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Voting Column */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("upvote")}
              disabled={isVoting}
              className={isUpvoted ? "text-primary" : ""}
            >
              <ThumbsUp className={`w-5 h-5 ${isUpvoted ? "fill-current" : ""}`} />
            </Button>
            <span className="text-lg font-bold text-foreground">{answer.upvotes}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("downvote")}
              disabled={isVoting}
              className={isDownvoted ? "text-destructive" : ""}
            >
              <ThumbsDown className={`w-5 h-5 ${isDownvoted ? "fill-current" : ""}`} />
            </Button>
            
            {answer.isAccepted && (
              <div className="mt-2">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>

          {/* Answer Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={answer.authorAvatar} alt={answer.authorName} />
                  <AvatarFallback className="bg-muted text-foreground">{answer.authorName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{answer.authorName}</span>
                    {answer.isInstructor && (
                      <Badge variant="secondary" className="text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Instructor
                      </Badge>
                    )}
                    {answer.isAccepted && (
                      <Badge variant="default" className="bg-green-600 dark:bg-green-700 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Best Answer
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(answer.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </div>

              {canAccept && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Best Answer
                </Button>
              )}
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{answer.content}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
