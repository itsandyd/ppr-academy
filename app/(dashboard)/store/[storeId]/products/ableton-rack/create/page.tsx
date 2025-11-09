"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Upload, Music, Waves, Save, Sparkles, Info, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

interface AbletonRackFormData {
  // Basic info
  title: string;
  description: string;
  price: string;
  
  // Ableton-specific
  abletonVersion: string;
  minAbletonVersion: string;
  rackType: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
  effectType: string[];
  macroCount: string;
  cpuLoad: "low" | "medium" | "high";
  complexity: "beginner" | "intermediate" | "advanced";
  fileFormat: "adg" | "adv" | "alp";
  
  // Musical metadata
  genre: string[];
  bpm: string;
  musicalKey: string;
  
  // Dependencies
  requiresMaxForLive: boolean;
  thirdPartyPlugins: string[];
  
  // Files - Upload or URL
  deliveryMethod: "upload" | "url";
  rackFileUrl: string; // If using URL method
  rackFile: File | null; // If using upload method
  coverImage: File | null;
  demoAudio: File | null;
  chainImage: File | null;
  macroScreenshots: File[];
  
  // Additional info
  tags: string[];
  installationNotes: string;
}

const ABLETON_VERSIONS = ["Live 9", "Live 10", "Live 11", "Live 12"];
const EFFECT_TYPES = [
  "Delay", "Reverb", "Distortion", "EQ", "Compression", "Modulation",
  "Filter", "Saturation", "Chorus", "Phaser", "Flanger", "Limiter",
  "Gate", "Transient", "Stereo", "Utility"
];
const GENRES = [
  "Hip Hop", "Trap", "House", "Techno", "Drum & Bass", "Dubstep",
  "Lo-Fi", "Ambient", "Indie", "Rock", "Jazz", "R&B", "Pop", "Electronic"
];

