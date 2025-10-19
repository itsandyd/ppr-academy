"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Save, Upload, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { useCourseCreation } from "../context";
import { CourseContentManager } from "../components/CourseContentManager";
import { FormFieldWithHelp, courseFieldHelp } from "@/components/ui/form-field-with-help";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { CategorySelector } from "@/components/course/category-selector";

const categoryGroups = {
  "DAWs & Software": [
    "Ableton Live",
    "FL Studio",
    "Logic Pro",
    "Pro Tools",
    "Cubase",
    "Studio One",
    "Reason",
    "Bitwig",
    "Reaper",
  ],
  "Genre Production": [
    "Hip-Hop & Trap",
    "Lo-Fi & Chill Beats",
    "R&B & Soul",
    "Pop & Top 40",
    "Electronic & EDM",
    "House & Deep House",
    "Techno & Minimal",
    "Drum & Bass",
    "Dubstep & Bass Music",
    "Afrobeats & Amapiano",
    "Latin & Reggaeton",
    "Rock & Alternative",
    "Jazz & Neo-Soul",
    "Ambient & Downtempo",
    "Film & Game Scoring",
  ],
  "Production Skills": [
    "Mixing",
    "Mastering",
    "Sound Design",
    "Synthesis",
    "Sampling & Chopping",
    "Drum Programming",
    "Melody & Chord Writing",
    "Arrangement & Structure",
    "Vocal Recording & Editing",
    "Vocal Mixing & Effects",
    "Recording Techniques",
    "Audio Engineering",
  ],
  "Music Fundamentals": [
    "Music Theory",
    "Ear Training",
    "Rhythm & Timing",
    "Scales & Modes",
    "Chord Progressions",
  ],
  "Specific Tools": [
    "Serum",
    "Vital",
    "Omnisphere",
    "Kontakt & Sampling",
    "Native Instruments",
    "Waves Plugins",
    "FabFilter",
    "Izotope",
    "Auto-Tune & Melodyne",
  ],
  "Career & Business": [
    "Email Marketing & Funnels",
    "Marketing & Social Media",
    "Fanbase & Community Building",
    "Release Strategy & Distribution",
    "Playlist Pitching & Promotion",
    "Artist Branding & Identity",
    "Music Business Fundamentals",
    "Monetization & Revenue Streams",
    "Copyright & Licensing",
    "Live Performance & DJing",
  ],
  "Other": [
    "Workflow & Productivity",
    "General Production",
    "Other",
  ],
};

const skillLevels = [
  "Beginner",
  "Intermediate",
  "Advanced", 
  "All Levels"
];

