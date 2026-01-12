"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  X,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";

interface PerformanceFeedbackDialogProps {
  scriptId: Id<"generatedScripts">;
  scriptTitle: string;
  viralityScore: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PerformanceFeedbackDialog({
  scriptId,
  scriptTitle,
  viralityScore,
  open,
  onOpenChange,
}: PerformanceFeedbackDialogProps) {
  const { toast } = useToast();
  const submitPerformanceFeedback = useMutation(
    api.generatedScripts.submitPerformanceFeedback
  );
  const submitUserFeedback = useMutation(
    api.generatedScripts.submitUserFeedback
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("metrics");

  // Performance metrics
  const [views, setViews] = useState<string>("");
  const [likes, setLikes] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [shares, setShares] = useState<string>("");
  const [saves, setSaves] = useState<string>("");

  // User feedback
  const [rating, setRating] = useState<number>(3);
  const [notes, setNotes] = useState<string>("");
  const [audienceReaction, setAudienceReaction] = useState<
    "positive" | "mixed" | "negative" | ""
  >("");
  const [whatWorked, setWhatWorked] = useState<string[]>([]);
  const [whatDidntWork, setWhatDidntWork] = useState<string[]>([]);
  const [newWorkedTag, setNewWorkedTag] = useState("");
  const [newDidntWorkTag, setNewDidntWorkTag] = useState("");

  const resetForm = () => {
    setViews("");
    setLikes("");
    setComments("");
    setShares("");
    setSaves("");
    setRating(3);
    setNotes("");
    setAudienceReaction("");
    setWhatWorked([]);
    setWhatDidntWork([]);
    setNewWorkedTag("");
    setNewDidntWorkTag("");
    setActiveTab("metrics");
  };

  const handleAddWorkedTag = () => {
    if (newWorkedTag.trim() && !whatWorked.includes(newWorkedTag.trim())) {
      setWhatWorked([...whatWorked, newWorkedTag.trim()]);
      setNewWorkedTag("");
    }
  };

  const handleAddDidntWorkTag = () => {
    if (
      newDidntWorkTag.trim() &&
      !whatDidntWork.includes(newDidntWorkTag.trim())
    ) {
      setWhatDidntWork([...whatDidntWork, newDidntWorkTag.trim()]);
      setNewDidntWorkTag("");
    }
  };

  const handleRemoveWorkedTag = (tag: string) => {
    setWhatWorked(whatWorked.filter((t) => t !== tag));
  };

  const handleRemoveDidntWorkTag = (tag: string) => {
    setWhatDidntWork(whatDidntWork.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Submit performance metrics if any are provided
      const hasMetrics = views || likes || comments || shares || saves;
      if (hasMetrics) {
        await submitPerformanceFeedback({
          scriptId,
          views: views ? parseInt(views) : undefined,
          likes: likes ? parseInt(likes) : undefined,
          comments: comments ? parseInt(comments) : undefined,
          shares: shares ? parseInt(shares) : undefined,
          saves: saves ? parseInt(saves) : undefined,
        });
      }

      // Submit user feedback if any is provided
      const hasFeedback =
        rating !== 3 ||
        notes ||
        audienceReaction ||
        whatWorked.length > 0 ||
        whatDidntWork.length > 0;
      if (hasFeedback) {
        await submitUserFeedback({
          scriptId,
          rating: rating !== 3 ? rating : undefined,
          notes: notes || undefined,
          audienceReaction: audienceReaction || undefined,
          whatWorked: whatWorked.length > 0 ? whatWorked : undefined,
          whatDidntWork: whatDidntWork.length > 0 ? whatDidntWork : undefined,
        });
      }

      toast({
        title: "Feedback Submitted",
        description:
          "Your feedback will help improve future script generations.",
      });

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedWorkedTags = [
    "Hook was engaging",
    "CTA converted well",
    "Good pacing",
    "Clear message",
    "Relatable content",
    "Trending format",
  ];

  const suggestedDidntWorkTags = [
    "Too long",
    "Sounded AI-generated",
    "Unclear CTA",
    "Poor hook",
    "Wrong tone",
    "Off-topic",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Performance Feedback</DialogTitle>
          <DialogDescription>
            Track how &quot;{scriptTitle}&quot; performed. Predicted virality:{" "}
            <span className="font-semibold">{viralityScore}/10</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="feedback">Your Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Enter the actual performance metrics from your post
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="views" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Views
                </Label>
                <Input
                  id="views"
                  type="number"
                  placeholder="0"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="likes" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Likes
                </Label>
                <Input
                  id="likes"
                  type="number"
                  placeholder="0"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Comments
                </Label>
                <Input
                  id="comments"
                  type="number"
                  placeholder="0"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shares" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Shares
                </Label>
                <Input
                  id="shares"
                  type="number"
                  placeholder="0"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="saves" className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" /> Saves
                </Label>
                <Input
                  id="saves"
                  type="number"
                  placeholder="0"
                  value={saves}
                  onChange={(e) => setSaves(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Your Rating</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[rating]}
                  onValueChange={([v]) => setRating(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-lg font-semibold w-8 text-center">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Audience Reaction</Label>
              <Select
                value={audienceReaction}
                onValueChange={(v) =>
                  setAudienceReaction(v as "positive" | "mixed" | "negative")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did the audience react?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" /> Positive
                    </div>
                  </SelectItem>
                  <SelectItem value="mixed">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-yellow-500" /> Mixed
                    </div>
                  </SelectItem>
                  <SelectItem value="negative">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" /> Negative
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>What Worked</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {whatWorked.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => handleRemoveWorkedTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add what worked..."
                  value={newWorkedTag}
                  onChange={(e) => setNewWorkedTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWorkedTag()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddWorkedTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestedWorkedTags
                  .filter((tag) => !whatWorked.includes(tag))
                  .slice(0, 4)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer text-xs"
                      onClick={() => setWhatWorked([...whatWorked, tag])}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>What Didn&apos;t Work</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {whatDidntWork.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 cursor-pointer bg-red-100 dark:bg-red-900/30"
                    onClick={() => handleRemoveDidntWorkTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add what didn't work..."
                  value={newDidntWorkTag}
                  onChange={(e) => setNewDidntWorkTag(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddDidntWorkTag()
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddDidntWorkTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestedDidntWorkTags
                  .filter((tag) => !whatDidntWork.includes(tag))
                  .slice(0, 4)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer text-xs border-red-200 dark:border-red-800"
                      onClick={() => setWhatDidntWork([...whatDidntWork, tag])}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any other observations about the post's performance..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
