"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Wand2,
  Clock,
  Play,
  Loader2,
  Film,
  Sparkles,
  Mic,
  MicOff,
  MonitorPlay,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = [
  { value: "educational", label: "Educational" },
  { value: "hype", label: "Hype" },
  { value: "cinematic", label: "Cinematic" },
  { value: "minimalist", label: "Minimalist" },
];

const DURATIONS = [
  { value: "15", label: "15s" },
  { value: "30", label: "30s" },
  { value: "60", label: "60s" },
  { value: "90", label: "90s" },
];

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16", desc: "Reels / TikTok" },
  { value: "16:9", label: "16:9", desc: "YouTube" },
  { value: "1:1", label: "1:1", desc: "Feed" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  queued: { label: "Queued", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  gathering_context: { label: "Gathering data", color: "bg-blue-500/10 text-blue-600", icon: Loader2 },
  generating_script: { label: "Writing script", color: "bg-blue-500/10 text-blue-600", icon: Loader2 },
  generating_assets: { label: "Generating images", color: "bg-blue-500/10 text-blue-600", icon: Loader2 },
  generating_voice: { label: "Generating voice", color: "bg-blue-500/10 text-blue-600", icon: Loader2 },
  generating_code: { label: "Composing video", color: "bg-purple-500/10 text-purple-600", icon: Loader2 },
  rendering: { label: "Rendering", color: "bg-indigo-500/10 text-indigo-600", icon: Film },
  post_processing: { label: "Finishing up", color: "bg-indigo-500/10 text-indigo-600", icon: Loader2 },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-600", icon: AlertCircle },
};

export default function VideoStudioPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [prompt, setPrompt] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [style, setStyle] = useState("educational");
  const [duration, setDuration] = useState("60");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const jobs = useQuery(api.videos.getJobsByStore, {
    storeId: storeId as Id<"stores">,
  });
  const courses = useQuery(api.videos.getCreatorCourses);
  const generateVideo = useMutation(api.videos.generate);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const jobId = await generateVideo({
        prompt: prompt.trim(),
        storeId: storeId as Id<"stores">,
        courseId: courseId ? (courseId as Id<"courses">) : undefined,
        style,
        targetDuration: parseInt(duration),
        aspectRatio,
        voiceId: voiceEnabled ? undefined : undefined, // placeholder for voice selector
      });
      router.push(`/store/${storeId}/videos/${jobId}`);
    } catch (err) {
      console.error("Failed to start generation:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const recentJobs = jobs ?? [];

  return (
    <div className="space-y-8">
      {/* Prompt Input Area */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              What video do you want to create?
            </h2>
          </div>

          <Textarea
            placeholder="Describe the video you want to create... e.g. 'Make a 60-second promo for my saturation course — educational style, warm colors'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none bg-background border-border text-base"
          />

          {/* Controls Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Course Selector */}
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Course (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="none">No course</SelectItem>
                {courses?.map((c: { _id: string; title: string }) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Style */}
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Duration */}
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Aspect Ratio */}
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {ASPECT_RATIOS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label} — {a.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Voice Toggle */}
            <Button
              variant={voiceEnabled ? "default" : "outline"}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn(
                "gap-2",
                voiceEnabled && "bg-primary text-primary-foreground"
              )}
            >
              {voiceEnabled ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
              Voice {voiceEnabled ? "On" : "Off"}
            </Button>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-muted-foreground self-center mr-1">
              Quick:
            </span>
            {[
              "Course Promo",
              "Product Launch",
              "Feature Demo",
              "Sale Announcement",
              "Tutorial Teaser",
            ].map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className="text-xs h-7 border-border hover:bg-muted"
                onClick={() =>
                  setPrompt(
                    `Create a ${action.toLowerCase()} video for my store`
                  )
                }
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Videos Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Recent Videos
          </h3>
          {recentJobs.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {recentJobs.length} video{recentJobs.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {jobs === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Video className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No videos yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe your first video above and hit Generate to get started.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentJobs.map((job: any) => {
              const statusInfo = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
              const StatusIcon = statusInfo.icon;
              const isActive =
                job.status !== "completed" && job.status !== "failed";

              return (
                <Card
                  key={job._id}
                  className="group cursor-pointer overflow-hidden bg-card border-border hover:border-primary/30 transition-all duration-200"
                  onClick={() =>
                    router.push(`/store/${storeId}/videos/${job._id}`)
                  }
                >
                  {/* Thumbnail / Placeholder */}
                  <div className="relative aspect-[9/16] max-h-48 bg-muted overflow-hidden">
                    {job.thumbnailUrl ? (
                      <img
                        src={job.thumbnailUrl}
                        alt={job.prompt.slice(0, 50)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        {isActive ? (
                          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                        ) : job.status === "failed" ? (
                          <AlertCircle className="w-8 h-8 text-red-400" />
                        ) : (
                          <MonitorPlay className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {/* Play overlay for completed */}
                    {job.status === "completed" && job.videoUrl && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-black ml-0.5" />
                        </div>
                      </div>
                    )}
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2">
                      <Badge
                        variant="secondary"
                        className="bg-black/70 text-white text-xs border-0"
                      >
                        {job.targetDuration}s
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                      {job.prompt.slice(0, 80)}
                      {job.prompt.length > 80 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        className={cn(
                          "text-xs font-medium gap-1",
                          statusInfo.color
                        )}
                        variant="secondary"
                      >
                        <StatusIcon
                          className={cn(
                            "w-3 h-3",
                            isActive && "animate-spin"
                          )}
                        />
                        {statusInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job._creationTime).toLocaleDateString()}
                      </span>
                    </div>
                    {job.version > 1 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RotateCcw className="w-3 h-3" />
                        v{job.version}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
