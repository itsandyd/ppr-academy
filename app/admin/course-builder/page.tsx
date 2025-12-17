"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Shield,
  Loader2,
  Plus,
  Play,
  Pause,
  Trash2,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Clock,
  Store,
  Wand2,
  Copy,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface QueueItem {
  _id: Id<"aiCourseQueue">;
  userId: string;
  storeId: string;
  prompt: string;
  topic?: string;
  skillLevel?: string;
  targetModules?: number;
  targetLessonsPerModule?: number;
  status: string;
  progress?: {
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    currentChapter?: string;
  };
  outlineId?: Id<"aiCourseOutlines">;
  courseId?: Id<"courses">;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface CourseOutline {
  _id: Id<"aiCourseOutlines">;
  title: string;
  description: string;
  topic: string;
  skillLevel: string;
  totalChapters: number;
  expandedChapters: number;
  outline: {
    course: {
      title: string;
      description: string;
      category: string;
      skillLevel: string;
      estimatedDuration: number;
    };
    modules: Array<{
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
          duration: number;
          orderIndex: number;
          hasDetailedContent?: boolean;
          wordCount?: number;
        }>;
      }>;
    }>;
  };
  chapterStatus?: Array<{
    moduleIndex: number;
    lessonIndex: number;
    chapterIndex: number;
    title: string;
    hasDetailedContent: boolean;
    wordCount?: number;
  }>;
  createdAt: number;
}

