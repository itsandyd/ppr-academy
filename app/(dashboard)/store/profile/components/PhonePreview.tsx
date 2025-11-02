"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instagram, Twitter, Youtube, Globe, Video } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PhonePreviewProps {
  className?: string;
}

export function PhonePreview({ className }: PhonePreviewProps) {
  const { user: clerkUser } = useUser();
  
  // Get updated user data from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get store data
  const stores = useQuery(
    api.stores.getStoresByUser,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );
  const store = stores?.[0];

  // Show loading state while fetching user data
  if (!clerkUser || convexUser === undefined || !store) {
    return (
      <div className={className}>
        <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-chart-1 to-chart-2 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Prioritize saved name over Clerk's firstName + lastName
  const displayName = convexUser?.name || 
    (clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName || clerkUser.lastName || "User");
    
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Use saved avatar or fallback to Clerk image
  const avatarUrl = convexUser?.imageUrl || clerkUser.imageUrl || "";

  // Get social links
  const socialLinks = [
    { icon: Instagram, url: convexUser?.instagram, color: "text-pink-500" },
    { icon: Video, url: convexUser?.tiktok, color: "text-black dark:text-white" },
    { icon: Twitter, url: convexUser?.twitter, color: "text-blue-500" },
    { icon: Youtube, url: convexUser?.youtube, color: "text-red-500" },
    { icon: Globe, url: convexUser?.website, color: "text-gray-600 dark:text-gray-400" },
  ].filter(link => link.url);

  return (
    <div className={className}>
      <div className="mb-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">Live Preview</p>
        <p className="text-xs text-muted-foreground">Changes update in real-time</p>
      </div>
      
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
              <span className="font-bold text-base text-white truncate block">{store.name || displayName}</span>
              <span className="text-xs text-white/80 truncate block">by {displayName} • @{store.slug}</span>
            </div>
          </div>
          
          {/* Bio */}
          {convexUser?.bio && (
            <p className="text-white/90 text-xs leading-relaxed mb-3 line-clamp-2">
              {convexUser.bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white/10 backdrop-blur rounded-md p-2 text-center">
              <div className="text-base font-bold text-white">0</div>
              <div className="text-white/70 text-[10px]">Products</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-md p-2 text-center">
              <div className="text-base font-bold text-white">0</div>
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
          {socialLinks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 text-center">Connect</p>
              <div className="flex justify-center gap-2">
                {socialLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <div
                      key={index}
                      className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center ${link.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
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