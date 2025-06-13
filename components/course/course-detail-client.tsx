"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  Download, 
  FileText, 
  CheckCircle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  X,
  Volume2,
  Save
} from "lucide-react";
import { enrollInCourse, submitCourseReview, markChapterComplete, updateChapter } from "@/app/actions/course-actions";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  admin?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
}

interface CourseDetailClientProps {
  courseId: string;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  userProgress: number;
  user?: any;
  course?: any;
  showContent?: boolean;
}

export function CourseDetailClient({
  courseId,
  isAuthenticated,
  isEnrolled,
  userProgress,
  user,
  course,
  showContent = false
}: CourseDetailClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<{ [key: number]: boolean }>({});
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    isPublished: false,
    isFree: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<{ [key: string]: boolean }>({});

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to sign in
      window.location.href = "/sign-in";
      return;
    }

    setIsEnrolling(true);
    const result = await enrollInCourse(courseId);
    setIsEnrolling(false);

    if (result.success) {
      toast({
        title: "Enrolled Successfully!",
        description: "You can now access all course content.",
      });
      router.refresh();
    } else {
      toast({
        title: "Enrollment Failed",
        description: result.error || "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast({
        title: "Missing Comment",
        description: "Please add a comment to your review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReview(true);
    const result = await submitCourseReview(courseId, reviewRating, reviewComment);
    setIsSubmittingReview(false);

    if (result.success) {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setReviewComment("");
      router.refresh();
    } else {
      toast({
        title: "Review Failed",
        description: result.error || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleMarkComplete = async (chapterId: string) => {
    const result = await markChapterComplete(chapterId);

    if (result.success) {
      toast({
        title: "Chapter Completed!",
        description: "Great progress on your learning journey.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to mark chapter as complete",
        variant: "destructive",
      });
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setEditForm({
      title: chapter.title,
      description: chapter.description || "",
      videoUrl: chapter.videoUrl || "",
      isPublished: chapter.isPublished,
      isFree: chapter.isFree
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChapter = async () => {
    if (!selectedChapter) return;

    if (!editForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a chapter title.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await updateChapter(selectedChapter.id, {
      title: editForm.title,
      description: editForm.description,
      videoUrl: editForm.videoUrl,
      isPublished: editForm.isPublished,
      isFree: editForm.isFree
    });
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Chapter Updated",
        description: "Chapter has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      router.refresh();
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update chapter",
        variant: "destructive",
      });
    }
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedChapter(null);
    setEditForm({
      title: "",
      description: "",
      videoUrl: "",
      isPublished: false,
      isFree: false
    });
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleChapterContent = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-slate-300"
        } cursor-pointer`}
        onClick={() => setReviewRating(i + 1)}
      />
    ));
  };

  if (!showContent) {
    // Just show enrollment button
    return (
      <div className="space-y-4">
        {isAuthenticated ? (
          isEnrolled ? (
            <div className="space-y-4">
              <Button className="w-full" size="lg">
                <PlayCircle className="w-5 h-5 mr-2" />
                Continue Learning
              </Button>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{userProgress}%</span>
                </div>
                <Progress value={userProgress} />
              </div>
            </div>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? "Enrolling..." : "Enroll Now"}
            </Button>
          )
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => window.location.href = "/sign-in"}
          >
            Sign In to Enroll
          </Button>
        )}
      </div>
    );
  }

  // Show full course content
  return (
    <>
      <Tabs defaultValue="content" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Course Content */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              {course?.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module: any, moduleIndex: number) => (
                    <div key={module.id} className="border border-slate-200 rounded-lg">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {expandedModules[module.id] ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              Module {moduleIndex + 1}: {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-sm text-slate-600">{module.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {module.lessons?.[0]?.chapters?.length || 0} chapters
                        </div>
                      </button>
                      
                      {expandedModules[module.id] && module.lessons && (
                        <div className="border-t border-slate-200">
                          {module.lessons.map((lesson: any, lessonIndex: number) => (
                            <div key={lesson.id} className="p-4 border-b border-slate-100 last:border-b-0">
                              <h4 className="font-medium text-slate-900 mb-2">
                                {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-sm text-slate-600 mb-3">{lesson.description}</p>
                              )}
                              
                              {lesson.chapters && lesson.chapters.length > 0 && (
                                <div className="ml-4 space-y-3">
                                  {lesson.chapters.map((chapter: Chapter, chapterIndex: number) => (
                                    <div
                                      key={chapter.id}
                                      className="border border-slate-200 rounded-lg overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between p-3 bg-slate-50">
                                        <div className="flex items-center space-x-3">
                                          {chapter.videoUrl ? (
                                            <PlayCircle className="w-4 h-4 text-primary" />
                                          ) : (
                                            <FileText className="w-4 h-4 text-secondary" />
                                          )}
                                          <span className="text-sm font-medium">
                                            {chapterIndex + 1}. {chapter.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {user?.admin && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="text-xs"
                                              onClick={() => handleEditChapter(chapter)}
                                            >
                                              <Settings className="w-3 h-3 mr-1" />
                                              Edit
                                            </Button>
                                          )}
                                          {isEnrolled && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleMarkComplete(chapter.id)}
                                            >
                                              <CheckCircle className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      {chapter.description && (
                                        <div className="p-4 bg-white border-t border-slate-200">
                                          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {(() => {
                                              const isLongContent = chapter.description.length > 300;
                                              const isExpanded = expandedChapters[chapter.id];
                                              const shouldTruncate = isLongContent && !isExpanded;
                                              
                                              return (
                                                <>
                                                  {shouldTruncate 
                                                    ? `${chapter.description.substring(0, 300)}...` 
                                                    : chapter.description
                                                  }
                                                  {isLongContent && (
                                                    <button
                                                      onClick={() => toggleChapterContent(chapter.id)}
                                                      className="block mt-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                                    >
                                                      {isExpanded ? 'Show Less' : 'Show More'}
                                                    </button>
                                                  )}
                                                </>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">
                  Course content is being prepared. Check back soon!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-slate-700 leading-relaxed">
                {course?.description || "Course description coming soon..."}
              </p>
              
              <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">What You'll Learn</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Master industry-standard production techniques</li>
                <li>• Create professional-quality beats and compositions</li>
                <li>• Understand advanced music theory concepts</li>
                <li>• Develop your unique artistic style</li>
                <li>• Learn to mix and master your tracks</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Requirements</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Basic understanding of music production (recommended)</li>
                <li>• Access to a Digital Audio Workstation (DAW)</li>
                <li>• Enthusiasm to learn and practice</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-6">
          {/* Add Review (if enrolled) */}
          {isEnrolled && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {getRatingStars(reviewRating)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this course..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim() || isSubmittingReview}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reviews placeholder */}
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No reviews yet</h3>
              <p className="text-slate-500">Be the first to share your experience!</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Course Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No resources available</h3>
                <p className="text-slate-500">Course resources will be added soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Chapter Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>
              Update the chapter information and content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter chapter title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (Optional)</Label>
              <Input
                id="videoUrl"
                value={editForm.videoUrl}
                onChange={(e) => setEditForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Chapter Content</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter the chapter content, lesson text, and learning material..."
                rows={12}
                className="min-h-[300px]"
              />
              <p className="text-sm text-slate-500">
                This content will be displayed to students when they access this chapter.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={editForm.isPublished}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isPublished" className="text-sm">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={editForm.isFree}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isFree: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isFree" className="text-sm">Free Preview</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={closeEditDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChapter}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Volume2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 