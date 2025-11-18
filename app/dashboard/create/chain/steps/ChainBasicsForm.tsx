"use client";

import { useEffectChainCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAW_TYPES } from "../../types";

export function ChainBasicsForm() {
  const { state, updateData, saveChain } = useEffectChainCreation();
  const router = useRouter();

  const handleNext = async () => {
    await saveChain();
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/chain?daw=${dawType}&step=files${state.chainId ? `&chainId=${state.chainId}` : ''}`);
  };

  const canProceed = !!(state.data.title && state.data.description && state.data.dawType);

  const selectedDAW = DAW_TYPES.find(d => d.id === state.data.dawType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Effect Chain Basics</h2>
        <p className="text-muted-foreground mt-1">
          Set up your effect chain details
        </p>
      </div>

      {/* DAW Selection */}
      <Card>
        <CardHeader>
          <CardTitle>DAW Type *</CardTitle>
          <CardDescription>Which DAW is this effect chain for?</CardDescription>
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
          <CardTitle>Effect Chain Title *</CardTitle>
          <CardDescription>Give your effect chain a descriptive name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Fat Bass Compression Chain"
            value={state.data.title || ""}
            onChange={(e) => updateData("basics", { title: e.target.value })}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description *</CardTitle>
          <CardDescription>Describe what this effect chain does</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the effects, use cases, sound characteristics..."
            value={state.data.description || ""}
            onChange={(e) => updateData("basics", { description: e.target.value })}
            rows={6}
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
          Continue to Files →
        </Button>
      </div>
    </div>
  );
}

