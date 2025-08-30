"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreId } from "@/hooks/useStoreId";
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

interface CourseFormData {
  title?: string;
  description?: string;
  category?: string;
  skillLevel?: string;
  thumbnail?: string;
  price?: string;
  modules?: Module[];
}

interface CreateCourseFormProps {
  initialData?: CourseFormData;
  onDataChange?: (data: CourseFormData) => void;
  disableSubmit?: boolean;
  hideBasicInfo?: boolean;
}

export default function CreateCourseForm({ 
  initialData, 
  onDataChange, 
  disableSubmit = false,
  hideBasicInfo = false
}: CreateCourseFormProps = {}) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storeId = useStoreId(); // Get current store ID from URL
  
  // Convex mutations
  const createCourseWithData = useMutation(api.courses.createCourseWithData);

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

  // Load initial data from props
  useEffect(() => {
    console.log("🔥 CreateCourseForm useEffect triggered - initialData:", initialData);
    if (initialData) {
      console.log("📥 CreateCourseForm loading initial data:", initialData);
      
      if (initialData.title !== undefined) setTitle(initialData.title);
      if (initialData.description !== undefined) setDescription(initialData.description);
      if (initialData.category !== undefined) setCategory(initialData.category);
      if (initialData.skillLevel !== undefined) setSkillLevel(initialData.skillLevel);
      if (initialData.thumbnail !== undefined) setThumbnail(initialData.thumbnail);
      if (initialData.price !== undefined) setPrice(initialData.price);
      if (initialData.modules !== undefined) {
        console.log("🔥 Loading modules from initialData:", initialData.modules);
        setModules(initialData.modules);
        console.log("🔥 Modules state updated to:", initialData.modules);
        
        // Auto-expand modules that should be expanded
        if (initialData.modules.length > 0) {
          const lastModuleIndex = initialData.modules.length - 1;
          setExpandedModules(prev => ({
            ...prev,
            [lastModuleIndex]: true  // Auto-expand the last module
          }));
        }
      }
    }
  }, [initialData]);

  // Helper function to get current form data
  const getCurrentFormData = (): CourseFormData => ({
    title,
    description,
    category,
    skillLevel,
    thumbnail,
    price,
    modules
  });

  // Helper function to notify parent of data changes
  const notifyDataChange = () => {
    if (onDataChange) {
      const currentData = getCurrentFormData();
      console.log("🔄 CreateCourseForm notifying data change:", currentData);
      console.log("🔥 Current modules in notifyDataChange:", currentData.modules);
      onDataChange(currentData);
    }
  };

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
    console.log("🔥 BEFORE addModule - current modules:", modules);
    console.log("🔥 BEFORE addModule - current expandedModules:", expandedModules);
    const newModule: Module = {
      title: "",
      description: "",
      orderIndex: modules.length,
      lessons: [],
    };
    const newModules = [...modules, newModule];
    const newModuleIndex = modules.length;
    console.log("🔥 AFTER addModule - new modules:", newModules);
    console.log("🔥 Setting module", newModuleIndex, "as expanded");
    setModules(newModules);
    
    // Auto-expand the newly added module
    setExpandedModules(prev => {
      const newExpanded = {
        ...prev,
        [newModuleIndex]: true
      };
      console.log("🔥 New expandedModules state:", newExpanded);
      return newExpanded;
    });
    
    // Fix timing issue - use the newModules array directly instead of stale state
    console.log("🔥 Calling notifyDataChange with new modules:", newModules);
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: newModules  // Use the fresh array instead of stale state
      };
      console.log("🔄 CreateCourseForm notifying data change (direct):", currentData);
      onDataChange(currentData);
    }
  };

  const updateModule = (index: number, field: keyof Module, value: any) => {
    console.log("🔥 updateModule called:", { index, field, value });
    console.log("🔥 Current modules before update:", modules);
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    console.log("🔥 Updated modules array:", updatedModules);
    setModules(updatedModules);
    
    // Use direct onDataChange call with the updated data instead of notifyDataChange
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules  // Use the updated array directly
      };
      console.log("🔥 updateModule calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
  };

  const deleteModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    setModules(updatedModules);
    setTimeout(notifyDataChange, 0);
  };

  const addLesson = (moduleIndex: number) => {
    console.log("🔥 Adding lesson to module", moduleIndex);
    const newLesson: Lesson = {
      title: "",
      description: "",
      orderIndex: modules[moduleIndex].lessons.length,
      chapters: [],
    };
    
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    const newLessonIndex = updatedModules[moduleIndex].lessons.length - 1;
    setModules(updatedModules);
    
    // Auto-expand the newly added lesson
    const lessonKey = `${moduleIndex}-${newLessonIndex}`;
    setExpandedLessons(prev => ({
      ...prev,
      [lessonKey]: true
    }));
    
    // Use direct onDataChange call for consistency
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules
      };
      console.log("🔥 addLesson calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    console.log("🔥 updateLesson called:", { moduleIndex, lessonIndex, field, value });
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      [field]: value,
    };
    setModules(updatedModules);
    
    // Use direct onDataChange call for consistency
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules
      };
      console.log("🔥 updateLesson calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    console.log("🔥 Deleting lesson:", { moduleIndex, lessonIndex });
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updatedModules);
    
    // Use direct onDataChange call for consistency
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules
      };
      console.log("🔥 deleteLesson calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
  };

  const addChapter = (moduleIndex: number, lessonIndex: number) => {
    console.log("🔥 Adding chapter to module", moduleIndex, "lesson", lessonIndex);
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
    
    // Use direct onDataChange call for consistency
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules
      };
      console.log("🔥 addChapter calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
  };

  const updateChapter = (moduleIndex: number, lessonIndex: number, chapterIndex: number, field: keyof Chapter, value: any) => {
    console.log("🔥 updateChapter called:", { moduleIndex, lessonIndex, chapterIndex, field, value });
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex],
      [field]: value,
    };
    setModules(updatedModules);
    
    // Use direct onDataChange call for consistency
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules
      };
      console.log("🔥 updateChapter calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
  };

  const deleteChapter = (moduleIndex: number, lessonIndex: number, chapterIndex: number) => {
    console.log("🔥 Deleting chapter:", { moduleIndex, lessonIndex, chapterIndex });
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].chapters = 
      updatedModules[moduleIndex].lessons[lessonIndex].chapters.filter((_, i) => i !== chapterIndex);
    setModules(updatedModules);
    
    // Use direct onDataChange call for consistency
    if (onDataChange) {
      const currentData = {
        title,
        description,
        category,
        skillLevel,
        thumbnail,
        price,
        modules: updatedModules
      };
      console.log("🔥 deleteChapter calling onDataChange with:", currentData);
      onDataChange(currentData);
    }
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
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!storeId) {
      toast({
        title: "Error",
        description: "Store not found. Please navigate to your store first.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("🚀 Creating course with data:", {
        userId: user.id,
        storeId: storeId,
        data: {
          title,
          description,
          price,
          category,
          skillLevel,
          thumbnail,
          modules,
          checkoutHeadline: `Learn ${title}`,
        }
      });

      const result = await createCourseWithData({
        userId: user.id, // Clerk user ID
        storeId: storeId, // Use actual store ID from URL
        data: {
          title,
          description,
          price,
          category,
          skillLevel,
          thumbnail,
          modules,
          checkoutHeadline: `Learn ${title}`, // Add default checkout headline
        }
      });
      
      console.log("✅ Course creation result:", result);
      
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
          description: "Failed to create course",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    }
  };

  return (
    <form id="course-form" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Course Details */}
            <div className="order-1 lg:col-span-2 space-y-4 md:space-y-6">
              {/* Basic Information - Conditionally rendered */}
              {!hideBasicInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Course Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setTimeout(notifyDataChange, 0);
                      }}
                      placeholder="Enter course title"
                      required
                      className="min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Course Description *</label>
                    <Textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setTimeout(notifyDataChange, 0);
                      }}
                      placeholder="Describe what students will learn..."
                      rows={4}
                      required
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Category *</label>
                      <Select value={category} onValueChange={(value) => {
                        setCategory(value);
                        setTimeout(notifyDataChange, 0);
                      }} required>
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
                      <label className="block text-sm font-medium mb-2 text-foreground">Skill Level *</label>
                      <Select value={skillLevel} onValueChange={(value) => {
                        setSkillLevel(value);
                        setTimeout(notifyDataChange, 0);
                      }} required>
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
                    <label className="block text-sm font-medium mb-2 text-foreground">Price (USD) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        setTimeout(notifyDataChange, 0);
                      }}
                      placeholder="0.00"
                      required
                      className="min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Thumbnail URL</label>
                    <Input
                      value={thumbnail}
                      onChange={(e) => {
                        setThumbnail(e.target.value);
                        setTimeout(notifyDataChange, 0);
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="min-h-[44px]"
                    />
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Course Modules */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle>Course Modules</CardTitle>
                    <Button 
                      type="button" 
                      onClick={() => {
                        console.log("🔥 Add Module button clicked!");
                        addModule();
                      }} 
                      variant="outline"
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    console.log("🔥 Modules render check - modules.length:", modules.length, "modules:", modules);
                    return modules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No modules yet. Add your first module to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {modules.map((module, moduleIndex) => {
                          console.log("🔥 Rendering module:", { moduleIndex, module, isExpanded: expandedModules[moduleIndex] });
                          return (
                          <div key={moduleIndex} className="border border-border rounded-lg shadow-sm">
                            {/* Module Header */}
                            <div className="p-3 md:p-4 bg-muted/30 border-b border-border">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => toggleModule(moduleIndex)}
                                  className="flex items-center space-x-2 text-left min-h-[44px] flex-1 mr-2"
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
                                  className="min-h-[44px] min-w-[44px]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="mt-3 space-y-3">
                                <Input
                                  value={module.title}
                                  onChange={(e) => {
                                    console.log("🔥 Input onChange triggered:", { moduleIndex, field: "title", value: e.target.value });
                                    updateModule(moduleIndex, "title", e.target.value);
                                  }}
                                  placeholder="Module title"
                                  className="min-h-[44px]"
                                />
                                <Textarea
                                  value={module.description}
                                  onChange={(e) => {
                                    console.log("🔥 Textarea onChange triggered:", { moduleIndex, field: "description", value: e.target.value });
                                    updateModule(moduleIndex, "description", e.target.value);
                                  }}
                                  placeholder="Module description"
                                  rows={2}
                                  className="min-h-[44px]"
                                />
                              </div>
                            </div>

                            {/* Module Content */}
                            {expandedModules[moduleIndex] && (
                            <div className="p-3 md:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <h4 className="font-medium">Lessons</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLesson(moduleIndex)}
                                  className="w-full sm:w-auto min-h-[44px]"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Lesson
                                </Button>
                              </div>

                              {module.lessons.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No lessons yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lessonIndex} className="border border-border rounded shadow-sm">
                                      {/* Lesson Header */}
                                      <div className="p-3 bg-muted/20 border-b border-border">
                                        <div className="flex items-center justify-between">
                                          <button
                                            type="button"
                                            onClick={() => toggleLesson(moduleIndex, lessonIndex)}
                                            className="flex items-center space-x-2 min-h-[44px] flex-1 mr-2"
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
                                            className="min-h-[44px] min-w-[44px]"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        
                                        <div className="mt-2 space-y-2">
                                          <Input
                                            value={lesson.title}
                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                                            placeholder="Lesson title"
                                            className="text-sm min-h-[40px]"
                                          />
                                          <Textarea
                                            value={lesson.description}
                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "description", e.target.value)}
                                            placeholder="Lesson description"
                                            rows={2}
                                            className="text-sm min-h-[40px]"
                                          />
                                        </div>
                                      </div>

                                      {/* Lesson Chapters */}
                                      {expandedLessons[`${moduleIndex}-${lessonIndex}`] && (
                                        <div className="p-3">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                            <h5 className="text-sm font-medium">Chapters</h5>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => addChapter(moduleIndex, lessonIndex)}
                                              className="w-full sm:w-auto min-h-[40px]"
                                            >
                                              <Plus className="w-3 h-3 mr-1" />
                                              Add Chapter
                                            </Button>
                                          </div>

                                          {lesson.chapters.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-2 text-sm">No chapters yet</p>
                                          ) : (
                                            <div className="space-y-3">
                                              {lesson.chapters.map((chapter, chapterIndex) => (
                                                <div key={chapterIndex} className="border border-border rounded p-3 bg-muted/20 shadow-sm">
                                                  <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium">
                                                      Chapter {chapterIndex + 1}
                                                    </span>
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => deleteChapter(moduleIndex, lessonIndex, chapterIndex)}
                                                      className="min-h-[40px] min-w-[40px]"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                  
                                                  <div className="space-y-2">
                                                    <Input
                                                      value={chapter.title}
                                                      onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "title", e.target.value)}
                                                      placeholder="Chapter title"
                                                      className="text-sm min-h-[40px]"
                                                    />
                                                    <Textarea
                                                      value={chapter.content}
                                                      onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "content", e.target.value)}
                                                      placeholder="Chapter content"
                                                      rows={2}
                                                      className="text-sm min-h-[40px]"
                                                    />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                      <Input
                                                        value={chapter.videoUrl}
                                                        onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "videoUrl", e.target.value)}
                                                        placeholder="Video URL"
                                                        className="text-sm min-h-[40px]"
                                                      />
                                                      <Input
                                                        type="number"
                                                        value={chapter.duration}
                                                        onChange={(e) => updateChapter(moduleIndex, lessonIndex, chapterIndex, "duration", parseInt(e.target.value) || 0)}
                                                        placeholder="Duration (seconds)"
                                                        className="text-sm min-h-[40px]"
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
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="order-2 lg:col-span-1 space-y-4 md:space-y-6">
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
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {title || "Course Title"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
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
                    <p className="text-sm text-muted-foreground">
                      Your course will be created as a draft. You can publish it later from your dashboard.
                    </p>
                    
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting || disableSubmit}
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
  );
} 