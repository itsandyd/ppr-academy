"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCcw,
  BookOpen,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  Settings,
} from "lucide-react";

interface CourseTiming {
  courseId: Id<"courses">;
  timingMode: "fixed" | "engagement";
  nurtureEmailCount: number;
  nurtureDelayDays: number;
  pitchEmailCount: number;
  pitchDelayDays: number;
  purchaseCheckDelayDays: number;
  engagementWaitDays?: number;
  minEngagementActions?: number;
}

interface CourseInfo {
  _id: Id<"courses">;
  title: string;
  imageUrl?: string;
  price?: number;
  moduleCount: number;
}

interface CourseCycleConfigProps {
  storeId: string;
  selectedConfigId?: Id<"courseCycleConfigs"> | null;
  onConfigSelect: (configId: Id<"courseCycleConfigs"> | null, configName?: string, courseCount?: number) => void;
  onClose?: () => void;
}

const defaultTiming: Omit<CourseTiming, "courseId"> = {
  timingMode: "fixed",
  nurtureEmailCount: 3,
  nurtureDelayDays: 2,
  pitchEmailCount: 2,
  pitchDelayDays: 1,
  purchaseCheckDelayDays: 3,
};

export default function CourseCycleConfig({
  storeId,
  selectedConfigId,
  onConfigSelect,
  onClose,
}: CourseCycleConfigProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Form state for creating/editing
  const [name, setName] = useState("New Course Cycle");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Id<"courses">[]>([]);
  const [courseTimings, setCourseTimings] = useState<CourseTiming[]>([]);
  const [loopOnCompletion, setLoopOnCompletion] = useState(true);
  const [differentContentOnSecondCycle, setDifferentContentOnSecondCycle] = useState(true);

  // Queries
  const configs = useQuery(api.courseCycles.listCourseCycleConfigs, { storeId });
  const availableCourses = useQuery(api.courseCycles.getAvailableCoursesForCycle, { storeId });
  const existingConfig = useQuery(
    api.courseCycles.getCourseCycleConfig,
    selectedConfigId ? { configId: selectedConfigId } : "skip"
  );

  // Mutations
  const createConfig = useMutation(api.courseCycles.createCourseCycleConfig);
  const updateConfig = useMutation(api.courseCycles.updateCourseCycleConfig);
  const deleteConfig = useMutation(api.courseCycles.deleteCourseCycleConfig);
  const generateEmails = useAction(api.courseCycleAI.generateAllCycleEmails);

  const handleAddCourse = (courseId: Id<"courses">) => {
    if (selectedCourseIds.includes(courseId)) return;

    setSelectedCourseIds([...selectedCourseIds, courseId]);
    setCourseTimings([
      ...courseTimings,
      { ...defaultTiming, courseId },
    ]);
  };

  const handleRemoveCourse = (courseId: Id<"courses">) => {
    setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    setCourseTimings(courseTimings.filter((t) => t.courseId !== courseId));
  };

  const handleMoveCourse = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedCourseIds.length) return;

    const newCourseIds = [...selectedCourseIds];
    [newCourseIds[index], newCourseIds[newIndex]] = [newCourseIds[newIndex], newCourseIds[index]];
    setSelectedCourseIds(newCourseIds);

    const newTimings = [...courseTimings];
    [newTimings[index], newTimings[newIndex]] = [newTimings[newIndex], newTimings[index]];
    setCourseTimings(newTimings);
  };

  const handleUpdateTiming = (courseId: Id<"courses">, updates: Partial<CourseTiming>) => {
    setCourseTimings(
      courseTimings.map((t) =>
        t.courseId === courseId ? { ...t, ...updates } : t
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }
    if (selectedCourseIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one course", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      if (selectedConfigId) {
        await updateConfig({
          configId: selectedConfigId,
          name,
          courseIds: selectedCourseIds,
          courseTimings,
          loopOnCompletion,
          differentContentOnSecondCycle,
        });
        toast({ title: "Updated", description: "Course cycle configuration updated" });
      } else {
        const configId = await createConfig({
          storeId,
          name,
          courseIds: selectedCourseIds,
          courseTimings,
          loopOnCompletion,
          differentContentOnSecondCycle,
        });
        onConfigSelect(configId, name, selectedCourseIds.length);
        toast({ title: "Created", description: "Course cycle configuration created" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateEmails = async (configId: Id<"courseCycleConfigs">) => {
    setIsGenerating(true);
    try {
      const result = await generateEmails({
        courseCycleConfigId: configId,
        generateSecondCycle: differentContentOnSecondCycle,
      });
      toast({
        title: "Emails Generated",
        description: `Generated ${result.emailsGenerated} emails for ${result.coursesProcessed} courses`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate emails. Please check your OpenAI API key.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (configId: Id<"courseCycleConfigs">) => {
    try {
      await deleteConfig({ configId });
      if (selectedConfigId === configId) {
        onConfigSelect(null);
      }
      toast({ title: "Deleted", description: "Course cycle configuration deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete configuration", variant: "destructive" });
    }
  };

  const getCourseById = (courseId: Id<"courses">): CourseInfo | undefined => {
    return availableCourses?.find((c) => c._id === courseId);
  };

  return (
    <div className="space-y-6">
      {/* Existing Configurations */}
      {configs && configs.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Existing Configuration</Label>
          <div className="space-y-2">
            {configs.map((config) => (
              <div
                key={config._id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
                  selectedConfigId === config._id
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                    : "border-zinc-200 hover:border-violet-300 dark:border-zinc-800"
                }`}
                onClick={() => onConfigSelect(config._id, config.name, config.courseCount)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <RotateCcw className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{config.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {config.courseCount} courses &middot; {config.generatedEmailCount} emails generated
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {config.generatedEmailCount === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateEmails(config._id);
                      }}
                      disabled={isGenerating}
                      className="gap-1"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Generate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(config._id);
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {configs && configs.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              or create new
            </span>
          </div>
        </div>
      )}

      {/* Create New Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Configuration Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Main Course Nurture Cycle"
          />
        </div>

        {/* Course Selection */}
        <div className="space-y-2">
          <Label>Add Courses to Cycle</Label>
          <Select onValueChange={(v) => handleAddCourse(v as Id<"courses">)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course to add..." />
            </SelectTrigger>
            <SelectContent>
              {availableCourses
                ?.filter((c) => !selectedCourseIds.includes(c._id))
                .map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-zinc-400" />
                      <span>{course.title}</span>
                      <span className="text-xs text-zinc-500">
                        ({course.moduleCount} modules)
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Courses List */}
        {selectedCourseIds.length > 0 && (
          <div className="space-y-2">
            <Label>Course Order (drag to reorder)</Label>
            <div className="space-y-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
              {selectedCourseIds.map((courseId, index) => {
                const course = getCourseById(courseId);
                const timing = courseTimings.find((t) => t.courseId === courseId);
                const isExpanded = expandedCourse === courseId;

                return (
                  <div
                    key={courseId}
                    className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {/* Course Header */}
                    <div className="flex items-center gap-2 p-3">
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveCourse(index, "up")}
                          disabled={index === 0}
                          className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCourse(index, "down")}
                          disabled={index === selectedCourseIds.length - 1}
                          className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{course?.title || "Unknown Course"}</p>
                        {timing && (
                          <p className="text-xs text-zinc-500">
                            {timing.nurtureEmailCount} nurture + {timing.pitchEmailCount} pitch emails
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCourse(isExpanded ? null : courseId)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCourse(courseId)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Expanded Timing Settings */}
                    {isExpanded && timing && (
                      <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Timing Mode</Label>
                            <Select
                              value={timing.timingMode}
                              onValueChange={(v) =>
                                handleUpdateTiming(courseId, { timingMode: v as "fixed" | "engagement" })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed Schedule</SelectItem>
                                <SelectItem value="engagement">Engagement-Based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Nurture Emails
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={timing.nurtureEmailCount}
                              onChange={(e) =>
                                handleUpdateTiming(courseId, {
                                  nurtureEmailCount: parseInt(e.target.value) || 3,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Nurture Delay (days)
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={14}
                              value={timing.nurtureDelayDays}
                              onChange={(e) =>
                                handleUpdateTiming(courseId, {
                                  nurtureDelayDays: parseInt(e.target.value) || 2,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Pitch Emails
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={timing.pitchEmailCount}
                              onChange={(e) =>
                                handleUpdateTiming(courseId, {
                                  pitchEmailCount: parseInt(e.target.value) || 2,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pitch Delay (days)
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={7}
                              value={timing.pitchDelayDays}
                              onChange={(e) =>
                                handleUpdateTiming(courseId, {
                                  pitchDelayDays: parseInt(e.target.value) || 1,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Purchase Check Delay (days)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={14}
                              value={timing.purchaseCheckDelayDays}
                              onChange={(e) =>
                                handleUpdateTiming(courseId, {
                                  purchaseCheckDelayDays: parseInt(e.target.value) || 3,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          {timing.timingMode === "engagement" && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs">Max Wait (days)</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={timing.engagementWaitDays || 7}
                                  onChange={(e) =>
                                    handleUpdateTiming(courseId, {
                                      engagementWaitDays: parseInt(e.target.value) || 7,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Min Actions Required</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={timing.minEngagementActions || 1}
                                  onChange={(e) =>
                                    handleUpdateTiming(courseId, {
                                      minEngagementActions: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loop Settings */}
        <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <Label>Loop on Completion</Label>
              <p className="text-xs text-zinc-500">
                Restart from course 1 after completing all courses
              </p>
            </div>
            <Switch checked={loopOnCompletion} onCheckedChange={setLoopOnCompletion} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Different Content on 2nd Cycle</Label>
              <p className="text-xs text-zinc-500">
                Generate alternate emails for repeat cycles
              </p>
            </div>
            <Switch
              checked={differentContentOnSecondCycle}
              onCheckedChange={setDifferentContentOnSecondCycle}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isCreating} className="w-full gap-2">
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {selectedConfigId ? "Update Configuration" : "Create Configuration"}
        </Button>
      </div>
    </div>
  );
}
