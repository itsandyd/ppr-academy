"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  MoreVertical,
  Play,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ViralityBadge } from "../script-library/ViralityBadge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface CalendarWeekViewProps {
  accountProfileId: Id<"socialAccountProfiles">;
  storeId: string;
  userId: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function CalendarWeekView({
  accountProfileId,
  storeId,
  userId,
}: CalendarWeekViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Get current week start (Monday)
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    return monday.getTime();
  });

  // Get calendar entries for this week
  const entries = useQuery(api.scriptCalendar.getCalendarEntriesForWeek, {
    accountProfileId,
    weekStartDate: weekStart,
  });

  // Mutations
  const removeFromCalendar = useMutation(api.scriptCalendar.removeFromCalendar);
  const updateEntryStatus = useMutation(api.scriptCalendar.updateEntryStatus);

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setUTCDate(date.getUTCDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekStart]);

  const goToPreviousWeek = () => {
    setWeekStart((prev) => prev - 7 * 24 * 60 * 60 * 1000);
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => prev + 7 * 24 * 60 * 60 * 1000);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    setWeekStart(monday.getTime());
  };

  const handleUseScript = (scriptId: Id<"generatedScripts">) => {
    router.push(
      `/dashboard/social/create?fromScript=${scriptId}&step=combine&mode=create`
    );
  };

  const handleRemove = async (entryId: Id<"scriptCalendarEntries">) => {
    try {
      await removeFromCalendar({ entryId });
      toast({
        title: "Removed from calendar",
        description: "The script has been unscheduled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from calendar",
        variant: "destructive",
      });
    }
  };

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleString("default", { month: "short" });
    const endMonth = end.toLocaleString("default", { month: "short" });
    const year = start.getUTCFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getUTCDate()} - ${end.getUTCDate()}, ${year}`;
    }
    return `${startMonth} ${start.getUTCDate()} - ${endMonth} ${end.getUTCDate()}, ${year}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getUTCDate() === today.getUTCDate() &&
      date.getUTCMonth() === today.getUTCMonth() &&
      date.getUTCFullYear() === today.getUTCFullYear()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "published":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "skipped":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (entries === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            <div className="h-9 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{formatDateRange()}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dayOfWeek = date.getUTCDay();
          const dayEntries = entries[dayOfWeek] || [];

          return (
            <Card
              key={index}
              className={`min-h-[200px] ${
                isToday(date)
                  ? "border-primary border-2"
                  : ""
              }`}
            >
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>
                    {DAYS[dayOfWeek]}{" "}
                    <span className="text-muted-foreground">
                      {date.getUTCDate()}
                    </span>
                  </span>
                  {isToday(date) && (
                    <Badge variant="default" className="text-xs">
                      Today
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {dayEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      No scripts scheduled
                    </p>
                  </div>
                ) : (
                  dayEntries.map((entry: any) => (
                    <div
                      key={entry._id}
                      className="p-2 bg-muted/50 rounded-lg space-y-1"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1">
                          {entry.script && (
                            <ViralityBadge
                              score={entry.script.viralityScore}
                              size="sm"
                            />
                          )}
                          <span className="text-xs font-medium truncate max-w-[80px]">
                            {entry.script?.chapterTitle || "Script"}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleUseScript(entry.generatedScriptId)
                              }
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Use Script
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(entry._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getStatusColor(entry.status)}`}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
