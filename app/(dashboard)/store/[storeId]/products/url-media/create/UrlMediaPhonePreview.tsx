"use client";

import { PhoneShell } from "@/components/shared/PhoneShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Youtube, 
  Music, 
  Globe, 
  ExternalLink,
  Play
} from "lucide-react";
import { UserResource } from "@clerk/types";

interface UrlMediaPhonePreviewProps {
  user: UserResource;
  store?: {
    _id: string;
    name: string;
    slug?: string;
    userId: string;
  };
  url: string;
  title: string;
  description: string;
  displayStyle: "embed" | "card" | "button";
}

export function UrlMediaPhonePreview({ 
  user, 
  store, 
  url, 
  title, 
  description, 
  displayStyle 
}: UrlMediaPhonePreviewProps) {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || "Creator";

  const avatarUrl = user.imageUrl || "";

  // Detect media type for preview
  const getMediaType = (url: string) => {
    if (!url) return "unknown";
    try {
      const domain = new URL(url).hostname.toLowerCase();
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) return "youtube";
      if (domain.includes('spotify.com')) return "spotify";
      return "website";
    } catch {
      return "unknown";
    }
  };

  const mediaType = getMediaType(url);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "youtube": return <Youtube className="w-6 h-6 text-red-600" />;
      case "spotify": return <Music className="w-6 h-6 text-green-600" />;
      default: return <Globe className="w-6 h-6 text-gray-600" />;
    }
  };

  const renderPreview = () => {
    if (displayStyle === "embed") {
      // Embed Style - Large media display
      if (mediaType === "youtube") {
        return (
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm">{title || "YouTube Video"}</h4>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
          </Card>
        );
      } else if (mediaType === "spotify") {
        return (
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Music className="w-16 h-16 text-white" />
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm">{title || "Spotify Content"}</h4>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
          </Card>
        );
      } else {
        return (
          <Card className="overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center border-2 border-dashed border-blue-300">
              <div className="text-center">
                <Globe className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-blue-600">Website Embed</p>
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm">{title || "Website"}</h4>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
          </Card>
        );
      }
    } else if (displayStyle === "card") {
      // Card Style - Compact link card
      return (
        <Card className="p-4 border border-blue-200 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {getMediaIcon(mediaType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-blue-800 truncate">
                {title || "Link Title"}
              </h4>
              {description && (
                <p className="text-xs text-blue-600 truncate mt-1">
                  {description}
                </p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </div>
        </Card>
      );
    } else {
      // Button Style - Centered button
      return (
        <div className="space-y-3">
          <div className="text-center">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
              {title || "Visit Link"}
            </Button>
          </div>
          {description && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-700 text-center">{description}</p>
            </Card>
          )}
        </div>
      );
    }
  };

  return (
    <PhoneShell
      storeName={store?.name || displayName}
      displayName={displayName}
      slug={store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"}
      avatarUrl={avatarUrl}
    >
      <div className="p-4 bg-background">
        <div className="w-full space-y-3">
          {renderPreview()}
        </div>
      </div>
    </PhoneShell>
  );
}
