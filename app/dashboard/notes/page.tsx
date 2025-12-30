"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NotionEditor } from "@/components/notes/notion-editor";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { AINoteGenerator } from "@/components/notes/ai-note-generator";
import { SourceLibrary } from "@/components/notes/source-library";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Save,
  Sparkles,
  BookOpen,
  FileText,
  Loader2,
  PlusCircle,
  Brain,
  ChevronRight,
  Home,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
  Youtube,
  Globe,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardNotesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const mode = searchParams.get("mode");

  // State
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Redirect if not in create mode
  useEffect(() => {
    if (isLoaded && mode !== "create") {
      router.replace("/dashboard?mode=learn");
    }
  }, [mode, isLoaded, router]);

  // Get user's stores
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");

  const storeId = stores?.[0]?._id;

  // Convex queries and mutations
  const folders =
    useQuery(
      api.notes.getFoldersByUser,
      user?.id && storeId
        ? {
            userId: user.id,
            storeId,
            parentId: selectedFolderId ? (selectedFolderId as Id<"noteFolders">) : undefined,
          }
        : "skip"
    ) ?? [];

  const notesQuery = useQuery(
    (api.notes as any).getNotesByUser,
    user?.id && storeId
      ? {
          userId: user.id,
          storeId,
          folderId: selectedFolderId ? (selectedFolderId as Id<"noteFolders">) : undefined,
          paginationOpts: { numItems: 50, cursor: null },
        }
      : "skip"
  );

  const notes = notesQuery?.page ?? [];

  const selectedNote = useQuery(
    api.notes.getNote,
    selectedNoteId ? { noteId: selectedNoteId as Id<"notes"> } : "skip"
  );

  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const createFolder = useMutation(api.notes.createFolder);
  const updateFolder = useMutation(api.notes.updateFolder);
  const deleteFolder = useMutation(api.notes.deleteFolder);

  // Get current folder for breadcrumb
  const currentFolder = selectedFolderId
    ? folders.find((f: any) => f._id === selectedFolderId)
    : null;

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    if (!selectedFolderId || !currentFolder) return [];

    const path: Array<{ _id: string; name: string }> = [];
    let folder = currentFolder;

    while (folder) {
      path.unshift({ _id: folder._id, name: folder.name });
      folder = folders.find((f: any) => f._id === folder.parentId) as any;
    }

    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  // Handlers
  const handleNoteSelect = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleCreateNote = useCallback(
    async (folderId?: string) => {
      if (!user?.id || !storeId) return;

      try {
        const noteId = await createNote({
          title: "Untitled",
          content: "<p>Start writing your thoughts...</p>",
          userId: user.id,
          storeId,
          folderId: folderId ? (folderId as Id<"noteFolders">) : undefined,
          tags: [],
          category: undefined,
          priority: "medium",
        });
        setSelectedNoteId(noteId);
        toast({
          title: "Note Created",
          description: "Your new note has been created.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create note.",
          variant: "destructive",
        });
      }
    },
    [createNote, user?.id, storeId]
  );

  const handleCreateFolder = useCallback(
    async (parentId?: string) => {
      if (!user?.id || !storeId) return;

      try {
        await createFolder({
          name: "New Folder",
          userId: user.id,
          storeId,
          parentId: parentId ? (parentId as Id<"noteFolders">) : undefined,
        });
        toast({
          title: "Folder Created",
          description: "Your new folder has been created.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create folder.",
          variant: "destructive",
        });
      }
    },
    [createFolder, user?.id, storeId]
  );

  const handleRenameFolder = useCallback(
    async (folderId: string, newName: string) => {
      try {
        await updateFolder({
          folderId: folderId as Id<"noteFolders">,
          name: newName,
        });
        toast({
          title: "Folder Renamed",
          description: "Your folder has been renamed successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to rename folder.",
          variant: "destructive",
        });
      }
    },
    [updateFolder]
  );

  const handleSaveNote = useCallback(
    async (showToast = true) => {
      if (!selectedNoteId) {
        await handleCreateNote(selectedFolderId || undefined);
        return;
      }

      setIsSaving(true);
      try {
        await updateNote({
          noteId: selectedNoteId as Id<"notes">,
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
    [selectedNoteId, currentNote, updateNote, handleCreateNote, selectedFolderId]
  );

  // Update current note when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setCurrentNote({
        title: selectedNote.title,
        content: selectedNote.content,
        icon: selectedNote.icon || "📝",
        tags: selectedNote.tags,
        priority: selectedNote.priority || "medium",
        status: selectedNote.status,
      });
    }
  }, [selectedNote]);

  // Auto-save functionality
  useEffect(() => {
    if (!selectedNoteId || !selectedNote) return;

    const hasChanges =
      currentNote.title !== selectedNote.title ||
      currentNote.content !== selectedNote.content ||
      JSON.stringify(currentNote.tags) !== JSON.stringify(selectedNote.tags) ||
      currentNote.priority !== selectedNote.priority ||
      currentNote.status !== selectedNote.status;

    if (!hasChanges) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateNote({
          noteId: selectedNoteId as Id<"notes">,
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
  }, [selectedNoteId, selectedNote, currentNote, updateNote]);

  // Handle note created from AI generator
  const handleNoteCreated = (noteId: Id<"notes">) => {
    setSelectedNoteId(noteId);
  };

  // Loading state
  if (!isLoaded || !user || stores === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Redirect if not create mode
  if (mode !== "create") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Show error if no stores
  if (!storeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">AI Notes</h1>
          <p className="text-muted-foreground">
            Generate notes from YouTube, websites, PDFs, and more using AI
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold">Store Required</h3>
                <p className="mb-4 text-muted-foreground">
                  AI Notes requires a creator store. Set up your store to start generating notes
                  from any content.
                </p>
                <Button asChild>
                  <Link href="/dashboard?mode=create">Set Up Your Store</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="-m-4 h-[calc(100vh-9rem)] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800/50 md:-m-8">
      <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#1a1a1a]">
        {/* Sidebar */}
        <div className="flex w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800/50 dark:bg-[#1e1e1e]">
          <NotesSidebar
            folders={folders}
            notes={notes}
            selectedNoteId={selectedNoteId ?? undefined}
            selectedFolderId={selectedFolderId ?? undefined}
            onNoteSelect={handleNoteSelect}
            onFolderSelect={setSelectedFolderId}
            onCreateNote={handleCreateNote}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={(folderId) => deleteFolder({ folderId: folderId as Id<"noteFolders"> })}
            onDeleteNote={(noteId) => deleteNote({ noteId: noteId as Id<"notes"> })}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#1a1a1a]">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white backdrop-blur-sm dark:border-gray-800/50 dark:bg-[#1e1e1e]/50">
            {/* Breadcrumb Navigation */}
            {breadcrumbPath.length > 0 && (
              <div className="flex items-center gap-2 px-6 pb-2 pt-3 text-sm text-gray-600 dark:text-gray-400">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className="flex items-center gap-1 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <Home className="h-4 w-4" />
                  <span>All Notes</span>
                </button>
                {breadcrumbPath.map((folder, index) => (
                  <div key={folder._id} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <button
                      onClick={() => setSelectedFolderId(folder._id)}
                      className={cn(
                        "transition-colors hover:text-gray-900 dark:hover:text-gray-100",
                        index === breadcrumbPath.length - 1 &&
                          "font-semibold text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Header */}
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex min-w-0 items-center gap-4">
                <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedNoteId
                    ? currentNote.title
                    : currentFolder
                      ? currentFolder.name
                      : "Notes"}
                </h1>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                {selectedNote && (
                  <>
                    <Badge
                      variant="secondary"
                      className="border-gray-200 bg-gray-100 text-xs text-gray-700 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300"
                    >
                      {selectedNote.status}
                    </Badge>
                    {selectedNote.wordCount && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedNote.wordCount} words
                      </span>
                    )}
                    {isSaving ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    ) : lastSaved ? (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        ✓ Saved {formatDistanceToNow(lastSaved)} ago
                      </span>
                    ) : null}
                  </>
                )}

                {/* Content Importer Button */}
                <AINoteGenerator
                  userId={user.id}
                  storeId={storeId}
                  folderId={selectedFolderId ?? undefined}
                  onNoteCreated={handleNoteCreated}
                />

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

                {selectedNoteId && (
                  <Button onClick={() => handleSaveNote(true)} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-auto">
              {selectedNoteId && selectedNote ? (
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
              ) : (
                // Welcome Screen
                <div className="flex h-full items-center justify-center bg-gray-50/50 dark:bg-[#1a1a1a]">
                  <div className="max-w-lg space-y-6 px-4 text-center">
                    <div className="space-y-2">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20">
                        <Brain className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        AI-Powered Notes
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Generate notes from YouTube videos, websites, PDFs, or write your own.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Button onClick={() => handleCreateNote()} className="flex-1 gap-2">
                          <PlusCircle className="h-4 w-4" />
                          New Note
                        </Button>
                        <AINoteGenerator
                          userId={user.id}
                          storeId={storeId}
                          folderId={selectedFolderId ?? undefined}
                          onNoteCreated={handleNoteCreated}
                        />
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Or select a note from the sidebar
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 dark:border-gray-800/50">
                      <h3 className="mb-4 font-medium text-gray-900 dark:text-gray-100">
                        Import Content From
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-[#1e1e1e]">
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                            <Youtube className="h-5 w-5 text-red-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            YouTube
                          </p>
                          <p className="text-xs text-gray-500">Transcripts</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-[#1e1e1e]">
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                            <Globe className="h-5 w-5 text-blue-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Websites
                          </p>
                          <p className="text-xs text-gray-500">Articles</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-[#1e1e1e]">
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                            <Upload className="h-5 w-5 text-orange-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            PDFs
                          </p>
                          <p className="text-xs text-gray-500">Documents</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Source Library Panel */}
            {showSourceLibrary && (
              <div className="w-80 flex-shrink-0">
                <SourceLibrary
                  userId={user.id}
                  storeId={storeId}
                  folderId={selectedFolderId ?? undefined}
                  onGenerateNotes={(sourceId) => {
                    // Refresh notes after generation
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
