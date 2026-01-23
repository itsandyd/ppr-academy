"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NotionEditor } from "@/components/notes/notion-editor";
import { SourceLibrary } from "@/components/notes/source-library";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Save,
  Loader2,
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Clock,
  Star,
  Archive,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", icon: FileText },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "completed", label: "Completed", icon: Star },
  { value: "archived", label: "Archived", icon: Archive },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function NoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const noteId = params.noteId as string;

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSourceLibrary, setShowSourceLibrary] = useState(false);

  // Current note state
  const [currentNote, setCurrentNote] = useState({
    title: "Untitled",
    content: "",
    icon: "📝",
    tags: [] as string[],
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "draft" as "draft" | "in_progress" | "completed" | "archived",
  });

  // Get user's stores
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const storeId = stores?.[0]?._id;

  // Get the note
  const note = useQuery(
    api.notes.getNote,
    noteId ? { noteId: noteId as Id<"notes"> } : "skip"
  );

  // Mutations
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  // Update current note when note data loads
  useEffect(() => {
    if (note) {
      setCurrentNote({
        title: note.title,
        content: note.content,
        icon: note.icon || "📝",
        tags: note.tags,
        priority: note.priority || "medium",
        status: note.status,
      });
    }
  }, [note]);

  // Auto-save functionality
  useEffect(() => {
    if (!noteId || !note) return;

    const hasChanges =
      currentNote.title !== note.title ||
      currentNote.content !== note.content ||
      JSON.stringify(currentNote.tags) !== JSON.stringify(note.tags) ||
      currentNote.priority !== note.priority ||
      currentNote.status !== note.status;

    if (!hasChanges) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateNote({
          noteId: noteId as Id<"notes">,
          title: currentNote.title,
          content: currentNote.content,
          tags: currentNote.tags,
          priority: currentNote.priority,
          status: currentNote.status,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [noteId, note, currentNote, updateNote]);

  // Handlers
  const handleSaveNote = useCallback(
    async (showToast = true) => {
      if (!noteId) return;

      setIsSaving(true);
      try {
        await updateNote({
          noteId: noteId as Id<"notes">,
          title: currentNote.title,
          content: currentNote.content,
          tags: currentNote.tags,
          priority: currentNote.priority,
          status: currentNote.status,
        });

        setLastSaved(new Date());

        if (showToast) {
          toast({
            title: "Note Saved",
            description: "Your note has been saved successfully.",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save note.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [noteId, currentNote, updateNote]
  );

  const handleDeleteNote = async () => {
    if (!confirm("Are you sure you want to delete this note? This cannot be undone.")) {
      return;
    }
    try {
      await deleteNote({ noteId: noteId as Id<"notes"> });
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted.",
      });
      router.push("/dashboard/notes?mode=create");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (!isLoaded || !user || stores === undefined || note === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Note not found
  if (note === null) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Note Not Found</h1>
          <p className="mt-1 text-muted-foreground">
            The note you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/notes?mode=create">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="-m-4 h-[calc(100vh-9rem)] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800/50 md:-m-8">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-800/50 dark:bg-[#1e1e1e]">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notes?mode=create">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentNote.title || "Untitled"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Selector */}
              <Select
                value={currentNote.status}
                onValueChange={(value: any) =>
                  setCurrentNote((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Selector */}
              <Select
                value={currentNote.priority}
                onValueChange={(value: any) =>
                  setCurrentNote((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Word count and save status */}
              {note.wordCount && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {note.wordCount} words
                </span>
              )}

              {isSaving ? (
                <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Saved {formatDistanceToNow(lastSaved)} ago
                </span>
              ) : null}

              {/* Toggle Source Library */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSourceLibrary(!showSourceLibrary)}
                className="gap-2"
              >
                {showSourceLibrary ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
                Sources
              </Button>

              {/* Delete Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteNote}
                className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* Save Button */}
              <Button onClick={() => handleSaveNote(true)} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-auto">
            <div className="h-full w-full">
              <NotionEditor
                content={currentNote.content}
                onChange={(content) => setCurrentNote((prev) => ({ ...prev, content }))}
                title={currentNote.title}
                onTitleChange={(title) => setCurrentNote((prev) => ({ ...prev, title }))}
                icon={currentNote.icon}
                onIconChange={(icon) => setCurrentNote((prev) => ({ ...prev, icon }))}
                placeholder="Start writing your ideas..."
                className="h-full rounded-none border-none shadow-none"
              />
            </div>
          </div>

          {/* Source Library Panel */}
          {showSourceLibrary && storeId && (
            <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800/50">
              <SourceLibrary
                userId={user.id}
                storeId={storeId}
                folderId={note.folderId ?? undefined}
                onGenerateNotes={(sourceId) => {
                  // Could refresh or navigate to the generated note
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
