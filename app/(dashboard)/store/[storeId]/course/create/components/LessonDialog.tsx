"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Play, Save, X } from "lucide-react";

interface Lesson {
  title: string;
  description: string;
  orderIndex: number;
  chapters: any[];
}

interface LessonDialogProps {
  moduleTitle: string;
  onLessonAdd: (lesson: Omit<Lesson, 'chapters'>) => void;
  existingLessons: Lesson[];
  trigger?: React.ReactNode;
}

export function LessonDialog({ moduleTitle, onLessonAdd, existingLessons, trigger }: LessonDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
  });

  const handleSave = () => {
    if (!lessonData.title.trim()) {
      alert("Lesson title is required");
      return;
    }

    const newLesson = {
      title: lessonData.title.trim(),
      description: lessonData.description.trim(),
      orderIndex: existingLessons.length + 1,
    };

    onLessonAdd(newLesson);
    
    // Reset form and close dialog
    setLessonData({ title: "", description: "" });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLessonData({ title: "", description: "" });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lesson
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Add Lesson to "{moduleTitle}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Lesson Title */}
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title *</Label>
            <Input
              id="lesson-title"
              placeholder="e.g., EQ3 Overview and Controls"
              value={lessonData.title}
              onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              This will be Lesson {existingLessons.length + 1} in {moduleTitle}
            </p>
          </div>

          {/* Lesson Description */}
          <div className="space-y-2">
            <Label htmlFor="lesson-description">Lesson Description</Label>
            <Textarea
              id="lesson-description"
              placeholder="Describe what students will learn in this lesson..."
              value={lessonData.description}
              onChange={(e) => setLessonData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Provide a brief overview of the lesson content
            </p>
          </div>

          {/* Lesson Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Preview:</h4>
            <div className="text-sm">
              <div className="font-medium text-blue-700">
                Lesson {existingLessons.length + 1}: {lessonData.title || "Lesson Title"}
              </div>
              {lessonData.description && (
                <div className="text-blue-600 mt-1">
                  {lessonData.description}
                </div>
              )}
              <div className="text-xs text-blue-500 mt-2">
                In Module: {moduleTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center gap-3 justify-end pt-6 border-t border-border">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!lessonData.title.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Add Lesson
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
