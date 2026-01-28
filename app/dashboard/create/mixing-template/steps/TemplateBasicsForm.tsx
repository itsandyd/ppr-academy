"use client";

import { useMixingTemplateCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAW_TYPES } from "../../types";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { ImageUploader } from "../../shared/ImageUploader";

const TEMPLATE_TYPES = [
  {
    id: "mixing",
    label: "Mixing Template",
    description: "Full mixing session with routing and processing",
    icon: "🎚️",
  },
  {
    id: "mastering",
    label: "Mastering Template",
    description: "Mastering chain with limiter and EQ",
    icon: "💿",
  },
  {
    id: "vocal",
    label: "Vocal Template",
    description: "Vocal processing chain and routing",
    icon: "🎤",
  },
  {
    id: "stem",
    label: "Stem Template",
    description: "Multi-track stem mixing setup",
    icon: "📊",
  },
  {
    id: "full-project",
    label: "Full Project",
    description: "Complete project with arrangement",
    icon: "📁",
  },
];

export function TemplateBasicsForm() {
  const { state, updateData, saveTemplate } = useMixingTemplateCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveTemplate();
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/mixing-template?daw=${dawType}&step=files${state.templateId ? `&templateId=${state.templateId}` : ''}`);
  };

  const canProceed = !!(state.data.title && state.data.description && state.data.dawType);

  const selectedDAW = DAW_TYPES.find(d => d.id === state.data.dawType);
  const selectedTemplateType = TEMPLATE_TYPES.find(t => t.id === state.data.templateType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mixing Template Basics</h2>
        <p className="text-muted-foreground mt-1">
          Set up your mixing template details
        </p>
      </div>

      {/* DAW Selection */}
      <Card>
        <CardHeader>
          <CardTitle>DAW Type *</CardTitle>
          <CardDescription>Which DAW is this template for?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DAW_TYPES.map((daw) => (
              <button
                key={daw.id}
                onClick={() => updateData("basics", { dawType: daw.id })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  state.data.dawType === daw.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-2">{daw.icon}</div>
                <div className="font-semibold text-sm">{daw.label}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{daw.description}</div>
              </button>
            ))}
          </div>

          {selectedDAW && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Supported file types:</strong> {selectedDAW.extensions.join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Template Type</CardTitle>
          <CardDescription>What kind of template is this?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => updateData("basics", { templateType: type.id as any })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  state.data.templateType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DAW Version (Optional) */}
      {state.data.dawType && (
        <Card>
          <CardHeader>
            <CardTitle>DAW Version (Optional)</CardTitle>
            <CardDescription>Minimum version required</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., 11.3"
              value={state.data.dawVersion || ""}
              onChange={(e) => updateData("basics", { dawVersion: e.target.value })}
              className="max-w-xs bg-background"
            />
          </CardContent>
        </Card>
      )}

      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>Template Title *</CardTitle>
          <CardDescription>Give your template a descriptive name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Pro Mixing Template - Hip Hop"
            value={state.data.title || ""}
            onChange={(e) => updateData("basics", { title: e.target.value })}
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
              <CardDescription>Describe what this template includes</CardDescription>
            </div>
            <AIContentAssistant
              productType="mixing-template"
              title={state.data.title}
              description={state.data.description}
              onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the channels, routing, plugins used, genre focus..."
            value={state.data.description || ""}
            onChange={(e) => updateData("basics", { description: e.target.value })}
            rows={6}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Channel Count (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Track/Channel Count (Optional)</CardTitle>
          <CardDescription>How many tracks does this template include?</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            placeholder="e.g., 24"
            value={state.data.channelCount || ""}
            onChange={(e) => updateData("basics", { channelCount: parseInt(e.target.value) || undefined })}
            className="max-w-xs bg-background"
          />
        </CardContent>
      </Card>

      {/* Genre Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Genre Focus (Optional)</CardTitle>
          <CardDescription>What genres is this template best for?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Hip Hop", "Pop", "EDM", "Rock", "R&B", "Trap", "House", "Techno", "Lo-Fi", "Orchestral"].map((genre) => (
              <Badge
                key={genre}
                variant={state.data.genre?.includes(genre) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const currentGenres = state.data.genre || [];
                  const newGenres = currentGenres.includes(genre)
                    ? currentGenres.filter(g => g !== genre)
                    : [...currentGenres, genre];
                  updateData("basics", { genre: newGenres });
                }}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Image */}
      <ImageUploader
        value={state.data.thumbnail}
        onChange={(url) => updateData("basics", { thumbnail: url })}
        title="Template Thumbnail"
        description="Add an image to showcase your mixing template"
        productType="mixing-template"
        productTitle={state.data.title}
        productDescription={state.data.description}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/create')}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Files
        </Button>
      </div>
    </div>
  );
}