function CourseBasicInfoCard() {
  const { state, updateData } = useCourseCreation();
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    category: false,
    skillLevel: false,
  });
  
  const handleInputChange = (field: string, value: string) => {
    const newData = { ...state.data, [field]: value };
    console.log("🔄 CourseBasicInfoCard updating context with:", { step: "course", data: { [field]: value } });
    updateData("course", { [field]: value });
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: keyof typeof touched, value: any) => {
    return touched[field] && !value;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full text-blue-700 font-medium mb-4 border border-blue-200">
          <Sparkles className="w-4 h-4" />
          Course Information
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your course
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          All fields marked with <span className="text-red-600 font-bold">*</span> are required before you can publish your course.
        </p>
      </div>

      {/* Form Fields - Enhanced with Inline Help */}
      <div className="space-y-8">
        <FormFieldWithHelp
          label="Course Title"
          name="title"
          value={state.data?.title || ""}
          onChange={(value) => handleInputChange("title", value)}
          placeholder="e.g., Mastering Hip-Hop Drums"
          required
          help={courseFieldHelp.title}
          error={getFieldError("title", state.data?.title) ? "Course title is required" : undefined}
        />

        <FormFieldWithHelp
          label="Course Description"
          name="description"
          type="textarea"
          value={state.data?.description || ""}
          onChange={(value) => handleInputChange("description", value)}
          placeholder="Describe what students will learn in this course..."
          required
          help={courseFieldHelp.description}
          error={getFieldError("description", state.data?.description) ? "Course description is required" : undefined}
          rows={6}
        />

        {/* Category, Subcategory & Tags - New Hierarchical System */}
        <CategorySelector
          category={state.data?.category}
          subcategory={state.data?.subcategory}
          tags={state.data?.tags || []}
          title={state.data?.title}
          description={state.data?.description}
          onCategoryChange={(value) => {
            handleInputChange("category", value);
            setTouched(prev => ({ ...prev, category: true }));
          }}
          onSubcategoryChange={(value) => {
            handleInputChange("subcategory", value);
            setTouched(prev => ({ ...prev, subcategory: true }));
          }}
          onTagsChange={(value) => {
            handleInputChange("tags", value);
          }}
          errors={{
            category: getFieldError("category", state.data?.category),
            subcategory: getFieldError("subcategory", state.data?.subcategory),
          }}
        />

        {/* Skill Level */}
        <div className="space-y-3">
          <Label htmlFor="skillLevel" className="text-base font-semibold text-gray-900 flex items-center gap-1">
            Skill Level <span className="text-red-600">*</span>
          </Label>
            <Select 
              value={state.data?.skillLevel || ""} 
              onValueChange={(value) => {
                handleInputChange("skillLevel", value);
                setTouched(prev => ({ ...prev, skillLevel: true }));
              }}
            >
              <SelectTrigger className={`h-14 border-2 rounded-xl text-base ${
                getFieldError("skillLevel", state.data?.skillLevel)
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}>
                <SelectValue placeholder="Select skill level" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {skillLevels.map((level) => (
                  <SelectItem key={level} value={level} className="text-base py-3">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError("skillLevel", state.data?.skillLevel) && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Skill level is required
              </p>
            )}
            {!getFieldError("skillLevel", state.data?.skillLevel) && (
              <p className="text-sm text-gray-500">
                Set expectations by indicating the required skill level for your course.
              </p>
            )}
        </div>
      </div>
    </div>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full text-purple-700 font-medium mb-4 border border-purple-200">
          <Upload className="w-4 h-4" />
          Course Thumbnail
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add a compelling thumbnail
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          A great thumbnail helps students discover your course. You can upload your own or generate one with AI.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 sm:space-y-6">
          {/* AI Generation Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Label className="text-foreground font-medium text-sm">Generate with AI</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !state.data?.title || !state.data?.description}
                className="gap-2 h-10 sm:h-8 w-full sm:w-auto"
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
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border-strong"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2 sm:space-y-3">
              <p className="text-foreground font-medium text-sm sm:text-base">Drop your thumbnail here</p>
              <p className="text-xs sm:text-sm text-muted-foreground">or click to browse files</p>
              <Button variant="outline" size="sm" className="h-10 px-6">
                Choose File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
              Recommended: 1920x1080px (16:9 ratio), max 5MB
            </p>
          </div>

          {/* URL Input */}
          <div className="relative">
            <Label htmlFor="thumbnail-url" className="text-foreground text-sm font-medium">Or enter image URL</Label>
            <Input
              id="thumbnail-url"
              value={state.data?.thumbnail || ""}
              onChange={(e) => handleInputChange("thumbnail", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-2 h-12 text-base"
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
      </div>
    </div>
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
      <CourseContentManager
        modules={state.data?.modules || []}
        onModulesChange={(modules) => handleModulesDataChange({ ...state.data, modules })}
      />

      {/* Navigation */}
      <div className="pt-6 border-t border-border space-y-4">
        {/* Mobile: Stack buttons vertically */}
        <div className="flex flex-col sm:hidden gap-3">
          <Button 
            onClick={handleNext} 
            disabled={!isValid}
            className="gap-2 h-12 order-1"
          >
            Continue to Options
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-3 order-2">
            <Button variant="outline" onClick={handleBack} className="gap-2 h-12 flex-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2 h-12 flex-1"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        
        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex justify-between">
          <Button variant="outline" onClick={handleBack} className="gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back to Checkout
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2 h-10"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save Course"}
            </Button>
          
            <Button 
              onClick={handleNext} 
              disabled={!isValid}
              className="gap-2 h-10"
            >
              Continue to Options
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 