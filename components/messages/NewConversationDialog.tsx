"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Loader2, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SearchedUser {
  id: string | undefined;
  name: string;
  email: string | undefined;
  imageUrl: string | undefined;
}

interface NewConversationDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function NewConversationDialog({
  trigger,
  className,
}: NewConversationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isStarting, setIsStarting] = useState<string | null>(null);

  const getOrCreateConversation = useMutation(
    api.directMessages.getOrCreateConversation
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useQuery(
    api.directMessages.searchUsersForDM,
    debouncedQuery.length >= 2 ? { searchQuery: debouncedQuery } : "skip"
  );

  const handleStartConversation = async (userId: string, userName: string) => {
    setIsStarting(userId);
    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: userId,
      });
      setOpen(false);
      setSearchQuery("");
      router.push(`/dashboard/messages/${conversationId}`);
      toast.success(`Started conversation with ${userName}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setIsStarting(null);
    }
  };

  const defaultTrigger = (
    <Button className={cn("gap-2", className)}>
      <Plus className="h-4 w-4" />
      New Conversation
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Start New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-[300px] overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search for users
                </p>
              </div>
            ) : searchResults === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No users found matching &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user: SearchedUser) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartConversation(user.id!, user.name)}
                    disabled={isStarting !== null}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{user.name}</p>
                      {user.email && (
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                    {isStarting === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
