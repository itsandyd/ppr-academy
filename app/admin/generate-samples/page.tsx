"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Music, AlertCircle, CheckCircle2, Play, Download, Package, Zap, Grid3x3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Sample template library (Splice-like)
const SAMPLE_TEMPLATES = {
  drums: [
    { name: "808 Kick Deep", genre: "hip-hop", description: "Deep sub 808 kick drum with heavy punch", tags: ["808", "kick", "sub"], bpm: 95 },
    { name: "Trap Snare", genre: "trap", description: "Crisp trap snare with clap tail", tags: ["snare", "trap", "crisp"], bpm: 140 },
    { name: "Breakbeat 1", genre: "dnb", description: "Classic breakbeat loop broken down", tags: ["breakbeat", "dnb", "loop"], bpm: 175 },
    { name: "Boom Bap Kick", genre: "hip-hop", description: "Punchy boom bap style kick", tags: ["kick", "boom", "hip-hop"], bpm: 90 },
    { name: "House Clap", genre: "house", description: "Deep house clap with reverb", tags: ["clap", "house", "reverb"], bpm: 128 },
    { name: "Techno Hi-Hat", genre: "techno", description: "Tight closed hi-hat for techno", tags: ["hi-hat", "techno", "tight"], bpm: 130 },
  ],
  bass: [
    { name: "Bass Line Funk", genre: "funk", description: "Slap bass funky bass line", tags: ["slap", "funk", "bass"], bpm: 100 },
    { name: "Sub Bass Wobble", genre: "dubstep", description: "Wobbling sub bass with LFO", tags: ["wobble", "dubstep", "sub"], bpm: 140 },
    { name: "House Bass Deep", genre: "house", description: "Deep rolling house bass", tags: ["house", "deep", "rolling"], bpm: 128 },
    { name: "Reggae Bass", genre: "reggae", description: "Roots reggae bassline", tags: ["reggae", "roots", "bass"], bpm: 76 },
    { name: "Synth Bass Retro", genre: "synthwave", description: "Retro synth bass 80s style", tags: ["synth", "retro", "80s"], bpm: 120 },
  ],
  synth: [
    { name: "Synth Lead Bright", genre: "electronic", description: "Bright synth lead with filter sweep", tags: ["lead", "bright", "sweep"], bpm: 120 },
    { name: "Pad Ambient", genre: "ambient", description: "Lush ambient pad with reverb tail", tags: ["pad", "ambient", "lush"], bpm: 80 },
    { name: "Pluck Synthwave", genre: "synthwave", description: "Plucky 80s synth lead", tags: ["pluck", "synthwave", "lead"], bpm: 110 },
    { name: "Keys Electric Piano", genre: "funk", description: "Vintage electric piano keys", tags: ["piano", "keys", "vintage"], bpm: 100 },
    { name: "Bell Pad", genre: "ambient", description: "Ethereal bell pad texture", tags: ["bell", "pad", "ethereal"], bpm: 60 },
  ],
  fx: [
    { name: "Impact Whoosh", genre: "sound-design", description: "Cinematic whoosh impact effect", tags: ["whoosh", "impact", "cinematic"], bpm: null },
    { name: "Laser Zap", genre: "sound-design", description: "Retro laser zap sound effect", tags: ["laser", "zap", "retro"], bpm: null },
    { name: "Sweep Risers", genre: "edm", description: "EDM sweep riser automation", tags: ["riser", "sweep", "edm"], bpm: 128 },
    { name: "Digital Glitch", genre: "glitch", description: "Digital glitch effect texture", tags: ["glitch", "digital", "texture"], bpm: null },
    { name: "Reverse Cymbal", genre: "orchestral", description: "Reversed cymbal swell", tags: ["cymbal", "reverse", "orchestral"], bpm: null },
  ],
  vocals: [
    { name: "Vocal Chops Loop", genre: "edm", description: "Chopped vocal loop", tags: ["chop", "vocal", "loop"], bpm: 128 },
    { name: "Aah Vocal Hit", genre: "pop", description: "Classic aah vocal hit", tags: ["vocal", "hit", "pop"], bpm: 120 },
    { name: "Vocal Stab", genre: "soul", description: "Soul vocal stab", tags: ["stab", "soul", "vocal"], bpm: 100 },
  ],
  melody: [
    { name: "Arpeggiated Synth", genre: "electronic", description: "Fast arpeggiating synth melody", tags: ["arpeggio", "synth", "fast"], bpm: 120 },
    { name: "String Melody", genre: "cinematic", description: "Soaring string melody", tags: ["string", "cinematic", "soaring"], bpm: 90 },
    { name: "Horn Section", genre: "jazz", description: "Jazz horn section melody", tags: ["horn", "jazz", "section"], bpm: 100 },
  ],
  loops: [
    { name: "Lofi Hip Hop Loop", genre: "lofi", description: "Chill lofi hip hop drum loop", tags: ["lofi", "hip-hop", "chill"], bpm: 85 },
    { name: "Funk Loop Break", genre: "funk", description: "Funky breakbeat loop", tags: ["funk", "break", "loop"], bpm: 100 },
    { name: "Ambient Loop", genre: "ambient", description: "Evolving ambient soundscape loop", tags: ["ambient", "evolving", "loop"], bpm: 60 },
  ],
};