export default function CreateAbletonRackPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  
  const storeId = params.storeId as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Mutations
  const createRack = useMutation(api.abletonRacks.createAbletonRack);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const [formData, setFormData] = useState<AbletonRackFormData>({
    title: "",
    description: "",
    price: "",
    abletonVersion: "Live 12",
    minAbletonVersion: "Live 11",
    rackType: "audioEffect",
    effectType: [],
    macroCount: "8",
    cpuLoad: "medium",
    complexity: "intermediate",
    fileFormat: "adg",
    genre: [],
    bpm: "",
    musicalKey: "",
    requiresMaxForLive: false,
    thirdPartyPlugins: [],
    deliveryMethod: "upload",
    rackFileUrl: "",
    rackFile: null,
    coverImage: null,
    demoAudio: null,
    chainImage: null,
    macroScreenshots: [],
    tags: [],
    installationNotes: "",
  });

  const updateFormData = (updates: Partial<AbletonRackFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFileChange = async (
    field: keyof AbletonRackFormData,
    file: File | null
  ) => {
    updateFormData({ [field]: file });
  };

  const uploadFile = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await response.json();
    return storageId;
  };

  const handleSubmit = async () => {
    if (!convexUser?._id) {
      toast.error("User not found. Please try again.");
      return;
    }

    // Validation
    if (!formData.title || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check delivery method
    if (formData.deliveryMethod === "upload") {
      if (!formData.rackFile) {
        toast.error("Please upload the rack file (.adg, .adv, or .alp)");
        return;
      }
    } else if (formData.deliveryMethod === "url") {
      if (!formData.rackFileUrl || !formData.rackFileUrl.trim()) {
        toast.error("Please provide a download URL for the rack file");
        return;
      }
      // Basic URL validation
      try {
        new URL(formData.rackFileUrl);
      } catch {
        toast.error("Please provide a valid URL");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let rackFileUrl: string | undefined;
      let fileSize: number | undefined;

      // Handle file upload or URL
      if (formData.deliveryMethod === "upload" && formData.rackFile) {
        // Upload files to Convex storage
        const rackFileId = await uploadFile(formData.rackFile);
        rackFileUrl = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${rackFileId}`).then(r => r.url);
        fileSize = formData.rackFile.size / (1024 * 1024); // Convert to MB
      } else if (formData.deliveryMethod === "url") {
        // Use the provided URL
        rackFileUrl = formData.rackFileUrl;
        fileSize = undefined; // File size unknown for external URLs
      }

      // Upload optional files
      const coverImageId = formData.coverImage ? await uploadFile(formData.coverImage) : undefined;
      const demoAudioId = formData.demoAudio ? await uploadFile(formData.demoAudio) : undefined;
      const chainImageId = formData.chainImage ? await uploadFile(formData.chainImage) : undefined;
      
      const macroScreenshotIds = await Promise.all(
        formData.macroScreenshots.map(file => uploadFile(file))
      );

      // Get storage URLs for optional files
      const coverImageUrl = coverImageId ? await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${coverImageId}`).then(r => r.url) : undefined;
      const demoAudioUrl = demoAudioId ? await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${demoAudioId}`).then(r => r.url) : undefined;
      const chainImageUrl = chainImageId ? await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${chainImageId}`).then(r => r.url) : undefined;
      
      const macroScreenshotUrls = await Promise.all(
        macroScreenshotIds.map(id => 
          fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${id}`).then(r => r.url)
        )
      );

      // Create the Ableton rack product
      await createRack({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: coverImageUrl,
        downloadUrl: rackFileUrl,
        storeId,
        userId: user!.id,
        
        // Ableton-specific
        abletonVersion: formData.abletonVersion,
        minAbletonVersion: formData.minAbletonVersion,
        rackType: formData.rackType,
        effectType: formData.effectType.length > 0 ? formData.effectType : undefined,
        macroCount: parseInt(formData.macroCount),
        cpuLoad: formData.cpuLoad,
        genre: formData.genre.length > 0 ? formData.genre : undefined,
        bpm: formData.bpm ? parseFloat(formData.bpm) : undefined,
        musicalKey: formData.musicalKey || undefined,
        requiresMaxForLive: formData.requiresMaxForLive,
        thirdPartyPlugins: formData.thirdPartyPlugins.length > 0 ? formData.thirdPartyPlugins : undefined,
        demoAudioUrl,
        chainImageUrl,
        macroScreenshotUrls: macroScreenshotUrls.length > 0 ? macroScreenshotUrls : undefined,
        complexity: formData.complexity,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        fileFormat: formData.fileFormat,
        fileSize,
        installationNotes: formData.installationNotes || undefined,
      });

      toast.success("Ableton rack created successfully!");
      router.push(`/store/${storeId}/products`);
    } catch (error: any) {
      console.error("Error creating rack:", error);
      toast.error(error.message || "Failed to create rack");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", description: "Title, description, and pricing" },
    { number: 2, title: "Technical Details", description: "Ableton version, rack type, and specs" },
    { number: 3, title: "Files & Assets", description: "Upload rack file and demo materials" },
    { number: 4, title: "Metadata", description: "Genre, tags, and additional info" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl">
              <Waves className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Ableton Rack</h1>
              <p className="text-muted-foreground">
                Share your audio effect racks and presets with producers worldwide
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.number
                        ? "bg-chart-1 border-chart-1 text-white"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-all ${
                      currentStep > step.number ? "bg-chart-1" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && (
              <StepBasicInfo
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            
            {currentStep === 2 && (
              <StepTechnicalDetails
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            
            {currentStep === 3 && (
              <StepFilesAssets
                formData={formData}
                updateFormData={updateFormData}
                handleFileChange={handleFileChange}
              />
            )}
            
            {currentStep === 4 && (
              <StepMetadata
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
          </CardContent>
          
          {/* Navigation */}
          <div className="border-t border-border p-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
            
            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-chart-1 to-chart-2"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Rack
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Step 1: Basic Info
function StepBasicInfo({ formData, updateFormData }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Let's start with the basics. Give your rack a catchy name and describe what makes it special.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Rack Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Vintage Tape Delay Rack"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Give it a descriptive name that tells producers what it does
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe what this rack does, what devices it includes, and how it can be used..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={6}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about included effects, macro controls, and use cases
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">
          Price (USD) <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="19.99"
            value={formData.price}
            onChange={(e) => updateFormData({ price: e.target.value })}
            className="pl-8 text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Set a fair price for your work. Average Ableton racks sell for $15-50.
        </p>
      </div>
    </motion.div>
  );
}

// Step 2: Technical Details
function StepTechnicalDetails({ formData, updateFormData }: any) {
  const [newPlugin, setNewPlugin] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Help producers know if this rack will work with their setup.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="abletonVersion">Ableton Version <span className="text-destructive">*</span></Label>
          <Select
            value={formData.abletonVersion}
            onValueChange={(value) => updateFormData({ abletonVersion: value })}
          >
            <SelectTrigger className="bg-white dark:bg-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {ABLETON_VERSIONS.map(version => (
                <SelectItem key={version} value={version}>{version}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minAbletonVersion">Minimum Version</Label>
          <Select
            value={formData.minAbletonVersion}
            onValueChange={(value) => updateFormData({ minAbletonVersion: value })}
          >
            <SelectTrigger className="bg-white dark:bg-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {ABLETON_VERSIONS.map(version => (
                <SelectItem key={version} value={version}>{version}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rackType">Rack Type <span className="text-destructive">*</span></Label>
        <Select
          value={formData.rackType}
          onValueChange={(value: any) => updateFormData({ rackType: value })}
        >
          <SelectTrigger className="bg-white dark:bg-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-black">
            <SelectItem value="audioEffect">Audio Effect Rack</SelectItem>
            <SelectItem value="instrument">Instrument Rack</SelectItem>
            <SelectItem value="midiEffect">MIDI Effect Rack</SelectItem>
            <SelectItem value="drumRack">Drum Rack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Effect Types</Label>
        <div className="flex flex-wrap gap-2">
          {EFFECT_TYPES.map(effect => (
            <Badge
              key={effect}
              variant={formData.effectType.includes(effect) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                const newEffectTypes = formData.effectType.includes(effect)
                  ? formData.effectType.filter((e: string) => e !== effect)
                  : [...formData.effectType, effect];
                updateFormData({ effectType: newEffectTypes });
              }}
            >
              {effect}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="macroCount">Macro Controls</Label>
          <Input
            id="macroCount"
            type="number"
            min="0"
            max="128"
            value={formData.macroCount}
            onChange={(e) => updateFormData({ macroCount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpuLoad">CPU Load</Label>
          <Select
            value={formData.cpuLoad}
            onValueChange={(value: any) => updateFormData({ cpuLoad: value })}
          >
            <SelectTrigger className="bg-white dark:bg-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="complexity">Complexity</Label>
          <Select
            value={formData.complexity}
            onValueChange={(value: any) => updateFormData({ complexity: value })}
          >
            <SelectTrigger className="bg-white dark:bg-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="maxForLive"
          checked={formData.requiresMaxForLive}
          onCheckedChange={(checked) => updateFormData({ requiresMaxForLive: checked })}
        />
        <Label htmlFor="maxForLive" className="text-sm font-normal cursor-pointer">
          Requires Max for Live
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Third-Party Plugins (Optional)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., FabFilter Pro-Q 3"
            value={newPlugin}
            onChange={(e) => setNewPlugin(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newPlugin.trim()) {
                updateFormData({
                  thirdPartyPlugins: [...formData.thirdPartyPlugins, newPlugin.trim()]
                });
                setNewPlugin("");
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (newPlugin.trim()) {
                updateFormData({
                  thirdPartyPlugins: [...formData.thirdPartyPlugins, newPlugin.trim()]
                });
                setNewPlugin("");
              }
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.thirdPartyPlugins.map((plugin: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-2">
              {plugin}
              <button
                onClick={() => {
                  updateFormData({
                    thirdPartyPlugins: formData.thirdPartyPlugins.filter((_: any, i: number) => i !== index)
                  });
                }}
                className="hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Step 3: Files & Assets
function StepFilesAssets({ formData, updateFormData, handleFileChange }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Files & Demo Assets</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose how to deliver your rack file and upload demo materials to showcase what it can do.
        </p>
      </div>

      {/* Delivery Method Selection */}
      <Card className="border-2 border-chart-1/30">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Rack File Delivery Method <span className="text-destructive">*</span>
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Upload Option */}
              <button
                type="button"
                onClick={() => updateFormData({ deliveryMethod: "upload", rackFileUrl: "" })}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  formData.deliveryMethod === "upload"
                    ? "border-chart-1 bg-chart-1/10"
                    : "border-border hover:border-chart-1/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`p-3 rounded-lg ${
                    formData.deliveryMethod === "upload" ? "bg-chart-1 text-white" : "bg-muted"
                  }`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Upload File</div>
                    <p className="text-xs text-muted-foreground">
                      Upload your .adg, .adv, or .alp file directly
                    </p>
                  </div>
                </div>
                {formData.deliveryMethod === "upload" && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-chart-1 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* URL Option */}
              <button
                type="button"
                onClick={() => updateFormData({ deliveryMethod: "url", rackFile: null })}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  formData.deliveryMethod === "url"
                    ? "border-chart-1 bg-chart-1/10"
                    : "border-border hover:border-chart-1/50"
                }`}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`p-3 rounded-lg ${
                    formData.deliveryMethod === "url" ? "bg-chart-1 text-white" : "bg-muted"
                  }`}>
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">External URL</div>
                    <p className="text-xs text-muted-foreground">
                      Link to Dropbox, Google Drive, or your own hosting
                    </p>
                  </div>
                </div>
                {formData.deliveryMethod === "url" && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-chart-1 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Method */}
      {formData.deliveryMethod === "upload" && (
        <Card className="border-2 border-dashed border-chart-1/50 bg-chart-1/5">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="rackFile" className="text-base font-semibold">
                Upload Rack File (.adg, .adv, or .alp) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rackFile"
                type="file"
                accept=".adg,.adv,.alp"
                onChange={(e) => handleFileChange("rackFile", e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {formData.rackFile && (
                <p className="text-sm text-chart-1 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {formData.rackFile.name} ({(formData.rackFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                File will be securely stored and delivered to customers after purchase
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL Method */}
      {formData.deliveryMethod === "url" && (
        <Card className="border-2 border-dashed border-chart-1/50 bg-chart-1/5">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="rackFileUrl" className="text-base font-semibold">
                Download URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rackFileUrl"
                type="url"
                placeholder="https://www.dropbox.com/s/..."
                value={formData.rackFileUrl}
                onChange={(e) => updateFormData({ rackFileUrl: e.target.value })}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                🔒 Customers will receive this URL after purchase. Make sure it's a direct download link or a page where they can easily download the file.
              </p>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>💡 Pro Tips:</strong>
                  <br />• Use Dropbox, Google Drive, or WeTransfer with public access
                  <br />• Ensure the link won't expire
                  <br />• Test the download link before publishing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Image */}
      <div className="space-y-2">
        <Label htmlFor="coverImage">Cover Image</Label>
        <Input
          id="coverImage"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange("coverImage", e.target.files?.[0] || null)}
        />
        <p className="text-xs text-muted-foreground">
          High-quality image showcasing your rack (recommended: 1200x800px)
        </p>
      </div>

      {/* Demo Audio */}
      <div className="space-y-2">
        <Label htmlFor="demoAudio">Demo Audio (30-second preview)</Label>
        <Input
          id="demoAudio"
          type="file"
          accept="audio/*"
          onChange={(e) => handleFileChange("demoAudio", e.target.files?.[0] || null)}
        />
        <p className="text-xs text-muted-foreground">
          Short audio demo showing the rack in action
        </p>
      </div>

      {/* Device Chain Screenshot */}
      <div className="space-y-2">
        <Label htmlFor="chainImage">Device Chain Screenshot</Label>
        <Input
          id="chainImage"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange("chainImage", e.target.files?.[0] || null)}
        />
        <p className="text-xs text-muted-foreground">
          Screenshot of the device chain in Ableton
        </p>
      </div>

      {/* Macro Screenshots */}
      <div className="space-y-2">
        <Label htmlFor="macroScreenshots">Macro Control Screenshots (Optional)</Label>
        <Input
          id="macroScreenshots"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFileChange("macroScreenshots", files);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Multiple images showing different macro settings
        </p>
      </div>
    </motion.div>
  );
}

// Step 4: Metadata
function StepMetadata({ formData, updateFormData }: any) {
  const [newTag, setNewTag] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Metadata & Tags</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Help producers discover your rack with relevant genres and tags.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Genres</Label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <Badge
              key={genre}
              variant={formData.genre.includes(genre) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                const newGenres = formData.genre.includes(genre)
                  ? formData.genre.filter((g: string) => g !== genre)
                  : [...formData.genre, genre];
                updateFormData({ genre: newGenres });
              }}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bpm">BPM (Optional)</Label>
          <Input
            id="bpm"
            type="number"
            min="20"
            max="300"
            placeholder="e.g., 128"
            value={formData.bpm}
            onChange={(e) => updateFormData({ bpm: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="musicalKey">Musical Key (Optional)</Label>
          <Input
            id="musicalKey"
            placeholder="e.g., C minor"
            value={formData.musicalKey}
            onChange={(e) => updateFormData({ musicalKey: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom tags..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newTag.trim()) {
                updateFormData({
                  tags: [...formData.tags, newTag.trim()]
                });
                setNewTag("");
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (newTag.trim()) {
                updateFormData({
                  tags: [...formData.tags, newTag.trim()]
                });
                setNewTag("");
              }
            }}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-2">
              {tag}
              <button
                onClick={() => {
                  updateFormData({
                    tags: formData.tags.filter((_: any, i: number) => i !== index)
                  });
                }}
                className="hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="installationNotes">Installation Notes (Optional)</Label>
        <Textarea
          id="installationNotes"
          placeholder="Any special instructions for installing or using this rack..."
          value={formData.installationNotes}
          onChange={(e) => updateFormData({ installationNotes: e.target.value })}
          rows={4}
        />
      </div>

      <Card className="bg-muted/50 border-info/50">
        <CardContent className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Ready to publish?</p>
            <p>Your rack will be saved as a draft. You can publish it anytime from your products dashboard.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

