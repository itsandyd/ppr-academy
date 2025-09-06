"use client";

import { useState } from "react";
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

  const toggleModule = (moduleIndex: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleIndex)) {
      newExpanded.delete(moduleIndex);
    } else {
      newExpanded.add(moduleIndex);
    }
    setExpandedModules(newExpanded);
  };

  const toggleLesson = (moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedLessons(newExpanded);
  };

  const addModule = (moduleData: Omit<Module, 'lessons'>) => {
    const newModule = { ...moduleData, lessons: [] };
    const updatedModules = [...modules, newModule];
    onModulesChange(updatedModules);
  };

  const addLesson = (moduleIndex: number, lessonData: Omit<Lesson, 'chapters'>) => {
    const newLesson = { ...lessonData, chapters: [] };
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    onModulesChange(updatedModules);
  };

  const addChapter = (moduleIndex: number, lessonIndex: number, chapterData: Chapter) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters.push(chapterData);
    onModulesChange(updatedModules);
  };

  const removeModule = (moduleIndex: number) => {
    if (confirm("Are you sure you want to remove this module and all its content?")) {
      const updatedModules = modules.filter((_, index) => index !== moduleIndex);
      onModulesChange(updatedModules);
    }
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    if (confirm("Are you sure you want to remove this lesson and all its chapters?")) {
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
      onModulesChange(updatedModules);
    }
  };

  const removeChapter = (moduleIndex: number, lessonIndex: number, chapterIndex: number) => {
    if (confirm("Are you sure you want to remove this chapter?")) {
      const updatedModules = [...modules];
      updatedModules[moduleIndex].lessons[lessonIndex].chapters = 
        updatedModules[moduleIndex].lessons[lessonIndex].chapters.filter((_, index) => index !== chapterIndex);
      onModulesChange(updatedModules);
    }
  };

  // Edit functions
  const editModule = (moduleIndex: number, moduleData: Omit<Module, 'lessons'>) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], ...moduleData };
    onModulesChange(updatedModules);
  };

  const editLesson = (moduleIndex: number, lessonIndex: number, lessonData: Omit<Lesson, 'chapters'>) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = { 
      ...updatedModules[moduleIndex].lessons[lessonIndex], 
      ...lessonData 
    };
    onModulesChange(updatedModules);
  };

  const editChapter = (moduleIndex: number, lessonIndex: number, chapterIndex: number, chapterData: Chapter) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex] = chapterData;
    onModulesChange(updatedModules);
  };

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
              <Card key={moduleIndex} className="border-emerald-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleModule(moduleIndex)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      {expandedModules.has(moduleIndex) ? (
                        <ChevronDown className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-emerald-600" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-800">
                          Module {moduleIndex + 1}: {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-xs sm:text-sm text-emerald-600 mt-1 line-clamp-2 sm:line-clamp-none">{module.description}</p>
                        )}
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-2">
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
                        <Card key={lessonIndex} className="border-blue-200 ml-6">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleLesson(moduleIndex, lessonIndex)}
                                className="flex items-center gap-3 text-left flex-1"
                              >
                                {expandedLessons.has(`${moduleIndex}-${lessonIndex}`) ? (
                                  <ChevronDown className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-blue-600" />
                                )}
                                <div className="flex-1">
                                  <h5 className="font-medium text-blue-800">
                                    Lesson {lessonIndex + 1}: {lesson.title}
                                  </h5>
                                  {lesson.description && (
                                    <p className="text-xs sm:text-sm text-blue-600 mt-1 line-clamp-2 sm:line-clamp-none">{lesson.description}</p>
                                  )}
                                </div>
                              </button>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {lesson.chapters.length} chapters
                                </Badge>
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
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLesson(moduleIndex, lessonIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
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
                                  <Card key={chapterIndex} className="border-purple-200 ml-6 bg-purple-50/30">
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h6 className="font-medium text-purple-800">
                                            Chapter {chapterIndex + 1}: {chapter.title}
                                          </h6>
                                          <p className="text-sm text-purple-600 mt-1 line-clamp-2">
                                            {chapter.content}
                                          </p>
                                          {chapter.videoUrl && (
                                            <div className="flex items-center gap-1 mt-2">
                                              <Play className="w-3 h-3 text-purple-600" />
                                              <span className="text-xs text-purple-600">Video included</span>
                                            </div>
                                          )}
                                          {chapter.duration > 0 && (
                                            <span className="text-xs text-purple-500">
                                              {chapter.duration} min
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
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
                                                className="text-blue-600 hover:text-blue-700"
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                            }
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeChapter(moduleIndex, lessonIndex, chapterIndex)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}

                                {lesson.chapters.length === 0 && (
                                  <div className="text-center py-6 border border-dashed border-purple-200 rounded-lg bg-purple-50/30">
                                    <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                    <p className="text-sm text-purple-600 mb-3">No chapters yet</p>
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
