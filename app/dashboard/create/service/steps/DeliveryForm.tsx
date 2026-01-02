"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useServiceCreation } from "../context";
import { DELIVERY_FORMATS, DeliveryFormat } from "../types";
import { Send, Clock, FileAudio } from "lucide-react";

export function DeliveryForm() {
  const { state, updateData } = useServiceCreation();
  const delivery = state.data.delivery || {
    formats: ["wav-24bit", "mp3-320"],
    includeProjectFile: false,
    includeStemBounces: false,
    deliveryMethod: "download" as const,
    standardTurnaround: 7,
    rushTurnaround: 3,
  };

  const updateDelivery = (field: string, value: any) => {
    updateData("delivery", {
      delivery: { ...delivery, [field]: value },
    });
  };

  const toggleFormat = (formatId: DeliveryFormat) => {
    const current = delivery.formats || [];
    const updated = current.includes(formatId)
      ? current.filter((f) => f !== formatId)
      : [...current, formatId];
    updateDelivery("formats", updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Delivery Formats
          </CardTitle>
          <CardDescription>What formats will you deliver to clients?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DELIVERY_FORMATS.map((format) => (
              <div key={format.id} className="flex items-start space-x-3 rounded-lg border p-3">
                <Checkbox
                  id={format.id}
                  checked={delivery.formats?.includes(format.id)}
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

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Project File</Label>
                <p className="text-sm text-muted-foreground">
                  Send the DAW session file with your mix
                </p>
              </div>
              <Switch
                checked={delivery.includeProjectFile}
                onCheckedChange={(checked) => updateDelivery("includeProjectFile", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Stem Bounces</Label>
                <p className="text-sm text-muted-foreground">
                  Provide mixed stem groups (drums, bass, etc.)
                </p>
              </div>
              <Switch
                checked={delivery.includeStemBounces}
                onCheckedChange={(checked) => updateDelivery("includeStemBounces", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Turnaround Time
          </CardTitle>
          <CardDescription>How long will it take to complete orders?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Standard Turnaround (days)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={delivery.standardTurnaround}
                onChange={(e) => updateDelivery("standardTurnaround", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Normal delivery time for all orders</p>
            </div>

            {state.data.rushAvailable && (
              <div className="space-y-2">
                <Label>Rush Turnaround (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max={delivery.standardTurnaround - 1}
                  value={delivery.rushTurnaround || Math.ceil(delivery.standardTurnaround / 2)}
                  onChange={(e) => updateDelivery("rushTurnaround", Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Expedited delivery for rush orders</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Delivery Method
          </CardTitle>
          <CardDescription>How will you send completed files?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={delivery.deliveryMethod}
            onValueChange={(value) => updateDelivery("deliveryMethod", value)}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <RadioGroupItem value="download" id="download" className="peer sr-only" />
              <Label
                htmlFor="download"
                className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="font-semibold">Direct Download</span>
                <span className="text-sm text-muted-foreground">
                  Client downloads from the platform
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="wetransfer" id="wetransfer" className="peer sr-only" />
              <Label
                htmlFor="wetransfer"
                className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="font-semibold">WeTransfer</span>
                <span className="text-sm text-muted-foreground">Send link via WeTransfer</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="dropbox" id="dropbox" className="peer sr-only" />
              <Label
                htmlFor="dropbox"
                className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="font-semibold">Dropbox</span>
                <span className="text-sm text-muted-foreground">Share via Dropbox folder</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="google-drive" id="google-drive" className="peer sr-only" />
              <Label
                htmlFor="google-drive"
                className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="font-semibold">Google Drive</span>
                <span className="text-sm text-muted-foreground">Share via Google Drive</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
