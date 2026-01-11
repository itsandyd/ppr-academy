"use client";

import { useMixingTemplateCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader, FileList } from "../../chain/components/FileUploader";
import { DAW_TYPES } from "../../types";

export function TemplateFilesForm() {
  const { state, updateData } = useMixingTemplateCreation();
  const router = useRouter();

  const handleBack = () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/mixing-template?daw=${dawType}&step=basics${state.templateId ? `&templateId=${state.templateId}` : ''}`);
  };

  const handleNext = async () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/mixing-template?daw=${dawType}&step=pricing${state.templateId ? `&templateId=${state.templateId}` : ''}`);
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

  // Mixing templates typically use project files
  const projectExtensions = {
    "ableton": ".als,.adg",
    "fl-studio": ".flp",
    "logic": ".logicx",
    "bitwig": ".bwproject",
    "studio-one": ".song",
    "reason": ".reason",
    "cubase": ".cpr",
    "multi-daw": "*",
  };

  const acceptedFileTypes = state.data.dawType
    ? projectExtensions[state.data.dawType as keyof typeof projectExtensions] || '*'
    : '*';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Template Files</h2>
        <p className="text-muted-foreground mt-1">
          Upload your {selectedDAW?.label || 'DAW'} mixing template files
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
            Upload your {selectedDAW?.label || 'mixing template'} project files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploader
            onFilesUploaded={handleFilesUploaded}
            accept={acceptedFileTypes}
            multiple={true}
            maxSize={500}
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
            You can skip this step and add files later from the product editor
          </p>
        </CardContent>
      </Card>

      {/* Installation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Notes (Optional)</CardTitle>
          <CardDescription>Help users set up the template</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Extract to your User Library folder..."
            value={state.data.installationNotes || ""}
            onChange={(e) => updateData("files", { installationNotes: e.target.value })}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Third Party Plugins */}
      <Card>
        <CardHeader>
          <CardTitle>Required Plugins (Optional)</CardTitle>
          <CardDescription>List any third-party plugins needed (comma separated)</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., FabFilter Pro-Q 3, Waves SSL, Soundtoys Decapitator"
            value={state.data.thirdPartyPlugins?.join(", ") || ""}
            onChange={(e) => {
              const plugins = e.target.value.split(",").map(p => p.trim()).filter(Boolean);
              updateData("files", { thirdPartyPlugins: plugins });
            }}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Let buyers know if they need specific plugins for this template
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue to Pricing
        </Button>
      </div>
    </div>
  );
}
