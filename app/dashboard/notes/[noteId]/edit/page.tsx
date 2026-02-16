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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Settings,
  Edit3,
  Tag,
  X,
  Plus,
  Sparkles,
  BookOpen,
  FolderOpen,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", icon: FileText, color: "text-gray-600" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "text-yellow-600" },
  { value: "completed", label: "Completed", icon: Star, color: "text-green-600" },
  { value: "archived", label: "Archived", icon: Archive, color: "text-purple-600" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
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
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("editor");

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

  // Get folders for folder selection
  const folders = useQuery(
    api.notes.getFoldersByUser,
    user?.id && storeId
      ? {
          userId: user.id,
          storeId,
        }
      : "skip"
  ) ?? [];

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

  const handleAddTag = () => {
    if (newTag.trim() && !currentNote.tags.includes(newTag.trim())) {
      setCurrentNote((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentNote((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Check if there are unsaved changes
  const hasChanges = note && (
    currentNote.title !== note.title ||
    currentNote.content !== note.content ||
    JSON.stringify(currentNote.tags) !== JSON.stringify(note.tags) ||
    currentNote.priority !== note.priority ||
    currentNote.status !== note.status
  );

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

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === currentNote.status) || STATUS_OPTIONS[0];
  const priorityConfig = PRIORITY_OPTIONS.find((p) => p.value === currentNote.priority) || PRIORITY_OPTIONS[1];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/notes?mode=create">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Edit Note</h1>
              <p className="text-muted-foreground">{currentNote.title || "Untitled"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Save Status */}
            {isSaving ? (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-sm text-green-600 dark:text-green-400">
                Saved {formatDistanceToNow(lastSaved)} ago
              </span>
            ) : hasChanges ? (
              <span className="text-sm text-orange-600">Unsaved changes</span>
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

            {/* Save Button */}
            <Button onClick={() => handleSaveNote(true)} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="editor" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-6">
                {/* Editor Card */}
                <Card>
                  <CardContent className="p-0">
                    <div className="min-h-[600px]">
                      <NotionEditor
                        content={currentNote.content}
                        onChange={(content) => setCurrentNote((prev) => ({ ...prev, content }))}
                        title={currentNote.title}
                        onTitleChange={(title) => setCurrentNote((prev) => ({ ...prev, title }))}
                        icon={currentNote.icon}
                        onIconChange={(icon) => setCurrentNote((prev) => ({ ...prev, icon }))}
                        placeholder="Start writing your ideas..."
                        className="h-full rounded-lg border-none shadow-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {/* Status & Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Note Status
                    </CardTitle>
                    <CardDescription>
                      Manage the status and priority of your note
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={currentNote.status}
                          onValueChange={(value: any) =>
                            setCurrentNote((prev) => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger className="mt-1.5 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className={`h-4 w-4 ${option.color}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Priority</Label>
                        <Select
                          value={currentNote.priority}
                          onValueChange={(value: any) =>
                            setCurrentNote((prev) => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger className="mt-1.5 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {PRIORITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <Badge className={option.color}>{option.label}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </CardTitle>
                    <CardDescription>
                      Add tags to organize and find your notes easily
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="bg-background"
                      />
                      <Button onClick={handleAddTag} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentNote.tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tags yet</p>
                      ) : (
                        currentNote.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 rounded-full p-0.5 hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Note Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Note Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(note._creationTime), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Last Edited</p>
                          <p className="text-sm text-muted-foreground">
                            {note.lastEditedAt
                              ? format(new Date(note.lastEditedAt), "MMM d, yyyy 'at' h:mm a")
                              : "Never"}
                          </p>
                        </div>
                      </div>
                      {note.wordCount && (
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Word Count</p>
                            <p className="text-sm text-muted-foreground">
                              {note.wordCount} words
                            </p>
                          </div>
                        </div>
                      )}
                      {note.folderId && (
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <FolderOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Folder</p>
                            <p className="text-sm text-muted-foreground">
                              {folders.find((f: any) => f._id === note.folderId)?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Actions
                    </CardTitle>
                    <CardDescription>
                      Use AI to enhance or transform your note
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Course from This Note
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      Summarize Content
                    </Button>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Irreversible actions that affect your note
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Note
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-black">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Note</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{currentNote.title}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteNote}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Source Library Panel */}
          {showSourceLibrary && storeId && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <Card className="sticky top-8">
                <SourceLibrary
                  userId={user.id}
                  storeId={storeId}
                  folderId={note.folderId ?? undefined}
                  onGenerateNotes={(sourceId) => {
                    // Could refresh or navigate to the generated note
                  }}
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
