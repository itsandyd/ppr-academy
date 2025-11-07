'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { NotionEditor } from './notion-editor';
import { NotesSidebar } from './notes-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Save,
  Sparkles,
  BookOpen,
  Wand2,
  Share,
  Archive,
  Star,
  Tag,
  Folder,
  FileText,
  Loader2,
  CheckSquare,
  Brain,
  Zap,
  PlusCircle,
  Settings,
  ChevronRight,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotesDashboardProps {
  userId: string;
  storeId: string;
}

export function NotesDashboard({ userId, storeId }: NotesDashboardProps) {
  // State
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotesForCourse, setSelectedNotesForCourse] = useState<Set<string>>(new Set());
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    targetAudience: '',
    category: '',
    skillLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    preferredModuleCount: 4,
    includeQuizzes: true,
    matchExistingStyle: true, // NEW: Match existing course style by default
  });

  // Current note state
  const [currentNote, setCurrentNote] = useState({
    title: 'Untitled',
    content: '',
    icon: '📝',
    tags: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'draft' as 'draft' | 'in_progress' | 'completed' | 'archived',
  });

  // Convex queries and mutations
  const folders = useQuery(api.notes.getFoldersByUser, {
    userId,
    storeId,
    parentId: selectedFolderId ? (selectedFolderId as Id<"noteFolders">) : undefined,
  }) ?? [];

  const notesQuery = useQuery((api.notes as any).getNotesByUser, {
    userId,
    storeId,
    folderId: selectedFolderId ? (selectedFolderId as Id<"noteFolders">) : undefined,
    paginationOpts: { numItems: 50, cursor: null },
  });

  // Get user's existing courses for style analysis
  const userCourses = useQuery(api.courses.getCoursesByStore, {
    storeId,
  }) ?? [];

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
  const generateCourseFromNotes = useAction((api as any).notesToCourse.generateCourseFromNotes);

  // Get current folder for breadcrumb
  const currentFolder = selectedFolderId 
    ? folders.find(f => f._id === selectedFolderId)
    : null;

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    if (!selectedFolderId || !currentFolder) return [];
    
    const path: Array<{_id: string, name: string}> = [];
    let folder = currentFolder;
    
    // Build path from current folder to root
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
    try {
      const noteId = await createNote({
        title: 'Untitled',
        content: '<p>Start writing your thoughts...</p>',
        userId,
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
  }, [createNote, userId, storeId]);

  const handleCreateFolder = useCallback(async (parentId?: string) => {
    try {
      const folderId = await createFolder({
        name: 'New Folder',
        userId,
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
  }, [createFolder, userId, storeId]);

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

  const handleToggleNoteSelection = (noteId: string) => {
    const newSelection = new Set(selectedNotesForCourse);
    if (newSelection.has(noteId)) {
      newSelection.delete(noteId);
    } else {
      newSelection.add(noteId);
    }
    setSelectedNotesForCourse(newSelection);
  };

  // NEW: Select ALL notes in current folder for course generation
  const handleSelectAllNotesInFolder = () => {
    const folderNotes = notes.map(note => note._id);
    setSelectedNotesForCourse(new Set(folderNotes));
    toast({
      title: "Notes Selected",
      description: `Selected all ${folderNotes.length} notes in this folder for course generation.`,
    });
  };

  const handleGenerateCourse = async () => {
    if (selectedNotesForCourse.size === 0) {
      toast({
        title: "No Notes Selected",
        description: "Please select at least one note to generate a course.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCourse(true);
    try {
      const result = await generateCourseFromNotes({
        noteIds: Array.from(selectedNotesForCourse) as Id<"notes">[],
        userId,
        storeId,
        courseTitle: courseFormData.title,
        courseDescription: courseFormData.description,
        targetAudience: courseFormData.targetAudience,
        courseCategory: courseFormData.category,
        skillLevel: courseFormData.skillLevel,
        preferredModuleCount: courseFormData.preferredModuleCount,
        includeQuizzes: courseFormData.includeQuizzes,
        matchExistingStyle: courseFormData.matchExistingStyle, // NEW: Pass style matching flag
      });

      if (result.success && result.courseId) {
        const styleMessage = courseFormData.matchExistingStyle 
          ? " matching your teaching style" 
          : "";
        toast({
          title: "Course Generated Successfully!",
          description: `Your course "${courseFormData.title}" has been created from ${selectedNotesForCourse.size} notes${styleMessage}.`,
        });
        setShowCourseDialog(false);
        setSelectedNotesForCourse(new Set());
        setCourseFormData({
          title: '',
          description: '',
          targetAudience: '',
          category: '',
          skillLevel: 'intermediate',
          preferredModuleCount: 4,
          includeQuizzes: true,
          matchExistingStyle: true,
        });
        // Optionally redirect to course editor
        window.open(`/store/${storeId}/course/${result.courseId}/edit`, '_blank');
      } else {
        toast({
          title: "Course Generation Failed",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate course from notes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCourse(false);
    }
  };

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

  // Auto-save functionality - debounced save after 2 seconds of no typing
  useEffect(() => {
    if (!selectedNoteId || !selectedNote) return;

    // Check if content has actually changed
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
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [selectedNoteId, selectedNote, currentNote, updateNote]);

  return (
    <div className="h-full w-full flex bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Sidebar - Balanced width */}
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
        {/* Header with Breadcrumbs - Clean and spacious */}
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
            
            {selectedNote && (
              <div className="flex items-center gap-2 flex-shrink-0">
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
                {/* Auto-save indicator - Enhanced visibility */}
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
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Course Generation */}
            {selectedNotesForCourse.size > 0 && (
              <>
                <Badge variant="default" className="mr-2">
                  {selectedNotesForCourse.size} selected
                </Badge>
                
                <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Generate Course from Notes
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Create a structured course from your selected {selectedNotesForCourse.size} notes using AI.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="course-title">Course Title *</Label>
                        <Input
                          id="course-title"
                          value={courseFormData.title}
                          onChange={(e) => setCourseFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Complete Guide to React Development"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="course-description">Course Description</Label>
                        <Textarea
                          id="course-description"
                          value={courseFormData.description}
                          onChange={(e) => setCourseFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of what students will learn..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="skill-level">Skill Level</Label>
                          <Select 
                            value={courseFormData.skillLevel} 
                            onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                              setCourseFormData(prev => ({ ...prev, skillLevel: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800">
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="module-count">Module Count</Label>
                          <Select 
                            value={courseFormData.preferredModuleCount.toString()} 
                            onValueChange={(value) => 
                              setCourseFormData(prev => ({ ...prev, preferredModuleCount: parseInt(value) }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800">
                              <SelectItem value="3">3 Modules</SelectItem>
                              <SelectItem value="4">4 Modules</SelectItem>
                              <SelectItem value="5">5 Modules</SelectItem>
                              <SelectItem value="6">6 Modules</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-quizzes"
                          checked={courseFormData.includeQuizzes}
                          onChange={(e) => setCourseFormData(prev => ({ ...prev, includeQuizzes: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="include-quizzes" className="text-sm">
                          Include quizzes and assessments
                        </Label>
                      </div>
                      
                      {/* NEW: Match Existing Style Toggle */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="match-style"
                              checked={courseFormData.matchExistingStyle}
                              onChange={(e) => setCourseFormData(prev => ({ ...prev, matchExistingStyle: e.target.checked }))}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="match-style" className="text-sm font-semibold flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Match My Course Style
                            </Label>
                          </div>
                        </div>
                        {courseFormData.matchExistingStyle && (
                          <div className="pl-6 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {userCourses.length > 0 ? (
                              <>
                                <p className="font-medium text-green-600 dark:text-green-400">
                                  ✓ Found {userCourses.length} existing course{userCourses.length > 1 ? 's' : ''} to analyze
                                </p>
                                <p className="leading-relaxed">
                                  AI will analyze your existing courses to match your teaching style, 
                                  content structure, and communication approach.
                                </p>
                              </>
                            ) : (
                              <p className="text-amber-600 dark:text-amber-400 leading-relaxed">
                                No existing courses found. The AI will use best practices for course creation.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCourseDialog(false)}
                        disabled={isGeneratingCourse}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleGenerateCourse}
                        disabled={isGeneratingCourse || !courseFormData.title}
                        className="gap-2"
                      >
                        {isGeneratingCourse ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            Generate Course
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Multi-select toggle */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setSelectedNotesForCourse(new Set())}
            >
              <CheckSquare className="h-4 w-4" />
              {selectedNotesForCourse.size > 0 ? 'Clear Selection' : 'Select Notes'}
            </Button>
            
            {/* NEW: Select all notes in folder */}
            {notes.length > 0 && selectedNotesForCourse.size === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/20"
                onClick={handleSelectAllNotesInFolder}
              >
                <Folder className="h-4 w-4" />
                Select All in Folder ({notes.length})
              </Button>
            )}

            {selectedNoteId && (
              <Button onClick={() => handleSaveNote(true)} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Content Area - Optimized editor */}
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
            // Welcome Screen - Enhanced dark mode
            <div className="h-full flex items-center justify-center bg-gray-50/50 dark:bg-[#1a1a1a]">
              <div className="text-center space-y-6 max-w-md px-4">
                <div className="space-y-2">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    Welcome to Your Notes
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create, organize, and transform your ideas into courses with AI assistance.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button onClick={() => handleCreateNote()} className="w-full gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Your First Note
                  </Button>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Or select a note from the sidebar to start editing
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800/50">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    AI-Powered Features
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      Generate courses from your notes
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                      AI-powered content suggestions
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-500 dark:text-green-400" />
                      Automatic content organization
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-select overlay for notes list */}
      {selectedNotesForCourse.size > 0 && (
        <div className="fixed inset-0 bg-black/20 pointer-events-none" />
      )}
      
      {/* Note selection checkboxes */}
      {notes.length > 0 && (
        <style jsx>{`
          .note-item {
            position: relative;
          }
          .note-item::after {
            content: '';
            position: absolute;
            top: 8px;
            right: 8px;
            width: 16px;
            height: 16px;
            border: 2px solid #e2e8f0;
            border-radius: 3px;
            background: white;
            cursor: pointer;
          }
          .note-item.selected::after {
            background: #3b82f6;
            border-color: #3b82f6;
          }
          .note-item.selected::before {
            content: '✓';
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            font-size: 10px;
            font-weight: bold;
            z-index: 1;
          }
        `}</style>
      )}
    </div>
  );
}
