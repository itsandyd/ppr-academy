"use client";

import { use, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageThread } from "@/components/messages/MessageThread";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const { user, isLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationDetails = useQuery(
    api.directMessages.getConversationDetails,
    isLoaded && user
      ? { conversationId: conversationId as Id<"dmConversations"> }
      : "skip"
  );

  const messages = useQuery(
    api.directMessages.getMessages,
    isLoaded && user
      ? { conversationId: conversationId as Id<"dmConversations"> }
      : "skip"
  );

  const markAsRead = useMutation(api.directMessages.markAsRead);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId && user) {
      markAsRead({ conversationId: conversationId as Id<"dmConversations"> });
    }
  }, [conversationId, user, markAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoaded || conversationDetails === undefined || messages === undefined) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Sign in to view messages</h2>
        </div>
      </div>
    );
  }

  if (!conversationDetails) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Conversation not found</h2>
          <p className="mt-2 text-muted-foreground">
            This conversation may have been deleted or you don&apos;t have access.
          </p>
          <Link href="/dashboard/messages">
            <Button className="mt-4">Back to Messages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { otherUser } = conversationDetails;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 border-b bg-background px-3 md:px-4 py-3">
        <Link href="/dashboard/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            {otherUser.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{otherUser.name}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <MessageThread messages={messages} currentUserId={user.id} />
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        conversationId={conversationId as Id<"dmConversations">}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-4 border-b px-4 py-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1 space-y-4 px-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
            <Skeleton className="h-16 w-64 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}
