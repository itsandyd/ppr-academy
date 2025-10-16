"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Send,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LessonFeedbackPromptProps {
  lessonTitle: string;
  lessonId: string;
  onSubmit?: (feedback: { rating: number; comment?: string }) => void;
  onSkip?: () => void;
  autoShow?: boolean;
}

export function LessonFeedbackPrompt({
  lessonTitle,
  lessonId,
  onSubmit,
  onSkip,
  autoShow = true
}: LessonFeedbackPromptProps) {
  const [isOpen, setIsOpen] = useState(autoShow);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [step, setStep] = useState<"rating" | "comment" | "complete">("rating");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingSelect = (stars: number) => {
    setRating(stars);
    // Auto-advance to comment step
    setTimeout(() => setStep("comment"), 300);
  };

  const handleSubmit = async () => {
    if (rating === null) return;

    setIsSubmitting(true);
    
    await onSubmit?.({ rating, comment: comment || undefined });
    
    setStep("complete");
    setIsSubmitting(false);

    // Auto close after showing success
    setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  const handleSkipFeedback = () => {
    onSkip?.();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-white dark:bg-black">
        <AnimatePresence mode="wait">
          {step === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-center">
                  Lesson Complete! 🎉
                </DialogTitle>
                <DialogDescription className="text-center">
                  How was <strong>{lessonTitle}</strong>?
                </DialogDescription>
              </DialogHeader>

              <div className="py-8">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => handleRatingSelect(stars)}
                      className={cn(
                        "w-12 h-12 rounded-lg transition-all hover:scale-110",
                        rating === stars
                          ? "bg-yellow-400 text-white"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                      )}
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 mx-auto",
                          rating && rating >= stars 
                            ? "fill-yellow-600 text-yellow-600"
                            : "text-slate-400"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Tap a star to rate this lesson
                </p>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" size="sm" onClick={handleSkipFeedback}>
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}

          {step === "comment" && (
            <motion.div
              key="comment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center justify-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <Star
                        key={stars}
                        className={cn(
                          "w-5 h-5",
                          rating && rating >= stars 
                            ? "fill-yellow-600 text-yellow-600"
                            : "text-slate-300"
                        )}
                      />
                    ))}
                  </div>
                </DialogTitle>
                <DialogDescription className="text-center">
                  Share your thoughts (optional)
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <Textarea
                  placeholder="What did you think of this lesson? Any suggestions?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleSkipFeedback}
                  >
                    Skip
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <ThumbsUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thank You! 🙏</h3>
                <p className="text-muted-foreground">
                  Your feedback helps us improve the course
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Simpler version - just quick rating without modal
export function QuickLessonRating({
  lessonTitle,
  lessonId,
  onRate
}: {
  lessonTitle: string;
  lessonId: string;
  onRate?: (rating: number) => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const handleRate = (stars: number) => {
    setRating(stars);
    onRate?.(stars);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <MessageSquare className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium mb-1">How was this lesson?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              onClick={() => handleRate(stars)}
              className="transition-transform hover:scale-125"
            >
              <Star
                className={cn(
                  "w-5 h-5",
                  rating && rating >= stars
                    ? "fill-yellow-600 text-yellow-600"
                    : "text-slate-300 hover:text-yellow-400"
                )}
              />
            </button>
          ))}
        </div>
      </div>
      
      <AnimatePresence>
        {showThanks && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-green-600"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">Thanks!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

