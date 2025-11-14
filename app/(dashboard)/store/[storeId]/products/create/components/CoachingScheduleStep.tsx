"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Calendar, Plus } from "lucide-react";

interface CoachingConfig {
  duration?: number;
  sessionType?: string;
  availabilityNotes?: string;
}

interface CoachingScheduleStepProps {
  config?: CoachingConfig;
  onConfigChange: (config: CoachingConfig) => void;
  onContinue: () => void;
  onBack: () => void;
  productCategory: string;
}

export function CoachingScheduleStep({
  config,
  onConfigChange,
  onContinue,
  onBack,
  productCategory,
}: CoachingScheduleStepProps) {
  const handleUpdate = (field: keyof CoachingConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const getSessionTypeLabel = () => {
    switch (productCategory) {
      case "coaching":
        return "1:1 Coaching Call";
      case "mixing-service":
        return "Mixing Service";
      case "mastering-service":
        return "Mastering Service";
      case "workshop":
        return "Group Workshop";
      default:
        return "Service";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Session Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Set up your {getSessionTypeLabel().toLowerCase()} details
        </p>
      </div>

      {/* Session Details */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Session Duration (minutes)</Label>
            <Select
              value={config?.duration?.toString()}
              onValueChange={(value) => handleUpdate("duration", parseInt(value))}
            >
              <SelectTrigger id="duration" className="bg-white dark:bg-black">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="sessionType">Session Type</Label>
            <Select
              value={config?.sessionType}
              onValueChange={(value) => handleUpdate("sessionType", value)}
            >
              <SelectTrigger id="sessionType" className="bg-white dark:bg-black">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {productCategory === "coaching" && (
                  <>
                    <SelectItem value="production-coaching">Production Coaching</SelectItem>
                    <SelectItem value="mixing-feedback">Mixing Feedback</SelectItem>
                    <SelectItem value="career-coaching">Career Coaching</SelectItem>
                    <SelectItem value="mentorship">Mentorship Session</SelectItem>
                  </>
                )}
                {productCategory === "mixing-service" && (
                  <>
                    <SelectItem value="mix-single">Mix Single Track</SelectItem>
                    <SelectItem value="mix-ep">Mix EP (3-5 tracks)</SelectItem>
                    <SelectItem value="mix-album">Mix Album (8+ tracks)</SelectItem>
                  </>
                )}
                {productCategory === "mastering-service" && (
                  <>
                    <SelectItem value="master-single">Master Single Track</SelectItem>
                    <SelectItem value="master-ep">Master EP (3-5 tracks)</SelectItem>
                    <SelectItem value="master-album">Master Album (8+ tracks)</SelectItem>
                  </>
                )}
                {productCategory === "workshop" && (
                  <>
                    <SelectItem value="group-workshop">Group Workshop</SelectItem>
                    <SelectItem value="masterclass">Masterclass</SelectItem>
                    <SelectItem value="live-session">Live Q&A Session</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Notes */}
          <div className="space-y-2">
            <Label htmlFor="availabilityNotes">Availability Notes (Optional)</Label>
            <Textarea
              id="availabilityNotes"
              placeholder="e.g., Available weekdays 9am-5pm EST, 48-hour turnaround for mixing..."
              value={config?.availabilityNotes || ""}
              onChange={(e) => handleUpdate("availabilityNotes", e.target.value)}
              className="min-h-[100px] bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Let customers know your availability and expected turnaround time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Calendar Integration Available
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                After creating this product, you can connect your calendar and enable automatic booking through the product settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-3">
          {(!config?.duration || !config?.sessionType) && (
            <Button variant="outline" onClick={onContinue}>
              Skip & Continue →
            </Button>
          )}
          <Button onClick={onContinue} disabled={!config?.duration || !config?.sessionType}>
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

