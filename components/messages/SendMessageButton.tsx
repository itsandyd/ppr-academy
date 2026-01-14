"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SendMessageButtonProps {
  recipientUserId: string;
  recipientName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

export function SendMessageButton({
  recipientUserId,
  recipientName,
  variant = "outline",
  size = "default",
  className,
  showIcon = true,
  showLabel = true,
}: SendMessageButtonProps) {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const getOrCreateConversation = useMutation(api.directMessages.getOrCreateConversation);

  const handleClick = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to send messages");
      return;
    }

    if (user.id === recipientUserId) {
      toast.error("You can't message yourself");
      return;
    }

    setIsLoading(true);

    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: recipientUserId,
      });

      router.push(`/dashboard/messages/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (user?.id === recipientUserId) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <MessageCircle className="h-4 w-4" />
      ) : null}
      {showLabel && (
        <span className={showIcon ? "ml-2" : ""}>
          {recipientName ? `Message ${recipientName}` : "Send Message"}
        </span>
      )}
    </Button>
  );
}
