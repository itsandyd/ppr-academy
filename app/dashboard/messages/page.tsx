"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConversationList } from "@/components/messages/ConversationList";
import { EmptyInbox } from "@/components/messages/EmptyInbox";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const conversations = useQuery(
    api.directMessages.getConversations,
    isLoaded && user ? {} : "skip"
  );

  if (!isLoaded || conversations === undefined) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Sign in to view messages</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to access your messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Your direct message conversations</p>
        </div>
        <NewConversationDialog />
      </div>

      <div className="max-w-3xl">
        {conversations.length === 0 ? (
          <EmptyInbox />
        ) : (
          <ConversationList conversations={conversations} />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="max-w-3xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
