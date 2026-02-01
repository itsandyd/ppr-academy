"use client";

import { useState, useEffect } from "react";
import { Platform, platformMeta } from "@/lib/marketing-campaigns/types";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Check, Copy, RefreshCw, Hash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmailContent {
  subject: string;
  previewText: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
}

interface SocialContent {
  caption?: string;
  tweet?: string;
  post?: string;
  hashtags: string[];
  callToAction?: string;
  hookLine?: string;
  suggestedImageStyle?: string;
  professionalAngle?: string;
}

interface PlatformContentEditorProps {
  platform: Platform;
  content: EmailContent | SocialContent;
  onChange: (content: EmailContent | SocialContent) => void;
  originalContent?: EmailContent | SocialContent;
  showCharacterCount?: boolean;
  className?: string;
}

export function PlatformContentEditor({
  platform,
  content,
  onChange,
  originalContent,
  showCharacterCount = true,
  className,
}: PlatformContentEditorProps) {
  const meta = platformMeta.find((m) => m.id === platform);
  const [newHashtag, setNewHashtag] = useState("");

  // Get main content field based on platform
  const getMainContent = (): string => {
    if (platform === "email") {
      return (content as EmailContent).body || "";
    }
    const social = content as SocialContent;
    return social.caption || social.tweet || social.post || "";
  };

  const setMainContent = (value: string) => {
    if (platform === "email") {
      onChange({ ...content, body: value } as EmailContent);
    } else if (platform === "twitter") {
      onChange({ ...content, tweet: value } as SocialContent);
    } else if (platform === "facebook" || platform === "linkedin") {
      onChange({ ...content, post: value } as SocialContent);
    } else {
      onChange({ ...content, caption: value } as SocialContent);
    }
  };

  const mainContent = getMainContent();
  const charLimit = meta?.characterLimit;
  const isOverLimit = charLimit ? mainContent.length > charLimit : false;
  const isNearLimit = charLimit ? mainContent.length > charLimit * 0.9 : false;

  // Handle hashtag management
  const addHashtag = () => {
    if (!newHashtag.trim()) return;
    const social = content as SocialContent;
    const tag = newHashtag.replace(/^#/, "").trim();
    if (social.hashtags?.includes(tag)) {
      toast.error("Hashtag already exists");
      return;
    }
    onChange({
      ...content,
      hashtags: [...(social.hashtags || []), tag],
    } as SocialContent);
    setNewHashtag("");
  };

  const removeHashtag = (tag: string) => {
    const social = content as SocialContent;
    onChange({
      ...content,
      hashtags: social.hashtags?.filter((h) => h !== tag) || [],
    } as SocialContent);
  };

  // Reset to original content
  const resetToOriginal = () => {
    if (originalContent) {
      onChange(originalContent);
      toast.success("Content reset to original");
    }
  };

  // Copy content to clipboard
  const copyContent = () => {
    navigator.clipboard.writeText(mainContent);
    toast.success("Content copied to clipboard");
  };

  // Email-specific editor
  if (platform === "email") {
    const emailContent = content as EmailContent;
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-2">
          <Label>Subject Line</Label>
          <Input
            value={emailContent.subject || ""}
            onChange={(e) => onChange({ ...emailContent, subject: e.target.value })}
            placeholder="Enter subject line"
            className={cn(
              emailContent.subject?.length > 50 && "border-yellow-500"
            )}
          />
          {emailContent.subject && (
            <p className="text-xs text-muted-foreground">
              {emailContent.subject.length} characters
              {emailContent.subject.length > 50 && " (may be truncated on mobile)"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Preview Text</Label>
          <Input
            value={emailContent.previewText || ""}
            onChange={(e) => onChange({ ...emailContent, previewText: e.target.value })}
            placeholder="Enter preview text"
          />
          <p className="text-xs text-muted-foreground">
            Shown after subject in inbox preview
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Email Body (HTML)</Label>
            <div className="flex gap-2">
              {originalContent && (
                <Button variant="ghost" size="sm" onClick={resetToOriginal}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={copyContent}>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          <Textarea
            value={emailContent.body || ""}
            onChange={(e) => onChange({ ...emailContent, body: e.target.value })}
            placeholder="Enter email body HTML"
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CTA Button Text</Label>
            <Input
              value={emailContent.ctaText || ""}
              onChange={(e) => onChange({ ...emailContent, ctaText: e.target.value })}
              placeholder="e.g., Shop Now"
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Button URL</Label>
            <Input
              value={emailContent.ctaUrl || ""}
              onChange={(e) => onChange({ ...emailContent, ctaUrl: e.target.value })}
              placeholder="https://..."
              type="url"
            />
          </div>
        </div>
      </div>
    );
  }

  // Social media editor
  const socialContent = content as SocialContent;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            {platform === "twitter" ? "Tweet" : platform === "tiktok" ? "Caption" : "Post"}
          </Label>
          <div className="flex items-center gap-2">
            {originalContent && (
              <Button variant="ghost" size="sm" onClick={resetToOriginal}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={copyContent}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
        <Textarea
          value={mainContent}
          onChange={(e) => setMainContent(e.target.value)}
          placeholder={`Enter your ${platform} content`}
          className={cn(
            "min-h-[150px]",
            isOverLimit && "border-red-500",
            isNearLimit && !isOverLimit && "border-yellow-500"
          )}
        />
        {showCharacterCount && charLimit && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                isOverLimit
                  ? "text-red-600 font-medium"
                  : isNearLimit
                  ? "text-yellow-600"
                  : "text-muted-foreground"
              )}
            >
              {mainContent.length}/{charLimit} characters
            </span>
            {isOverLimit && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Over limit
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Hashtags (not for email) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Hashtags
        </Label>
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
          {socialContent.hashtags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              #{tag}
              <button
                onClick={() => removeHashtag(tag)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHashtag();
                }
              }}
              placeholder="Add hashtag"
              className="h-7 w-32 text-sm"
            />
            <Button variant="ghost" size="sm" onClick={addHashtag} className="h-7">
              Add
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {socialContent.hashtags?.length || 0} hashtags
          {meta?.characterLimit && platform === "instagram" && " (10-15 recommended for Instagram)"}
          {platform === "twitter" && " (1-2 recommended for Twitter)"}
        </p>
      </div>

      {/* Platform-specific fields */}
      {platform === "tiktok" && (
        <div className="space-y-2">
          <Label>Hook Line</Label>
          <Input
            value={socialContent.hookLine || ""}
            onChange={(e) =>
              onChange({ ...socialContent, hookLine: e.target.value })
            }
            placeholder="Opening hook for the video"
          />
          <p className="text-xs text-muted-foreground">
            The opening line to grab attention
          </p>
        </div>
      )}

      {(platform === "instagram" || platform === "facebook") && (
        <div className="space-y-2">
          <Label>Call to Action</Label>
          <Input
            value={socialContent.callToAction || ""}
            onChange={(e) =>
              onChange({ ...socialContent, callToAction: e.target.value })
            }
            placeholder="e.g., Link in bio"
          />
        </div>
      )}

      {platform === "linkedin" && (
        <div className="space-y-2">
          <Label>Professional Angle</Label>
          <Input
            value={socialContent.professionalAngle || ""}
            onChange={(e) =>
              onChange({ ...socialContent, professionalAngle: e.target.value })
            }
            placeholder="Professional context note"
          />
        </div>
      )}

      {(platform === "instagram" || platform === "facebook") && (
        <div className="space-y-2">
          <Label>Suggested Image Style</Label>
          <Input
            value={socialContent.suggestedImageStyle || ""}
            onChange={(e) =>
              onChange({ ...socialContent, suggestedImageStyle: e.target.value })
            }
            placeholder="e.g., carousel, single, reel"
          />
        </div>
      )}
    </div>
  );
}
