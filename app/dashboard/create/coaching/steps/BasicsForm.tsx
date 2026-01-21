"use client";

import { useCoachingCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { ValidatedField } from "@/shared/components/ValidatedField";
import { validationRules } from "@/hooks/useFieldValidation";

export function BasicsForm() {
  const { state, updateData, saveCoaching } = useCoachingCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveCoaching();
    router.push(`/dashboard/create/coaching?step=pricing${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const canProceed = !!(state.data.title && state.data.description && state.data.sessionType && state.data.duration);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Session Details</h2>
        <p className="text-muted-foreground mt-1">
          Set up your coaching session basics
        </p>
      </div>

      {/* Session Type */}
      <Card>
        <CardHeader>
          <CardTitle>Session Type *</CardTitle>
          <CardDescription>What type of coaching do you offer?</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={state.data.sessionType}
            onValueChange={(value: any) => updateData("basics", { sessionType: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select session type..." />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="production-coaching">Production Coaching</SelectItem>
              <SelectItem value="feedback-session">Feedback Session</SelectItem>
              <SelectItem value="consultation">Consultation Call</SelectItem>
              <SelectItem value="workshop">Group Workshop</SelectItem>
              <SelectItem value="custom">Custom Session</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Duration */}
      <Card>
        <CardHeader>
          <CardTitle>Session Duration *</CardTitle>
          <CardDescription>How long is each session?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[30, 60, 90, 120].map((minutes) => (
              <button
                key={minutes}
                onClick={() => updateData("basics", { duration: minutes })}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  state.data.duration === minutes
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl font-bold">{minutes}</div>
                <div className="text-xs text-muted-foreground">minutes</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="custom-duration" className="text-sm">Or enter custom duration</Label>
            <Input
              id="custom-duration"
              type="number"
              min="15"
              step="15"
              placeholder="e.g., 45"
              value={state.data.duration || ""}
              onChange={(e) => updateData("basics", { duration: parseInt(e.target.value) || undefined })}
              className="max-w-xs bg-background mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>Session Title</CardTitle>
          <CardDescription>Give your coaching session a clear name</CardDescription>
        </CardHeader>
        <CardContent>
          <ValidatedField
            id="coaching-title"
            label="Title"
            value={state.data.title || ""}
            onChange={(value) => updateData("basics", { title: value })}
            required
            rules={[validationRules.minLength(5, "Title must be at least 5 characters")]}
            placeholder="e.g., 1-on-1 Production Coaching"
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Description *</CardTitle>
              <CardDescription>What will students get from this session?</CardDescription>
            </div>
            <AIContentAssistant
              productType="coaching"
              title={state.data.title}
              description={state.data.description}
              onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe what you'll cover, what students should prepare, what they'll learn..."
            value={state.data.description || ""}
            onChange={(e) => updateData("basics", { description: e.target.value })}
            rows={6}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Deliverables (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>What Students Get (Optional)</CardTitle>
          <CardDescription>List specific deliverables</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Mixed track, Feedback document, Session recording"
            value={state.data.deliverables || ""}
            onChange={(e) => updateData("basics", { deliverables: e.target.value })}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/create')}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Pricing →
        </Button>
      </div>
    </div>
  );
}

