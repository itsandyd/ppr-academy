"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactNode } from "react";

interface PhoneShellProps {
  children: ReactNode;
  className?: string;
  // Header info
  storeName?: string;
  displayName?: string;
  slug?: string;
  avatarUrl?: string;
  bio?: string;
  // Options
  showHeader?: boolean;
  showFooter?: boolean;
}

/**
 * PhoneShell - Consistent phone preview frame for all preview components
 * 
 * Provides the standardized phone chrome (frame, header, footer) while allowing
 * custom content to be rendered inside. Ensures all phone previews look consistent.
 * 
 * @example
 * <PhoneShell
 *   storeName="My Store"
 *   displayName="John Doe"
 *   slug="johndoe"
 *   avatarUrl="/avatar.jpg"
 * >
 *   <div className="p-4">
 *     Your custom content here
 *   </div>
 * </PhoneShell>
 */
export function PhoneShell({
  children,
  className = "",
  storeName = "Your Store",
  displayName = "Your Name",
  slug = "yourslug",
  avatarUrl,
  bio,
  showHeader = true,
  showFooter = true,
}: PhoneShellProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`lg:sticky lg:top-24 ${className}`}>
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden shadow-2xl">
        {showHeader && (
          <div className="bg-gradient-to-r from-chart-1 to-chart-2 p-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-12 h-12 border-2 border-white/30">
                <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
                <AvatarFallback className="text-sm font-bold bg-white/20 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-base text-white truncate block">
                  {storeName}
                </span>
                <span className="text-xs text-white/80 truncate block">
                  by {displayName} • @{slug}
                </span>
              </div>
            </div>
            {bio && (
              <p className="text-white/90 text-xs leading-relaxed line-clamp-2">
                {bio}
              </p>
            )}
          </div>
        )}

        {/* Custom content area - scrollable */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
          {children}
        </div>

        {showFooter && (
          <div className="p-2 bg-muted/50 border-t border-border flex-shrink-0">
            <p className="text-[10px] text-center text-muted-foreground">
              Powered by <span className="font-semibold">PausePlayRepeat</span>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

