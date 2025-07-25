"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Control, UseFormRegister, UseFormWatch } from "react-hook-form";
import { AvailabilitySchema } from "./schema";
import { useState } from "react";

interface ConfigSectionProps {
  control: Control<AvailabilitySchema>;
  register: UseFormRegister<AvailabilitySchema>;
  watch: UseFormWatch<AvailabilitySchema>;
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

const bufferOptions = [
  { value: 0, label: 'No buffer' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
];

export function ConfigSection({ control, register, watch }: ConfigSectionProps) {
  const [bufferBeforeEnabled, setBufferBeforeEnabled] = useState(false);
  const [bufferAfterEnabled, setBufferAfterEnabled] = useState(false);

  return (
          <Card className="p-6 border-card-hover rounded-xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Template name */}
        <div className="space-y-2">
          <Label htmlFor="template" className="text-sm font-medium">Template name</Label>
          <Select defaultValue="Default">
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Default">Default</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">Duration (min)</Label>
          <Input
            {...register("duration", { valueAsNumber: true })}
            type="number"
            defaultValue={30}
            className="h-12"
          />
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-medium">Time Zone</Label>
          <Select defaultValue="America/Chicago">
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead time */}
        <div className="space-y-2">
          <Label htmlFor="leadTimeHours" className="text-sm font-medium">Prevent bookings within</Label>
          <div className="flex gap-2">
            <Input
              {...register("leadTimeHours", { valueAsNumber: true })}
              type="number"
              defaultValue={2}
              className="h-12 flex-1"
            />
            <div className="bg-[#F8F9FB] border border-[#E5E7F5] rounded-lg px-3 flex items-center text-sm text-[#6B6E85]">
              Hours
            </div>
          </div>
        </div>

        {/* Max attendees */}
        <div className="space-y-2">
          <Label htmlFor="maxAttendees" className="text-sm font-medium">Max attendees</Label>
          <Input
            {...register("maxAttendees", { valueAsNumber: true })}
            type="number"
            defaultValue={1}
            className="h-12"
          />
        </div>

        {/* Buffer before */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Before Meeting</Label>
            <Switch 
              checked={bufferBeforeEnabled}
              onCheckedChange={setBufferBeforeEnabled}
            />
          </div>
          <Select disabled={!bufferBeforeEnabled} defaultValue="15">
            <SelectTrigger className={`h-12 ${!bufferBeforeEnabled ? 'opacity-50' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bufferOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Buffer after */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">After Meeting</Label>
            <Switch 
              checked={bufferAfterEnabled}
              onCheckedChange={setBufferAfterEnabled}
            />
          </div>
          <Select disabled={!bufferAfterEnabled} defaultValue="15">
            <SelectTrigger className={`h-12 ${!bufferAfterEnabled ? 'opacity-50' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bufferOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Book within days */}
        <div className="space-y-2">
          <Label htmlFor="advanceDays" className="text-sm font-medium">Book within the next ___ days</Label>
          <Input
            {...register("advanceDays", { valueAsNumber: true })}
            type="number"
            defaultValue={60}
            className="h-12"
          />
        </div>
      </div>
    </Card>
  );
} 