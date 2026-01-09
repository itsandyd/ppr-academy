"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  Edit3,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationSidebarProps {
  userId: string;
  currentConversationId: Id<"aiConversations"> | null;
  onSelectConversation: (id: Id<"aiConversations"> | null) => void;
  onNewConversation: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ConversationSidebar({
  userId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<Id<"aiConversations"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Id<"aiConversations"> | null>(
    null
  );

  // Queries
  const conversations = useQuery(api.aiConversations.getUserConversations, {
    userId,
    limit: 100,
    includeArchived: false,
  });

  // Mutations
  const updateTitle = useMutation(api.aiConversations.updateConversationTitle);
  const toggleStarred = useMutation(api.aiConversations.toggleStarred);
  const archiveConversation = useMutation(api.aiConversations.archiveConversation);
  const deleteConversation = useMutation(api.aiConversations.deleteConversation);

  // Filter conversations by search
  const filteredConversations = conversations?.filter((c: any) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate starred and regular conversations
  const starredConversations = filteredConversations?.filter((c: any) => c.starred) || [];
  const regularConversations = filteredConversations?.filter((c: any) => !c.starred) || [];

  const handleStartEdit = (id: Id<"aiConversations">, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await updateTitle({ conversationId: editingId, title: editTitle.trim() });
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleDelete = async () => {
    if (conversationToDelete) {
      await deleteConversation({ conversationId: conversationToDelete });
      if (currentConversationId === conversationToDelete) {
        onSelectConversation(null);
      }
      setConversationToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const ConversationItem = ({
    conversation,
  }: {
    conversation: NonNullable<typeof conversations>[0];
  }) => {
    const isActive = currentConversationId === conversation._id;
    const isEditing = editingId === conversation._id;

    return (
      <div
        className={cn(
          "group relative cursor-pointer rounded-lg px-3 py-2.5 transition-all",
          isActive
            ? "border border-primary/20 bg-primary/10 text-primary"
            : "border border-transparent hover:bg-muted/50"
        )}
        onClick={() => !isEditing && onSelectConversation(conversation._id)}
      >
        {/* Content - full width without icon for more title space */}
        <div className="pr-8">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") setEditingId(null);
              }}
              onBlur={handleSaveEdit}
              className="h-7 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <div className="mb-0.5 flex items-center gap-1.5">
                {conversation.starred && (
                  <Star className="h-3 w-3 flex-shrink-0 fill-yellow-500 text-yellow-500" />
                )}
                <span className="line-clamp-2 text-sm font-medium leading-tight">
                  {conversation.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {formatDistanceToNow(conversation.lastMessageAt, { addSuffix: true })}
                </span>
                <span className="flex-shrink-0">·</span>
                <span className="flex-shrink-0">{conversation.messageCount} msgs</span>
              </div>
            </>
          )}
        </div>

        {/* Actions - positioned absolutely in top right */}
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black">
              <DropdownMenuItem
                onClick={() => handleStartEdit(conversation._id, conversation.title)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStarred({ conversationId: conversation._id })}>
                <Star className={cn("mr-2 h-4 w-4", conversation.starred && "fill-current")} />
                {conversation.starred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => archiveConversation({ conversationId: conversation._id })}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setConversationToDelete(conversation._id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  // Collapsed view - show mini conversation buttons
  if (isCollapsed) {
    const recentConversations = conversations?.slice(0, 6) || [];

    return (
      <div className="flex h-full w-16 flex-col items-center border-r bg-background pb-3 pt-2">
        {/* Header section */}
        <div className="flex w-full flex-col items-center gap-2 border-b border-border px-2 pb-2">
          {/* Expand button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* New conversation */}
          <Button
            variant="outline"
            size="icon"
            onClick={onNewConversation}
            className="h-10 w-10 rounded-full"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Recent conversations as mini buttons */}
        <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-3">
          {recentConversations.map((conversation: any) => {
            const isActive = currentConversationId === conversation._id;
            const initial = conversation.title.charAt(0).toUpperCase();

            return (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-all",
                  "hover:bg-muted/80",
                  isActive
                    ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground"
                )}
                title={conversation.title}
              >
                {conversation.starred ? (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ) : (
                  initial
                )}
              </button>
            );
          })}

          {/* Show more indicator if there are more conversations */}
          {conversations && conversations.length > 6 && (
            <button
              onClick={onToggleCollapse}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs text-muted-foreground hover:bg-muted/50"
              title={`${conversations.length - 6} more conversations`}
            >
              +{conversations.length - 6}
            </button>
          )}
        </div>

        {/* Footer count */}
        <div className="flex w-full justify-center border-t border-border px-2 pt-2">
          <div className="flex flex-col items-center text-[10px] text-muted-foreground">
            <MessageSquare className="mb-0.5 h-4 w-4" />
            <span>{conversations?.length || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-80 flex-col border-r bg-background">
        {/* Header */}
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Conversations</h2>
            </div>
            {onToggleCollapse && (
              <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button onClick={onNewConversation} className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 bg-muted/50 pl-8"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {/* Starred Section */}
            {starredConversations.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Starred
                </div>
                {starredConversations.map((conversation: any) => (
                  <ConversationItem key={conversation._id} conversation={conversation} />
                ))}
              </div>
            )}

            {/* Regular Section */}
            {regularConversations.length > 0 && (
              <div>
                {starredConversations.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recent
                  </div>
                )}
                {regularConversations.map((conversation: any) => (
                  <ConversationItem key={conversation._id} conversation={conversation} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredConversations?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="text-sm">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                {!searchQuery && <p className="mt-1 text-xs">Start a new conversation to begin</p>}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="border-t bg-muted/30 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{conversations?.length || 0} conversations</span>
            <span>{conversations?.reduce((sum: number, c: any) => sum + c.messageCount, 0) || 0} messages</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
