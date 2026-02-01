"use client";

import { MarketingCampaignTemplate, Platform } from "@/lib/marketing-campaigns/types";
import { replaceTemplateVariables } from "@/lib/marketing-campaigns/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Copy,
  ExternalLink,
  Hash,
} from "lucide-react";
import { TikTokIcon, platformIcons } from "./CampaignCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CampaignPreviewProps {
  template: MarketingCampaignTemplate;
  variableValues: Record<string, string>;
  className?: string;
  showPlatform?: Platform | "all";
  compact?: boolean;
}

export function CampaignPreview({
  template,
  variableValues,
  className,
  showPlatform = "all",
  compact = false,
}: CampaignPreviewProps) {
  // Apply variable values to template
  const content = replaceTemplateVariables(template, variableValues);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Email Preview
  const EmailPreview = () => {
    if (!content.email) return null;
    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <CardTitle className={cn("text-sm", compact && "text-xs")}>
                Email
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content.email!.body, "Email body")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3", compact && "p-3 pt-0")}>
          <div>
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="font-medium text-sm">{content.email.subject}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Preview</p>
            <p className="text-sm text-muted-foreground">
              {content.email.previewText}
            </p>
          </div>
          <Separator />
          <div
            className="prose prose-sm max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: content.email.body }}
          />
          {content.email.ctaText && (
            <div className="pt-2">
              <Badge variant="default" className="cursor-pointer">
                {content.email.ctaText}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Instagram Preview
  const InstagramPreview = () => {
    if (!content.instagram) return null;
    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              <CardTitle className={cn("text-sm", compact && "text-xs")}>
                Instagram
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  content.instagram!.caption +
                    "\n\n" +
                    content.instagram!.hashtags.map((h) => `#${h}`).join(" "),
                  "Instagram caption"
                )
              }
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3", compact && "p-3 pt-0")}>
          {/* Image placeholder */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg h-32 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              {content.instagram.suggestedImageStyle || "Image"} preview
            </span>
          </div>
          {/* Caption */}
          <p className="text-sm whitespace-pre-wrap">{content.instagram.caption}</p>
          {/* Hashtags */}
          <div className="flex flex-wrap gap-1">
            {content.instagram.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
          {content.instagram.callToAction && (
            <p className="text-xs text-muted-foreground italic">
              {content.instagram.callToAction}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Twitter Preview
  const TwitterPreview = () => {
    if (!content.twitter) return null;
    const tweetWithHashtags =
      content.twitter.tweet +
      (content.twitter.hashtags.length > 0
        ? "\n\n" + content.twitter.hashtags.map((h) => `#${h}`).join(" ")
        : "");
    const charCount = tweetWithHashtags.length;

    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              <CardTitle className={cn("text-sm", compact && "text-xs")}>
                X (Twitter)
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs",
                  charCount > 280 ? "text-red-600" : "text-muted-foreground"
                )}
              >
                {charCount}/280
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(tweetWithHashtags, "Tweet")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3", compact && "p-3 pt-0")}>
          <p className="text-sm whitespace-pre-wrap">{content.twitter.tweet}</p>
          <div className="flex flex-wrap gap-1">
            {content.twitter.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Facebook Preview
  const FacebookPreview = () => {
    if (!content.facebook) return null;
    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-700" />
              <CardTitle className={cn("text-sm", compact && "text-xs")}>
                Facebook
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content.facebook!.post, "Facebook post")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3", compact && "p-3 pt-0")}>
          <p className="text-sm whitespace-pre-wrap">{content.facebook.post}</p>
          {content.facebook.callToAction && (
            <Badge variant="outline">{content.facebook.callToAction}</Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  // LinkedIn Preview
  const LinkedInPreview = () => {
    if (!content.linkedin) return null;
    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-blue-600" />
              <CardTitle className={cn("text-sm", compact && "text-xs")}>
                LinkedIn
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  content.linkedin!.post +
                    "\n\n" +
                    content.linkedin!.hashtags.map((h) => `#${h}`).join(" "),
                  "LinkedIn post"
                )
              }
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3", compact && "p-3 pt-0")}>
          <p className="text-sm whitespace-pre-wrap">{content.linkedin.post}</p>
          <div className="flex flex-wrap gap-1">
            {content.linkedin.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
          {content.linkedin.professionalAngle && (
            <p className="text-xs text-muted-foreground italic">
              Angle: {content.linkedin.professionalAngle}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // TikTok Preview
  const TikTokPreview = () => {
    if (!content.tiktok) return null;
    const charCount =
      (content.tiktok.caption?.length || 0) +
      content.tiktok.hashtags.reduce((acc, h) => acc + h.length + 2, 0);

    return (
      <Card className={cn(compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TikTokIcon className="h-4 w-4" />
              <CardTitle className={cn("text-sm", compact && "text-xs")}>
                TikTok
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs",
                  charCount > 150 ? "text-red-600" : "text-muted-foreground"
                )}
              >
                {charCount}/150
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    content.tiktok!.caption +
                      " " +
                      content.tiktok!.hashtags.map((h) => `#${h}`).join(" "),
                    "TikTok caption"
                  )
                }
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3", compact && "p-3 pt-0")}>
          {/* Video placeholder */}
          <div className="bg-gradient-to-br from-black to-gray-800 rounded-lg h-40 flex items-center justify-center">
            <span className="text-xs text-white/60">Video preview</span>
          </div>
          {content.tiktok.hookLine && (
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Hook line:</p>
              <p className="text-sm font-medium">{content.tiktok.hookLine}</p>
            </div>
          )}
          <p className="text-sm">{content.tiktok.caption}</p>
          <div className="flex flex-wrap gap-1">
            {content.tiktok.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render based on showPlatform
  if (showPlatform !== "all") {
    const previews: Record<Platform, React.ReactNode> = {
      email: <EmailPreview />,
      instagram: <InstagramPreview />,
      twitter: <TwitterPreview />,
      facebook: <FacebookPreview />,
      linkedin: <LinkedInPreview />,
      tiktok: <TikTokPreview />,
    };
    return <div className={className}>{previews[showPlatform]}</div>;
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
      )}>
        <EmailPreview />
        <InstagramPreview />
        <TwitterPreview />
        <FacebookPreview />
        <LinkedInPreview />
        <TikTokPreview />
      </div>
    </ScrollArea>
  );
}
