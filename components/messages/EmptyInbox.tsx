"use client";

import { MessageCircle } from "lucide-react";

export function EmptyInbox() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <MessageCircle className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No messages yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        When you start a conversation with someone, it will appear here.
        Visit a creator&apos;s profile to send them a message.
      </p>
    </div>
  );
}
