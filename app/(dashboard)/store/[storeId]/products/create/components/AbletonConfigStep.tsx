"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AbletonRackConfig } from "../types";

interface AbletonConfigStepProps {
  config?: AbletonRackConfig;
  onConfigChange: (config: AbletonRackConfig) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function AbletonConfigStep({
  config,
  onConfigChange,
  onContinue,
  onBack,
}: AbletonConfigStepProps) {
  const handleUpdate = (field: keyof AbletonRackConfig, value: any) => {
    onConfigChange({
      abletonVersion: config?.abletonVersion || "11",
      rackType: config?.rackType || "audioEffect",
      ...config,
      [field]: value,
    });
  };

  const canProceed = config?.abletonVersion && config?.rackType;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ableton Rack Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Specify Ableton Live version and rack type
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rack Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ableton Version */}
          <div className="space-y-2">
            <Label htmlFor="version">Ableton Live Version *</Label>
            <Select
              value={config?.abletonVersion}
              onValueChange={(value) => handleUpdate("abletonVersion", value)}
            >
              <SelectTrigger id="version" className="bg-white dark:bg-black">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="12">Ableton Live 12</SelectItem>
                <SelectItem value="11">Ableton Live 11</SelectItem>
                <SelectItem value="10">Ableton Live 10</SelectItem>
                <SelectItem value="9">Ableton Live 9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rack Type */}
          <div className="space-y-2">
            <Label htmlFor="rackType">Rack Type *</Label>
            <Select
              value={config?.rackType}
              onValueChange={(value) => handleUpdate("rackType", value as any)}
            >
              <SelectTrigger id="rackType" className="bg-white dark:bg-black">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="audioEffect">Audio Effect Rack</SelectItem>
                <SelectItem value="instrument">Instrument Rack</SelectItem>
                <SelectItem value="midiEffect">MIDI Effect Rack</SelectItem>
                <SelectItem value="drumRack">Drum Rack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Make sure your rack files are compatible with the selected Ableton Live version. 
            You'll upload the actual rack files in the next step.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-3">
          {!canProceed && (
            <Button variant="outline" onClick={onContinue}>
              Skip & Continue →
            </Button>
          )}
          <Button onClick={onContinue} disabled={!canProceed}>
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

