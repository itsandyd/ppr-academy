"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreVertical,
  Play,
  Calendar,
  Archive,
  BookOpen,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { ViralityBadge, ViralityBreakdown } from "./ViralityBadge";
import { useToast } from "@/hooks/use-toast";

interface GeneratedScript {
  _id: Id<"generatedScripts">;
  courseTitle: string;
  chapterTitle: string;
  chapterPosition: number;
  sourceContentSnippet: string;
  tiktokScript: string;
  youtubeScript: string;
  instagramScript: string;
  combinedScript: string;
  viralityScore: number;
  viralityAnalysis: {
    engagementPotential: number;
    educationalValue: number;
    trendAlignment: number;
    reasoning: string;
  };
  suggestedAccountProfileId?: Id<"socialAccountProfiles">;
  topicMatch?: string[];
  accountMatchScore?: number;
  status: string;
  actualPerformance?: {
    views?: number;
    likes?: number;
    comments?: number;
    performanceScore?: number;
  };
  userFeedback?: {
    rating?: number;
    audienceReaction?: string;
  };
  predictionAccuracy?: number;
}

interface ScriptCardProps {
  script: GeneratedScript;
  accountName?: string;
  onSchedule?: (scriptId: Id<"generatedScripts">) => void;
  onFeedback?: (scriptId: Id<"generatedScripts">) => void;
}

export function ScriptCard({
  script,
  accountName,
  onSchedule,
  onFeedback,
}: ScriptCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"combined" | "tiktok" | "youtube" | "instagram">("combined");

  const archiveScript = useMutation(api.generatedScripts.archiveScript);

  const handleUseScript = () => {
    // Navigate to social media generator with this script
    router.push(`/dashboard/social/create?fromScript=${script._id}&step=combine&mode=create`);
  };

  const handleArchive = async () => {
    try {
      await archiveScript({ scriptId: script._id });
      toast({
        title: "Script archived",
        description: "The script has been moved to archive.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to archive script",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get first line of combined script as preview
  const scriptPreview = script.combinedScript
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 2)
    .join(" ")
    .slice(0, 150);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <ViralityBadge score={script.viralityScore} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{script.chapterTitle}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {script.courseTitle}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleUseScript}>
                  <Play className="mr-2 h-4 w-4" />
                  Use Script
                </DropdownMenuItem>
                {onSchedule && script.status !== "scheduled" && (
                  <DropdownMenuItem onClick={() => onSchedule(script._id)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowDetailDialog(true)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {(script.status === "completed" || script.status === "scheduled") &&
                  onFeedback && (
                    <DropdownMenuItem onClick={() => onFeedback(script._id)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Feedback
                    </DropdownMenuItem>
                  )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive} className="text-muted-foreground">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {scriptPreview}...
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={getStatusColor(script.status)}>
              {script.status.replace("_", " ")}
            </Badge>
            {accountName && (
              <Badge variant="secondary" className="text-xs">
                {accountName}
              </Badge>
            )}
            {script.topicMatch && script.topicMatch.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {script.topicMatch[0]}
                {script.topicMatch.length > 1 && ` +${script.topicMatch.length - 1}`}
              </Badge>
            )}
          </div>

          {script.predictionAccuracy !== undefined && (
            <div className="text-xs text-muted-foreground">
              Prediction accuracy: {Math.round(script.predictionAccuracy)}%
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailDialog(true)}
            >
              View Script
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleUseScript}>
              Use Script
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <ViralityBadge score={script.viralityScore} size="lg" />
              <div>
                <span className="block">{script.chapterTitle}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {script.courseTitle}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription>
              {script.viralityAnalysis.reasoning}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Virality Breakdown */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Virality Analysis</h4>
              <ViralityBreakdown
                engagementPotential={script.viralityAnalysis.engagementPotential}
                educationalValue={script.viralityAnalysis.educationalValue}
                trendAlignment={script.viralityAnalysis.trendAlignment}
              />
            </div>

            {/* Script Tabs */}
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["combined", "tiktok", "youtube", "instagram"] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className="capitalize"
                  >
                    {tab}
                  </Button>
                ))}
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {activeTab === "combined" && script.combinedScript}
                  {activeTab === "tiktok" && script.tiktokScript}
                  {activeTab === "youtube" && script.youtubeScript}
                  {activeTab === "instagram" && script.instagramScript}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
              <Button onClick={handleUseScript}>
                Use This Script
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
