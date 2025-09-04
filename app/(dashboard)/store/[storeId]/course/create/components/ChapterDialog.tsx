"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Save, X, Video } from "lucide-react";

interface Chapter {
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  orderIndex: number;
}

interface ChapterDialogProps {
  moduleTitle: string;
  lessonTitle: string;
  onChapterAdd: (chapter: Chapter) => void;
  existingChapters: Chapter[];
  trigger?: React.ReactNode;
}

export function ChapterDialog({ 
  moduleTitle, 
  lessonTitle, 
  onChapterAdd, 
  existingChapters, 
  trigger 
}: ChapterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chapterData, setChapterData] = useState({
    title: "",
    content: "",
    videoUrl: "",
    duration: 0,
  });

  const handleSave = () => {
    if (!chapterData.title.trim()) {
      alert("Chapter title is required");
      return;
    }

    const newChapter = {
      title: chapterData.title.trim(),
      content: chapterData.content.trim(),
      videoUrl: chapterData.videoUrl.trim(),
      duration: chapterData.duration || 0,
      orderIndex: existingChapters.length + 1,
    };

    onChapterAdd(newChapter);
    
    // Reset form and close dialog
    setChapterData({ title: "", content: "", videoUrl: "", duration: 0 });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setChapterData({ title: "", content: "", videoUrl: "", duration: 0 });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Chapter
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Add Chapter to "{lessonTitle}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Chapter Title */}
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Chapter Title *</Label>
            <Input
              id="chapter-title"
              placeholder="e.g., Introduction to EQ3 Controls"
              value={chapterData.title}
              onChange={(e) => setChapterData(prev => ({ ...prev, title: e.target.value }))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              This will be Chapter {existingChapters.length + 1} in {lessonTitle}
            </p>
          </div>

          {/* Chapter Content */}
          <div className="space-y-2">
            <Label htmlFor="chapter-content">Chapter Content *</Label>
            <Textarea
              id="chapter-content"
              placeholder="Write your chapter content here. You can use HTML formatting if needed..."
              value={chapterData.content}
              onChange={(e) => setChapterData(prev => ({ ...prev, content: e.target.value }))}
              rows={12}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This is where you'll put your comprehensive content (like your EQ3 explanation)
            </p>
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="chapter-video">Video URL (Optional)</Label>
            <Input
              id="chapter-video"
              placeholder="https://youtube.com/watch?v=..."
              value={chapterData.videoUrl}
              onChange={(e) => setChapterData(prev => ({ ...prev, videoUrl: e.target.value }))}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add a video to accompany this chapter
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="chapter-duration">Estimated Duration (minutes)</Label>
            <Input
              id="chapter-duration"
              type="number"
              placeholder="15"
              value={chapterData.duration || ""}
              onChange={(e) => setChapterData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              className="h-12"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Estimated time for students to complete this chapter
            </p>
          </div>

          {/* Chapter Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-800 mb-2">Preview:</h4>
            <div className="text-sm space-y-2">
              <div className="font-medium text-purple-700">
                Chapter {existingChapters.length + 1}: {chapterData.title || "Chapter Title"}
              </div>
              {chapterData.content && (
                <div className="text-purple-600 bg-white p-3 rounded border max-h-32 overflow-y-auto">
                  {chapterData.content.slice(0, 200)}
                  {chapterData.content.length > 200 && "..."}
                </div>
              )}
              {chapterData.videoUrl && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Video className="w-4 h-4" />
                  <span>Video included</span>
                </div>
              )}
              {chapterData.duration > 0 && (
                <div className="text-xs text-purple-500">
                  Duration: {chapterData.duration} minutes
                </div>
              )}
              <div className="text-xs text-purple-500">
                In: {moduleTitle} → {lessonTitle}
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
            disabled={!chapterData.title.trim() || !chapterData.content.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
