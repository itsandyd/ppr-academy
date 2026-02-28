"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  X,
  Globe,
  Shield,
  CalendarOff,
  CalendarPlus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type {
  DayOfWeek,
  TimeWindow,
  WeekSchedule,
  DaySchedule,
  DateOverride,
} from "../types";

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
];

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

const BUFFER_OPTIONS = [
  { value: 0, label: "No buffer" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
];

const NOTICE_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 2, label: "2 hours" },
  { value: 4, label: "4 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "1 week" },
];

const ADVANCE_OPTIONS = [
  { value: 7, label: "1 week" },
  { value: 14, label: "2 weeks" },
  { value: 30, label: "1 month" },
  { value: 60, label: "2 months" },
  { value: 90, label: "3 months" },
];

const DEFAULT_WINDOWS: TimeWindow[] = [{ start: "09:00", end: "17:00" }];

function buildDefaultSchedule(): DaySchedule[] {
  return DAYS.map((day) => ({
    day: day.id,
    enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day.id),
    timeWindows: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day.id)
      ? [{ start: "09:00", end: "17:00" }]
      : [],
  }));
}

export function AvailabilityForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [showDateOverrides, setShowDateOverrides] = useState(false);
  const [newOverrideDate, setNewOverrideDate] = useState("");

  // Initialize schedule — migrate legacy timeSlots to timeWindows if needed
  const schedule: WeekSchedule = state.data.weekSchedule || {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    schedule: buildDefaultSchedule(),
  };

  // Migrate: if a day has timeSlots but no timeWindows, convert
  const migratedSchedule: WeekSchedule = {
    ...schedule,
    schedule: schedule.schedule.map((d) => {
      if (d.timeWindows && d.timeWindows.length > 0) return d;
      if (d.timeSlots && d.timeSlots.length > 0) {
        return {
          ...d,
          timeWindows: d.timeSlots.map((s) => ({ start: s.start, end: s.end })),
        };
      }
      return { ...d, timeWindows: d.timeWindows || [] };
    }),
  };

  const dateOverrides = state.data.dateOverrides || [];
  const sessionDurations = state.data.sessionDurations || [state.data.duration || 60];

  const currentDaySchedule = migratedSchedule.schedule.find(
    (d) => d.day === selectedDay
  ) || {
    day: selectedDay,
    enabled: false,
    timeWindows: [],
  };

  const handleBack = () => {
    router.push(
      `/dashboard/create/coaching?step=platform${state.coachingId ? `&coachingId=${state.coachingId}` : ""}`
    );
  };

  const handlePublish = async () => {
    await saveCoaching();
  };

  const updateSchedule = (newSchedule: WeekSchedule) => {
    updateData("availability", { weekSchedule: newSchedule });
  };

  const toggleDay = (day: DayOfWeek, enabled: boolean) => {
    const newSchedule = {
      ...migratedSchedule,
      schedule: migratedSchedule.schedule.map((d) =>
        d.day === day
          ? {
              ...d,
              enabled,
              timeWindows: enabled && d.timeWindows.length === 0 ? DEFAULT_WINDOWS : d.timeWindows,
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const addTimeWindow = (day: DayOfWeek) => {
    const daySchedule = migratedSchedule.schedule.find((d) => d.day === day);
    const lastWindow = daySchedule?.timeWindows[daySchedule.timeWindows.length - 1];
    const newStart = lastWindow ? lastWindow.end : "09:00";
    const startMinutes =
      parseInt(newStart.split(":")[0]) * 60 + parseInt(newStart.split(":")[1]);
    const endMinutes = Math.min(startMinutes + 120, 23 * 60 + 59);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const newEnd = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    const newSchedule = {
      ...migratedSchedule,
      schedule: migratedSchedule.schedule.map((d) =>
        d.day === day
          ? {
              ...d,
              timeWindows: [...d.timeWindows, { start: newStart, end: newEnd }],
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const removeTimeWindow = (day: DayOfWeek, index: number) => {
    const newSchedule = {
      ...migratedSchedule,
      schedule: migratedSchedule.schedule.map((d) =>
        d.day === day
          ? { ...d, timeWindows: d.timeWindows.filter((_, i) => i !== index) }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const updateTimeWindow = (
    day: DayOfWeek,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    const newSchedule = {
      ...migratedSchedule,
      schedule: migratedSchedule.schedule.map((d) =>
        d.day === day
          ? {
              ...d,
              timeWindows: d.timeWindows.map((w, i) =>
                i === index ? { ...w, [field]: value } : w
              ),
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  // Copy one day's schedule to all weekdays
  const copyToWeekdays = (sourceDay: DayOfWeek) => {
    const source = migratedSchedule.schedule.find((d) => d.day === sourceDay);
    if (!source) return;
    const weekdays: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const newSchedule = {
      ...migratedSchedule,
      schedule: migratedSchedule.schedule.map((d) =>
        weekdays.includes(d.day) && d.day !== sourceDay
          ? { ...d, enabled: source.enabled, timeWindows: [...source.timeWindows] }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  // Session durations
  const toggleDuration = (duration: number) => {
    const current = new Set(sessionDurations);
    if (current.has(duration)) {
      current.delete(duration);
    } else {
      current.add(duration);
    }
    const arr = Array.from(current).sort((a, b) => a - b);
    updateData("availability", {
      sessionDurations: arr.length > 0 ? arr : [60],
      duration: arr.length > 0 ? arr[0] : 60, // set primary duration to shortest
    });
  };

  // Date overrides
  const addDateOverride = (date: string, available: boolean) => {
    if (!date) return;
    const existing = dateOverrides.find((o) => o.date === date);
    if (existing) return; // no duplicates
    const newOverride: DateOverride = {
      date,
      available,
      timeWindows: available ? [{ start: "09:00", end: "17:00" }] : undefined,
      reason: available ? "Extra hours" : "Blocked",
    };
    updateData("availability", {
      dateOverrides: [...dateOverrides, newOverride].sort((a, b) => a.date.localeCompare(b.date)),
    });
    setNewOverrideDate("");
  };

  const removeOverride = (date: string) => {
    updateData("availability", {
      dateOverrides: dateOverrides.filter((o) => o.date !== date),
    });
  };

  const updateOverrideWindow = (
    date: string,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    updateData("availability", {
      dateOverrides: dateOverrides.map((o) =>
        o.date === date && o.timeWindows
          ? {
              ...o,
              timeWindows: o.timeWindows.map((w, i) =>
                i === index ? { ...w, [field]: value } : w
              ),
            }
          : o
      ),
    });
  };

  const addOverrideWindow = (date: string) => {
    updateData("availability", {
      dateOverrides: dateOverrides.map((o) =>
        o.date === date
          ? {
              ...o,
              timeWindows: [...(o.timeWindows || []), { start: "09:00", end: "17:00" }],
            }
          : o
      ),
    });
  };

  const canProceed = migratedSchedule.schedule.some(
    (d) => d.enabled && d.timeWindows.length > 0
  );

  const enabledDayCount = migratedSchedule.schedule.filter((d) => d.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set Your Availability</h2>
        <p className="text-muted-foreground mt-1">
          Configure when students can book sessions with you
        </p>
      </div>

      {/* Timezone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Your Timezone
          </CardTitle>
          <CardDescription>All times will be shown in this timezone</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={migratedSchedule.timezone}
            onValueChange={(value) =>
              updateSchedule({ ...migratedSchedule, timezone: value })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Current time:{" "}
            {new Date().toLocaleTimeString("en-US", {
              timeZone: migratedSchedule.timezone,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Session Durations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Durations
          </CardTitle>
          <CardDescription>
            Which session lengths do you offer? Buyers choose during booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = sessionDurations.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleDuration(opt.value)}
                  className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {sessionDurations.length === 0 && (
            <p className="text-sm text-destructive mt-2">Select at least one duration</p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Availability
          </CardTitle>
          <CardDescription>
            Set your recurring weekly schedule.{" "}
            {enabledDayCount > 0
              ? `${enabledDayCount} day${enabledDayCount !== 1 ? "s" : ""} active`
              : "No days active"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day Selector */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {DAYS.map((day) => {
              const daySchedule = migratedSchedule.schedule.find(
                (d) => d.day === day.id
              );
              const isEnabled = daySchedule?.enabled;
              const isSelected = selectedDay === day.id;
              const windowCount = daySchedule?.timeWindows.length || 0;

              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : isEnabled
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-xs font-semibold">{day.short}</div>
                  {isEnabled && (
                    <div className="text-[10px] text-green-600 dark:text-green-400 mt-1">
                      {windowCount} {windowCount === 1 ? "window" : "windows"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Configuration */}
          <Card className="bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {DAYS.find((d) => d.id === selectedDay)?.label}
                </CardTitle>
                <Switch
                  checked={currentDaySchedule.enabled}
                  onCheckedChange={(checked) => toggleDay(selectedDay, checked)}
                />
              </div>
              <CardDescription>
                {currentDaySchedule.enabled ? "Available" : "Not available"}
              </CardDescription>
            </CardHeader>

            {currentDaySchedule.enabled && (
              <CardContent className="space-y-4">
                {/* Time Windows */}
                {currentDaySchedule.timeWindows.map((window, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          From
                        </Label>
                        <Input
                          type="time"
                          value={window.start}
                          onChange={(e) =>
                            updateTimeWindow(
                              selectedDay,
                              index,
                              "start",
                              e.target.value
                            )
                          }
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">To</Label>
                        <Input
                          type="time"
                          value={window.end}
                          onChange={(e) =>
                            updateTimeWindow(
                              selectedDay,
                              index,
                              "end",
                              e.target.value
                            )
                          }
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeWindow(selectedDay, index)}
                      className="mt-5"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeWindow(selectedDay)}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Window
                  </Button>
                  {["monday", "tuesday", "wednesday", "thursday", "friday"].includes(
                    selectedDay
                  ) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToWeekdays(selectedDay)}
                      className="text-xs"
                    >
                      Copy to weekdays
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Booking Rules
          </CardTitle>
          <CardDescription>
            Control how and when students can book
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Buffer Between Sessions</Label>
              <Select
                value={String(state.data.bufferTime ?? 15)}
                onValueChange={(v) =>
                  updateData("availability", { bufferTime: parseInt(v) })
                }
              >
                <SelectTrigger className="bg-background mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {BUFFER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Break between back-to-back sessions
              </p>
            </div>

            <div>
              <Label>Max Bookings Per Day</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={state.data.maxBookingsPerDay || 3}
                onChange={(e) =>
                  updateData("availability", {
                    maxBookingsPerDay: parseInt(e.target.value) || 3,
                  })
                }
                className="bg-background mt-1.5"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Minimum Notice</Label>
              <Select
                value={String(state.data.minNoticeHours ?? 24)}
                onValueChange={(v) =>
                  updateData("availability", { minNoticeHours: parseInt(v) })
                }
              >
                <SelectTrigger className="bg-background mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {NOTICE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How much notice you need before a booking
              </p>
            </div>

            <div>
              <Label>Advance Booking Window</Label>
              <Select
                value={String(state.data.advanceBookingDays ?? 30)}
                onValueChange={(v) =>
                  updateData("availability", { advanceBookingDays: parseInt(v) })
                }
              >
                <SelectTrigger className="bg-background mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {ADVANCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How far out students can book
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5" />
                Date Overrides
              </CardTitle>
              <CardDescription>
                Block specific dates or add extra availability
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDateOverrides(!showDateOverrides)}
            >
              {showDateOverrides ? "Hide" : "Manage"}
            </Button>
          </div>
        </CardHeader>

        {showDateOverrides && (
          <CardContent className="space-y-4">
            {/* Add new override */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-sm">Date</Label>
                <Input
                  type="date"
                  value={newOverrideDate}
                  onChange={(e) => setNewOverrideDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-background mt-1"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDateOverride(newOverrideDate, false)}
                disabled={!newOverrideDate}
                className="mb-0.5"
              >
                <CalendarOff className="w-4 h-4 mr-1" />
                Block
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDateOverride(newOverrideDate, true)}
                disabled={!newOverrideDate}
                className="mb-0.5"
              >
                <CalendarPlus className="w-4 h-4 mr-1" />
                Open
              </Button>
            </div>

            {/* Existing overrides */}
            {dateOverrides.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No date overrides set. Use this to block vacation days or open
                extra availability.
              </p>
            ) : (
              <div className="space-y-3">
                {dateOverrides.map((override) => (
                  <Card
                    key={override.date}
                    className={`${
                      override.available
                        ? "border-green-200 dark:border-green-800"
                        : "border-red-200 dark:border-red-800"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={override.available ? "default" : "destructive"}
                            className={
                              override.available ? "bg-green-600" : ""
                            }
                          >
                            {override.available ? "Open" : "Blocked"}
                          </Badge>
                          <span className="font-medium text-sm">
                            {new Date(override.date + "T12:00:00").toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          {override.reason && (
                            <span className="text-xs text-muted-foreground">
                              ({override.reason})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeOverride(override.date)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Time windows for "open" overrides */}
                      {override.available && override.timeWindows && (
                        <div className="space-y-2 mt-2">
                          {override.timeWindows.map((w, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={w.start}
                                onChange={(e) =>
                                  updateOverrideWindow(
                                    override.date,
                                    idx,
                                    "start",
                                    e.target.value
                                  )
                                }
                                className="bg-background h-8 text-sm"
                              />
                              <span className="text-xs text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={w.end}
                                onChange={(e) =>
                                  updateOverrideWindow(
                                    override.date,
                                    idx,
                                    "end",
                                    e.target.value
                                  )
                                }
                                className="bg-background h-8 text-sm"
                              />
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => addOverrideWindow(override.date)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add window
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Summary */}
      {canProceed && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2">Availability Summary</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Days available:</span>
              <span className="font-medium text-foreground">
                {migratedSchedule.schedule
                  .filter((d) => d.enabled)
                  .map((d) => DAYS.find((day) => day.id === d.day)?.short)
                  .join(", ")}
              </span>
              <span>Session durations:</span>
              <span className="font-medium text-foreground">
                {sessionDurations.map((d) => `${d} min`).join(", ")}
              </span>
              <span>Buffer time:</span>
              <span className="font-medium text-foreground">
                {state.data.bufferTime ?? 15} min
              </span>
              <span>Min notice:</span>
              <span className="font-medium text-foreground">
                {NOTICE_OPTIONS.find(
                  (o) => o.value === (state.data.minNoticeHours ?? 24)
                )?.label || `${state.data.minNoticeHours}h`}
              </span>
              <span>Booking window:</span>
              <span className="font-medium text-foreground">
                {ADVANCE_OPTIONS.find(
                  (o) => o.value === (state.data.advanceBookingDays ?? 30)
                )?.label || `${state.data.advanceBookingDays} days`}
              </span>
              {dateOverrides.length > 0 && (
                <>
                  <span>Date overrides:</span>
                  <span className="font-medium text-foreground">
                    {dateOverrides.filter((o) => !o.available).length} blocked,{" "}
                    {dateOverrides.filter((o) => o.available).length} extra
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          &larr; Back
        </Button>
        <Button onClick={handlePublish} disabled={!canProceed}>
          {canProceed ? "Save & Ready to Publish" : "Set at least one time window"}
        </Button>
      </div>
    </div>
  );
}
