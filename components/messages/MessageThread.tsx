"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { FileIcon, ImageIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  storageId: string;
  url?: string;
  size: number;
  type: string;
}

interface Message {
  _id: Id<"dmMessages">;
  conversationId: Id<"dmConversations">;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  readAt?: number;
  createdAt: number;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const message of messages) {
    const messageDate = new Date(message.createdAt);
    let dateLabel: string;

    if (isToday(messageDate)) {
      dateLabel = "Today";
    } else if (isYesterday(messageDate)) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = format(messageDate, "MMMM d, yyyy");
    }

    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      groupedMessages.push({ date: dateLabel, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  }

  return (
    <div className="space-y-6">
      {groupedMessages.map((group) => (
        <div key={group.date}>
          <div className="mb-4 flex items-center justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {group.date}
            </span>
          </div>
          <div className="space-y-3">
            {group.messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[70%] space-y-2", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isOwn
              ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
              : "bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} isOwn={isOwn} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn("flex items-center gap-1", isOwn ? "justify-end" : "justify-start")}>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
          {isOwn && message.readAt && (
            <span className="text-xs text-muted-foreground">· Read</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AttachmentPreview({ attachment, isOwn }: { attachment: Attachment; isOwn: boolean }) {
  const isImage = attachment.type.startsWith("image/");
  const fileSize = formatFileSize(attachment.size);

  if (isImage && attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-64 rounded-lg object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
        isOwn ? "bg-white/10" : "bg-background"
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("truncate text-sm font-medium", isOwn ? "text-white" : "text-foreground")}>
          {attachment.name}
        </p>
        <p className={cn("text-xs", isOwn ? "text-white/70" : "text-muted-foreground")}>
          {fileSize}
        </p>
      </div>
      <Download className={cn("h-4 w-4", isOwn ? "text-white/70" : "text-muted-foreground")} />
    </a>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
