"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  Bell,
  Settings2,
  GripVertical,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DripContentSettingsProps {
  courseId: string;
  className?: string;
}

interface ModuleDripSettings {
  moduleId: Id<"courseModules">;
  title: string;
  position: number;
  dripEnabled: boolean;
  dripType: "days_after_enrollment" | "specific_date" | "after_previous";
  dripDaysAfterEnrollment: number;
  dripSpecificDate?: number;
  dripNotifyStudents: boolean;
}

export function DripContentSettings({ courseId, className }: DripContentSettingsProps) {
  const dripSettings = useQuery(api.courseDrip.getCourseDripSettings, { courseId });
  const updateCourseDripSettings = useMutation(api.courseDrip.updateCourseDripSettings);

  const [localSettings, setLocalSettings] = useState<ModuleDripSettings[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [globalDripEnabled, setGlobalDripEnabled] = useState(false);

  useEffect(() => {
    if (dripSettings) {
      setLocalSettings(dripSettings as ModuleDripSettings[]);
      setGlobalDripEnabled(dripSettings.some((m: ModuleDripSettings) => m.dripEnabled));
    }
  }, [dripSettings]);

  const handleModuleSettingChange = (
    moduleId: Id<"courseModules">,
    field: keyof ModuleDripSettings,
    value: any
  ) => {
    setLocalSettings((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, [field]: value } : m))
    );
    setHasChanges(true);
  };

  const handleGlobalToggle = (enabled: boolean) => {
    setGlobalDripEnabled(enabled);
    setLocalSettings((prev) =>
      prev.map((m, index) => ({
        ...m,
        dripEnabled: enabled,
        // Set progressive days for each module when enabling
        dripDaysAfterEnrollment: enabled ? index * 7 : m.dripDaysAfterEnrollment,
      }))
    );
    setHasChanges(true);
  };

  const applyPreset = (preset: "weekly" | "biweekly" | "daily" | "custom") => {
    const daysMultiplier = preset === "weekly" ? 7 : preset === "biweekly" ? 14 : 1;

    setLocalSettings((prev) =>
      prev.map((m, index) => ({
        ...m,
        dripEnabled: true,
        dripType: "days_after_enrollment" as const,
        dripDaysAfterEnrollment: index * daysMultiplier,
      }))
    );
    setGlobalDripEnabled(true);
    setHasChanges(true);
    toast.success(`Applied ${preset} drip schedule`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCourseDripSettings({
        courseId,
        modules: localSettings.map((m) => ({
          moduleId: m.moduleId,
          dripEnabled: m.dripEnabled,
          dripType: m.dripType,
          dripDaysAfterEnrollment: m.dripDaysAfterEnrollment,
          dripSpecificDate: m.dripSpecificDate,
          dripNotifyStudents: m.dripNotifyStudents,
        })),
      });
      setHasChanges(false);
      toast.success("Drip settings saved successfully");
    } catch (error) {
      toast.error("Failed to save drip settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!dripSettings) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Drip Content Settings
            </CardTitle>
            <CardDescription>
              Control when students can access each section of your course
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="global-drip" className="text-sm">
              Enable Drip
            </Label>
            <Switch
              id="global-drip"
              checked={globalDripEnabled}
              onCheckedChange={handleGlobalToggle}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Presets */}
        {globalDripEnabled && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-3 text-sm font-medium">Quick Presets</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("daily")}
              >
                Daily Release
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("weekly")}
              >
                Weekly Release
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset("biweekly")}
              >
                Bi-Weekly Release
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">How Drip Content Works</p>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              Drip content releases course sections on a schedule. Students see
              locked sections until they&apos;re released, helping pace learning
              and reduce overwhelm.
            </p>
          </div>
        </div>

        <Separator />

        {/* Module List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Module Schedule</h4>
          <Accordion type="multiple" className="space-y-2">
            {localSettings.map((module, index) => (
              <AccordionItem
                key={module.moduleId}
                value={module.moduleId}
                className="rounded-lg border"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{module.title}</span>
                    {module.dripEnabled ? (
                      <Badge variant="outline" className="ml-2">
                        <Lock className="mr-1 h-3 w-3" />
                        {module.dripType === "days_after_enrollment" && (
                          <>Day {module.dripDaysAfterEnrollment}</>
                        )}
                        {module.dripType === "specific_date" &&
                          module.dripSpecificDate && (
                            <>{format(module.dripSpecificDate, "MMM d, yyyy")}</>
                          )}
                        {module.dripType === "after_previous" && (
                          <>After Previous</>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <Unlock className="mr-1 h-3 w-3" />
                        Available Now
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    {/* Enable/Disable Drip for this module */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Drip for this Section</Label>
                        <p className="text-xs text-muted-foreground">
                          Lock this section until the scheduled release
                        </p>
                      </div>
                      <Switch
                        checked={module.dripEnabled}
                        onCheckedChange={(checked) =>
                          handleModuleSettingChange(
                            module.moduleId,
                            "dripEnabled",
                            checked
                          )
                        }
                      />
                    </div>

                    {module.dripEnabled && (
                      <>
                        {/* Drip Type Selection */}
                        <div className="space-y-2">
                          <Label>Release Type</Label>
                          <Select
                            value={module.dripType}
                            onValueChange={(value) =>
                              handleModuleSettingChange(
                                module.moduleId,
                                "dripType",
                                value
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days_after_enrollment">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Days After Enrollment
                                </div>
                              </SelectItem>
                              <SelectItem value="specific_date">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Specific Date
                                </div>
                              </SelectItem>
                              <SelectItem value="after_previous">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  After Previous Section
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Days After Enrollment */}
                        {module.dripType === "days_after_enrollment" && (
                          <div className="space-y-2">
                            <Label>Days After Enrollment</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={module.dripDaysAfterEnrollment}
                                onChange={(e) =>
                                  handleModuleSettingChange(
                                    module.moduleId,
                                    "dripDaysAfterEnrollment",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">
                                days
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {module.dripDaysAfterEnrollment === 0
                                ? "Available immediately upon enrollment"
                                : `Unlocks ${module.dripDaysAfterEnrollment} day${module.dripDaysAfterEnrollment !== 1 ? "s" : ""} after student enrolls`}
                            </p>
                          </div>
                        )}

                        {/* Specific Date */}
                        {module.dripType === "specific_date" && (
                          <div className="space-y-2">
                            <Label>Release Date</Label>
                            <Input
                              type="date"
                              value={
                                module.dripSpecificDate
                                  ? format(module.dripSpecificDate, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) =>
                                handleModuleSettingChange(
                                  module.moduleId,
                                  "dripSpecificDate",
                                  e.target.value
                                    ? new Date(e.target.value).getTime()
                                    : undefined
                                )
                              }
                              className="w-48"
                            />
                            <p className="text-xs text-muted-foreground">
                              All students will get access on this date
                            </p>
                          </div>
                        )}

                        {/* After Previous */}
                        {module.dripType === "after_previous" && (
                          <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground">
                              {index === 0
                                ? "This is the first section - it will be available immediately."
                                : `This section will unlock when the student completes "${localSettings[index - 1]?.title || "the previous section"}".`}
                            </p>
                          </div>
                        )}

                        {/* Notification Setting */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label>Email Notification</Label>
                              <p className="text-xs text-muted-foreground">
                                Notify students when content unlocks
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={module.dripNotifyStudents}
                            onCheckedChange={(checked) =>
                              handleModuleSettingChange(
                                module.moduleId,
                                "dripNotifyStudents",
                                checked
                              )
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Save Drip Settings
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
