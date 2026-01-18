"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  _id: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  jobType: "full_scan" | "course_scan" | "incremental";
  totalChapters?: number;
  processedChapters?: number;
  failedChapters?: number;
  scriptsGenerated?: number;
  averageViralityScore?: number;
  startedAt?: number;
  completedAt?: number;
  updatedAt?: number;
  lastError?: string;
}

interface GenerationJobStatusProps {
  job: Job;
}

export function GenerationJobStatus({ job }: GenerationJobStatusProps) {
  const { toast } = useToast();
  const [isResuming, setIsResuming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelJob = useAction(api.masterAI.socialScriptAgent.cancelJob);
  const resumeJob = useAction(api.masterAI.socialScriptAgent.resumeJob);

  const progress =
    job.totalChapters && job.totalChapters > 0
      ? Math.round(((job.processedChapters || 0) / job.totalChapters) * 100)
      : 0;

  // Check if job appears stalled (no update in 2+ minutes while processing)
  const isStalled =
    job.status === "processing" && job.updatedAt && Date.now() - job.updatedAt > 2 * 60 * 1000;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelJob({ jobId: job._id as Id<"scriptGenerationJobs"> });
      toast({
        title: "Job cancelled",
        description: "The generation job has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel job",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await resumeJob({ jobId: job._id as Id<"scriptGenerationJobs"> });
      toast({
        title: "Job resumed",
        description: "Processing will continue from where it left off.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resume job",
        variant: "destructive",
      });
    } finally {
      setIsResuming(false);
    }
  };

  const getStatusIcon = () => {
    if (isStalled) {
      return <Clock className="h-4 w-4 text-orange-500" />;
    }
    switch (job.status) {
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "queued":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getJobTypeLabel = () => {
    switch (job.jobType) {
      case "full_scan":
        return "Full content scan";
      case "course_scan":
        return "Course scan";
      case "incremental":
        return "New content scan";
      default:
        return "Generation job";
    }
  };

  const getEstimatedTime = () => {
    if (job.status !== "processing" || !job.startedAt || !job.totalChapters) return null;

    const elapsed = Date.now() - job.startedAt;
    const processed = job.processedChapters || 0;
    if (processed === 0) return "Calculating...";

    const avgTimePerChapter = elapsed / processed;
    const remaining = job.totalChapters - processed;
    const estimatedMs = remaining * avgTimePerChapter;

    if (estimatedMs < 60000) {
      return `~${Math.round(estimatedMs / 1000)}s remaining`;
    } else {
      return `~${Math.round(estimatedMs / 60000)}min remaining`;
    }
  };

  return (
    <Card
      className={`${isStalled ? "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20" : "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"}`}
    >
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getJobTypeLabel()}</span>
            <Badge
              variant="outline"
              className={
                isStalled
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  : getStatusColor()
              }
            >
              {isStalled ? "stalled" : job.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {job.status === "processing" && !isStalled && getEstimatedTime() && (
              <span className="text-sm text-muted-foreground">{getEstimatedTime()}</span>
            )}
            {isStalled && (
              <Button variant="outline" size="sm" onClick={handleResume} disabled={isResuming}>
                {isResuming ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3 w-3" />
                )}
                Resume
              </Button>
            )}
            {(job.status === "queued" || job.status === "processing") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
                className="text-muted-foreground hover:text-destructive"
              >
                {isCancelling ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {(job.status === "processing" || job.status === "queued") && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {job.processedChapters || 0} / {job.totalChapters || "?"} chapters
              </span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {job.status === "completed" && (
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="font-medium">{job.scriptsGenerated || 0}</span> scripts generated
            </span>
            {job.averageViralityScore && (
              <span>
                Avg virality:{" "}
                <span className="font-medium">{job.averageViralityScore.toFixed(1)}/10</span>
              </span>
            )}
            {job.failedChapters && job.failedChapters > 0 && (
              <span className="text-orange-600">{job.failedChapters} failed</span>
            )}
          </div>
        )}

        {job.status === "failed" && job.lastError && (
          <p className="mt-2 text-sm text-red-600">{job.lastError}</p>
        )}
      </CardContent>
    </Card>
  );
}
