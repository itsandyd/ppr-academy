"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, X, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DayOfWeek, TimeSlot, WeekSchedule, DaySchedule } from "../types";

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
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export function AvailabilityForm() {
  const { state, updateData } = useCoachingCreation();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");

  // Initialize schedule if not exists
  const schedule = state.data.weekSchedule || {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    schedule: DAYS.map(day => ({
      day: day.id,
      enabled: false,
      timeSlots: [],
    })),
  };

  const currentDaySchedule = schedule.schedule.find(d => d.day === selectedDay) || {
    day: selectedDay,
    enabled: false,
    timeSlots: [],
  };

  const handleBack = () => {
    router.push(`/dashboard/create/coaching?step=discord${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const updateSchedule = (newSchedule: WeekSchedule) => {
    updateData("availability", { weekSchedule: newSchedule });
  };

  const toggleDay = (day: DayOfWeek, enabled: boolean) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(d => 
        d.day === day ? { ...d, enabled } : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const addTimeSlot = (day: DayOfWeek) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(d => 
        d.day === day 
          ? { 
              ...d, 
              timeSlots: [...d.timeSlots, { start: "09:00", end: "10:00", available: true }] 
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(d => 
        d.day === day 
          ? { ...d, timeSlots: d.timeSlots.filter((_, i) => i !== index) }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const updateTimeSlot = (day: DayOfWeek, index: number, field: 'start' | 'end', value: string) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map(d => 
        d.day === day 
          ? { 
              ...d, 
              timeSlots: d.timeSlots.map((slot, i) => 
                i === index ? { ...slot, [field]: value } : slot
              )
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const canProceed = schedule.schedule.some(d => d.enabled && d.timeSlots.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set Your Availability</h2>
        <p className="text-muted-foreground mt-1">
          Configure your weekly schedule and timezone
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
            value={schedule.timezone}
            onValueChange={(value) => updateSchedule({ ...schedule, timezone: value })}
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
            Current time: {new Date().toLocaleTimeString('en-US', { 
              timeZone: schedule.timezone,
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>Select days and add time slots</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day Selector */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {DAYS.map((day) => {
              const daySchedule = schedule.schedule.find(d => d.day === day.id);
              const isEnabled = daySchedule?.enabled;
              const isSelected = selectedDay === day.id;

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
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {daySchedule.timeSlots.length} slots
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
                  {DAYS.find(d => d.id === selectedDay)?.label}
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
                {/* Time Slots */}
                {currentDaySchedule.timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(selectedDay, index, 'start', e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(selectedDay, index, 'end', e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(selectedDay, index)}
                      className="mt-5"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Time Slot Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(selectedDay)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
              </CardContent>
            )}
          </Card>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Max Sessions Per Day</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={state.data.maxBookingsPerDay || 3}
                onChange={(e) => updateData("availability", { maxBookingsPerDay: parseInt(e.target.value) })}
                className="bg-background"
              />
            </div>
            <div>
              <Label>Buffer Time (minutes)</Label>
              <Input
                type="number"
                min="0"
                step="15"
                value={state.data.bufferTime || 15}
                onChange={(e) => updateData("availability", { bufferTime: parseInt(e.target.value) })}
                className="bg-background"
              />
            </div>
          </div>

          <div>
            <Label>Advance Booking Window (days)</Label>
            <Input
              type="number"
              min="1"
              max="90"
              value={state.data.advanceBookingDays || 30}
              onChange={(e) => updateData("availability", { advanceBookingDays: parseInt(e.target.value) })}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Students can book up to {state.data.advanceBookingDays || 30} days in advance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button disabled={!canProceed}>
          {canProceed ? "Ready to Publish" : "Set at least one time slot"}
        </Button>
      </div>
    </div>
  );
}

