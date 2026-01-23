"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AINoteGenerator } from "@/components/notes/ai-note-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Loader2,
  PlusCircle,
  MoreVertical,
  Pencil,
  Trash2,
  FolderOpen,
  Clock,
  Archive,
  Search,
  AlertCircle,
  Youtube,
  Globe,
  Upload,
  Sparkles,
  Brain,
  Calendar,
  Star,
  FolderPlus,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: FileText,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: Star,
  },
  archived: {
    label: "Archived",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Archive,
  },
};

export default function DashboardNotesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const mode = searchParams.get("mode");

  // State
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get user's stores
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const storeId = stores?.[0]?._id;

  // Convex queries
  const folders = useQuery(
    api.notes.getFoldersByUser,
    user?.id && storeId
      ? {
          userId: user.id,
          storeId,
        }
      : "skip"
  ) ?? [];

  const notesQuery = useQuery(
    (api.notes as any).getNotesByUser,
    user?.id && storeId
      ? {
          userId: user.id,
          storeId,
          paginationOpts: { numItems: 100, cursor: null },
        }
      : "skip"
  );

  const notes = notesQuery?.page ?? [];

  // Mutations
  const createNote = useMutation(api.notes.createNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const createFolder = useMutation(api.notes.createFolder);
  const deleteFolder = useMutation(api.notes.deleteFolder);

  // Calculate stats
  const stats = {
    total: notes.length,
    draft: notes.filter((n: any) => n.status === "draft").length,
    inProgress: notes.filter((n: any) => n.status === "in_progress").length,
    completed: notes.filter((n: any) => n.status === "completed").length,
    folders: folders.length,
  };

  // Filter notes based on tab and search
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const filteredNotes = notes.filter((note: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!note.title.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Tab filter
    switch (activeTab) {
      case "recent":
        return note._creationTime > oneWeekAgo;
      case "draft":
        return note.status === "draft";
      case "completed":
        return note.status === "completed";
      case "archived":
        return note.status === "archived";
      default:
        return note.status !== "archived";
    }
  });

  // Handlers
  const handleCreateNote = async () => {
    if (!user?.id || !storeId) return;

    try {
      const noteId = await createNote({
        title: "Untitled Note",
        content: "<p>Start writing your thoughts...</p>",
        userId: user.id,
        storeId,
        tags: [],
        priority: "medium",
      });
      router.push(`/dashboard/notes/${noteId}/edit?mode=create`);
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
  };

  const handleCreateFolder = async () => {
    if (!user?.id || !storeId) return;

    try {
      await createFolder({
        name: "New Folder",
        userId: user.id,
        storeId,
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
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note? This cannot be undone.")) {
      return;
    }
    try {
      await deleteNote({ noteId: noteId as Id<"notes"> });
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  const handleNoteCreated = (noteId: Id<"notes">) => {
    router.push(`/dashboard/notes/${noteId}/edit?mode=create`);
  };

  // Loading state
  if (!isLoaded || !user || stores === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error if no stores
  if (!storeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Notes</h1>
          <p className="mt-1 text-muted-foreground">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Notes</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your notes, generate from any content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AINoteGenerator
            userId={user.id}
            storeId={storeId}
            onNoteCreated={handleNoteCreated}
          />
          <Button onClick={handleCreateNote} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Quick Import Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
              <Youtube className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium">YouTube</p>
              <p className="text-sm text-muted-foreground">Import from videos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Websites</p>
              <p className="text-sm text-muted-foreground">Import from articles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Upload className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">PDFs</p>
              <p className="text-sm text-muted-foreground">Import from documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Notes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.folders}</div>
            <div className="text-sm text-muted-foreground">Folders</div>
          </CardContent>
        </Card>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="h-5 w-5" />
                Folders
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleCreateFolder} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {folders.map((folder: any) => (
                <Link
                  key={folder._id}
                  href={`/dashboard/notes/folder/${folder._id}?mode=create`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder.noteCount || 0} notes
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total - notes.filter((n: any) => n.status === "archived").length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({stats.draft})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No notes match your search"
                    : activeTab === "all"
                      ? "No notes yet. Create your first note!"
                      : `No ${activeTab} notes`}
                </p>
                {!searchQuery && activeTab === "all" && (
                  <Button onClick={handleCreateNote} className="mt-4 gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Note
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredNotes.map((note: any) => (
              <NoteCard
                key={note._id}
                note={note}
                onDelete={handleDeleteNote}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: any;
  onDelete: (id: string) => void;
}) {
  const statusConfig = STATUS_CONFIG[note.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const createdDate = new Date(note._creationTime);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              {note.icon || "📝"}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-semibold">{note.title}</h3>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {note.sourceType && (
                  <Badge variant="outline" className="text-xs">
                    {note.sourceType === "youtube" && <Youtube className="mr-1 h-3 w-3" />}
                    {note.sourceType === "web" && <Globe className="mr-1 h-3 w-3" />}
                    {note.sourceType === "pdf" && <Upload className="mr-1 h-3 w-3" />}
                    {note.sourceType}
                  </Badge>
                )}
              </div>
              {note.tags && note.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{note.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(createdDate, "MMM d, yyyy")}</span>
                </div>
                {note.wordCount && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{note.wordCount} words</span>
                  </div>
                )}
                <span className="text-xs">
                  Updated {formatDistanceToNow(note.lastEditedAt || note._creationTime)} ago
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/notes/${note._id}/edit?mode=create`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/notes/${note._id}/edit?mode=create`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Note
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Course
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(note._id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