export default function GenerateSamplesPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof SAMPLE_TEMPLATES>("drums");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [generatedSamples, setGeneratedSamples] = useState<any[]>([]);
  const [previewSampleId, setPreviewSampleId] = useState<string | null>(null);
  const [publishingSampleId, setPublishingSampleId] = useState<string | null>(null);
  
  // Single generation state
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(2);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("electronic");
  const [category, setCategory] = useState<"fx" | "drums" | "bass" | "synth" | "vocals" | "melody" | "loops" | "one-shots">("fx");
  const [tags, setTags] = useState("");
  const [creditPrice, setCreditPrice] = useState(3);
  const [licenseType, setLicenseType] = useState<"royalty-free" | "exclusive" | "commercial">("royalty-free");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  
  // Publish metadata state
  const [isPublished, setIsPublished] = useState(false);
  const [publishDate, setPublishDate] = useState<Date | null>(null);
  const [publishNotes, setPublishNotes] = useState("");
  
  // Get user's store
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  
  const userStores = useQuery(
    api.stores.getUserStores,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );
  
  const createSample = useMutation(api.samples.createSample);
  const generateSoundEffect = useAction(api.audioGeneration.generateTextToSoundEffect);
  
  const storeId = selectedStoreId || userStores?.[0]?._id;
  
  // Handle template selection
  const toggleTemplate = (templateName: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateName)
        ? prev.filter(t => t !== templateName)
        : [...prev, templateName]
    );
  };
  
  const selectAll = () => {
    const allTemplates = SAMPLE_TEMPLATES[selectedCategory].map(t => t.name);
    setSelectedTemplates(allTemplates);
  };
  
  const deselectAll = () => {
    setSelectedTemplates([]);
  };
  
  // Generate batch samples
  const handleBatchGenerate = async () => {
    if (selectedTemplates.length === 0) {
      toast({
        title: "No templates selected",
        description: "Please select at least one sample template to generate",
        variant: "destructive",
      });
      return;
    }
    
    if (!storeId) {
      toast({
        title: "No store selected",
        description: "Please create or select a store first",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSamples([]);
    setGenerationProgress({ current: 0, total: selectedTemplates.length });
    
    try {
      const generated: any[] = [];
      
      for (let i = 0; i < selectedTemplates.length; i++) {
        const templateName = selectedTemplates[i];
        const template = SAMPLE_TEMPLATES[selectedCategory].find(t => t.name === templateName);
        
        if (!template) continue;
        
        setGenerationProgress({ current: i + 1, total: selectedTemplates.length });
        
        try {
          const result = await generateSoundEffect({
            description: template.description,
            duration: 4, // Default duration for batch
          });
          
            if (result.success && result.audioUrl && result.storageId) {
              // Create sample
              // Note: ElevenLabs doesn't provide BPM/key - these would need separate audio analysis
              const sampleId = await createSample({
                storeId,
                title: template.name,
                description: template.description,
                storageId: result.storageId as any,
                fileUrl: result.audioUrl,
                fileName: `${template.name}.${result.format || "mp3"}`,
                fileSize: result.fileSize || 0,
                duration: 4, // ElevenLabs generates based on prompt, actual duration may vary
                format: result.format || "mp3",
                bpm: undefined, // Would require audio analysis (e.g., music-tempo package)
                key: undefined, // Would require audio analysis (e.g., key-detection package)
                genre: template.genre,
                subGenre: undefined,
                tags: template.tags,
                category: selectedCategory,
                creditPrice: 3,
                licenseType: "royalty-free",
                licenseTerms: "Standard royalty-free license",
                waveformData: undefined, // Could be generated client-side with wavesurfer.js
              });
            
            generated.push({
              id: sampleId,
              title: template.name,
              genre: template.genre,
              category: selectedCategory,
              status: "success",
              audioUrl: result.audioUrl, // Add audioUrl to the sample object
            });
            
            toast({
              title: `✅ ${template.name} generated`,
              description: `${i + 1}/${selectedTemplates.length}`,
            });
          } else {
            generated.push({
              title: template.name,
              status: "failed",
              error: result.error,
            });
          }
        } catch (error: any) {
          generated.push({
            title: template.name,
            status: "failed",
            error: error.message,
          });
        }
      }
      
      setGeneratedSamples(generated);
      setGenerationProgress(null);
      
      const successCount = generated.filter(s => s.status === "success").length;
      toast({
        title: "🎉 Batch generation complete!",
        description: `${successCount}/${selectedTemplates.length} samples created successfully`,
      });
      
    } catch (error: any) {
      console.error("Batch generation error:", error);
      toast({
        title: "Batch generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };
  
  if (!convexUser?.admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground text-center">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => router.push("/admin")} className="mt-6">
              Go to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Sample Library Generator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create entire sample libraries like Splice using AI templates
          </p>
        </div>
        
        {/* Mode Selector */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={mode === "single" ? "default" : "outline"}
            onClick={() => setMode("single")}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Single Sample
          </Button>
          <Button
            variant={mode === "batch" ? "default" : "outline"}
            onClick={() => setMode("batch")}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            Batch Generator
          </Button>
        </div>
        
        {/* Single Mode */}
        {mode === "single" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Single Sample
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Sound Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Deep cinematic boom with reverb, Retro 8-bit laser sound..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                
                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duration: {duration}s</Label>
                  <input
                    type="range"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={duration}
                    onChange={(e) => setDuration(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">0.5 - 30 seconds</p>
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Sample Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Cinematic Impact Boom"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                {/* Category & Genre */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fx">FX / Sound Effects</SelectItem>
                        <SelectItem value="drums">Drums</SelectItem>
                        <SelectItem value="bass">Bass</SelectItem>
                        <SelectItem value="synth">Synth</SelectItem>
                        <SelectItem value="vocals">Vocals</SelectItem>
                        <SelectItem value="melody">Melody</SelectItem>
                        <SelectItem value="loops">Loops</SelectItem>
                        <SelectItem value="one-shots">One-Shots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Input
                      placeholder="e.g., electronic"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="e.g., cinematic, impact, boom, reverb"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                
                {/* Price & License */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Credit Price *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={creditPrice}
                      onChange={(e) => setCreditPrice(parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>License Type *</Label>
                    <Select value={licenseType} onValueChange={(v: any) => setLicenseType(v)}>
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="royalty-free">Royalty-Free</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="exclusive">Exclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                  Generate Sample
                </Button>
              </CardContent>
            </Card>
            
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                {description ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="font-medium mb-2">Description:</p>
                      <p className="text-sm italic">"{description}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Duration:</strong> {duration}s</div>
                      <div><strong>Category:</strong> {category}</div>
                      <div><strong>Genre:</strong> {genre}</div>
                      <div><strong>Price:</strong> {creditPrice} credits</div>
                    </div>
                  </div>
                ) : (
                  <p>Enter a description to see preview</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Batch Mode */}
        {mode === "batch" && (
          <div className="space-y-8">
            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5" />
                  Select Sample Category
                </CardTitle>
                <CardDescription>
                  Choose a category to browse templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.keys(SAMPLE_TEMPLATES).map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      onClick={() => {
                        setSelectedCategory(cat as keyof typeof SAMPLE_TEMPLATES);
                        setSelectedTemplates([]);
                      }}
                      className="capitalize"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Templates Grid */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">
                      {selectedCategory} Samples ({SAMPLE_TEMPLATES[selectedCategory].length})
                    </CardTitle>
                    <CardDescription>
                      Select templates to generate
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={deselectAll}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SAMPLE_TEMPLATES[selectedCategory].map(template => (
                    <Card key={template.name} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedTemplates.includes(template.name)}
                            onCheckedChange={() => toggleTemplate(template.name)}
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {template.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {template.bpm && (
                              <p className="text-xs text-muted-foreground mt-2">🎵 {template.bpm} BPM</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Generation Status */}
            {generationProgress && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <div className="flex-1">
                      <p className="font-semibold">Generating samples...</p>
                      <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {generationProgress.current} of {generationProgress.total} samples
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Results */}
            {generatedSamples.length > 0 && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <CheckCircle2 className="h-5 w-5" />
                    Generation Complete ({generatedSamples.filter(s => s.status === "success").length}/{generatedSamples.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedSamples.map((sample, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        {/* Header with status and toggle */}
                        <button
                          onClick={() => setPreviewSampleId(previewSampleId === `${i}` ? null : `${i}`)}
                          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            {sample.status === "success" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            )}
                            <div className="text-left">
                              <p className="font-medium text-sm">{sample.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {sample.genre} • {sample.category}
                              </p>
                            </div>
                          </div>
                          <Play className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {/* Error message */}
                        {sample.error && (
                          <p className="text-xs text-red-600 mt-2">{sample.error}</p>
                        )}
                        
                        {/* Audio Preview - Expandable */}
                        {previewSampleId === `${i}` && sample.audioUrl && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">🎵 Preview</p>
                              <audio
                                controls
                                className="w-full"
                                controlsList="nodownload"
                                preload="auto"
                              >
                                <source src={sample.audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                            
                            {/* Publish Form */}
                            {publishingSampleId === `${i}` && sample.status === "success" && (
                              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-3">
                                <p className="text-sm font-medium">📦 Publish to Store</p>
                                
                                {/* Store Selection */}
                                <div className="space-y-1">
                                  <Label className="text-xs">Store *</Label>
                                  <Select value={selectedStoreId || userStores?.[0]?._id || ""} onValueChange={setSelectedStoreId}>
                                    <SelectTrigger className="h-8 text-xs bg-white dark:bg-black">
                                      <SelectValue placeholder="Select store" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-black">
                                      {userStores?.map((store) => (
                                        <SelectItem key={store._id} value={store._id}>
                                          {store.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Price & License */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Price (credits) *</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={creditPrice}
                                      onChange={(e) => setCreditPrice(parseInt(e.target.value))}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">License *</Label>
                                    <Select value={licenseType} onValueChange={(v: any) => setLicenseType(v)}>
                                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-black">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white dark:bg-black">
                                        <SelectItem value="royalty-free">Royalty-Free</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                        <SelectItem value="exclusive">Exclusive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPublishingSampleId(null)}
                                    className="text-xs flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="text-xs flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                                    onClick={() => {
                                      toast({
                                        title: "✅ Sample published!",
                                        description: `${sample.title} has been added to your store.`,
                                      });
                                      setPublishingSampleId(null);
                                    }}
                                  >
                                    Publish
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Publish Button */}
                            {publishingSampleId !== `${i}` && sample.status === "success" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPublishingSampleId(`${i}`)}
                                className="w-full text-xs"
                              >
                                📦 Publish to Store
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleBatchGenerate}
                disabled={isGenerating || selectedTemplates.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating {selectedTemplates.length} Samples...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Generate {selectedTemplates.length} Samples
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

