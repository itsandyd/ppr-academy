"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ScriptFiltersProps {
  storeId: string;
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  minViralityScore: number;
  onMinViralityScoreChange: (value: number) => void;
  courseFilter: string;
  onCourseFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function ScriptFilters({
  storeId,
  accountFilter,
  onAccountFilterChange,
  statusFilter,
  onStatusFilterChange,
  minViralityScore,
  onMinViralityScoreChange,
  courseFilter,
  onCourseFilterChange,
  onClearFilters,
}: ScriptFiltersProps) {
  // Get account profiles
  const profiles = useQuery(api.socialAccountProfiles.getAccountProfiles, {
    storeId,
  });

  // Get user's courses (we'll need to query this)
  // For now, we'll just show the filter without the course list

  const hasActiveFilters =
    accountFilter !== "all" ||
    statusFilter !== "all" ||
    minViralityScore > 1 ||
    courseFilter !== "all";

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
      {/* Account Filter */}
      <div className="space-y-1.5">
        <Label className="text-sm">Account</Label>
        <Select value={accountFilter} onValueChange={onAccountFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {profiles?.map((profile: any) => (
              <SelectItem key={profile._id} value={profile._id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-1.5">
        <Label className="text-sm">Status</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Virality Score Filter */}
      <div className="space-y-1.5 w-[200px]">
        <Label className="text-sm">
          Min Virality Score: {minViralityScore}
        </Label>
        <Slider
          value={[minViralityScore]}
          onValueChange={(v) => onMinViralityScoreChange(v[0])}
          min={1}
          max={10}
          step={1}
          className="py-2"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
