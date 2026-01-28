"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useServiceCreation } from "../context";
import { SERVICE_TYPES, ServiceType } from "../types";
import { Settings } from "lucide-react";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { ImageUploader } from "../../shared/ImageUploader";
import { ValidatedField } from "@/shared/components/ValidatedField";
import { validationRules } from "@/hooks/useFieldValidation";

export function BasicsForm() {
  const searchParams = useSearchParams();
  const urlServiceType = searchParams.get("type") as ServiceType | null;
  const { state, updateData } = useServiceCreation();

  useEffect(() => {
    if (urlServiceType && !state.data.serviceType) {
      updateData("basics", { serviceType: urlServiceType });
    }
  }, [urlServiceType]);

  const handleChange = (field: string, value: string) => {
    updateData("basics", { [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={state.data.serviceType || "mixing"}
            onValueChange={(value) => handleChange("serviceType", value)}
            className="grid grid-cols-2 gap-4"
          >
            {SERVICE_TYPES.map((type) => (
              <div key={type.id}>
                <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                <Label
                  htmlFor={type.id}
                  className="flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="mb-2 text-3xl">{type.icon}</span>
                  <span className="font-semibold">{type.label}</span>
                  <span className="mt-1 text-center text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedField
            id="title"
            label="Service Title"
            value={state.data.title || ""}
            onChange={(value) => handleChange("title", value)}
            required
            rules={[validationRules.minLength(5, "Title must be at least 5 characters")]}
            placeholder="e.g., Professional Mixing by [Your Name]"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description *</Label>
              <AIContentAssistant
                productType={state.data.serviceType === "mastering" ? "mastering-service" : "mixing-service"}
                title={state.data.title}
                description={state.data.description}
                existingTags={state.data.tags}
                onDescriptionGenerated={(desc) => handleChange("description", desc)}
                onTagsGenerated={(tags) => updateData("basics", { tags })}
              />
            </div>
            <Textarea
              id="description"
              placeholder="Describe your service, your experience, what makes you unique, and what clients can expect..."
              value={state.data.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your workflow, equipment, genres you specialize in, and any notable
              credits.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., hip-hop, trap, vocals, analog"
              value={state.data.tags?.join(", ") || ""}
              onChange={(e) =>
                updateData("basics", {
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Image */}
      <ImageUploader
        value={state.data.thumbnail}
        onChange={(url) => updateData("basics", { thumbnail: url })}
        title="Service Thumbnail"
        description="Add an image to promote your service"
        productType={state.data.serviceType === "mastering" ? "mastering-service" : "mixing-service"}
        productTitle={state.data.title}
        productDescription={state.data.description}
      />
    </div>
  );
}
