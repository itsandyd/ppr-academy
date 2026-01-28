"use client";

import { usePDFCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { ImageUploader } from "../../shared/ImageUploader";

export function PDFBasicsForm() {
  const { state, updateData, savePDF } = usePDFCreation();
  const router = useRouter();

  const handleNext = async () => {
    await savePDF();
    router.push(`/dashboard/create/pdf?step=files${state.pdfId ? `&pdfId=${state.pdfId}` : ''}`);
  };

  const canProceed = !!(state.data.title && state.data.description);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">PDF Basics</h2>
        <p className="text-muted-foreground mt-1">
          Set up your PDF details
        </p>
      </div>

      {/* PDF Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>PDF Type</CardTitle>
          <CardDescription>What type of PDF are you uploading?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: "cheat-sheet", label: "Cheat Sheet", icon: "📋", desc: "Quick reference (1-5 pages)" },
              { value: "guide", label: "Guide", icon: "📄", desc: "Educational content (10-50 pages)" },
              { value: "ebook", label: "Ebook", icon: "📚", desc: "Comprehensive book (50+ pages)" },
              { value: "workbook", label: "Workbook", icon: "✏️", desc: "Interactive exercises" },
              { value: "template", label: "Template", icon: "📝", desc: "Fillable templates" },
              { value: "other", label: "Other", icon: "📄", desc: "Other PDF content" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => updateData("basics", { pdfType: type.value as any })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  state.data.pdfType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{type.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>PDF Title *</CardTitle>
          <CardDescription>Give your PDF a clear, descriptive name</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Complete EQ Cheat Sheet"
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
              <CardDescription>Describe what's inside this PDF</CardDescription>
            </div>
            <AIContentAssistant
              productType="pdf"
              title={state.data.title}
              description={state.data.description}
              onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the content, what students will learn, key topics covered..."
            value={state.data.description || ""}
            onChange={(e) => updateData("basics", { description: e.target.value })}
            rows={6}
            className="bg-background"
          />
        </CardContent>
      </Card>

      {/* Page Count (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Page Count (Optional)</CardTitle>
          <CardDescription>How many pages is this PDF?</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            placeholder="e.g., 24"
            value={state.data.pageCount || ""}
            onChange={(e) => updateData("basics", { pageCount: parseInt(e.target.value) || undefined })}
            className="max-w-xs bg-background"
          />
        </CardContent>
      </Card>

      {/* Thumbnail Image */}
      <ImageUploader
        value={state.data.thumbnail}
        onChange={(url) => updateData("basics", { thumbnail: url })}
        title="PDF Cover Image"
        description="Add a cover image to make your PDF stand out"
        productType="pdf"
        productTitle={state.data.title}
        productDescription={state.data.description}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/create')}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Upload →
        </Button>
      </div>
    </div>
  );
}
