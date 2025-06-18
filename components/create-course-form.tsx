"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { createCourse } from "@/app/actions/course-actions";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Play, 
  FileText, 
  ChevronDown,
  ChevronRight,
  Save
} from "lucide-react";

interface Module {
  id?: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Lesson {
  id?: number;
  title: string;
  description: string;
  orderIndex: number;
  chapters: Chapter[];
}

interface Chapter {
  id?: number;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  orderIndex: number;
}

export default function CreateCourseForm() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  // Course structure
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});
  const [expandedLessons, setExpandedLessons] = useState<{ [key: string]: boolean }>({});

  const categories = [
    "Hip-Hop Production",
    "Electronic Music",
    "Mixing & Mastering", 
    "Sound Design",
    "Music Theory",
    "Pop Production",
    "Rock Production",
    "DAWs",
    "Trap Production",
    "House Music",
    "Techno Production",
    "Vocal Production",
    "Jazz Production",
    "R&B Production",
    "Ambient Music",
    "Drum Programming",
    "Synthesis",
    "Sampling",
    "Audio Engineering",
    "Live Performance"
  ];

  const skillLevels = [
    "Beginner",
    "Intermediate",
    "Advanced", 
    "All Levels"
  ];

  const addModule = () => {
    const newModule: Module = {
      title: "",
      description: "",
      orderIndex: modules.length,
      lessons: [],
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
  };

  const deleteModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    setModules(updatedModules);
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: Lesson = {
      title: "",
      description: "",
      orderIndex: modules[moduleIndex].lessons.length,
      chapters: [],
    };
    
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    setModules(updatedModules);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      [field]: value,
    };
    setModules(updatedModules);
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updatedModules);
  };

  const addChapter = (moduleIndex: number, lessonIndex: number) => {
    const newChapter: Chapter = {
      title: "",
      content: "",
      videoUrl: "",
      duration: 0,
      orderIndex: modules[moduleIndex].lessons[lessonIndex].chapters.length,
    };
    
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters.push(newChapter);
    setModules(updatedModules);
  };

  const updateChapter = (moduleIndex: number, lessonIndex: number, chapterIndex: number, field: keyof Chapter, value: any) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex],
      [field]: value,
    };
    setModules(updatedModules);
  };

  const deleteChapter = (moduleIndex: number, lessonIndex: number, chapterIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters = 
      updatedModules[moduleIndex].lessons[lessonIndex].chapters.filter((_, i) => i !== chapterIndex);
    setModules(updatedModules);
  };

  const toggleModule = (index: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleLesson = (moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setExpandedLessons(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !price || !category || !skillLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const courseData = {
      title,
      description,
      price: parseFloat(price),
      category,
      skillLevel,
      thumbnail,
      isPublished: false,
      modules,
    };
    
    const result = await createCourse(courseData);
    
    setIsSubmitting(false);

    if (result.success && result.courseId) {
      toast({
        title: "Course Created!",
        description: "Your course has been created successfully.",
      });
      // Use the slug returned from the server
      if (result.slug) {
        router.push(`/courses/${result.slug}`);
      } else {
        router.push(`/courses`);
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create course",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Create New Course</h1>
              <p className="text-white/90 mt-2">Share your knowledge with the world</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Save Draft
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-white text-primary hover:bg-slate-100"
              >
                {isSubmitting ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Course Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter course title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Course Description *</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what students will learn..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category *</label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Skill Level *</label>
                      <Select value={skillLevel} onValueChange={setSkillLevel} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillLevels.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Price (USD) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                    <Input
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Course Modules */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Course Modules</CardTitle>
                    <Button type="button" onClick={addModule} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {modules.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No modules yet. Add your first module to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="border border-slate-200 rounded-lg">
                          {/* Module Header */}
                          <div className="p-4 bg-slate-50 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleModule(moduleIndex)}
                                className="flex items-center space-x-2 text-left"
                              >
                                {expandedModules[moduleIndex] ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                                <span className="font-medium">Module {moduleIndex + 1}</span>
                              </button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => deleteModule(moduleIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="mt-3 space-y-3">
                              <Input
                                value={module.title}
                                onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                                placeholder="Module title"
                              />
                              <Textarea
                                value={module.description}
                                onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                                placeholder="Module description"
                                rows={2}
                              />
                            </div>
                          </div>

                          {/* Module Content */}
                          {expandedModules[moduleIndex] && (
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium">Lessons</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLesson(moduleIndex)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Lesson
                                </Button>
                              </div>

                              {module.lessons.length === 0 ? (
                                <p className="text-slate-500 text-center py-4">No lessons yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lessonIndex} className="border border-slate-200 rounded">
                                      {/* Lesson Header */}
                                      <div className="p-3 bg-slate-25 border-b border-slate-200">
                                        <div className="flex items-center justify-between">
                                          <button
                                            type="button"
                                            onClick={() => toggleLesson(moduleIndex, lessonIndex)}
                                            className="flex items-center space-x-2"
                                          >
                                            {expandedLessons[`${moduleIndex}-${lessonIndex}`] ? (
                                              <ChevronDown className="w-4 h-4" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4" />
                                            )}
                                            <span className="text-sm font-medium">
                                              Lesson {lessonIndex + 1}
                                            </span>
                                          </button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        
                                        <div className="mt-2 space-y-2">
                                          <Input
                                            value={lesson.title}
                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                                            placeholder="Lesson title"
                                            className="text-sm"
                                          />
                                          <Textarea
                                            value={lesson.description}
                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "description", e.target.value)}
                                            placeholder="Lesson description"
                                            rows={2}
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>

                                      {/* Lesson Chapters */}
                                      {expandedLessons[`${moduleIndex}-${lessonIndex}`] && (
                                        <div className="p-3">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-medium">Chapters</h5>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => addChapter(moduleIndex, lessonIndex)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" />
                                              Add Chapter
                                            </Button>
                                          </div>

                                          {lesson.chapters.length === 0 ? (
                                            <p className="text-slate-500 text-center py-2 text-sm">No chapters yet</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {lesson.chapters.map((chapter, chapterIndex) => (
                                                <div key={chapterIndex} className="border border-slate-200 rounded p-3 bg-slate-50">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">
                                                      Chapter {chapterIndex + 1}
                                                    </span>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => deleteChapter(moduleIndex, lessonIndex, chapterIndex)}
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                  
                                                  <div className="space-y-2">
                                                    <Input
                                                      value={chapter.title}
                                                      onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "title", e.target.value)}
                                                      placeholder="Chapter title"
                                                      className="text-sm"
                                                    />
                                                    <Textarea
                                                      value={chapter.content}
                                                      onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "content", e.target.value)}
                                                      placeholder="Chapter content"
                                                      rows={2}
                                                      className="text-sm"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                      <Input
                                                        value={chapter.videoUrl}
                                                        onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "videoUrl", e.target.value)}
                                                        placeholder="Video URL"
                                                        className="text-sm"
                                                      />
                                                      <Input
                                                        type="number"
                                                        value={chapter.duration}
                                                        onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "duration", parseInt(e.target.value) || 0)}
                                                        placeholder="Duration (seconds)"
                                                        className="text-sm"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Course Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt="Course thumbnail"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-dark line-clamp-2">
                        {title || "Course Title"}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-3">
                        {description || "Course description will appear here..."}
                      </p>
                    </div>

                    {(category || skillLevel) && (
                      <div className="flex flex-wrap gap-2">
                        {category && <Badge variant="secondary">{category}</Badge>}
                        {skillLevel && <Badge variant="outline">{skillLevel}</Badge>}
                      </div>
                    )}

                    {price && (
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(price).toFixed(0)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Modules:</span>
                      <span className="font-medium">{modules.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lessons:</span>
                      <span className="font-medium">
                        {modules.reduce((total, module) => total + module.lessons.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chapters:</span>
                      <span className="font-medium">
                        {modules.reduce((total, module) => 
                          total + module.lessons.reduce((lessonTotal, lesson) => 
                            lessonTotal + lesson.chapters.length, 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Duration:</span>
                      <span className="font-medium">
                        {Math.floor(
                          modules.reduce((total, module) => 
                            total + module.lessons.reduce((lessonTotal, lesson) => 
                              lessonTotal + lesson.chapters.reduce((chapterTotal, chapter) => 
                                chapterTotal + chapter.duration, 0), 0), 0) / 60)}m
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Your course will be created as a draft. You can publish it later from your dashboard.
                    </p>
                    
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Creating..." : "Create Course"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  );
} 