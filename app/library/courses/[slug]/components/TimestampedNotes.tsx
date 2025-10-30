"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  StickyNote,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Edit2,
  Check,
  X,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimestampedNotesProps {
  courseId: Id<"courses">;
  chapterId: Id<"chapters">;
  currentTimestamp?: number; // Current video/audio timestamp
  onSeekTo?: (timestamp: number) => void; // Callback to seek to timestamp
}

export function TimestampedNotes({
  courseId,
  chapterId,
  currentTimestamp = 0,
  onSeekTo,
}: TimestampedNotesProps) {
  const { user } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<Id<"courseNotes"> | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showPublicNotes, setShowPublicNotes] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const notes = useQuery(
    api.collaborativeNotes.getChapterNotes,
    user?.id
      ? {
          chapterId,
          userId: user.id,
          includePublic: showPublicNotes,
        }
      : "skip"
  );

  const createNote = useMutation(api.collaborativeNotes.createNote);
  const updateNote = useMutation(api.collaborativeNotes.updateNote);
  const deleteNote = useMutation(api.collaborativeNotes.deleteNote);
  const toggleVisibility = useMutation(api.collaborativeNotes.toggleNoteVisibility);

  useEffect(() => {
    if (isCreating && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isCreating]);

  const formatTimestamp = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCreateNote = async () => {
    if (!user?.id || !newNoteContent.trim()) return;

    try {
      await createNote({
        courseId,
        chapterId,
        userId: user.id,
        content: newNoteContent,
        timestamp: currentTimestamp,
        isPublic: false,
      });

      setNewNoteContent("");
      setIsCreating(false);
      toast.success("Note created!");
    } catch (error) {
      toast.error("Failed to create note");
      console.error(error);
    }
  };

  const handleUpdateNote = async (noteId: Id<"courseNotes">) => {
    if (!editContent.trim()) return;

    try {
      await updateNote({
        noteId,
        content: editContent,
      });

      setEditingNoteId(null);
      setEditContent("");
      toast.success("Note updated!");
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    }
  };

  const handleDeleteNote = async (noteId: Id<"courseNotes">) => {
    if (!user?.id) return;

    try {
      await deleteNote({ noteId, userId: user.id });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const handleToggleVisibility = async (noteId: Id<"courseNotes">) => {
    if (!user?.id) return;

    try {
      const result = await toggleVisibility({ noteId, userId: user.id });
      toast.success(result.isPublic ? "Note is now public" : "Note is now private");
    } catch (error) {
      toast.error("Failed to toggle visibility");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-amber-600" aria-hidden="true" />
          <h3 className="font-semibold">Timestamped Notes</h3>
          {notes && notes.length > 0 && (
            <Badge variant="secondary">{notes.length}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showPublicNotes ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPublicNotes(!showPublicNotes)}
                  aria-label={showPublicNotes ? "Hide public notes" : "Show public notes"}
                >
                  {showPublicNotes ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-black">
                {showPublicNotes ? "Hide public notes" : "Show public notes"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            aria-label="Add new note"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Create Note Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 space-y-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>At {formatTimestamp(currentTimestamp)}</span>
              </div>
              <Textarea
                ref={textareaRef}
                placeholder="Write your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[80px] bg-white dark:bg-black resize-none"
                aria-label="Note content"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewNoteContent("");
                  }}
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4 mr-2" aria-hidden="true" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNote}
                  disabled={!newNoteContent.trim()}
                  aria-label="Save note"
                >
                  <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                  Save
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="space-y-3">
        <AnimatePresence>
          {notes && notes.length > 0 ? (
            notes.map((note) => (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`p-4 space-y-3 ${note.isOwner ? "bg-card" : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {!note.isOwner && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={note.userAvatar} alt={note.userName || "User"} />
                          <AvatarFallback className="text-xs">
                            {note.userName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-primary font-mono"
                        onClick={() => onSeekTo?.(note.timestamp)}
                        aria-label={`Jump to ${formatTimestamp(note.timestamp)}`}
                      >
                        <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                        {formatTimestamp(note.timestamp)}
                      </Button>
                      {!note.isOwner && note.userName && (
                        <span className="text-xs text-muted-foreground truncate">
                          by {note.userName}
                        </span>
                      )}
                      {note.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>

                    {note.isOwner && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleToggleVisibility(note._id)}
                                aria-label={note.isPublic ? "Make private" : "Make public"}
                              >
                                {note.isPublic ? (
                                  <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white dark:bg-black">
                              {note.isPublic ? "Make private" : "Share publicly"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingNoteId(note._id);
                            setEditContent(note.content);
                          }}
                          aria-label="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note._id)}
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {editingNoteId === note._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none"
                        aria-label="Edit note content"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditContent("");
                          }}
                          aria-label="Cancel editing"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note._id)}
                          disabled={!editContent.trim()}
                          aria-label="Save changes"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                  )}

                  {/* Footer */}
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-20" aria-hidden="true" />
              <p>No notes yet. Click "Add Note" to create your first note!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

