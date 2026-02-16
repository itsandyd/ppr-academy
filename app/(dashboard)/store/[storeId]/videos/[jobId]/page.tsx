"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  Mic,
  Code,
  Film,
  Sparkles,
  Download,
  Copy,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPreview } from "@/components/video/VideoPreview";
import { VideoExport } from "@/components/video/VideoExport";

// Pipeline step definitions
const PIPELINE_STEPS = [
  { key: "gathering_context", label: "Gathering course data", icon: FileText },
  { key: "generating_script", label: "Writing script", icon: Sparkles },
  { key: "generating_assets", label: "Generating images", icon: ImageIcon },
  { key: "generating_voice", label: "Generating voiceover", icon: Mic },
  { key: "generating_code", label: "Writing video composition", icon: Code },
  { key: "rendering", label: "Rendering video", icon: Film },
  { key: "post_processing", label: "Finishing up", icon: CheckCircle2 },
] as const;

type PipelineStepKey = (typeof PIPELINE_STEPS)[number]["key"];
type StepStatus = "pending" | "active" | "completed";

function getStepStatus(
  stepKey: PipelineStepKey,
  currentStatus: string
): StepStatus {
  const stepOrder: string[] = PIPELINE_STEPS.map((s) => s.key);
  const currentIdx = stepOrder.indexOf(currentStatus);
  const stepIdx = stepOrder.indexOf(stepKey);

  if (currentStatus === "completed" || currentStatus === "failed") {
    // If completed, all steps are done. If failed, mark steps up to current as done.
    return currentStatus === "completed" || stepIdx < currentIdx
      ? "completed"
      : stepIdx === currentIdx
        ? "active"
        : "pending";
  }
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function VideoJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const jobId = params.jobId as string;

  const [iterationFeedback, setIterationFeedback] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [scriptExpanded, setScriptExpanded] = useState(false);

  const job = useQuery(api.videos.getJob, {
    jobId: jobId as Id<"videoJobs">,
  });
  const script = useQuery(
    api.videos.getScript,
    job?.scriptId ? { scriptId: job.scriptId } : "skip"
  );
  const versions = useQuery(api.videos.getVersionHistory, {
    jobId: jobId as Id<"videoJobs">,
  });

  const iterateMutation = useMutation(api.videos.iterate);

  const handleIterate = async () => {
    if (!iterationFeedback.trim()) return;
    setIsIterating(true);
    try {
      const newJobId = await iterateMutation({
        jobId: jobId as Id<"videoJobs">,
        feedback: iterationFeedback.trim(),
      });
      setIterationFeedback("");
      router.push(`/store/${storeId}/videos/${newJobId}`);
    } catch (err) {
      console.error("Iteration failed:", err);
    } finally {
      setIsIterating(false);
    }
  };

  // Loading state
  if (job === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/store/${storeId}/videos`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Video Studio
        </Button>
        <Card className="p-12 text-center bg-card border-border">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Video job not found.</p>
        </Card>
      </div>
    );
  }

  const isInProgress =
    job.status !== "completed" && job.status !== "failed";
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";

  // Code is available once generating_code finishes
  const codeAvailable = !!job.generatedCode;
  // Video file is available once rendering is done
  const videoAvailable = isCompleted && !!job.videoUrl;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back nav */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push(`/store/${storeId}/videos`)}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Video Studio
        </Button>

        {/* Version badges */}
        {versions && versions.length > 1 && (
          <div className="flex flex-wrap items-center gap-1">
            {versions.map((v: { _id: string; version: number; iterationPrompt?: string; status: string; _creationTime: number }) => (
              <Button
                key={v._id}
                variant={v._id === jobId ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs h-7 px-2",
                  v._id === jobId && "bg-primary text-primary-foreground"
                )}
                onClick={() =>
                  router.push(`/store/${storeId}/videos/${v._id}`)
                }
              >
                v{v.version}
                {v.iterationPrompt && (
                  <span className="ml-1 text-xs opacity-70 max-w-[80px] truncate">
                    ({v.iterationPrompt})
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Progress Steps — show during generation */}
      {isInProgress && (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-5">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <h2 className="text-lg font-semibold text-foreground">
              Generating Video
            </h2>
          </div>

          <div className="space-y-3">
            {PIPELINE_STEPS.map((step) => {
              const status = getStepStatus(step.key, job.status);
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
                    status === "active" && "bg-primary/5"
                  )}
                >
                  {/* Status indicator */}
                  <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                    {status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : status === "active" ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  <StepIcon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      status === "completed"
                        ? "text-green-500"
                        : status === "active"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                    )}
                  />

                  <span
                    className={cn(
                      "text-sm font-medium flex-1",
                      status === "completed"
                        ? "text-foreground"
                        : status === "active"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Progress indicator for rendering step */}
                  {step.key === "rendering" && status === "active" && (
                    <div className="w-32">
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Overall progress */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-medium text-foreground">
                {job.progress}%
              </span>
            </div>
            <Progress value={job.progress} className="mt-2 h-2" />
          </div>
        </Card>
      )}

      {/* Failed State */}
      {isFailed && (
        <Card className="p-6 bg-card border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-500">
                Generation Failed
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {job.error || "An unknown error occurred."}
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    // Re-trigger with same params
                    handleIterate();
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Area: Preview + Script */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Video Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Show Remotion Player preview when code is available */}
          {codeAvailable && !videoAvailable && (
            <Card className="overflow-hidden bg-card border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Live Preview
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary"
                  >
                    Real-time
                  </Badge>
                </div>
              </div>
              <VideoPreview
                generatedCode={job.generatedCode!}
                images={job.imageUrls || []}
                audioUrl={job.audioUrl || null}
                durationInFrames={job.targetDuration * 30}
                fps={30}
                width={
                  job.aspectRatio === "16:9"
                    ? 1920
                    : job.aspectRatio === "1:1"
                      ? 1080
                      : 1080
                }
                height={
                  job.aspectRatio === "16:9"
                    ? 1080
                    : job.aspectRatio === "1:1"
                      ? 1080
                      : 1920
                }
              />
            </Card>
          )}

          {/* Show final video when MP4 is ready */}
          {videoAvailable && (
            <Card className="overflow-hidden bg-card border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    Final Video
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-500/10 text-green-600"
                  >
                    Ready
                  </Badge>
                </div>
              </div>
              <div className="flex justify-center bg-black">
                <video
                  src={job.videoUrl}
                  controls
                  className="max-h-[600px] w-auto"
                  poster={job.thumbnailUrl}
                />
              </div>
            </Card>
          )}

          {/* Placeholder when nothing is ready yet */}
          {!codeAvailable && !videoAvailable && isInProgress && (
            <Card className="bg-card border-border">
              <div className="flex items-center justify-center py-32">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Video preview will appear here once composition is ready...
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Iteration Input */}
          {(isCompleted || codeAvailable) && (
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Refine this video
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "Make the hook more aggressive" or "Add the enrollment count"'
                  value={iterationFeedback}
                  onChange={(e) => setIterationFeedback(e.target.value)}
                  className="bg-background border-border"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleIterate();
                    }
                  }}
                />
                <Button
                  onClick={handleIterate}
                  disabled={!iterationFeedback.trim() || isIterating}
                  className="gap-2 shrink-0"
                >
                  {isIterating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Regenerate
                </Button>
              </div>
            </Card>
          )}

          {/* Export Options */}
          {isCompleted && (
            <VideoExport
              videoUrl={job.videoUrl!}
              thumbnailUrl={job.thumbnailUrl}
              caption={job.caption}
              srtContent={job.srtContent}
              prompt={job.prompt}
              storeId={storeId}
            />
          )}
        </div>

        {/* Script Panel (1 col) */}
        <div className="space-y-4">
          {/* Job Info */}
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Style</span>
                <span className="text-foreground capitalize">
                  {job.style || "modern"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="text-foreground">{job.targetDuration}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aspect Ratio</span>
                <span className="text-foreground">{job.aspectRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-foreground">v{job.version}</span>
              </div>
              {job.renderDuration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Render Time</span>
                  <span className="text-foreground">
                    {job.renderDuration.toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Script */}
          {script && (
            <Card className="p-4 bg-card border-border">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setScriptExpanded(!scriptExpanded)}
              >
                <h3 className="text-sm font-semibold text-foreground">
                  Script ({script.scenes.length} scenes)
                </h3>
                {scriptExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {scriptExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 mt-4">
                      {script.scenes.map((scene: { id: string; duration: number; voiceover?: string; onScreenText: { headline?: string; subhead?: string; bulletPoints?: string[]; emphasis?: string[] }; visualDirection: string; mood: string }, i: number) => (
                        <div
                          key={scene.id}
                          className="space-y-1 pb-3 border-b border-border last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 px-1.5"
                            >
                              {scene.id}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {scene.duration}s &middot; {scene.mood}
                            </span>
                          </div>
                          {scene.onScreenText.headline && (
                            <p className="text-sm font-medium text-foreground">
                              {scene.onScreenText.headline}
                            </p>
                          )}
                          {scene.voiceover && (
                            <p className="text-xs text-muted-foreground italic">
                              &ldquo;{scene.voiceover}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Voiceover script */}
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Full Voiceover
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {script.voiceoverScript}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Prompt */}
          <Card className="p-4 bg-card border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Prompt
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {job.prompt}
            </p>
            {job.iterationPrompt && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Iteration Feedback
                </p>
                <p className="text-sm text-muted-foreground">
                  {job.iterationPrompt}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
