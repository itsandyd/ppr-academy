"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instagram, Twitter, Youtube, Globe, Video, Facebook, Music2 } from "lucide-react";

interface GlobalPhonePreviewProps {
  className?: string;
  // User/Store Info
  storeName?: string;
  displayName?: string;
  slug?: string;
  avatarUrl?: string;
  bio?: string;
  
  // Social Accounts
  socialAccounts?: Array<{
    _id: string;
    platform: "instagram" | "twitter" | "facebook" | "tiktok" | "youtube" | "linkedin";
    platformUsername?: string;
    platformDisplayName?: string;
    accountLabel?: string;
    isActive: boolean;
    isConnected: boolean;
  }>;
  
  // Stats (optional)
  stats?: {
    products?: number;
    free?: number;
    courses?: number;
  };
  
  // Preview mode indicator
  showPreviewLabel?: boolean;
}

export function GlobalPhonePreview({
  className,
  storeName = "Your Store",
  displayName = "Your Name",
  slug = "yourslug",
  avatarUrl,
  bio,
  socialAccounts = [],
  stats = { products: 0, free: 0, courses: 0 },
  showPreviewLabel = true,
}: GlobalPhonePreviewProps) {
  
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get active social accounts with icons and colors
  const activeSocialAccounts = socialAccounts.filter(
    account => account.isActive && account.isConnected
  );

  const socialAccountsWithIcons = activeSocialAccounts.map(account => {
    let icon, color;
    switch (account.platform) {
      case "instagram":
        icon = Instagram;
        color = "text-pink-500";
        break;
      case "twitter":
        icon = Twitter;
        color = "text-blue-400";
        break;
      case "facebook":
        icon = Facebook;
        color = "text-blue-600";
        break;
      case "tiktok":
        icon = Music2;
        color = "text-black dark:text-white";
        break;
      case "youtube":
        icon = Youtube;
        color = "text-red-500";
        break;
      case "linkedin":
        icon = Globe;
        color = "text-blue-700";
        break;
      default:
        icon = Globe;
        color = "text-gray-600";
    }
    return { ...account, icon, color };
  });

  return (
    <div className={className}>
      {showPreviewLabel && (
        <div className="mb-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">Live Preview</p>
          <p className="text-xs text-muted-foreground">Changes update in real-time</p>
        </div>
      )}
      
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-chart-1 to-chart-2 p-4 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-white/30">
              <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
              <AvatarFallback className="text-sm font-bold bg-white/20 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-base text-white truncate block">{storeName}</span>
              <span className="text-xs text-white/80 truncate block">by {displayName} • @{slug}</span>
            </div>
          </div>
          
          {/* Bio */}
          {bio && (
            <p className="text-white/90 text-xs leading-relaxed mb-3 line-clamp-2">
              {bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white/10 backdrop-blur rounded-md p-2 text-center">
              <div className="text-base font-bold text-white">{stats.products || 0}</div>
              <div className="text-white/70 text-[10px]">Products</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-md p-2 text-center">
              <div className="text-base font-bold text-white">{stats.free || 0}</div>
              <div className="text-white/70 text-[10px]">Free</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-md p-2 text-center">
              <div className="text-base font-bold text-white">🎓</div>
              <div className="text-white/70 text-[10px]">Learn</div>
            </div>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-4 bg-white dark:bg-zinc-900 overflow-y-auto">
          <h3 className="text-xs font-bold text-foreground mb-3 text-center">Your Products & Courses</h3>
          
          {/* Product placeholder cards */}
          <div className="space-y-2">
            <Card className="p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-chart-1/20 rounded-md"></div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-chart-2/20 rounded-md"></div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded w-2/3 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </Card>
          </div>

          {/* Social links if any */}
          {socialAccountsWithIcons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 text-center">Connect</p>
              <div className="flex flex-wrap justify-center gap-2">
                {socialAccountsWithIcons.map((account) => {
                  const Icon = account.icon;
                  return (
                    <div
                      key={account._id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border"
                    >
                      <Icon className={`w-3 h-3 ${account.color}`} />
                      <span className="text-[10px] font-medium text-foreground capitalize">
                        {account.accountLabel || account.platform}
                      </span>
                      {account.platformUsername && (
                        <span className="text-[9px] text-muted-foreground">
                          @{account.platformUsername.replace('@', '').slice(0, 8)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer badge */}
        <div className="p-2 bg-muted/50 border-t border-border">
          <p className="text-[10px] text-center text-muted-foreground">
            Powered by <span className="font-semibold">PausePlayRepeat</span>
          </p>
        </div>
      </Card>
    </div>
  );
}

