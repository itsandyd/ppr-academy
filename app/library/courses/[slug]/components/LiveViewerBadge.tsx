"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LiveViewerBadgeProps {
  courseId: Id<"courses">;
  chapterId?: Id<"courseChapters">;
  showAvatars?: boolean;
}

export function LiveViewerBadge({
  courseId,
  chapterId,
  showAvatars = false,
}: LiveViewerBadgeProps) {
  const { user } = useUser();
  const recordPresence = useMutation(api.liveViewers.recordPresence);
  const removePresence = useMutation(api.liveViewers.removePresence);

  // Get viewer count
  const viewerData = useQuery(api.liveViewers.getLiveViewerCount, {
    courseId,
    chapterId: chapterId || undefined,
  });

  // Get active viewers with details (if showing avatars)
  const activeViewers = useQuery(
    api.liveViewers.getActiveViewers,
    showAvatars ? { courseId, chapterId: chapterId || undefined, limit: 5 } : "skip"
  );

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up presence heartbeat
  useEffect(() => {
    if (!user?.id) return;

    // Send initial presence
    recordPresence({
      courseId,
      chapterId: chapterId || undefined,
      userId: user.id,
    });

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      recordPresence({
        courseId,
        chapterId: chapterId || undefined,
        userId: user.id,
      });
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      removePresence({ courseId, userId: user.id });
    };
  }, [user?.id, courseId, chapterId, recordPresence, removePresence]);

  const viewerCount = viewerData?.total || 0;

  // Don't show if no viewers
  if (viewerCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Badge
              variant="secondary"
              className="flex items-center gap-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
              </motion.div>
              <span className="font-semibold">{viewerCount}</span>
              {showAvatars && activeViewers && activeViewers.length > 0 && (
                <div className="flex -space-x-2">
                  {activeViewers.slice(0, 3).map((viewer: any, index: number) => (
                    <Avatar key={viewer.userId} className="h-5 w-5 border-2 border-background">
                      <AvatarImage src={viewer.userAvatar} alt={viewer.userName || "Viewer"} />
                      <AvatarFallback className="text-[10px]">
                        {viewer.userName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-white dark:bg-black">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4" aria-hidden="true" />
              {viewerCount} {viewerCount === 1 ? "person" : "people"} watching now
            </p>
            {activeViewers && activeViewers.length > 0 && (
              <div className="space-y-1">
                {activeViewers.slice(0, 5).map((viewer: any) => (
                  <div key={viewer.userId} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={viewer.userAvatar} alt={viewer.userName || "Viewer"} />
                      <AvatarFallback className="text-[8px]">
                        {viewer.userName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">
                      {viewer.userName || "Anonymous"}
                      {viewer.chapterTitle && (
                        <span className="ml-1 text-xs">• {viewer.chapterTitle}</span>
                      )}
                    </span>
                  </div>
                ))}
                {activeViewers.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{activeViewers.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
