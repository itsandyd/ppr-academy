"use client";

import { useBeatLeaseCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BEAT_GENRES } from "../types";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { ImageUploader } from "../../shared/ImageUploader";

export function BasicsForm() {
  const { state, updateData, saveBeat } = useBeatLeaseCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveBeat();
    router.push(`/dashboard/create/beat-lease?step=metadata${state.beatId ? `&beatId=${state.beatId}` : ''}`);
  };

  const canProceed = !!(state.data.title && state.data.description);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Beat Information</h2>
        <p className="text-muted-foreground mt-1">
          Set up your beat's basic details
        </p>
      </div>

      {/* Beat Title */}
      <Card>
        <CardHeader>
          <CardTitle>Beat Title *</CardTitle>
          <CardDescription>Give your beat a catchy, memorable name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Dark Trap Beat 2024"
            value={state.data.title || ""}
            onChange={(e) => updateData("basics", { title: e.target.value })}
            className="bg-background text-lg"
          />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Description *</CardTitle>
              <CardDescription>Describe the vibe, style, and what artists can expect</CardDescription>
            </div>
            <AIContentAssistant
              productType="beat-lease"
              title={state.data.title}
              description={state.data.description}
              onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the beat's mood, style, what type of artist it's perfect for..."
            value={state.data.description || ""}
            onChange={(e) => updateData("basics", { description: e.target.value })}
            rows={6}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Genre Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Genre *</CardTitle>
          <CardDescription>What genre best describes this beat?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {BEAT_GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => updateData("basics", { 
                  metadata: { ...state.data.metadata, genre: genre.id } as any 
                })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  state.data.metadata?.genre === genre.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-xl mb-1">{genre.emoji}</div>
                <div className="text-xs font-semibold">{genre.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Producer Tag */}
      <Card>
        <CardHeader>
          <CardTitle>Producer Tag</CardTitle>
          <CardDescription>How should you be credited?</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Prod. by YourName"
            value={state.data.producerTag || ""}
            onChange={(e) => updateData("basics", { producerTag: e.target.value })}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Thumbnail Image */}
      <ImageUploader
        value={state.data.thumbnail}
        onChange={(url) => updateData("basics", { thumbnail: url })}
        title="Beat Artwork"
        description="Add cover artwork for your beat"
        productType="beat-lease"
        productTitle={state.data.title}
        productDescription={state.data.description}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/create')}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Beat Details →
        </Button>
      </div>
    </div>
  );
}
