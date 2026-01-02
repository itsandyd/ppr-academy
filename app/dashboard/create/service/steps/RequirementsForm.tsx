"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useServiceCreation } from "../context";
import { ACCEPTED_FORMATS } from "../types";
import { FileCheck, Upload } from "lucide-react";

export function RequirementsForm() {
  const { state, updateData } = useServiceCreation();
  const requirements = state.data.requirements || {
    acceptedFormats: ["wav", "aiff", "flac"],
    requireDryVocals: true,
    requireReferenceTrack: true,
    requireProjectNotes: false,
    maxFileSize: 500,
  };

  const updateRequirements = (field: string, value: any) => {
    updateData("requirements", {
      requirements: { ...requirements, [field]: value },
    });
  };

  const toggleFormat = (formatId: string) => {
    const current = requirements.acceptedFormats || [];
    const updated = current.includes(formatId)
      ? current.filter((f) => f !== formatId)
      : [...current, formatId];
    updateRequirements("acceptedFormats", updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Accepted File Formats
          </CardTitle>
          <CardDescription>What audio formats can clients submit?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {ACCEPTED_FORMATS.map((format) => (
              <div key={format.id} className="flex items-start space-x-3 rounded-lg border p-3">
                <Checkbox
                  id={format.id}
                  checked={requirements.acceptedFormats?.includes(format.id)}
                  onCheckedChange={() => toggleFormat(format.id)}
                />
                <div className="grid gap-1 leading-none">
                  <Label htmlFor={format.id} className="font-medium">
                    {format.label}
                  </Label>
                  <span className="text-xs text-muted-foreground">{format.description}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Submission Requirements
          </CardTitle>
          <CardDescription>What do you need from clients?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Dry Vocals (Unmixed)</Label>
              <p className="text-sm text-muted-foreground">Ask for vocal stems without effects</p>
            </div>
            <Switch
              checked={requirements.requireDryVocals}
              onCheckedChange={(checked) => updateRequirements("requireDryVocals", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Reference Track</Label>
              <p className="text-sm text-muted-foreground">
                Ask clients to provide a reference mix
              </p>
            </div>
            <Switch
              checked={requirements.requireReferenceTrack}
              onCheckedChange={(checked) => updateRequirements("requireReferenceTrack", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Project Notes</Label>
              <p className="text-sm text-muted-foreground">Ask for detailed mixing instructions</p>
            </div>
            <Switch
              checked={requirements.requireProjectNotes}
              onCheckedChange={(checked) => updateRequirements("requireProjectNotes", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Max File Size (MB per stem)</Label>
            <Input
              type="number"
              min="50"
              max="2000"
              value={requirements.maxFileSize}
              onChange={(e) => updateRequirements("maxFileSize", Number(e.target.value))}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Maximum file size per individual stem file
            </p>
          </div>

          <div className="space-y-2">
            <Label>Custom Requirements (optional)</Label>
            <Textarea
              placeholder="Any additional requirements or notes for clients submitting their projects..."
              value={requirements.customRequirements || ""}
              onChange={(e) => updateRequirements("customRequirements", e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Example: "Please label all stems clearly", "Include BPM and key info", etc.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
