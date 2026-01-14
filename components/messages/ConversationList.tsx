"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  _id: Id<"dmConversations">;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  createdAt: number;
  otherUser: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem key={conversation._id} conversation={conversation} />
      ))}
    </div>
  );
}

function ConversationItem({ conversation }: { conversation: Conversation }) {
  const { otherUser, lastMessagePreview, lastMessageAt, unreadCount, createdAt } = conversation;
  const displayTime = lastMessageAt || createdAt;

  return (
    <Link href={`/dashboard/messages/${conversation._id}`}>
      <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {otherUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`truncate font-semibold ${unreadCount > 0 ? "text-foreground" : "text-foreground"}`}>
              {otherUser.name}
            </h3>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(displayTime), { addSuffix: true })}
            </span>
          </div>
          <p className={`mt-1 truncate text-sm ${unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {lastMessagePreview || "No messages yet"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Badge variant="default" className="shrink-0 bg-blue-500">
            {unreadCount} new
          </Badge>
        )}
      </div>
    </Link>
  );
}
