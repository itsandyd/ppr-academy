"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Circle,
  ChevronLeft, 
  ChevronRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Course {
  _id: string;
  title: string;
  description?: string;
  modules?: Array<{
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      title: string;
      description: string;
      orderIndex: number;
      chapters: Array<{
        title: string;
        content: string;
        videoUrl?: string;
        duration: number;
        orderIndex: number;
      }>;
    }>;
  }>;
}

interface CourseViewLayoutProps {
  course: Course;
  currentLessonId?: string | null;
  currentModuleId?: string | null;
  storeId: string;
}

export function CourseViewLayout({ 
  course, 
  currentLessonId, 
  currentModuleId, 
  storeId 
}: CourseViewLayoutProps) {
  const router = useRouter();
  
  // Calculate progress
  const totalLessons = course.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const completedLessons = 0; // TODO: Implement progress tracking
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Get current lesson data
  const getCurrentLesson = () => {
    if (!course.modules || !currentLessonId) return null;
    
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => `${module.orderIndex}-${l.orderIndex}` === currentLessonId);
      if (lesson) {
        return { lesson, module };
      }
    }
    return null;
  };

  const currentLessonData = getCurrentLesson();
  const currentLesson = currentLessonData?.lesson;
  const currentModule = currentLessonData?.module;

  // Navigation helpers
  const getAllLessons = () => {
    if (!course.modules) return [];
    const allLessons: Array<{ lesson: any; module: any; id: string }> = [];
    
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        allLessons.push({
          lesson,
          module,
          id: `${module.orderIndex}-${lesson.orderIndex}`
        });
      });
    });
    
    return allLessons.sort((a, b) => {
      if (a.module.orderIndex !== b.module.orderIndex) {
        return a.module.orderIndex - b.module.orderIndex;
      }
      return a.lesson.orderIndex - b.lesson.orderIndex;
    });
  };

  const allLessons = getAllLessons();
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const navigateToLesson = (lessonId: string) => {
    router.push(`/store/${storeId}/courses/${course._id}?lesson=${lessonId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Left Sidebar - Course Outline */}
        <div className="w-80 bg-muted/20 border-r border-border p-6 sticky top-0 h-screen overflow-y-auto">
          {/* Header Card */}
          <Card className="p-4 mb-6 shadow-sm">
            <h2 className="font-bold text-lg text-foreground mb-3">
              {course.title}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs text-muted-foreground">{progressPercentage}% complete</span>
              </div>
              <Progress value={progressPercentage} className="h-1" />
            </div>
          </Card>

          {/* Course Home */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50"
              onClick={() => router.push(`/store/${storeId}/courses/${course._id}`)}
            >
              <Home className="w-4 h-4 mr-3 text-muted-foreground" />
              <span className="font-medium">Course Home</span>
            </Button>
          </div>

          {/* Modules List */}
          <div className="space-y-6">
            {course.modules?.map((module) => {
              const moduleCompletedLessons = 0; // TODO: Calculate actual progress
              const moduleTotalLessons = module.lessons.length;
              
              return (
                <Card key={module.orderIndex} className="p-4 shadow-sm">
                  {/* Module Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-foreground">
                      Module {module.orderIndex}: {module.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {moduleCompletedLessons}/{moduleTotalLessons}
                    </Badge>
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-3">
                    {module.lessons.map((lesson) => {
                      const lessonId = `${module.orderIndex}-${lesson.orderIndex}`;
                      const isActive = lessonId === currentLessonId;
                      const isCompleted = false; // TODO: Check if lesson is completed
                      
                      return (
                        <button
                          key={lesson.orderIndex}
                          onClick={() => navigateToLesson(lessonId)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            isActive
                              ? "bg-teal-50 border border-teal-200"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          {/* Lesson Icon */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted 
                              ? "bg-teal-100 text-teal-600"
                              : isActive
                              ? "bg-teal-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </div>
                          
                          {/* Lesson Title */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm truncate ${
                              isActive ? "text-teal-800" : "text-foreground"
                            }`}>
                              Lesson {lesson.orderIndex}: {lesson.title}
                            </h4>
                            {lesson.description && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Active Indicator */}
                          {isActive && (
                            <div className="w-2 h-8 bg-teal-500 rounded-full flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Main Content - Lesson Canvas */}
        <div className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-8 py-16">
            {currentLesson ? (
              <div className="max-w-3xl mx-auto space-y-12">
                {/* Lesson Title */}
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold text-teal-700 leading-tight">
                    Lesson {currentLesson.orderIndex}: {currentLesson.title}
                  </h1>
                  
                  {/* Module Context */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>Module {currentModule?.orderIndex}: {currentModule?.title}</span>
                  </div>
                </div>

                {/* Lesson Content */}
                <div className="prose prose-lg max-w-none">
                  {/* Intro Copy */}
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-8">
                    <p className="text-base leading-relaxed text-teal-800 m-0">
                      {currentLesson.description || "In this lesson, you'll learn essential concepts that will help you master the fundamentals and apply them in real-world scenarios."}
                    </p>
                  </div>

                  {/* Key Points */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">What You'll Learn</h3>
                    <ul className="space-y-4 text-base leading-relaxed">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-3 flex-shrink-0" />
                        <span>Master the fundamental concepts and core principles</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-3 flex-shrink-0" />
                        <span>Apply practical techniques through hands-on exercises</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-3 flex-shrink-0" />
                        <span>Build confidence with real-world implementation strategies</span>
                      </li>
                    </ul>
                  </div>

                  {/* Lesson Chapters/Content */}
                  {currentLesson.chapters && currentLesson.chapters.length > 0 && (
                    <div className="space-y-8">
                      {currentLesson.chapters.map((chapter) => (
                        <div key={chapter.orderIndex} className="space-y-4">
                          <h4 className="text-lg font-semibold text-foreground">
                            {chapter.title}
                          </h4>
                          <div 
                            className="prose prose-base max-w-none text-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                          />
                          {chapter.videoUrl && (
                            <div className="bg-gray-100 rounded-xl p-6 text-center">
                              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                                <Play className="w-4 h-4" />
                                <span className="text-sm">Video Content</span>
                                {chapter.duration > 0 && (
                                  <>
                                    <Clock className="w-4 h-4 ml-2" />
                                    <span className="text-sm">{chapter.duration} min</span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Video player will be implemented here</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Wrap-up */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-12">
                    <h4 className="font-semibold text-foreground mb-3">Ready for the Next Step?</h4>
                    <p className="text-base leading-relaxed text-muted-foreground m-0">
                      Complete any exercises or materials mentioned above, then continue to the next lesson 
                      to build on what you've learned here.
                    </p>
                  </div>
                </div>

                {/* Lesson Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
                  {/* Previous Lesson */}
                  {previousLesson ? (
                    <Card 
                      className="p-6 cursor-pointer hover:shadow-md transition-all bg-gray-50/50 hover:bg-gray-50 border-gray-200"
                      onClick={() => navigateToLesson(previousLesson.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Previous Lesson:</p>
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {previousLesson.lesson.title}
                          </h4>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div /> // Empty space to maintain grid
                  )}

                  {/* Next Lesson */}
                  {nextLesson ? (
                    <Card 
                      className="p-6 cursor-pointer hover:shadow-md transition-all bg-teal-50/50 hover:bg-teal-50 border-teal-200"
                      onClick={() => navigateToLesson(nextLesson.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-xs text-teal-600 mb-1">Next Lesson:</p>
                          <h4 className="font-bold text-sm text-teal-800 truncate">
                            {nextLesson.lesson.title}
                          </h4>
                        </div>
                        <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-teal-600" />
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6 bg-green-50/50 border-green-200">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-xs text-green-600 mb-1">Course Complete!</p>
                        <h4 className="font-bold text-sm text-green-800">
                          Congratulations! 🎉
                        </h4>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              /* Course Home View */
              <div className="max-w-3xl mx-auto space-y-12">
                {/* Course Title */}
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold text-teal-700 leading-tight">
                    {course.title}
                  </h1>
                  {course.description && (
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Course Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 text-center">
                    <BookOpen className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {course.modules?.length || 0} Modules
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Structured learning path
                    </p>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <Play className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {totalLessons} Lessons
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive content
                    </p>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <CheckCircle className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {progressPercentage}% Complete
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your progress
                    </p>
                  </Card>
                </div>

                {/* Start Course */}
                {course.modules && course.modules.length > 0 && (
                  <div className="text-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        const firstModule = course.modules![0];
                        const firstLesson = firstModule.lessons[0];
                        if (firstLesson) {
                          navigateToLesson(`${firstModule.orderIndex}-${firstLesson.orderIndex}`);
                        }
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-base"
                    >
                      {completedLessons > 0 ? "Continue Learning" : "Start Course"}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
