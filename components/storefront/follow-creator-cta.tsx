"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Bell, 
  Mail, 
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FollowCreatorCTAProps {
  creatorName: string;
  creatorSlug: string;
  creatorAvatar?: string;
  followerCount?: number;
  isFollowing?: boolean;
  onFollow?: () => void;
  onNotify?: () => void;
  sticky?: boolean;
  className?: string;
}

export function FollowCreatorCTA({
  creatorName,
  creatorSlug,
  creatorAvatar,
  followerCount = 0,
  isFollowing = false,
  onFollow,
  onNotify,
  sticky = true,
  className
}: FollowCreatorCTAProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFollow = () => {
    setFollowing(!following);
    onFollow?.();
    
    if (!following) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        sticky && "sticky top-20 z-40",
        className
      )}
      >
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 shadow-2xl overflow-hidden backdrop-blur-none">
          <div className="relative p-6 bg-gradient-to-r from-purple-500 to-blue-500">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          <div className="relative z-10">
            {/* Creator Info */}
            <div className="flex items-center gap-4 mb-4">
              {creatorAvatar && (
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  className="w-12 h-12 rounded-full border-2 border-white/30"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{creatorName}</h3>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {followerCount.toLocaleString()} followers
                </p>
              </div>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      You're now following {creatorName}! 🎉
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleFollow}
                className={cn(
                  "flex-1 gap-2 transition-all",
                  following
                    ? "bg-white/20 hover:bg-white/30 border border-white/40"
                    : "bg-white text-purple-600 hover:bg-white/90"
                )}
              >
                {following ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="gap-2 border-white/40 text-white hover:bg-white/10"
                onClick={onNotify}
              >
                <Bell className="w-4 h-4" />
                Notify Me
              </Button>
            </div>

            {/* Value Prop */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-white/90 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Get notified when {creatorName} releases new content, courses, and exclusive offers
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Compact version for sidebar
export function FollowCreatorCompact({
  creatorName,
  isFollowing = false,
  onFollow,
  className
}: Pick<FollowCreatorCTAProps, "creatorName" | "isFollowing" | "onFollow" | "className">) {
  const [following, setFollowing] = useState(isFollowing);

  const handleFollow = () => {
    setFollowing(!following);
    onFollow?.();
  };

  return (
    <Button
      onClick={handleFollow}
      variant={following ? "outline" : "default"}
      className={cn("w-full gap-2", className)}
    >
      {following ? (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <Heart className="w-4 h-4" />
          Follow {creatorName}
        </>
      )}
    </Button>
  );
}

