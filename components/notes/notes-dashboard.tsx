'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
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
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    targetAudience: '',
    category: '',
    skillLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    preferredModuleCount: 4,
    includeQuizzes: true,
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
    parentId: selectedFolderId ? selectedFolderId as Id<"noteFolders"> : undefined,
  }) ?? [];

  const notesQuery = useQuery(api.notes.getNotesByUser, {
    userId,
    storeId,
    folderId: selectedFolderId ? selectedFolderId as Id<"noteFolders"> : undefined,
    paginationOpts: { numItems: 50, cursor: null },
  });

  const notes = notesQuery?.page ?? [];

  const selectedNote = useQuery(
    api.notes.getNote,
    selectedNoteId ? { noteId: selectedNoteId as Id<"notes"> } : "skip"
  );

  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const createFolder = useMutation(api.notes.createFolder);
  const deleteFolder = useMutation(api.notes.deleteFolder);
  const generateCourseFromNotes = useMutation(api.notesToCourse.generateCourseFromNotes);

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

  const handleSaveNote = useCallback(async () => {
    if (!selectedNoteId) {
      await handleCreateNote(selectedFolderId || undefined);
      return;
    }

    try {
      await updateNote({
        noteId: selectedNoteId as Id<"notes">,
        title: currentNote.title,
        content: currentNote.content,
        tags: currentNote.tags,
        priority: currentNote.priority,
        status: currentNote.status,
      });
      
      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note.",
        variant: "destructive",
      });
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
      });

      if (result.success && result.courseId) {
        toast({
          title: "Course Generated Successfully!",
          description: `Your course "${courseFormData.title}" has been created from ${selectedNotesForCourse.size} notes.`,
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

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <NotesSidebar
          folders={folders}
          notes={notes}
          selectedNoteId={selectedNoteId}
          selectedFolderId={selectedFolderId}
          onNoteSelect={handleNoteSelect}
          onFolderSelect={setSelectedFolderId}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={(folderId) => deleteFolder({ folderId: folderId as Id<"noteFolders"> })}
          onDeleteNote={(noteId) => deleteNote({ noteId: noteId as Id<"notes"> })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {selectedNoteId ? currentNote.title : 'Notes'}
            </h1>
            
            {selectedNote && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedNote.status}
                </Badge>
                {selectedNote.wordCount && (
                  <span className="text-sm text-gray-500">
                    {selectedNote.wordCount} words
                  </span>
                )}
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
                  <DialogContent className="sm:max-w-lg bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Generate Course from Notes
                      </DialogTitle>
                      <DialogDescription>
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
                            <SelectContent className="bg-white dark:bg-black">
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
                            <SelectContent className="bg-white dark:bg-black">
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

            {selectedNoteId && (
              <Button onClick={handleSaveNote} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {selectedNoteId && selectedNote ? (
            <div className="h-full">
              <NotionEditor
                content={currentNote.content}
                onChange={(content) => setCurrentNote(prev => ({ ...prev, content }))}
                title={currentNote.title}
                onTitleChange={(title) => setCurrentNote(prev => ({ ...prev, title }))}
                icon={currentNote.icon}
                onIconChange={(icon) => setCurrentNote(prev => ({ ...prev, icon }))}
                placeholder="Start writing your ideas..."
                className="h-full"
              />
            </div>
          ) : (
            // Welcome Screen
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
              <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                  <FileText className="h-16 w-16 mx-auto text-gray-400" />
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
                
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    AI-Powered Features
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Generate courses from your notes
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      AI-powered content suggestions
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-500" />
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
