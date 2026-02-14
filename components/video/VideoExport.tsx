"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Download,
  Copy,
  Check,
  Instagram,
  Twitter,
  Calendar,
  Hash,
  Subtitles,
  Share2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface VideoExportProps {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  srtContent?: string;
  prompt: string;
  storeId: string;
}

type Platform = "instagram" | "tiktok" | "twitter";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; icon: React.ElementType; color: string }
> = {
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-500" },
  tiktok: { label: "TikTok", icon: Share2, color: "text-cyan-500" },
  twitter: { label: "Twitter / X", icon: Twitter, color: "text-blue-500" },
};

/**
 * VideoExport — download and social media export for completed videos.
 *
 * - Download raw MP4
 * - Download with burned-in subtitles (planned)
 * - Copy platform-specific captions
 * - Copy hashtags
 * - Schedule post (UI for now — actual posting is Phase 5)
 */
export function VideoExport({
  videoUrl,
  thumbnailUrl,
  caption,
  srtContent,
  prompt,
  storeId,
}: VideoExportProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  // Generate platform-specific captions from the base caption
  const platformCaptions: Record<Platform, string> = {
    instagram: caption
      ? `${caption}\n\n.\n.\n.\n#musicproduction #beatmaking #producerlife #mixing #mastering #sounddesign #producer #beats #daw #studio`
      : `Check out this new video from our studio!\n\n#musicproduction #producer #beats`,
    tiktok: caption
      ? caption.split(".").slice(0, 2).join(".") +
        " #musicproduction #producer #beats #fyp #musictips"
      : "New video dropping! #musicproduction #fyp #beats",
    twitter: caption
      ? caption.length > 250
        ? caption.slice(0, 250) + "..."
        : caption
      : "New video just dropped. Link in bio.",
  };

  // Extract hashtags from caption
  const hashtags = caption
    ? caption.match(/#\w+/g) || []
    : ["#musicproduction", "#producer", "#beats"];

  return (
    <Card className="p-5 bg-card border-border space-y-5">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export & Share
      </h3>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-2">
        <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download MP4
          </Button>
        </a>

        <Button
          variant="outline"
          className="gap-2"
          disabled={!srtContent}
          title={
            srtContent
              ? "Download with burned-in subtitles"
              : "No subtitles available"
          }
        >
          <Subtitles className="w-4 h-4" />
          Download + Subtitles
        </Button>

        {srtContent && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const blob = new Blob([srtContent], { type: "text/srt" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "subtitles.srt";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Subtitles className="w-4 h-4" />
            Download SRT
          </Button>
        )}
      </div>

      {/* Platform Caption Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Caption</span>
          <div className="flex gap-1">
            {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              const Icon = config.icon;
              return (
                <Button
                  key={platform}
                  variant={activePlatform === platform ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs gap-1 px-2",
                    activePlatform === platform &&
                      "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setActivePlatform(platform)}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Textarea
            value={platformCaptions[activePlatform]}
            readOnly
            className="min-h-[100px] resize-none bg-background border-border text-sm pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() =>
              copyToClipboard(
                platformCaptions[activePlatform],
                `caption-${activePlatform}`
              )
            }
          >
            {copiedField === `caption-${activePlatform}` ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Hashtags
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 px-2"
                onClick={() =>
                  copyToClipboard(hashtags.join(" "), "hashtags")
                }
              >
                {copiedField === "hashtags" ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs bg-muted text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Post (UI only) */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Schedule Post
          </span>
          <Badge
            variant="secondary"
            className="text-xs bg-yellow-500/10 text-yellow-600"
          >
            Coming Soon
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="bg-background border-border text-sm"
          />
          <Input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="bg-background border-border text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["instagram", "tiktok", "twitter"] as Platform[]).map(
            (platform) => {
              const config = PLATFORM_CONFIG[platform];
              const Icon = config.icon;
              return (
                <Button
                  key={platform}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  disabled
                >
                  <Icon className={cn("w-3 h-3", config.color)} />
                  {config.label}
                </Button>
              );
            }
          )}
        </div>

        <Button className="w-full gap-2" disabled>
          <Calendar className="w-4 h-4" />
          Schedule Post
        </Button>
      </div>
    </Card>
  );
}