interface StoreInfo {
  _id: Id<"stores">;
  name: string;
  slug: string;
  userId: string;
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    queued: { label: "Queued", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    generating_outline: { label: "Generating", variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    outline_ready: { label: "Outline Ready", variant: "outline", icon: <FileText className="w-3 h-3" /> },
    expanding_content: { label: "Expanding", variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    ready_to_create: { label: "Ready", variant: "outline", icon: <Check className="w-3 h-3" /> },
    creating_course: { label: "Creating", variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { label: "Completed", variant: "default", icon: <Check className="w-3 h-3" /> },
    failed: { label: "Failed", variant: "destructive", icon: <X className="w-3 h-3" /> },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" as const, icon: null };

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// =============================================================================
// QUEUE ITEM CARD COMPONENT
// =============================================================================

function QueueItemCard({
  item,
  stores,
  onGenerateOutline,
  onExpandContent,
  onCreateCourse,
  onDelete,
  onViewOutline,
  isProcessing,
}: {
  item: QueueItem;
  stores: StoreInfo[];
  onGenerateOutline: (queueId: Id<"aiCourseQueue">) => void;
  onExpandContent: (queueId: Id<"aiCourseQueue">, outlineId: Id<"aiCourseOutlines">) => void;
  onCreateCourse: (queueId: Id<"aiCourseQueue">, outlineId: Id<"aiCourseOutlines">) => void;
  onDelete: (queueId: Id<"aiCourseQueue">) => void;
  onViewOutline: (outlineId: Id<"aiCourseOutlines">) => void;
  isProcessing: boolean;
}) {
  const store = stores.find(s => s._id === item.storeId);

  return (
    <Card className="relative overflow-hidden">
      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 animate-pulse" />
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Prompt/Topic */}
            <p className="font-medium text-sm line-clamp-2 mb-2">
              {item.topic || item.prompt}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span>{store?.name || "Unknown Store"}</span>
              </div>
              <span>•</span>
              <span className="capitalize">{item.skillLevel || "intermediate"}</span>
              <span>•</span>
              <span>{item.targetModules || 4} modules</span>
            </div>

            {/* Progress */}
            {item.progress && (
              <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span>{item.progress.currentStep}</span>
                  <span>{item.progress.completedSteps}/{item.progress.totalSteps}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(item.progress.completedSteps / item.progress.totalSteps) * 100}%` }}
                  />
                </div>
                {item.progress.currentChapter && (
                  <p className="mt-1 text-muted-foreground truncate">
                    {item.progress.currentChapter}
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {item.error && (
              <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{item.error}</span>
              </div>
            )}
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={item.status} />

            <div className="flex items-center gap-1">
              {/* Generate Outline */}
              {item.status === "queued" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateOutline(item._id)}
                  disabled={isProcessing}
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Generate
                </Button>
              )}

              {/* View Outline */}
              {item.outlineId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewOutline(item.outlineId!)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}

              {/* Expand Content */}
              {item.status === "outline_ready" && item.outlineId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onExpandContent(item._id, item.outlineId!)}
                  disabled={isProcessing}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Expand
                </Button>
              )}

              {/* Create Course */}
              {(item.status === "outline_ready" || item.status === "ready_to_create") && item.outlineId && (
                <Button
                  size="sm"
                  onClick={() => onCreateCourse(item._id, item.outlineId!)}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Create
                </Button>
              )}

              {/* View Course */}
              {item.status === "completed" && item.courseId && (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a href={`/courses/${item.courseId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Course
                  </a>
                </Button>
              )}

              {/* Delete */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(item._id)}
                disabled={isProcessing}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// OUTLINE VIEWER COMPONENT
// =============================================================================

function OutlineViewer({
  outline,
  onExpandChapter,
  onClose,
  onExport,
  isExpanding,
}: {
  outline: CourseOutline | null;
  onExpandChapter: (moduleIndex: number, lessonIndex: number, chapterIndex: number) => void;
  onClose: () => void;
  onExport: () => void;
  isExpanding: boolean;
}) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  if (!outline) return null;

  const toggleModule = (index: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleLesson = (moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{outline.outline.course.title}</CardTitle>
              <CardDescription className="mt-1">
                {outline.totalChapters} chapters • {outline.expandedChapters} expanded
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Course Info */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">{outline.outline.course.description}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <Badge variant="outline">{outline.outline.course.skillLevel}</Badge>
                <span>~{outline.outline.course.estimatedDuration} min</span>
              </div>
            </div>

            {/* Modules */}
            {outline.outline.modules.map((module, mi) => (
              <Collapsible
                key={mi}
                open={expandedModules.has(mi)}
                onOpenChange={() => toggleModule(mi)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card border cursor-pointer hover:bg-muted/50 transition-colors">
                    {expandedModules.has(mi) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-medium">Module {mi + 1}: {module.title}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {module.lessons.length} lessons
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="pl-6 mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground px-3">{module.description}</p>

                  {/* Lessons */}
                  {module.lessons.map((lesson, li) => {
                    const lessonKey = `${mi}-${li}`;
                    return (
                      <Collapsible
                        key={li}
                        open={expandedLessons.has(lessonKey)}
                        onOpenChange={() => toggleLesson(mi, li)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-2 p-2 rounded bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                            {expandedLessons.has(lessonKey) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <BookOpen className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">Lesson {li + 1}: {lesson.title}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {lesson.chapters.length} chapters
                            </Badge>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="pl-6 mt-1 space-y-1">
                          {/* Chapters */}
                          {lesson.chapters.map((chapter, ci) => {
                            const chapterStatus = outline.chapterStatus?.find(
                              s => s.moduleIndex === mi && s.lessonIndex === li && s.chapterIndex === ci
                            );
                            const hasContent = chapterStatus?.hasDetailedContent || (chapter.wordCount && chapter.wordCount > 500);

                            return (
                              <div
                                key={ci}
                                className="flex items-start gap-2 p-2 rounded bg-background border text-xs"
                              >
                                <FileText className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{chapter.title}</span>
                                    {hasContent ? (
                                      <Badge variant="default" className="text-[10px] px-1.5">
                                        <Check className="w-2 h-2 mr-0.5" />
                                        {chapter.wordCount || chapterStatus?.wordCount} words
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-[10px] px-1.5">
                                        Outline only
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground mt-0.5 line-clamp-2">
                                    {chapter.content?.substring(0, 150)}...
                                  </p>
                                </div>
                                {!hasContent && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onExpandChapter(mi, li, ci);
                                    }}
                                    disabled={isExpanding}
                                  >
                                    {isExpanding ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Expand
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function AdminCourseBuilderPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // State
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [newPrompts, setNewPrompts] = useState("");
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [targetModules, setTargetModules] = useState(4);
  const [targetLessonsPerModule, setTargetLessonsPerModule] = useState(3);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [viewingOutlineId, setViewingOutlineId] = useState<Id<"aiCourseOutlines"> | null>(null);
  const [isExpandingChapter, setIsExpandingChapter] = useState(false);

  // Queries
  const adminCheck = useQuery(
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const stores = useQuery(api.stores.getAllStores) as StoreInfo[] | undefined;

  const queueItems = useQuery(
    api.aiCourseBuilderQueries.getQueueItems,
    user?.id && adminCheck?.isAdmin ? { userId: user.id } : "skip"
  ) as QueueItem[] | undefined;

  const viewingOutline = useQuery(
    api.aiCourseBuilderQueries.getOutline,
    viewingOutlineId ? { outlineId: viewingOutlineId } : "skip"
  ) as CourseOutline | null | undefined;

  // Mutations & Actions
  const addBatchToQueue = useMutation(api.aiCourseBuilderQueries.addBatchToQueue);
  const deleteQueueItem = useMutation(api.aiCourseBuilderQueries.deleteQueueItem);
  const generateOutline = useAction(api.aiCourseBuilder.generateOutline);
  const expandAllChapters = useAction(api.aiCourseBuilder.expandAllChapters);
  const expandChapterContent = useAction(api.aiCourseBuilder.expandChapterContent);
  const createCourseFromOutline = useAction(api.aiCourseBuilder.createCourseFromOutline);
  const exportOutlineAsJson = useQuery(
    api.aiCourseBuilderQueries.exportOutlineAsJson,
    viewingOutlineId ? { outlineId: viewingOutlineId } : "skip"
  );

  // Set default store when stores load
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0]._id);
    }
  }, [stores, selectedStoreId]);

  // Auth check
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in?redirect_url=/admin/course-builder");
    } else if (adminCheck !== undefined && !adminCheck.isAdmin) {
      router.push("/");
    }
  }, [isLoaded, user, adminCheck, router]);

  // Loading state
  if (!isLoaded || adminCheck === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="font-medium">Verifying admin access</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!adminCheck.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handlers
  const handleAddToQueue = async () => {
    if (!newPrompts.trim() || !selectedStoreId) {
      toast.error("Please enter prompts and select a store");
      return;
    }

    setIsAddingToQueue(true);

    try {
      // Parse prompts (one per line)
      const prompts = newPrompts
        .split("\n")
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(prompt => ({
          prompt,
          skillLevel,
          targetModules,
          targetLessonsPerModule,
        }));

      if (prompts.length === 0) {
        toast.error("No valid prompts found");
        return;
      }

      const queueIds = await addBatchToQueue({
        userId: user!.id,
        storeId: selectedStoreId,
        prompts,
      });

      toast.success(`Added ${queueIds.length} course(s) to the queue`);
      setNewPrompts("");
    } catch (error) {
      toast.error("Failed to add to queue");
      console.error(error);
    } finally {
      setIsAddingToQueue(false);
    }
  };

  const handleGenerateOutline = async (queueId: Id<"aiCourseQueue">) => {
    setProcessingIds(prev => new Set(prev).add(queueId));

    try {
      const result = await generateOutline({ queueId });
      if (result.success) {
        toast.success("Outline generated successfully");
      } else {
        toast.error(result.error || "Failed to generate outline");
      }
    } catch (error) {
      toast.error("Failed to generate outline");
      console.error(error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(queueId);
        return next;
      });
    }
  };

  const handleExpandContent = async (queueId: Id<"aiCourseQueue">, outlineId: Id<"aiCourseOutlines">) => {
    setProcessingIds(prev => new Set(prev).add(queueId));

    try {
      const result = await expandAllChapters({ outlineId, queueId });
      if (result.success) {
        toast.success(`Expanded ${result.expandedCount} chapters`);
      } else {
        toast.error(`Expanded ${result.expandedCount} chapters, ${result.failedCount} failed`);
      }
    } catch (error) {
      toast.error("Failed to expand content");
      console.error(error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(queueId);
        return next;
      });
    }
  };

  const handleExpandSingleChapter = async (moduleIndex: number, lessonIndex: number, chapterIndex: number) => {
    if (!viewingOutlineId) return;

    setIsExpandingChapter(true);

    try {
      const result = await expandChapterContent({
        outlineId: viewingOutlineId,
        moduleIndex,
        lessonIndex,
        chapterIndex,
      });

      if (result.success) {
        toast.success(`Chapter expanded (${result.wordCount} words)`);
      } else {
        toast.error(result.error || "Failed to expand chapter");
      }
    } catch (error) {
      toast.error("Failed to expand chapter");
      console.error(error);
    } finally {
      setIsExpandingChapter(false);
    }
  };

  const handleCreateCourse = async (queueId: Id<"aiCourseQueue">, outlineId: Id<"aiCourseOutlines">) => {
    setProcessingIds(prev => new Set(prev).add(queueId));

    try {
      const result = await createCourseFromOutline({
        outlineId,
        queueId,
        price: 0, // Free by default
        publish: false,
      });

      if (result.success) {
        toast.success("Course created successfully!", {
          action: result.slug ? {
            label: "View Course",
            onClick: () => window.open(`/courses/${result.courseId}`, "_blank"),
          } : undefined,
        });
      } else {
        toast.error(result.error || "Failed to create course");
      }
    } catch (error) {
      toast.error("Failed to create course");
      console.error(error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(queueId);
        return next;
      });
    }
  };

  const handleDelete = async (queueId: Id<"aiCourseQueue">) => {
    try {
      await deleteQueueItem({ queueId, userId: user!.id });
      toast.success("Removed from queue");
    } catch (error) {
      toast.error("Failed to delete");
      console.error(error);
    }
  };

  const handleExportJson = () => {
    if (!exportOutlineAsJson) return;

    const blob = new Blob([JSON.stringify(exportOutlineAsJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `course-outline-${viewingOutlineId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Outline exported");
  };

  // Stats
  const stats = {
    queued: queueItems?.filter(i => i.status === "queued").length || 0,
    processing: queueItems?.filter(i => ["generating_outline", "expanding_content", "creating_course"].includes(i.status)).length || 0,
    ready: queueItems?.filter(i => ["outline_ready", "ready_to_create"].includes(i.status)).length || 0,
    completed: queueItems?.filter(i => i.status === "completed").length || 0,
    failed: queueItems?.filter(i => i.status === "failed").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            AI Course Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Batch create courses with AI-generated outlines and content
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 rounded-lg bg-muted">
            <div className="text-2xl font-bold">{stats.queued}</div>
            <div className="text-xs text-muted-foreground">Queued</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600">
            <div className="text-2xl font-bold">{stats.processing}</div>
            <div className="text-xs">Processing</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-amber-500/10 text-amber-600">
            <div className="text-2xl font-bold">{stats.ready}</div>
            <div className="text-xs">Ready</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-green-500/10 text-green-600">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs">Completed</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="add">Add Courses</TabsTrigger>
        </TabsList>

        {/* Add Courses Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Courses to Queue</CardTitle>
              <CardDescription>
                Enter one prompt per line. Each prompt will generate a separate course outline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Store Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Store</Label>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {stores?.map(store => (
                        <SelectItem key={store._id} value={store._id}>
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            <span>{store.name}</span>
                            <span className="text-muted-foreground">(@{store.slug})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select value={skillLevel} onValueChange={(v: any) => setSkillLevel(v)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modules per Course</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={targetModules}
                    onChange={(e) => setTargetModules(parseInt(e.target.value) || 4)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lessons per Module</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={targetLessonsPerModule}
                    onChange={(e) => setTargetLessonsPerModule(parseInt(e.target.value) || 3)}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Prompts Textarea */}
              <div className="space-y-2">
                <Label>Course Prompts (one per line)</Label>
                <Textarea
                  placeholder={`Create me a course on how to make a tour style track in Ableton Live 12
Create me a course on how to use Serum for bass design
Create me a course on mixing and mastering EDM
Create me a course on music theory for producers`}
                  value={newPrompts}
                  onChange={(e) => setNewPrompts(e.target.value)}
                  className="min-h-[200px] bg-background font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {newPrompts.split("\n").filter(p => p.trim()).length} course(s) will be added
                </p>
              </div>

              <Button
                onClick={handleAddToQueue}
                disabled={isAddingToQueue || !newPrompts.trim() || !selectedStoreId}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isAddingToQueue ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding to Queue...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Queue
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          {queueItems && queueItems.length > 0 ? (
            <div className="space-y-3">
              {queueItems.map(item => (
                <QueueItemCard
                  key={item._id}
                  item={item}
                  stores={stores || []}
                  onGenerateOutline={handleGenerateOutline}
                  onExpandContent={handleExpandContent}
                  onCreateCourse={handleCreateCourse}
                  onDelete={handleDelete}
                  onViewOutline={setViewingOutlineId}
                  isProcessing={processingIds.has(item._id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No courses in queue</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add some course prompts to get started
                </p>
                <Button variant="outline" onClick={() => {
                  const tab = document.querySelector('[data-state="inactive"][value="add"]') as HTMLElement;
                  tab?.click();
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Courses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Outline Viewer Modal */}
      {viewingOutlineId && viewingOutline && (
        <OutlineViewer
          outline={viewingOutline}
          onExpandChapter={handleExpandSingleChapter}
          onClose={() => setViewingOutlineId(null)}
          onExport={handleExportJson}
          isExpanding={isExpandingChapter}
        />
      )}
    </div>
  );
}

