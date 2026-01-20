"use client";

import { usePackCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { FileUploader, FileList } from "../../shared/FileUploader";

export function PackFilesForm() {
  const { state, updateData, createPack } = usePackCreation();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pack Files</h2>
        <p className="text-muted-foreground mt-1">
          Upload your {state.data.packType?.replace("-", " ")} files
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

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload your {state.data.packType?.replace("-", " ")} files to Convex storage
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
            💡 You can skip this step and add files later from the product editor
          </p>
        </CardContent>
      </Card>

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

