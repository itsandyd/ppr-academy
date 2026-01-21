"use client";

import { usePackCreation } from "../context";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { FileUploader, FileList } from "../../shared/FileUploader";
import { SampleSelector } from "../components/SampleSelector";
import { Id } from "@/convex/_generated/dataModel";
import { Upload, Music } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function PackFilesForm() {
  const { state, updateData, createPack } = usePackCreation();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const { user } = useUser();

  // Get user's store for sample selection
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const primaryStore = stores?.[0];

  const handleBack = () => {
    const prevStep = state.data.pricingModel === "free_with_gate" ? "followGate" : "pricing";
    const packType = state.data.packType || "sample-pack";
    router.push(`/dashboard/create/pack?type=${packType}&step=${prevStep}${state.packId ? `&packId=${state.packId}` : ''}`);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const result = await createPack();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    } else {
      toast.error(result.error || "Failed to publish pack");
      setIsPublishing(false);
    }
  };

  const handleFilesUploaded = (uploadedFiles: Array<{ name: string; storageId: string; size: number; type: string }>) => {
    const newFiles = uploadedFiles.map(f => ({
      id: f.storageId,
      name: f.name,
      url: f.storageId, // Store the storage ID
      size: f.size,
      type: f.type,
      storageId: f.storageId,
    }));
    
    const currentFiles = state.data.files || [];
    updateData("files", { files: [...currentFiles, ...newFiles] });
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = (state.data.files || []).filter(f => f.id !== fileId);
    updateData("files", { files: updatedFiles });
  };

  const getAcceptedFileTypes = () => {
    switch (state.data.packType) {
      case "sample-pack":
        return "audio/*,.wav,.mp3,.aiff,.flac,.ogg";
      case "midi-pack":
        return ".mid,.midi";
      case "preset-pack":
        return ".fxp,.fxb,.vstpreset,.nksf,.vital,.serum";
      default:
        return "*";
    }
  };

  // Sample selection handlers
  const selectedSampleIds = (state.data.selectedSampleIds || []) as Id<"audioSamples">[];

  const handleSampleToggle = (sampleId: Id<"audioSamples">, selected: boolean) => {
    const current = selectedSampleIds;
    const updated = selected
      ? [...current, sampleId]
      : current.filter((id) => id !== sampleId);
    updateData("files", { selectedSampleIds: updated });
  };

  const handleSelectAllSamples = (sampleIds: Id<"audioSamples">[]) => {
    updateData("files", { selectedSampleIds: sampleIds });
  };

  const handleClearAllSamples = () => {
    updateData("files", { selectedSampleIds: [] });
  };

  const totalFilesCount = (state.data.files?.length || 0) + selectedSampleIds.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pack Files</h2>
        <p className="text-muted-foreground mt-1">
          Add content to your {state.data.packType?.replace("-", " ")}
        </p>
      </div>

      {/* Download URL (Alternative) */}
      <Card>
        <CardHeader>
          <CardTitle>Download URL</CardTitle>
          <CardDescription>Or provide a direct download link (Dropbox, Google Drive, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="https://..."
            value={state.data.downloadUrl || ""}
            onChange={(e) => updateData("files", { downloadUrl: e.target.value })}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Tabbed Content Options */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Files
            {state.data.files && state.data.files.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {state.data.files.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Add Existing Samples
            {selectedSampleIds.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {selectedSampleIds.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload new {state.data.packType?.replace("-", " ")} files to include in this pack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Uploader */}
              <FileUploader
                onFilesUploaded={handleFilesUploaded}
                accept={getAcceptedFileTypes()}
                multiple={true}
                maxSize={100}
              />

              {/* Uploaded Files List */}
              {state.data.files && state.data.files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Uploaded Files ({state.data.files.length})</p>
                  <FileList
                    files={state.data.files as any}
                    onRemove={removeFile}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                These files will only be available in this pack
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="mt-4">
          {primaryStore ? (
            <SampleSelector
              storeId={primaryStore._id}
              selectedSampleIds={selectedSampleIds}
              onSampleToggle={handleSampleToggle}
              onSelectAll={handleSelectAllSamples}
              onClearAll={handleClearAllSamples}
              currentPackId={state.packId}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  You need to set up a store first to add existing samples.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Total Summary */}
      {totalFilesCount > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pack Summary</p>
                <p className="text-sm text-muted-foreground">
                  {state.data.files?.length || 0} uploaded files + {selectedSampleIds.length} existing samples = {totalFilesCount} total items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip note */}
      <p className="text-xs text-muted-foreground text-center">
        You can skip this step and add files later from the product editor
      </p>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePublish} disabled={isPublishing}>
            Save as Draft
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish Pack →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

