"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Show loading state while fetching user data
  if (!clerkUser || convexUser === undefined) {
    return (
      <div className={className}>
        <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 bg-white flex flex-col p-6 sticky top-32">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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

  return (
    <div className={className}>
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 bg-white flex flex-col p-6 sticky top-32">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
            <AvatarFallback className="text-sm font-semibold bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm truncate block">{displayName}</span>
            {convexUser?.bio && (
              <span className="text-xs text-muted-foreground truncate block">{convexUser.bio}</span>
            )}
          </div>
        </div>
        
        {/* Live preview content */}
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4" />
            <p className="text-sm">Your profile preview</p>
            <p className="text-xs">Changes update in real-time</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 