'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { NotionEditor } from '@/components/notes/notion-editor';
import { NotesSidebar } from '@/components/notes/notes-sidebar';
import { AINoteGenerator } from '@/components/notes/ai-note-generator';
import { SourceLibrary } from '@/components/notes/source-library';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DashboardNotesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const mode = searchParams.get('mode');

  // State
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSourceLibrary, setShowSourceLibrary] = useState(false);

  // Current note state
  const [currentNote, setCurrentNote] = useState({
    title: 'Untitled',
    content: '',
    icon: '📝',
    tags: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'draft' as 'draft' | 'in_progress' | 'completed' | 'archived',
  });

  // Redirect if not in create mode
  useEffect(() => {
    if (isLoaded && mode !== 'create') {
      router.replace('/dashboard?mode=learn');
    }
  }, [mode, isLoaded, router]);

  // Get user's stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : 'skip'
  );

  const storeId = stores?.[0]?._id;

  // Convex queries and mutations
  const folders = useQuery(
    api.notes.getFoldersByUser,
    user?.id && storeId
      ? {
          userId: user.id,
          storeId,
          parentId: selectedFolderId ? (selectedFolderId as Id<"noteFolders">) : undefined,
        }
      : 'skip'
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
      : 'skip'
  );

  const notes = notesQuery?.page ?? [];

  const selectedNote = useQuery(
    api.notes.getNote,
    selectedNoteId ? { noteId: selectedNoteId as Id<"notes"> } : 'skip'
  );

  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const createFolder = useMutation(api.notes.createFolder);
  const updateFolder = useMutation(api.notes.updateFolder);
  const deleteFolder = useMutation(api.notes.deleteFolder);

  // Get current folder for breadcrumb
  const currentFolder = selectedFolderId 
    ? folders.find(f => f._id === selectedFolderId)
    : null;

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    if (!selectedFolderId || !currentFolder) return [];
    
    const path: Array<{_id: string, name: string}> = [];
    let folder = currentFolder;
    
    while (folder) {
      path.unshift({ _id: folder._id, name: folder.name });
      folder = folders.find(f => f._id === folder.parentId) as any;
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  // Handlers
  const handleNoteSelect = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleCreateNote = useCallback(async (folderId?: string) => {
    if (!user?.id || !storeId) return;
    
    try {
      const noteId = await createNote({
        title: 'Untitled',
        content: '<p>Start writing your thoughts...</p>',
        userId: user.id,
        storeId,
        folderId: folderId ? folderId as Id<"noteFolders"> : undefined,
        tags: [],
        category: undefined,
        priority: 'medium',
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
  }, [createNote, user?.id, storeId]);

  const handleCreateFolder = useCallback(async (parentId?: string) => {
    if (!user?.id || !storeId) return;
    
    try {
      await createFolder({
        name: 'New Folder',
        userId: user.id,
        storeId,
        parentId: parentId ? parentId as Id<"noteFolders"> : undefined,
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
  }, [createFolder, user?.id, storeId]);

  const handleRenameFolder = useCallback(async (folderId: string, newName: string) => {
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
  }, [updateFolder]);

  const handleSaveNote = useCallback(async (showToast = true) => {
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
  }, [selectedNoteId, currentNote, updateNote, handleCreateNote, selectedFolderId]);

  // Update current note when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setCurrentNote({
        title: selectedNote.title,
        content: selectedNote.content,
        icon: selectedNote.icon || '📝',
        tags: selectedNote.tags,
        priority: selectedNote.priority || 'medium',
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
        console.error('Auto-save failed:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Redirect if not create mode
  if (mode !== 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Show error if no stores
  if (!storeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Notes</h1>
          <p className="text-muted-foreground">
            Generate notes from YouTube, websites, PDFs, and more using AI
          </p>
        </div>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Store Required</h3>
                <p className="text-muted-foreground mb-4">
                  AI Notes requires a creator store. Set up your store to start generating notes from any content.
                </p>
                <Button asChild>
                  <Link href="/dashboard?mode=create">
                    Set Up Your Store
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-9rem)] -m-4 md:-m-8 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800/50">
      <div className="h-full w-full flex bg-white dark:bg-[#1a1a1a] overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-gray-50 dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800/50 flex flex-col">
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
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] min-w-0">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-800/50 bg-white dark:bg-[#1e1e1e]/50 backdrop-blur-sm flex-shrink-0">
            {/* Breadcrumb Navigation */}
            {breadcrumbPath.length > 0 && (
              <div className="px-6 pt-3 pb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
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
                        "hover:text-gray-900 dark:hover:text-gray-100 transition-colors",
                        index === breadcrumbPath.length - 1 && "font-semibold text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Main Header */}
            <div className="h-16 flex items-center justify-between px-6">
              <div className="flex items-center gap-4 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedNoteId ? currentNote.title : (currentFolder ? currentFolder.name : 'Notes')}
                </h1>
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                {selectedNote && (
                  <>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700/50"
                    >
                      {selectedNote.status}
                    </Badge>
                    {selectedNote.wordCount && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedNote.wordCount} words
                      </span>
                    )}
                    {isSaving ? (
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    ) : lastSaved ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
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
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-auto">
              {selectedNoteId && selectedNote ? (
                <div className="h-full w-full">
                  <NotionEditor
                    content={currentNote.content}
                    onChange={(content) => setCurrentNote(prev => ({ ...prev, content }))}
                    title={currentNote.title}
                    onTitleChange={(title) => setCurrentNote(prev => ({ ...prev, title }))}
                    icon={currentNote.icon}
                    onIconChange={(icon) => setCurrentNote(prev => ({ ...prev, icon }))}
                    placeholder="Start writing your ideas..."
                    className="h-full border-none rounded-none shadow-none"
                  />
                </div>
              ) : (
                // Welcome Screen
                <div className="h-full flex items-center justify-center bg-gray-50/50 dark:bg-[#1a1a1a]">
                  <div className="text-center space-y-6 max-w-lg px-4">
                    <div className="space-y-2">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
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
                    
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800/50">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Import Content From
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Youtube className="h-5 w-5 text-red-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">YouTube</p>
                          <p className="text-xs text-gray-500">Transcripts</p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Globe className="h-5 w-5 text-blue-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Websites</p>
                          <p className="text-xs text-gray-500">Articles</p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Upload className="h-5 w-5 text-orange-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">PDFs</p>
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


