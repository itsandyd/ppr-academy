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
  const [conversationToDelete, setConversationToDelete] = useState<Id<"aiConversations"> | null>(null);

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
  const filteredConversations = conversations?.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate starred and regular conversations
  const starredConversations = filteredConversations?.filter((c) => c.starred) || [];
  const regularConversations = filteredConversations?.filter((c) => !c.starred) || [];

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

  const ConversationItem = ({ conversation }: { conversation: NonNullable<typeof conversations>[0] }) => {
    const isActive = currentConversationId === conversation._id;
    const isEditing = editingId === conversation._id;

    return (
      <div
        className={cn(
          "group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all",
          isActive
            ? "bg-primary/10 text-primary border border-primary/20"
            : "hover:bg-muted/50 border border-transparent"
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
              <div className="flex items-center gap-1.5 mb-0.5">
                {conversation.starred && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                <span className="font-medium text-sm line-clamp-2 leading-tight">
                  {conversation.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{formatDistanceToNow(conversation.lastMessageAt, { addSuffix: true })}</span>
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
                className="absolute right-1 top-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black">
              <DropdownMenuItem onClick={() => handleStartEdit(conversation._id, conversation.title)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStarred({ conversationId: conversation._id })}>
                <Star className={cn("w-4 h-4 mr-2", conversation.starred && "fill-current")} />
                {conversation.starred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => archiveConversation({ conversationId: conversation._id })}>
                <Archive className="w-4 h-4 mr-2" />
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
                <Trash2 className="w-4 h-4 mr-2" />
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
      <div className="w-16 h-full border-r bg-background flex flex-col items-center pt-2 pb-3">
        {/* Header section */}
        <div className="flex flex-col items-center gap-2 px-2 pb-2 border-b border-border w-full">
          {/* Expand button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {/* New conversation */}
          <Button
            variant="outline"
            size="icon"
            onClick={onNewConversation}
            className="h-10 w-10 rounded-full"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Recent conversations as mini buttons */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full py-3 px-2">
          {recentConversations.map((conversation) => {
            const isActive = currentConversationId === conversation._id;
            const initial = conversation.title.charAt(0).toUpperCase();
            
            return (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all flex-shrink-0",
                  "hover:bg-muted/80",
                  isActive 
                    ? "bg-primary/20 text-primary ring-2 ring-primary/30" 
                    : "bg-muted/50 text-muted-foreground"
                )}
                title={conversation.title}
              >
                {conversation.starred ? (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
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
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/50 flex-shrink-0"
              title={`${conversations.length - 6} more conversations`}
            >
              +{conversations.length - 6}
            </button>
          )}
        </div>
        
        {/* Footer count */}
        <div className="pt-2 px-2 border-t border-border w-full flex justify-center">
          <div className="flex flex-col items-center text-[10px] text-muted-foreground">
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span>{conversations?.length || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 h-full border-r bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Conversations</h2>
            </div>
            {onToggleCollapse && (
              <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <Button
            onClick={onNewConversation}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Starred Section */}
            {starredConversations.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Starred
                </div>
                {starredConversations.map((conversation) => (
                  <ConversationItem key={conversation._id} conversation={conversation} />
                ))}
              </div>
            )}

            {/* Regular Section */}
            {regularConversations.length > 0 && (
              <div>
                {starredConversations.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent
                  </div>
                )}
                {regularConversations.map((conversation) => (
                  <ConversationItem key={conversation._id} conversation={conversation} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredConversations?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">
                  {searchQuery
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                {!searchQuery && (
                  <p className="text-xs mt-1">
                    Start a new conversation to begin
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{conversations?.length || 0} conversations</span>
            <span>{conversations?.reduce((sum, c) => sum + c.messageCount, 0) || 0} messages</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
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

