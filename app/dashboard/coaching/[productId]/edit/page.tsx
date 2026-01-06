"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Settings, Plus, X, Globe, Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DaySchedule {
  day: DayOfWeek;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface WeekSchedule {
  timezone: string;
  schedule: DaySchedule[];
}

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

interface EditCoachingPageProps {
  params: Promise<{ productId: string }>;
}

export default function EditCoachingPage({ params }: EditCoachingPageProps) {
  const { productId } = use(params);
  const { user } = useUser();
  const router = useRouter();

  const product = useQuery(api.coachingProducts.getCoachingProductById, {
    productId: productId as Id<"digitalProducts">,
  });

  const updateProduct = useMutation(api.coachingProducts.updateCoachingProduct);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [isSaving, setIsSaving] = useState(false);
  const [localData, setLocalData] = useState<{
    title: string;
    description: string;
    price: number;
    duration: number;
    maxBookingsPerDay: number;
    bufferTime: number;
    advanceBookingDays: number;
    weekSchedule: WeekSchedule;
  } | null>(null);

  if (product === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Coaching product not found</p>
        <Button asChild>
          <Link href="/dashboard/coaching/sessions">Back to Sessions</Link>
        </Button>
      </div>
    );
  }

  if (user?.id !== product.userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">You don't have permission to edit this product</p>
        <Button asChild>
          <Link href="/dashboard/coaching/sessions">Back to Sessions</Link>
        </Button>
      </div>
    );
  }

  const data = localData || {
    title: product.title,
    description: product.description || "",
    price: product.price,
    duration: product.duration || 60,
    maxBookingsPerDay: product.availability?.maxBookingsPerDay || 3,
    bufferTime: product.availability?.bufferTime || 15,
    advanceBookingDays: product.availability?.advanceBookingDays || 30,
    weekSchedule: product.availability?.weekSchedule || {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      schedule: DAYS.map((day) => ({
        day: day.id,
        enabled: false,
        timeSlots: [],
      })),
    },
  };

  const updateLocalData = (updates: Partial<typeof data>) => {
    setLocalData({ ...data, ...updates });
  };

  const schedule = data.weekSchedule;
  const currentDaySchedule = schedule.schedule.find((d: DaySchedule) => d.day === selectedDay) || {
    day: selectedDay,
    enabled: false,
    timeSlots: [] as TimeSlot[],
  };

  const updateSchedule = (newSchedule: WeekSchedule) => {
    updateLocalData({ weekSchedule: newSchedule });
  };

  const toggleDay = (day: DayOfWeek, enabled: boolean) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map((d: DaySchedule) => (d.day === day ? { ...d, enabled } : d)),
    };
    updateSchedule(newSchedule);
  };

  const addTimeSlot = (day: DayOfWeek) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map((d: DaySchedule) =>
        d.day === day
          ? {
              ...d,
              timeSlots: [...d.timeSlots, { start: "09:00", end: "10:00", available: true }],
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map((d: DaySchedule) =>
        d.day === day
          ? { ...d, timeSlots: d.timeSlots.filter((_: TimeSlot, i: number) => i !== index) }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const updateTimeSlot = (day: DayOfWeek, index: number, field: "start" | "end", value: string) => {
    const newSchedule = {
      ...schedule,
      schedule: schedule.schedule.map((d: DaySchedule) =>
        d.day === day
          ? {
              ...d,
              timeSlots: d.timeSlots.map((slot: TimeSlot, i: number) =>
                i === index ? { ...slot, [field]: value } : slot
              ),
            }
          : d
      ),
    };
    updateSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProduct({
        productId: productId as Id<"digitalProducts">,
        title: data.title,
        description: data.description,
        price: data.price,
        duration: data.duration,
        availability: {
          weekSchedule: data.weekSchedule,
          maxBookingsPerDay: data.maxBookingsPerDay,
          bufferTime: data.bufferTime,
          advanceBookingDays: data.advanceBookingDays,
        },
      });

      if (result.success) {
        toast.success("Changes saved successfully");
        setLocalData(null);
      } else {
        toast.error(result.error || "Failed to save changes");
      }
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = localData !== null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/coaching/sessions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Coaching</h1>
              <p className="text-muted-foreground">{product.title}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="details">
              <Settings className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>
                  Select days and add time slots when you're available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-7 gap-2">
                  {DAYS.map((day) => {
                    const daySchedule = schedule.schedule.find(
                      (d: DaySchedule) => d.day === day.id
                    );
                    const isEnabled = daySchedule?.enabled;
                    const isSelected = selectedDay === day.id;

                    return (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={`rounded-lg border-2 p-3 text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : isEnabled
                              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                              : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-xs font-semibold">{day.short}</div>
                        {isEnabled && daySchedule && (
                          <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                            {daySchedule.timeSlots.length} slots
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

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
                      {currentDaySchedule.timeSlots.map((slot: TimeSlot, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="grid flex-1 grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Start</Label>
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) =>
                                  updateTimeSlot(selectedDay, index, "start", e.target.value)
                                }
                                className="bg-background"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">End</Label>
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) =>
                                  updateTimeSlot(selectedDay, index, "end", e.target.value)
                                }
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
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(selectedDay)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Time Slot
                      </Button>
                    </CardContent>
                  )}
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Max Sessions Per Day</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={data.maxBookingsPerDay}
                      onChange={(e) =>
                        updateLocalData({ maxBookingsPerDay: parseInt(e.target.value) || 3 })
                      }
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Buffer Time (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="15"
                      value={data.bufferTime}
                      onChange={(e) =>
                        updateLocalData({ bufferTime: parseInt(e.target.value) || 15 })
                      }
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
                    value={data.advanceBookingDays}
                    onChange={(e) =>
                      updateLocalData({ advanceBookingDays: parseInt(e.target.value) || 30 })
                    }
                    className="bg-background"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Students can book up to {data.advanceBookingDays} days in advance
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={data.title}
                    onChange={(e) => updateLocalData({ title: e.target.value })}
                    className="bg-background"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => updateLocalData({ description: e.target.value })}
                    rows={4}
                    className="bg-background"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={data.price}
                      onChange={(e) => updateLocalData({ price: parseFloat(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      step="15"
                      value={data.duration}
                      onChange={(e) =>
                        updateLocalData({ duration: parseInt(e.target.value) || 60 })
                      }
                      className="bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
