"use client";

import { useState, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BookOpen, 
  Play, 
  FileText, 
  Edit, 
  Trash2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { ModuleDialog } from "./ModuleDialog";
import { LessonDialog } from "./LessonDialog";
import { ChapterDialog } from "./ChapterDialog";

interface Chapter {
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  orderIndex: number;
}

interface Lesson {
  title: string;
  description: string;
  orderIndex: number;
  chapters: Chapter[];
}

interface Module {
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseContentManagerProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
}

export function CourseContentManager({ modules, onModulesChange }: CourseContentManagerProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const toggleModule = useCallback((moduleIndex: number) => {
    setExpandedModules(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(moduleIndex)) {
        newExpanded.delete(moduleIndex);
      } else {
        newExpanded.add(moduleIndex);
      }
      return newExpanded;
    });
  }, []);

  const toggleLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setExpandedLessons(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      return newExpanded;
    });
  }, []);

  const addModule = useCallback((moduleData: Omit<Module, 'lessons'>) => {
    const newModule = { ...moduleData, lessons: [] };
    onModulesChange([...modules, newModule]);
  }, [modules, onModulesChange]);

  const addLesson = useCallback((moduleIndex: number, lessonData: Omit<Lesson, 'chapters'>) => {
    const newLesson = { ...lessonData, chapters: [] };
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: [...updatedModules[moduleIndex].lessons, newLesson]
    };
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);

  const addChapter = useCallback((moduleIndex: number, lessonIndex: number, chapterData: Chapter) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedModules[moduleIndex].lessons.map((lesson, idx) =>
        idx === lessonIndex
          ? { ...lesson, chapters: [...lesson.chapters, chapterData] }
          : lesson
      )
    };
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);

  const removeModule = useCallback((moduleIndex: number) => {
    if (confirm("Are you sure you want to remove this module and all its content?")) {
      onModulesChange(modules.filter((_, index) => index !== moduleIndex));
    }
  }, [modules, onModulesChange]);

  const removeLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (confirm("Are you sure you want to remove this lesson and all its chapters?")) {
      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex)
      };
      onModulesChange(updatedModules);
    }
  }, [modules, onModulesChange]);

  const removeChapter = useCallback((moduleIndex: number, lessonIndex: number, chapterIndex: number) => {
    if (confirm("Are you sure you want to remove this chapter?")) {
      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: updatedModules[moduleIndex].lessons.map((lesson, idx) =>
          idx === lessonIndex
            ? { ...lesson, chapters: lesson.chapters.filter((_, cIdx) => cIdx !== chapterIndex) }
            : lesson
        )
      };
      onModulesChange(updatedModules);
    }
  }, [modules, onModulesChange]);

  const editModule = useCallback((moduleIndex: number, moduleData: Omit<Module, 'lessons'>) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], ...moduleData };
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);

  const editLesson = useCallback((moduleIndex: number, lessonIndex: number, lessonData: Omit<Lesson, 'chapters'>) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedModules[moduleIndex].lessons.map((lesson, idx) =>
        idx === lessonIndex ? { ...lesson, ...lessonData } : lesson
      )
    };
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);

  const editChapter = useCallback((moduleIndex: number, lessonIndex: number, chapterIndex: number, chapterData: Chapter) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedModules[moduleIndex].lessons.map((lesson, idx) =>
        idx === lessonIndex
          ? { ...lesson, chapters: lesson.chapters.map((ch, cIdx) => cIdx === chapterIndex ? chapterData : ch) }
          : lesson
      )
    };
    onModulesChange(updatedModules);
  }, [modules, onModulesChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Content
          </CardTitle>
          <ModuleDialog 
            onModuleAdd={addModule}
            existingModules={modules}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No modules yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your course by adding your first module
            </p>
            <ModuleDialog 
              onModuleAdd={addModule}
              existingModules={modules}
              trigger={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Module
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <Card key={moduleIndex} className="border-primary/20 bg-card">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      onClick={() => toggleModule(moduleIndex)}
                      className="flex items-center gap-2 sm:gap-3 text-left flex-1 min-w-0"
                    >
                      {expandedModules.has(moduleIndex) ? (
                        <ChevronDown className="w-4 h-4 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base text-foreground">
                          Module {moduleIndex + 1}: {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{module.description}</p>
                        )}
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center ml-6 sm:ml-0">
                      <Badge variant="secondary" className="text-xs">
                        {module.lessons.length} lessons
                      </Badge>
                      <ModuleDialog
                        onModuleAdd={addModule}
                        onModuleEdit={(moduleData) => editModule(moduleIndex, moduleData)}
                        existingModules={modules}
                        editData={module}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(moduleIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedModules.has(moduleIndex) && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Add Lesson Button */}
                      <div className="flex justify-end">
                        <LessonDialog
                          moduleTitle={module.title}
                          onLessonAdd={(lessonData) => addLesson(moduleIndex, lessonData)}
                          existingLessons={module.lessons}
                        />
                      </div>

                      {/* Lessons */}
                      {module.lessons.map((lesson, lessonIndex) => (
                        <Card key={lessonIndex} className="border-border bg-card/50 ml-0 sm:ml-4 group hover:bg-card transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <button
                                onClick={() => toggleLesson(moduleIndex, lessonIndex)}
                                className="flex items-center gap-2 sm:gap-3 text-left flex-1 min-w-0"
                              >
                                {expandedLessons.has(`${moduleIndex}-${lessonIndex}`) ? (
                                  <ChevronDown className="w-4 h-4 shrink-0 text-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 shrink-0 text-primary" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm sm:text-base text-foreground">
                                    Lesson {lessonIndex + 1}: {lesson.title}
                                  </h5>
                                  {lesson.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.description}</p>
                                  )}
                                </div>
                              </button>
                              
                              <div className="flex items-center gap-1 shrink-0 self-start sm:self-center ml-6 sm:ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-muted-foreground mr-1">
                                  {lesson.chapters.length} ch
                                </span>
                                <LessonDialog
                                  moduleTitle={module.title}
                                  onLessonAdd={(lessonData) => addLesson(moduleIndex, lessonData)}
                                  onLessonEdit={(lessonData) => editLesson(moduleIndex, lessonIndex, lessonData)}
                                  existingLessons={module.lessons}
                                  editData={lesson}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLesson(moduleIndex, lessonIndex)}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {expandedLessons.has(`${moduleIndex}-${lessonIndex}`) && (
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {/* Add Chapter Button */}
                                <div className="flex justify-end">
                                  <ChapterDialog
                                    moduleTitle={module.title}
                                    lessonTitle={lesson.title}
                                    onChapterAdd={(chapterData) => addChapter(moduleIndex, lessonIndex, chapterData)}
                                    existingChapters={lesson.chapters}
                                  />
                                </div>

                                {/* Chapters */}
                                {lesson.chapters.map((chapter, chapterIndex) => (
                                  <div key={chapterIndex} className="ml-0 sm:ml-2 p-3 rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors group">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                        <h6 className="font-medium text-sm text-foreground truncate">
                                          Ch {chapterIndex + 1}: {chapter.title}
                                        </h6>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChapterDialog
                                          moduleTitle={module.title}
                                          lessonTitle={lesson.title}
                                          onChapterAdd={(chapterData) => addChapter(moduleIndex, lessonIndex, chapterData)}
                                          onChapterEdit={(chapterData) => editChapter(moduleIndex, lessonIndex, chapterIndex, chapterData)}
                                          existingChapters={lesson.chapters}
                                          editData={chapter}
                                          trigger={
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                            >
                                              <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                          }
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeChapter(moduleIndex, lessonIndex, chapterIndex)}
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1 ml-3.5 mt-1">
                                      {chapter.content.replace(/<[^>]*>/g, '').substring(0, 80)}...
                                    </p>
                                    {(chapter.videoUrl || chapter.duration > 0) && (
                                      <div className="flex flex-wrap items-center gap-2 mt-2 ml-3.5">
                                        {chapter.videoUrl && (
                                          <Badge variant="outline" className="text-xs h-5 px-1.5">
                                            <Play className="w-2.5 h-2.5 mr-1" />
                                            Video
                                          </Badge>
                                        )}
                                        {chapter.duration > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            {chapter.duration} min
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {lesson.chapters.length === 0 && (
                                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-muted/30">
                                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground mb-3">No chapters yet</p>
                                    <ChapterDialog
                                      moduleTitle={module.title}
                                      lessonTitle={lesson.title}
                                      onChapterAdd={(chapterData) => addChapter(moduleIndex, lessonIndex, chapterData)}
                                      existingChapters={lesson.chapters}
                                      trigger={
                                        <Button variant="outline" size="sm" className="gap-2">
                                          <Plus className="w-4 h-4" />
                                          Add First Chapter
                                        </Button>
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}

                      {module.lessons.length === 0 && (
                        <div className="text-center py-6 border border-dashed border-blue-200 rounded-lg bg-blue-50/30 ml-6">
                          <Play className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm text-blue-600 mb-3">No lessons yet</p>
                          <LessonDialog
                            moduleTitle={module.title}
                            onLessonAdd={(lessonData) => addLesson(moduleIndex, lessonData)}
                            existingLessons={module.lessons}
                            trigger={
                              <Button variant="outline" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add First Lesson
                              </Button>
                            }
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
