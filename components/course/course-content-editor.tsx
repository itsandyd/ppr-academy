"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Target,
  FileText,
  Video,
  Eye,
  EyeOff,
  Volume2,
  Play,
  Pause,
  Loader2
} from "lucide-react";
import { updateChapter, createChapter, deleteChapter, createModule, createLesson, updateModule, updateLesson, reorderChapters, reorderModules, reorderLessons, deleteModule, deleteLesson, deleteOrphanedChapters, updateCourseModule, updateCourseLesson, generateChapterAudio, getElevenLabsVoices } from "@/app/actions/course-actions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

// Sortable Module Item Component
function SortableModuleItem({ 
  module,
  editingModule,
  editModuleForm,
  setEditModuleForm,
  startEditingModule,
  saveModule,
  cancelEdit,
  handleDeleteModule,
  expandedModules,
  toggleModule,
  isLoading,
  children
}: {
  module: Module;
  editingModule: Module | null;
  editModuleForm: any;
  setEditModuleForm: any;
  startEditingModule: (module: Module) => void;
  saveModule: () => void;
  cancelEdit: () => void;
  handleDeleteModule: (chapterId: string | null, title: string) => void;
  expandedModules: Set<number>;
  toggleModule: (moduleId: number) => void;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.chapterId || `module-${module.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  if (editingModule?.id === module.id) {
    return (
      <div ref={setNodeRef} style={style}>
        <Card className="border-blue-200 bg-blue-50 mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`module-title-${module.id}`}>Module Title</Label>
              <Input
                id={`module-title-${module.id}`}
                value={editModuleForm.title}
                onChange={(e) => setEditModuleForm((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter module title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`module-description-${module.id}`}>Module Description</Label>
              <Textarea
                id={`module-description-${module.id}`}
                value={editModuleForm.description}
                onChange={(e) => setEditModuleForm((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter module description"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelEdit} size="sm">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={saveModule} disabled={isLoading} size="sm">
                <Save className="w-4 h-4 mr-1" />
                {isLoading ? "Saving..." : "Save Module"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card key={module.id} className="border-2 mb-4">
        <CardHeader className="group">
          <CardTitle className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={() => toggleModule(module.id)}
            >
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-slate-400" />
              </div>
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-lg">{module.title}</span>
              <Badge variant="secondary">{module.lessons.length} lessons</Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Always show edit button - allow renaming of all modules including default ones */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditingModule(module);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-4 h-4" />
              </Button>
              {/* Always show delete button - it handles both regular modules and fallback modules */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteModule(module.chapterId, module.title);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {expandedModules.has(module.id) ? (
                <ChevronDown className="w-5 h-5 cursor-pointer" onClick={() => toggleModule(module.id)} />
              ) : (
                <ChevronRight className="w-5 h-5 cursor-pointer" onClick={() => toggleModule(module.id)} />
              )}
            </div>
          </CardTitle>
          {module.description && (
            <p className="text-sm text-slate-600 mt-2">{module.description}</p>
          )}
        </CardHeader>
        {children}
      </Card>
    </div>
  );
}

// Sortable Lesson Item Component
function SortableLessonItem({ 
  lesson,
  lessonKey,
  editingLesson,
  editLessonForm,
  setEditLessonForm,
  startEditingLesson,
  saveLesson,
  cancelEdit,
  handleDeleteLesson,
  expandedLessons,
  toggleLesson,
  isLoading,
  children
}: {
  lesson: Lesson;
  lessonKey: string;
  editingLesson: Lesson | null;
  editLessonForm: any;
  setEditLessonForm: any;
  startEditingLesson: (lesson: Lesson) => void;
  saveLesson: () => void;
  cancelEdit: () => void;
  handleDeleteLesson: (chapterId: string | null, title: string) => void;
  expandedLessons: Set<string>;
  toggleLesson: (lessonKey: string) => void;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.chapterId || `lesson-${lesson.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  if (editingLesson?.id === lesson.id) {
    return (
      <div ref={setNodeRef} style={style} className="space-y-2">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`lesson-title-${lesson.id}`}>Lesson Title</Label>
              <Input
                id={`lesson-title-${lesson.id}`}
                value={editLessonForm.title}
                onChange={(e) => setEditLessonForm((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter lesson title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`lesson-description-${lesson.id}`}>Lesson Description</Label>
              <Textarea
                id={`lesson-description-${lesson.id}`}
                value={editLessonForm.description}
                onChange={(e) => setEditLessonForm((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter lesson description"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelEdit} size="sm">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={saveLesson} disabled={isLoading} size="sm">
                <Save className="w-4 h-4 mr-1" />
                {isLoading ? "Saving..." : "Save Lesson"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
        <div 
          className="flex items-center gap-2 flex-1 cursor-pointer"
          onClick={() => toggleLesson(lessonKey)}
        >
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
          <Target className="w-4 h-4 text-green-600" />
          <span className="font-medium">{lesson.title}</span>
          <Badge variant="outline">{lesson.chapters.length} chapters</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Always show edit button - allow editing of all lessons including fallback ones */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              startEditingLesson(lesson);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {/* Always show delete button - it handles both regular lessons and fallback lessons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteLesson(lesson.chapterId, lesson.title);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {expandedLessons.has(lessonKey) ? (
            <ChevronDown className="w-4 h-4 cursor-pointer" onClick={() => toggleLesson(lessonKey)} />
          ) : (
            <ChevronRight className="w-4 h-4 cursor-pointer" onClick={() => toggleLesson(lessonKey)} />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// Sortable Chapter Item Component
function SortableChapterItem({ 
  chapter, 
  editingChapter, 
  editForm, 
  setEditForm, 
  startEditingChapter, 
  saveChapter, 
  cancelEdit, 
  handleDeleteChapter, 
  isLoading,
  generatingAudio,
  audioPlaying,
  playAudio,
  generateAudio,
  availableVoices,
  selectedVoice,
  setSelectedVoice
}: {
  chapter: Chapter;
  editingChapter: Chapter | null;
  editForm: any;
  setEditForm: any;
  startEditingChapter: (chapter: Chapter) => void;
  saveChapter: () => void;
  cancelEdit: () => void;
  handleDeleteChapter: (chapterId: string) => void;
  isLoading: boolean;
  generatingAudio: string | null;
  audioPlaying: string | null;
  playAudio: (chapterId: string, audioUrl: string) => void;
  generateAudio: (chapterId: string, text: string) => void;
  availableVoices: any[];
  selectedVoice: string;
  setSelectedVoice: (voiceId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEditing = editingChapter?.id === chapter.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className={`mb-2 ${isEditing ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`title-${chapter.id}`}>Chapter Title</Label>
                <Input
                  id={`title-${chapter.id}`}
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter chapter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`video-${chapter.id}`}>Video URL (Optional)</Label>
                <Input
                  id={`video-${chapter.id}`}
                  value={editForm.videoUrl}
                  onChange={(e) => setEditForm((prev: any) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${chapter.id}`}>Chapter Content</Label>
                <Textarea
                  id={`description-${chapter.id}`}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter the chapter content..."
                  rows={6}
                />
              </div>

              {/* Audio Generation Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <Label className="text-sm font-medium">Audio Generation</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`voice-${chapter.id}`}>Voice</Label>
                  <select
                    id={`voice-${chapter.id}`}
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.voiceId} value={voice.voiceId}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text length indicator */}
                <div className="text-xs text-slate-500">
                  Text length: {editForm.description?.length || 0} / 5000 characters
                  {editForm.description && editForm.description.length > 5000 && (
                    <span className="text-red-500 ml-2">(Text will be truncated)</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateAudio(chapter.id, editForm.description || chapter.description || '')}
                    disabled={generatingAudio === chapter.id || !editForm.description}
                  >
                    {generatingAudio === chapter.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Generate Audio
                      </>
                    )}
                  </Button>

                  {chapter.audioUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => playAudio(chapter.id, chapter.audioUrl!)}
                    >
                      {audioPlaying === chapter.id ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play Audio
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, isPublished: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Published</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editForm.isFree}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, isFree: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Free Preview</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={cancelEdit} size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={saveChapter} disabled={isLoading} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h4 className="font-medium text-slate-900 truncate">{chapter.title}</h4>
                  {chapter.isFree && (
                    <Badge variant="secondary" className="text-xs">Free</Badge>
                  )}
                  {!chapter.isPublished && (
                    <Badge variant="outline" className="text-xs">Draft</Badge>
                  )}
                </div>
                
                {chapter.description && (
                  <div className="text-sm text-slate-600 mb-2 line-clamp-2">
                    {chapter.description}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {chapter.videoUrl && (
                    <div className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>Video</span>
                    </div>
                  )}
                  {chapter.audioUrl && (
                    <div className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      <span>Audio</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditingChapter(chapter)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
}

interface Module {
  id: number;
  chapterId: string | null;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  chapterId: string | null;
  title: string;
  description: string;
  chapters: Chapter[];
}

interface CourseContentEditorProps {
  courseId: string;
  modules: Module[];
  chapters: Chapter[];
  user: {
    id: string;
    admin: boolean;
  } | null;
  isOwner: boolean;
}

export function CourseContentEditor({ courseId, modules, chapters, user, isOwner }: CourseContentEditorProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  // Debug: Log what modules are received
  console.log(`🎯 CourseContentEditor received ${modules.length} modules:`);
  modules.forEach((module, index) => {
    console.log(`  Module ${index + 1}: "${module.title}" with ${module.lessons.length} lessons`);
    module.lessons.forEach((lesson, lessonIndex) => {
      console.log(`    Lesson ${lessonIndex + 1}: "${lesson.title}" with ${lesson.chapters.length} chapters`);
    });
  });
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addingChapterToLesson, setAddingChapterToLesson] = useState<string | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState<number | null>(null);
  
  // Audio generation state
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement | null }>({});
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("9BWtsMINqrJLrRacOk9x"); // Aria voice
  
  const [newChapterForm, setNewChapterForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    isPublished: false,
    isFree: false
  });
  const [newModuleForm, setNewModuleForm] = useState({
    title: "",
    description: ""
  });
  const [newLessonForm, setNewLessonForm] = useState({
    title: "",
    description: ""
  });
  
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    isPublished: false,
    isFree: false
  });
  const [editModuleForm, setEditModuleForm] = useState({
    title: "",
    description: ""
  });
  const [editLessonForm, setEditLessonForm] = useState({
    title: "",
    description: ""
  });

  // Only show editor to course owner or admin
  const canEdit = user && (isOwner || user.admin);

  // Load available voices on component mount
  useEffect(() => {
    const loadVoices = async () => {
      const result = await getElevenLabsVoices();
      if (result.success && result.voices) {
        setAvailableVoices(result.voices);
      }
    };
    loadVoices();
  }, []);

  // Audio player functions
  const playAudio = (chapterId: string, audioUrl: string) => {
    if (audioPlaying === chapterId) {
      // Stop current audio
      if (audioRefs[chapterId]) {
        audioRefs[chapterId]?.pause();
        audioRefs[chapterId]!.currentTime = 0;
      }
      setAudioPlaying(null);
    } else {
      // Stop any other playing audio
      Object.keys(audioRefs).forEach(id => {
        if (audioRefs[id]) {
          audioRefs[id]?.pause();
          audioRefs[id]!.currentTime = 0;
        }
      });
      setAudioPlaying(null);

      // Play new audio
      const audio = new Audio(audioUrl);
      audio.onended = () => setAudioPlaying(null);
      audio.onerror = () => {
        toast({
          title: "Audio Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
        setAudioPlaying(null);
      };
      
      setAudioRefs(prev => ({ ...prev, [chapterId]: audio }));
      audio.play();
      setAudioPlaying(chapterId);
    }
  };

  const generateAudio = async (chapterId: string, text: string) => {
    console.log(`🎵 Starting audio generation for chapter ${chapterId}`);
    console.log(`📝 Text to generate:`, text);
    console.log(`🎤 Selected voice:`, selectedVoice);
    
    setGeneratingAudio(chapterId);
    try {
      console.log(`🔄 Calling generateChapterAudio server action...`);
      
      const result = await generateChapterAudio(chapterId, {
        text: text,
        voiceId: selectedVoice
      });

      console.log(`📊 Audio generation result:`, result);

      if (result.success) {
        console.log(`✅ Audio generated successfully`);
        toast({
          title: "Audio Generated",
          description: result.message || "Audio has been generated successfully. Note: This is a reference - implement cloud storage for production.",
        });
        router.refresh();
      } else {
        console.error(`❌ Audio generation failed:`, result.error);
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate audio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`💥 Audio generation error:`, error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log(`🏁 Audio generation completed`);
      setGeneratingAudio(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, [audioRefs]);

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleLesson = (lessonKey: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonKey)) {
      newExpanded.delete(lessonKey);
    } else {
      newExpanded.add(lessonKey);
    }
    setExpandedLessons(newExpanded);
  };

  const startEditingChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setEditForm({
      title: chapter.title,
      description: chapter.description || "",
      videoUrl: chapter.videoUrl || "",
      isPublished: chapter.isPublished,
      isFree: chapter.isFree
    });
  };

  const startEditingModule = (module: Module) => {
    setEditingModule(module);
    setEditModuleForm({
      title: module.title,
      description: module.description
    });
  };

  const startEditingLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title,
      description: lesson.description
    });
  };

  const saveChapter = async () => {
    if (!editingChapter) return;

    setIsLoading(true);
    try {
      const result = await updateChapter(editingChapter.id, {
        title: editForm.title,
        description: editForm.description,
        videoUrl: editForm.videoUrl,
        isPublished: editForm.isPublished,
        isFree: editForm.isFree
      });

      if (result.success) {
        toast({
          title: "Chapter Updated",
          description: "Chapter has been updated successfully.",
        });
        setEditingChapter(null);
        router.refresh();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update chapter",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveModule = async () => {
    if (!editingModule) return;

    setIsLoading(true);
    try {
      let result;
      if (editingModule.id && !editingModule.chapterId && typeof editingModule.id === 'string') {
        // Real module
        result = await updateCourseModule(editingModule.id, {
          title: editModuleForm.title,
          description: editModuleForm.description
        });
      } else if (editingModule.chapterId) {
        // Legacy emoji header
        result = await updateModule(editingModule.chapterId, {
          title: editModuleForm.title,
          description: editModuleForm.description
        });
      }
      if (result && result.success) {
        toast({
          title: "Module Updated",
          description: "Module has been updated successfully.",
        });
        setEditingModule(null);
        router.refresh();
      } else if (result) {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update module",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveLesson = async () => {
    if (!editingLesson) return;

    setIsLoading(true);
    try {
      let result;
      if (editingLesson.id && !editingLesson.chapterId && typeof editingLesson.id === 'string') {
        // Real lesson
        result = await updateCourseLesson(editingLesson.id, {
          title: editLessonForm.title,
          description: editLessonForm.description
        });
      } else if (editingLesson.chapterId) {
        // Legacy emoji header
        result = await updateLesson(editingLesson.chapterId, {
          title: editLessonForm.title,
          description: editLessonForm.description
        });
      }
      if (result && result.success) {
        toast({
          title: "Lesson Updated",
          description: "Lesson has been updated successfully.",
        });
        setEditingLesson(null);
        router.refresh();
      } else if (result) {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update lesson",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingChapter(null);
    setEditingModule(null);
    setEditingLesson(null);
    setEditForm({
      title: "",
      description: "",
      videoUrl: "",
      isPublished: false,
      isFree: false
    });
    setEditModuleForm({
      title: "",
      description: ""
    });
    setEditLessonForm({
      title: "",
      description: ""
    });
  };

  const addNewChapter = async (lessonChapters: Chapter[], lessonChapterId?: string, lessonId?: string) => {
    if (!newChapterForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a chapter title.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Calculate the next position within this specific lesson
      let insertPosition: number;
      if (lessonChapters.length > 0) {
        // Add after the last chapter in this lesson
        const maxLessonPosition = Math.max(...lessonChapters.map(c => c.position));
        insertPosition = maxLessonPosition + 1;
      } else if (lessonChapterId) {
        // Find the lesson header in the global chapters list and insert after it
        const allChapters = chapters.sort((a, b) => a.position - b.position);
        const lessonChapter = allChapters.find(ch => ch.id === lessonChapterId);
        if (lessonChapter) {
          // Find the next lesson or module to determine where this lesson's content should end
          let nextHeaderPosition = allChapters.length + 1;
          for (let i = 0; i < allChapters.length; i++) {
            if (allChapters[i].id === lessonChapterId) {
              // Look for the next lesson or module header
              for (let j = i + 1; j < allChapters.length; j++) {
                const nextChapter = allChapters[j];
                if (nextChapter.title.startsWith('🎯') || nextChapter.title.startsWith('📚')) {
                  nextHeaderPosition = nextChapter.position;
                  break;
                }
              }
              break;
            }
          }
          // Insert at the end of this lesson's content area
          insertPosition = nextHeaderPosition;
        } else {
          // Fallback: add to the end
          const maxPosition = Math.max(...chapters.map(c => c.position), 0);
          insertPosition = maxPosition + 1;
        }
      } else {
        // Fallback: add to the end
        const maxPosition = Math.max(...chapters.map(c => c.position), 0);
        insertPosition = maxPosition + 1;
      }
      console.log(`Adding chapter "${newChapterForm.title}" at position ${insertPosition}, lessonChapterId: ${lessonChapterId}, lessonId: ${lessonId}, lessonChapters.length: ${lessonChapters.length}`);
      const result = await createChapter(courseId, {
        title: newChapterForm.title,
        description: newChapterForm.description,
        videoUrl: newChapterForm.videoUrl,
        position: insertPosition,
        isPublished: newChapterForm.isPublished,
        isFree: newChapterForm.isFree,
        lessonId: lessonId
      });
      if (result.success) {
        toast({
          title: "Chapter Added",
          description: "New chapter has been added successfully.",
        });
        setAddingChapterToLesson(null);
        setNewChapterForm({
          title: "",
          description: "",
          videoUrl: "",
          isPublished: false,
          isFree: false
        });
        router.refresh();
      } else {
        toast({
          title: "Add Failed",
          description: result.error || "Failed to add chapter",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Add Failed",
        description: "Failed to add chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteChapter(chapterId);

      if (result.success) {
        toast({
          title: "Chapter Deleted",
          description: "Chapter has been deleted successfully.",
        });
        router.refresh();
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete chapter",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addNewModule = async () => {
    if (!newModuleForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a module title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createModule(courseId, {
        title: newModuleForm.title,
        description: newModuleForm.description
      });

      if (result.success) {
        toast({
          title: "Module Added",
          description: "New module has been added successfully.",
        });
        setIsAddingModule(false);
        setNewModuleForm({
          title: "",
          description: ""
        });
        router.refresh();
      } else {
        toast({
          title: "Add Failed",
          description: result.error || "Failed to add module",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Add Failed",
        description: "Failed to add module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addNewLesson = async (moduleIndex: number) => {
    console.log(`🎯 Adding lesson: title="${newLessonForm.title}", moduleIndex=${moduleIndex}`);
    
    if (!newLessonForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a lesson title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🎯 Calling createLesson with courseId=${courseId}, moduleIndex=${moduleIndex}`);
      const result = await createLesson(courseId, {
        title: newLessonForm.title,
        description: newLessonForm.description,
        moduleIndex: moduleIndex
      });

      console.log(`🎯 createLesson result:`, result);

      if (result.success) {
        toast({
          title: "Lesson Added",
          description: "New lesson has been added successfully.",
        });
        setIsAddingLesson(null);
        setNewLessonForm({
          title: "",
          description: ""
        });
        console.log(`🎯 Calling router.refresh()`);
        router.refresh();
      } else {
        console.error(`🎯 createLesson failed:`, result.error);
        toast({
          title: "Add Failed",
          description: result.error || "Failed to add lesson",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`🎯 addNewLesson error:`, error);
      toast({
        title: "Add Failed",
        description: "Failed to add lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag end for reordering modules and chapters
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging modules
    const isDraggingModule = activeId.startsWith('module-') || modules.some(m => m.chapterId === activeId);
    const isOverModule = overId.startsWith('module-') || modules.some(m => m.chapterId === overId);

    // Check if we're dragging lessons
    let isDraggingLesson = false;
    let isOverLesson = false;
    let targetModule: Module | null = null;
    
    for (const module of modules) {
      const activeLesson = module.lessons.find(l => l.chapterId === activeId || `lesson-${l.id}` === activeId);
      const overLesson = module.lessons.find(l => l.chapterId === overId || `lesson-${l.id}` === overId);
      
      if (activeLesson && overLesson) {
        isDraggingLesson = true;
        isOverLesson = true;
        targetModule = module;
        break;
      }
    }

    if (isDraggingModule && isOverModule) {
      // Reordering modules
      const moduleChapterIds = modules
        .filter(m => m.chapterId) // Only modules with actual chapter IDs
        .map(m => m.chapterId!);
      
      const oldIndex = moduleChapterIds.findIndex(id => id === (activeId.startsWith('module-') ? modules.find(m => m.id === parseInt(activeId.replace('module-', '')))?.chapterId : activeId));
      const newIndex = moduleChapterIds.findIndex(id => id === (overId.startsWith('module-') ? modules.find(m => m.id === parseInt(overId.replace('module-', '')))?.chapterId : overId));

      if (oldIndex === -1 || newIndex === -1) {
        console.error("Could not find module indices");
        return;
      }

      const reorderedModuleIds = arrayMove(moduleChapterIds, oldIndex, newIndex);

      setIsLoading(true);
      try {
        const result = await reorderModules(courseId, { moduleChapterIds: reorderedModuleIds });

        if (result.success) {
          toast({
            title: "Modules Reordered",
            description: "Module order has been updated successfully.",
          });
          router.refresh();
        } else {
          toast({
            title: "Reorder Failed",
            description: result.error || "Failed to reorder modules",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Reorder Failed",
          description: "Failed to reorder modules. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isDraggingLesson && isOverLesson && targetModule) {
      // Handle lesson reordering within a module
      const lessonChapterIds = targetModule.lessons
        .filter(l => l.chapterId) // Only lessons with actual chapter IDs
        .map(l => l.chapterId!);
      
      const activeChapterId = activeId.startsWith('lesson-') ? 
        targetModule.lessons.find(l => l.id === parseInt(activeId.replace('lesson-', '')))?.chapterId : 
        activeId;
      const overChapterId = overId.startsWith('lesson-') ? 
        targetModule.lessons.find(l => l.id === parseInt(overId.replace('lesson-', '')))?.chapterId : 
        overId;
      
      const oldIndex = lessonChapterIds.findIndex(id => id === activeChapterId);
      const newIndex = lessonChapterIds.findIndex(id => id === overChapterId);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error("Could not find lesson indices for reordering");
        return;
      }
      
      const reorderedLessons = arrayMove(lessonChapterIds, oldIndex, newIndex);
      
      setIsLoading(true);
      try {
        const result = await reorderLessons(courseId, {
          lessonChapterIds: reorderedLessons,
          moduleChapterId: targetModule.chapterId || `module-${targetModule.id}`
        });
        
        if (result.success) {
          toast({
            title: "Lessons Reordered",
            description: "Lesson order has been updated successfully.",
          });
          router.refresh();
        } else {
          toast({
            title: "Reorder Failed",
            description: result.error || "Failed to reorder lessons",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Reorder Failed",
          description: "Failed to reorder lessons. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle chapter reordering (existing logic)
    // Find which lesson contains these chapters
    let targetLessonChapters: Chapter[] = [];
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (lesson.chapters.some(chapter => chapter.id === activeId)) {
          targetLessonChapters = lesson.chapters;
          break;
        }
      }
      if (targetLessonChapters.length > 0) break;
    }

    if (targetLessonChapters.length === 0) {
      console.error("Could not find lesson containing the dragged chapter");
      return;
    }

    const oldIndex = targetLessonChapters.findIndex(chapter => chapter.id === activeId);
    const newIndex = targetLessonChapters.findIndex(chapter => chapter.id === overId);

    if (oldIndex === -1 || newIndex === -1) {
      console.error("Could not find chapter indices");
      return;
    }

    // Reorder the chapters array
    const reorderedChapters = arrayMove(targetLessonChapters, oldIndex, newIndex);
    
    // Extract chapter IDs in new order
    const chapterIds = reorderedChapters.map(chapter => chapter.id);

    setIsLoading(true);
    try {
      const result = await reorderChapters(courseId, { chapterIds });

      if (result.success) {
        toast({
          title: "Chapters Reordered",
          description: "Chapter order has been updated successfully.",
        });
        router.refresh();
      } else {
        toast({
          title: "Reorder Failed",
          description: result.error || "Failed to reorder chapters",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reorder Failed",
        description: "Failed to reorder chapters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async (moduleChapterId: string | null, moduleTitle: string) => {
    // If this is a fallback module (no chapterId), delete all orphaned chapters
    if (!moduleChapterId) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete all chapters in "${moduleTitle}"?\n\nThis will permanently delete ALL chapters that are not part of a proper module/lesson structure. This action cannot be undone.`
      );

      if (!confirmDelete) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await deleteOrphanedChapters(courseId);

        if (result.success) {
          toast({
            title: "Chapters Deleted",
            description: `${(result as any).deletedCount} orphaned chapters have been deleted successfully.`,
          });
          router.refresh();
        } else {
          toast({
            title: "Delete Failed",
            description: result.error || "Failed to delete chapters",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete chapters. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular module deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the module "${moduleTitle}"?\n\nThis will permanently delete the module and ALL its lessons and chapters. This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteModule(moduleChapterId);

      if (result.success) {
        toast({
          title: "Module Deleted",
          description: `Module "${moduleTitle}" and all its content has been deleted successfully.`,
        });
        router.refresh();
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete module",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete module. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonChapterId: string | null, lessonTitle: string) => {
    // If this is a fallback lesson (no chapterId), delete all orphaned chapters
    if (!lessonChapterId) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete all chapters in "${lessonTitle}"?\n\nThis will permanently delete ALL chapters that are not part of a proper module/lesson structure. This action cannot be undone.`
      );

      if (!confirmDelete) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await deleteOrphanedChapters(courseId);

        if (result.success) {
          toast({
            title: "Chapters Deleted",
            description: `${(result as any).deletedCount} orphaned chapters have been deleted successfully.`,
          });
          router.refresh();
        } else {
          toast({
            title: "Delete Failed",
            description: result.error || "Failed to delete chapters",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete chapters. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular lesson deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the lesson "${lessonTitle}"?\n\nThis will permanently delete the lesson and ALL its chapters. This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteLesson(lessonChapterId);

      if (result.success) {
        toast({
          title: "Lesson Deleted",
          description: `Lesson "${lessonTitle}" and all its content has been deleted successfully.`,
        });
        router.refresh();
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete lesson",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsEditorOpen(true)}
        className="mb-6"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Course Content
      </Button>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Content Editor
            </DialogTitle>
            <DialogDescription>
              Edit your course modules, lessons, and chapters. Click on any chapter to edit its details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Course Modules</h3>
              <Button
                variant="outline"
                onClick={() => setIsAddingModule(true)}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </div>

            {isAddingModule && (
              <Card className="border-blue-200 bg-blue-50 mb-4">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-module-title">Module Title</Label>
                    <Input
                      id="new-module-title"
                      value={newModuleForm.title}
                      onChange={(e) => setNewModuleForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter module title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-module-description">Module Description</Label>
                    <Textarea
                      id="new-module-description"
                      value={newModuleForm.description}
                      onChange={(e) => setNewModuleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter module description"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingModule(false)} 
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={addNewModule} 
                      disabled={isLoading} 
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {isLoading ? "Adding..." : "Add Module"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={modules.filter(m => m.chapterId).map(m => m.chapterId!)}
                strategy={verticalListSortingStrategy}
              >
                {modules.map((module) => (
                  <SortableModuleItem
                    key={module.id}
                    module={module}
                    editingModule={editingModule}
                    editModuleForm={editModuleForm}
                    setEditModuleForm={setEditModuleForm}
                    startEditingModule={startEditingModule}
                    saveModule={saveModule}
                    cancelEdit={cancelEdit}
                    handleDeleteModule={handleDeleteModule}
                    expandedModules={expandedModules}
                    toggleModule={toggleModule}
                    isLoading={isLoading}
                  >
                    {expandedModules.has(module.id) && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingLesson(module.id)}
                        className="mb-3 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Lesson
                      </Button>

                      {isAddingLesson === module.id && (
                        <Card className="border-green-200 bg-green-50 mb-3">
                          <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`new-lesson-title-${module.id}`}>Lesson Title</Label>
                              <Input
                                id={`new-lesson-title-${module.id}`}
                                value={newLessonForm.title}
                                onChange={(e) => setNewLessonForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter lesson title"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`new-lesson-description-${module.id}`}>Lesson Description</Label>
                              <Textarea
                                id={`new-lesson-description-${module.id}`}
                                value={newLessonForm.description}
                                onChange={(e) => setNewLessonForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter lesson description"
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsAddingLesson(null)} 
                                size="sm"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => addNewLesson(modules.findIndex(m => m.id === module.id))} 
                                disabled={isLoading} 
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                {isLoading ? "Adding..." : "Add Lesson"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext 
                          items={module.lessons.map(lesson => lesson.chapterId || `lesson-${lesson.id}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          {module.lessons.map((lesson) => {
                            const lessonKey = `${module.id}-${lesson.id}`;
                            return (
                              <SortableLessonItem
                                key={lesson.id}
                                lesson={lesson}
                                lessonKey={lessonKey}
                                editingLesson={editingLesson}
                                editLessonForm={editLessonForm}
                                setEditLessonForm={setEditLessonForm}
                                startEditingLesson={startEditingLesson}
                                saveLesson={saveLesson}
                                cancelEdit={cancelEdit}
                                handleDeleteLesson={handleDeleteLesson}
                                expandedLessons={expandedLessons}
                                toggleLesson={toggleLesson}
                                isLoading={isLoading}
                              >
                                {expandedLessons.has(lessonKey) && (
                              <div className="space-y-2 pl-6">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAddingChapterToLesson(lessonKey)}
                                  className="mb-2"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Chapter
                                </Button>

                                {addingChapterToLesson === lessonKey && (
                                  <Card className="border-green-200 bg-green-50 mb-2">
                                    <CardContent className="p-4 space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="new-title">Chapter Title</Label>
                                        <Input
                                          id="new-title"
                                          value={newChapterForm.title}
                                          onChange={(e) => setNewChapterForm(prev => ({ ...prev, title: e.target.value }))}
                                          placeholder="Enter chapter title"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="new-description">Description</Label>
                                        <Textarea
                                          id="new-description"
                                          value={newChapterForm.description}
                                          onChange={(e) => setNewChapterForm(prev => ({ ...prev, description: e.target.value }))}
                                          placeholder="Enter chapter description"
                                          rows={3}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="new-video">Video URL</Label>
                                        <Input
                                          id="new-video"
                                          value={newChapterForm.videoUrl}
                                          onChange={(e) => setNewChapterForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                          placeholder="Enter video URL"
                                        />
                                      </div>

                                      <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={newChapterForm.isPublished}
                                            onChange={(e) => setNewChapterForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                                            className="rounded"
                                          />
                                          <span className="text-sm">Published</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={newChapterForm.isFree}
                                            onChange={(e) => setNewChapterForm(prev => ({ ...prev, isFree: e.target.checked }))}
                                            className="rounded"
                                          />
                                          <span className="text-sm">Free Preview</span>
                                        </label>
                                      </div>

                                      <div className="flex justify-end space-x-2">
                                        <Button 
                                          variant="outline" 
                                          onClick={() => setAddingChapterToLesson(null)} 
                                          size="sm"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={() => addNewChapter(lesson.chapters, lesson.chapterId || undefined, typeof lesson.id === 'string' ? lesson.id : undefined)} 
                                          disabled={isLoading} 
                                          size="sm"
                                        >
                                          <Plus className="w-4 h-4 mr-1" />
                                          {isLoading ? "Adding..." : "Add Chapter"}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                <DndContext 
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleDragEnd}
                                >
                                  <SortableContext 
                                    items={lesson.chapters.map(chapter => chapter.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {lesson.chapters.map((chapter) => (
                                      <SortableChapterItem
                                        key={chapter.id}
                                        chapter={chapter}
                                        editingChapter={editingChapter}
                                        editForm={editForm}
                                        setEditForm={setEditForm}
                                        startEditingChapter={startEditingChapter}
                                        saveChapter={saveChapter}
                                        cancelEdit={cancelEdit}
                                        handleDeleteChapter={handleDeleteChapter}
                                        isLoading={isLoading}
                                        generatingAudio={generatingAudio}
                                        audioPlaying={audioPlaying}
                                        playAudio={playAudio}
                                        generateAudio={generateAudio}
                                        availableVoices={availableVoices}
                                        selectedVoice={selectedVoice}
                                        setSelectedVoice={setSelectedVoice}
                                      />
                                    ))}
                                  </SortableContext>
                                </DndContext>
                              </div>
                                )}
                              </SortableLessonItem>
                            );
                          })}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </CardContent>
                )}
                  </SortableModuleItem>
                ))}
              </SortableContext>
            </DndContext>

            {modules.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium mb-2">No course content found</p>
                <p className="text-sm">This course doesn't have any modules or chapters yet.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Close Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 