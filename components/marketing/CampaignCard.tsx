"use client";

import { MarketingCampaignTemplate, campaignCategories, platformMeta } from "@/lib/marketing-campaigns/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Package,
  GraduationCap,
  Gift,
  Heart,
  Download,
  User,
  UserX,
  Clock,
  Calendar,
  CheckCircle,
  Award,
  ShoppingBag,
  Sparkles,
  Sun,
  Cake,
  BookOpen,
  Mail,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for template icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Package,
  GraduationCap,
  Gift,
  Heart,
  Download,
  User,
  UserX,
  Clock,
  Calendar,
  CheckCircle,
  Award,
  ShoppingBag,
  Sparkles,
  Sun,
  Cake,
  BookOpen,
};

// TikTok icon component (not in lucide)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

// Platform icon mapping
const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
};

interface CampaignCardProps {
  template: MarketingCampaignTemplate;
  onSelect: (template: MarketingCampaignTemplate) => void;
  selected?: boolean;
  variant?: "default" | "compact";
}

export function CampaignCard({
  template,
  onSelect,
  selected = false,
  variant = "default",
}: CampaignCardProps) {
  const IconComponent = iconMap[template.icon] || Package;
  const category = campaignCategories.find((c) => c.type === template.campaignType);

  // Get available platforms
  const availablePlatforms = Object.entries({
    email: template.email,
    instagram: template.instagram,
    twitter: template.twitter,
    facebook: template.facebook,
    linkedin: template.linkedin,
    tiktok: template.tiktok,
  })
    .filter(([, content]) => content)
    .map(([platform]) => platform);

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          selected && "ring-2 ring-primary"
        )}
        onClick={() => onSelect(template)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{template.name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {template.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onSelect(template)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
          >
            <IconComponent className="h-6 w-6" />
          </div>
          <Badge variant="outline" className="text-xs">
            {template.estimatedReach} reach
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Product types */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.productTypes.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>

        {/* Platform icons */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Platforms:</span>
          <div className="flex gap-1">
            {availablePlatforms.map((platform) => {
              const PlatformIcon = platformIcons[platform];
              return (
                <div
                  key={platform}
                  className="h-6 w-6 flex items-center justify-center rounded bg-muted"
                  title={platform}
                >
                  <PlatformIcon className="h-3.5 w-3.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Variables count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{template.variables.length} customizable fields</span>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Use Template
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Export platform icons for reuse
export { platformIcons, TikTokIcon };
