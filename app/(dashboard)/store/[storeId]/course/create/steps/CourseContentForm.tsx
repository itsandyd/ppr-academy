"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Save, Upload, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import CreateCourseForm from "@/components/create-course-form";
import { useCourseCreation } from "../context";

const categories = [
  "Hip-Hop Production",
  "Electronic Music",
  "Mixing & Mastering", 
  "Sound Design",
  "Music Theory",
  "Pop Production",
  "Rock Production",
  "DAWs",
  "Trap Production",
  "House Music",
  "Techno Production",
  "Vocal Production",
  "Jazz Production",
  "R&B Production",
  "Ambient Music",
  "Drum Programming",
  "Synthesis",
  "Sampling",
  "Audio Engineering",
  "Live Performance"
];

const skillLevels = [
  "Beginner",
  "Intermediate",
  "Advanced", 
  "All Levels"
];

function CourseBasicInfoCard() {
  const { state, updateData } = useCourseCreation();
  
  const handleInputChange = (field: string, value: string) => {
    const newData = { ...state.data, [field]: value };
    console.log("🔄 CourseBasicInfoCard updating context with:", { step: "course", data: { [field]: value } });
    updateData("course", { [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-foreground">Course Title *</Label>
          <Input
            id="title"
            value={state.data?.title || ""}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter course title"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-foreground">Course Description *</Label>
          <Textarea
            id="description"
            value={state.data?.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe what students will learn..."
            rows={4}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">Category *</Label>
            <Select value={state.data?.category || ""} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-foreground">Skill Level *</Label>
            <Select value={state.data?.skillLevel || ""} onValueChange={(value) => handleInputChange("skillLevel", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {skillLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseThumbnailCard() {
  const { state, updateData } = useCourseCreation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    console.log("🔄 CourseThumbnailCard updating context with:", { step: "course", data: { [field]: value } });
    updateData("course", { [field]: value });
  };

  const handleGenerateWithAI = async () => {
    // Validate required fields
    if (!state.data?.title || !state.data?.description) {
      setGenerationError("Please fill out the course title and description before generating a thumbnail.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log("🎨 Generating thumbnail with data:", {
        title: state.data.title,
        description: state.data.description,
        category: state.data.category,
      });

      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.data.title,
          description: state.data.description,
          category: state.data.category,
        }),
      });

      console.log("📡 API response status:", response.status);
      const data = await response.json();
      console.log("📝 API response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate thumbnail");
      }

      if (data.success && data.imageUrl) {
        handleInputChange("thumbnail", data.imageUrl);
      } else {
        throw new Error("Invalid response from AI service");
      }
    } catch (error: any) {
      console.error("Error generating thumbnail:", error);
      setGenerationError(error.message || "Failed to generate thumbnail. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // TODO: Handle file upload
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Thumbnail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* AI Generation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-medium">Generate with AI</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !state.data?.title || !state.data?.description}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating ? "Generating..." : "Generate Thumbnail"}
              </Button>
            </div>
            
            {/* Validation message */}
            {(!state.data?.title || !state.data?.description) && (
              <p className="text-sm text-muted-foreground">
                Fill out the course title and description above to generate an AI thumbnail.
              </p>
            )}
            
            {/* Error message */}
            {generationError && (
              <div className="text-sm bg-destructive/10 p-3 rounded space-y-2">
                <p className="text-destructive font-medium">
                  {generationError}
                </p>
                {generationError.includes('billing') && (
                  <div className="text-muted-foreground text-xs space-y-1">
                    <p>• Visit platform.openai.com/account/billing to add credits</p>
                    <p>• DALL-E 3 costs ~$0.04-0.08 per image</p>
                    <p>• You can upload a thumbnail manually below</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or upload manually</span>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border-strong"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-foreground font-medium">Drop your thumbnail here</p>
              <p className="text-sm text-muted-foreground">or click to browse files</p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Recommended: 1920x1080px (16:9 ratio), max 5MB
            </p>
          </div>

          {/* URL Input */}
          <div className="relative">
            <Label htmlFor="thumbnail-url" className="text-foreground">Or enter image URL</Label>
            <Input
              id="thumbnail-url"
              value={state.data?.thumbnail || ""}
              onChange={(e) => handleInputChange("thumbnail", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-2"
            />
          </div>

          {/* Preview */}
          {state.data?.thumbnail && (
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Preview</Label>
              <div className="relative inline-block w-full max-w-md">
                <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={state.data.thumbnail}
                    alt="Course thumbnail preview"
                    className="w-full h-auto object-contain max-h-64"
                    onError={() => {
                      console.error("Failed to load thumbnail image");
                      handleInputChange("thumbnail", "");
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log("Thumbnail loaded successfully", {
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3)
                      });
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 shadow-lg"
                    onClick={() => handleInputChange("thumbnail", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Thumbnail preview • Click X to remove
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseContentForm() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const { state, updateData, saveCourse } = useCourseCreation();
  
  // Debug: Log current state
  console.log("🔥 CourseContentForm render - current state.data:", state.data);

  const handleBack = () => {
    router.push(`/store/${storeId}/course/create?step=checkout`);
  };

  const handleNext = () => {
    // Check if basic info is complete before proceeding
    const isBasicInfoComplete = state.data?.title && state.data?.description && 
                               state.data?.category && state.data?.skillLevel;
    
    if (!isBasicInfoComplete) {
      console.warn("Basic course information incomplete");
      return;
    }
    
    router.push(`/store/${storeId}/course/create?step=options`);
  };

  const handleModulesDataChange = (data: any) => {
    console.log("🔥 CourseContentForm received modules data change:", data);
    console.log("🔥 Current context state.data:", state.data);
    // Pass through ALL data from CreateCourseForm, don't filter it
    console.log("🔥 Updating context with complete data:", data);
    updateData("course", data);
  };

  const isValid = state.data?.title && state.data?.description && 
                 state.data?.category && state.data?.skillLevel;

  return (
    <div className="space-y-8">
      {/* Course Basic Information */}
      <CourseBasicInfoCard />
      
      {/* Course Thumbnail */}
      <CourseThumbnailCard />
      
      {/* Course Content Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCourseForm 
            initialData={state.data}
            onDataChange={handleModulesDataChange}
            disableSubmit={true}
            hideBasicInfo={true}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Checkout
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={saveCourse}
            disabled={state.isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {state.isSaving ? "Saving..." : "Save Course"}
          </Button>
        
          <Button 
            onClick={handleNext} 
            disabled={!isValid}
            className="gap-2"
          >
            Continue to Options
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 