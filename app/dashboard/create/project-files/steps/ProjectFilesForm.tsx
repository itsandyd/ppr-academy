"use client";

import { useProjectFileCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader, FileList } from "../../chain/components/FileUploader";
import { DAW_TYPES } from "../../types";

export function ProjectFilesForm() {
  const { state, updateData } = useProjectFileCreation();
  const router = useRouter();

  const handleBack = () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/project-files?daw=${dawType}&step=basics${state.projectId ? `&projectId=${state.projectId}` : ''}`);
  };

  const handleNext = async () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/project-files?daw=${dawType}&step=pricing${state.projectId ? `&projectId=${state.projectId}` : ''}`);
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

  // Project files typically use larger project files
  const projectExtensions = {
    "ableton": ".als,.alp,.zip",
    "fl-studio": ".flp,.zip",
    "logic": ".logicx,.zip",
    "bitwig": ".bwproject,.zip",
    "studio-one": ".song,.zip",
    "reason": ".reason,.zip",
    "cubase": ".cpr,.zip",
    "multi-daw": "*",
  };

  const acceptedFileTypes = state.data.dawType
    ? projectExtensions[state.data.dawType as keyof typeof projectExtensions] || '*'
    : '*';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Project Files</h2>
        <p className="text-muted-foreground mt-1">
          Upload your {selectedDAW?.label || 'DAW'} project files
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
          <p className="text-xs text-muted-foreground mt-2">
            For large projects, we recommend using cloud storage links
          </p>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload your complete {selectedDAW?.label || 'DAW'} project
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
          <CardTitle>Setup Instructions (Optional)</CardTitle>
          <CardDescription>Help buyers set up the project correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Extract to your Projects folder. Open the .als file..."
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
            placeholder="e.g., Serum, OTT, FabFilter Pro-Q 3"
            value={state.data.thirdPartyPlugins?.join(", ") || ""}
            onChange={(e) => {
              const plugins = e.target.value.split(",").map(p => p.trim()).filter(Boolean);
              updateData("files", { thirdPartyPlugins: plugins });
            }}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Let buyers know which plugins are essential for this project
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
          Continue to Pricing
        </Button>
      </div>
    </div>
  );
}
