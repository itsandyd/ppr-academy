"use client";

import { usePDFCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { FileUploader, FileList } from "../../shared/FileUploader";

export function PDFFilesForm() {
  const { state, updateData, createPDF } = usePDFCreation();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  const handleBack = () => {
    const prevStep = state.data.pricingModel === "free_with_gate" ? "followGate" : "pricing";
    const pdfType = state.data.pdfType || "sample-pdf";
    router.push(
      `/dashboard/create/pdf?type=${pdfType}&step=${prevStep}${state.pdfId ? `&pdfId=${state.pdfId}` : ""}`
    );
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const result = await createPDF();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    } else {
      toast.error(result.error || "Failed to publish pdf");
      setIsPublishing(false);
    }
  };

  const handleFilesUploaded = (
    uploadedFiles: Array<{ name: string; storageId: string; size: number; type: string }>
  ) => {
    const newFiles = uploadedFiles.map((f) => ({
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
    const updatedFiles = (state.data.files || []).filter((f) => f.id !== fileId);
    updateData("files", { files: updatedFiles });
  };

  const getAcceptedFileTypes = () => {
    const pdfType = state.data.pdfType as string | undefined;
    switch (pdfType) {
      case "sample-pdf":
        return "audio/*,.wav,.mp3,.aiff,.flac,.ogg";
      case "midi-pdf":
        return ".mid,.midi";
      case "preset-pdf":
        return ".fxp,.fxb,.vstpreset,.nksf,.vital,.serum";
      default:
        return "*";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">PDF Files</h2>
        <p className="mt-1 text-muted-foreground">
          Upload your {state.data.pdfType?.replace("-", " ")} files
        </p>
      </div>

      {/* Download URL (Alternative) */}
      <Card>
        <CardHeader>
          <CardTitle>Download URL</CardTitle>
          <CardDescription>
            Or provide a direct download link (Dropbox, Google Drive, etc.)
          </CardDescription>
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
            Upload your {state.data.pdfType?.replace("-", " ")} files to Convex storage
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
              <p className="mb-2 text-sm font-medium">Uploaded Files ({state.data.files.length})</p>
              <FileList files={state.data.files as any} onRemove={removeFile} />
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
            {isPublishing ? "Publishing..." : "Publish PDF →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
