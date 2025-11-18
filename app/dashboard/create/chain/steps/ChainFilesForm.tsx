"use client";

import { useEffectChainCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { FileUploader, FileList } from "../components/FileUploader";
import { DAW_TYPES } from "../../types";

export function ChainFilesForm() {
  const { state, updateData, createChain } = useEffectChainCreation();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  const handleBack = () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/chain?daw=${dawType}&step=basics${state.chainId ? `&chainId=${state.chainId}` : ''}`);
  };

  const handleNext = async () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/chain?daw=${dawType}&step=pricing${state.chainId ? `&chainId=${state.chainId}` : ''}`);
  };

  const handleFilesUploaded = (uploadedFiles: Array<{ name: string; storageId: string; size: number; type: string }>) => {
    const newFiles = uploadedFiles.map(f => ({
      id: f.storageId,
      name: f.name,
      url: f.storageId,
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

  const selectedDAW = DAW_TYPES.find(d => d.id === state.data.dawType);
  const acceptedFileTypes = selectedDAW?.extensions.join(',') || '*';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Effect Chain Files</h2>
        <p className="text-muted-foreground mt-1">
          Upload your {selectedDAW?.label || 'DAW'} effect chain files
        </p>
      </div>

      {/* Download URL (Alternative) */}
      <Card>
        <CardHeader>
          <CardTitle>Download URL (Optional)</CardTitle>
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
            Upload your {selectedDAW?.label || 'effect chain'} files ({acceptedFileTypes})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploader
            onFilesUploaded={handleFilesUploaded}
            accept={acceptedFileTypes}
            multiple={true}
            maxSize={100}
          />

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
        <Button onClick={handleNext}>
          Continue to Pricing →
        </Button>
      </div>
    </div>
  );
}


