"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  Eye,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface QuestionCardProps {
  question: {
    _id: Id<"questions">;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    isResolved: boolean;
    viewCount: number;
    upvotes: number;
    answerCount: number;
    createdAt: number;
    lastActivityAt: number;
  };
  onClick?: () => void;
  showFullContent?: boolean;
}

export function QuestionCard({ question, onClick, showFullContent = false }: QuestionCardProps) {
  const { user } = useUser();
  const [isVoting, setIsVoting] = useState(false);

  const userVote = useQuery(
    api.qa.getUserVote,
    user
      ? {
          userId: user.id,
          targetType: "question",
          targetId: question._id,
        }
      : "skip"
  );

  const vote = useMutation(api.qa.vote);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    setIsVoting(true);

    try {
      const result = await vote({
        userId: user.id,
        targetType: "question",
        targetId: question._id,
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

  const isUpvoted = userVote?.voteType === "upvote";
  const isDownvoted = userVote?.voteType === "downvote";

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={question.authorAvatar} alt={question.authorName} />
              <AvatarFallback>{question.authorName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{question.authorName}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(question.createdAt, { addSuffix: true })}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg leading-tight mb-2">
                {question.title}
              </h3>
              
              {showFullContent ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {question.content}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {question.content}
                </p>
              )}
            </div>
          </div>

          {question.isResolved && (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Resolved
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Voting */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote("upvote");
                }}
                disabled={isVoting}
                className={isUpvoted ? "text-primary" : ""}
              >
                <ThumbsUp className={`w-4 h-4 ${isUpvoted ? "fill-current" : ""}`} />
              </Button>
              <span className="text-sm font-medium min-w-[2ch] text-center">
                {question.upvotes}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote("downvote");
                }}
                disabled={isVoting}
                className={isDownvoted ? "text-destructive" : ""}
              >
                <ThumbsDown className={`w-4 h-4 ${isDownvoted ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Answer Count */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">
                {question.answerCount} {question.answerCount === 1 ? "answer" : "answers"}
              </span>
            </div>

            {/* View Count */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{question.viewCount} views</span>
            </div>
          </div>

          {!showFullContent && onClick && (
            <Button variant="outline" size="sm">
              View Discussion
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
