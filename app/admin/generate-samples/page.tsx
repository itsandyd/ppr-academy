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
import { Loader2, Sparkles, Music, AlertCircle, CheckCircle2, Play, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function GenerateSamplesPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"generate" | "metadata">("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{
    filePath: string;
    storageId?: string;
    audioUrl?: string;
    description: string;
    format?: string;
    fileSize?: number;
  } | null>(null);
  const [generatedSample, setGeneratedSample] = useState<any>(null);
  
  // Step 1: Generation form state
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(2);
  
  // Step 2: Metadata form state
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("electronic");
  const [category, setCategory] = useState<"fx" | "drums" | "bass" | "synth" | "vocals" | "melody" | "loops" | "one-shots">("fx");
  const [tags, setTags] = useState("");
  const [creditPrice, setCreditPrice] = useState(10);
  const [licenseType, setLicenseType] = useState<"royalty-free" | "exclusive" | "commercial">("royalty-free");
  
  // Get user's store
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  
  const userStores = useQuery(
    api.stores.getUserStores,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );
  
  const createStore = useMutation(api.stores.createStore);
  
  const storeId = userStores?.[0]?._id;
  
  // Auto-create a store if user doesn't have one
  const ensureStore = async () => {
    if (!convexUser) return null;
    
    if (userStores && userStores.length === 0) {
      console.log("📦 Creating default store for user...");
      try {
        const newStoreId = await createStore({
          name: `${convexUser.name || convexUser.email}'s Store`,
          userId: convexUser._id,
        });
        console.log("✅ Store created:", newStoreId);
        return newStoreId;
      } catch (error) {
        console.error("Failed to create store:", error);
        return null;
      }
    }
    
    return storeId || null;
  };
  
  // Actions
  const generateAudioOnly = useAction(api.audioGeneration.generateAudioOnly);
  const saveSampleToMarketplace = useAction(api.audioGeneration.saveSampleToMarketplace);
  
  // Step 1: Generate audio
  const handleGenerateAudio = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the sound effect you want to create",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await generateAudioOnly({
        description,
        duration,
      });
      
      if (!result.success || !result.filePath) {
        throw new Error(result.error || "Failed to generate audio");
      }
      
      setGeneratedAudio({
        filePath: result.filePath || "",
        storageId: result.storageId,
        audioUrl: result.audioUrl,
        format: result.format || "mp3",
        fileSize: result.fileSize || 0,
        description,
      });
      
      // Auto-suggest a title from description
      const suggestedTitle = description
        .split(" ")
        .slice(0, 5)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setTitle(suggestedTitle);
      
      setStep("metadata");
      
      toast({
        title: "✨ Audio generated!",
        description: "Preview your sound and add metadata to publish it.",
      });
      
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Step 2: Save to marketplace
  const handleSaveToMarketplace = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the sample",
        variant: "destructive",
      });
      return;
    }
    
    if (!convexUser || !generatedAudio) {
      toast({
        title: "Missing information",
        description: "User or audio data missing. Please try regenerating.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure user has a store (create if needed)
    const finalStoreId = await ensureStore();
    
    if (!finalStoreId) {
      toast({
        title: "Store creation failed",
        description: "Could not create or find your store. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (!generatedAudio.storageId || !generatedAudio.audioUrl) {
        throw new Error("Audio not properly uploaded. Please regenerate.");
      }
      
      const result = await saveSampleToMarketplace({
        userId: convexUser._id,
        storeId: finalStoreId,
        storageId: generatedAudio.storageId as any,
        audioUrl: generatedAudio.audioUrl,
        title,
        description: generatedAudio.description,
        duration,
        format: generatedAudio.format || "mp3",
        fileSize: generatedAudio.fileSize || 0,
        genre,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        creditPrice,
        licenseType,
      });
      
      setGeneratedSample(result);
      
      toast({
        title: "🎉 Sample published!",
        description: `"${title}" is now available in your marketplace.`,
      });
      
      // Reset everything
      setStep("generate");
      setDescription("");
      setTitle("");
      setTags("");
      setGeneratedAudio(null);
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save sample. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Sample Generator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create professional sound effects using AI and sell them in your marketplace
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 1: Generation Form */}
          {step === "generate" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Step 1: Generate Audio
                </CardTitle>
                <CardDescription>
                  Describe the sound effect you want to create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Sound Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Deep cinematic boom with reverb, Retro 8-bit laser sound, Ambient forest with birds chirping..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific! Include details about tone, mood, and characteristics.
                  </p>
                </div>
                
                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="duration"
                      type="number"
                      min={0.5}
                      max={5}
                      step={0.5}
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value))}
                      disabled={isGenerating}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      {duration}s (0.5 - 5 seconds)
                    </span>
                  </div>
                </div>
                
                {/* Generate Button */}
                <Button
                  onClick={handleGenerateAudio}
                  disabled={isGenerating || !description}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Preview the audio first, then add pricing and metadata
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Step 2: Metadata Form */}
          {step === "metadata" && generatedAudio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Step 2: Add Metadata & Publish
                </CardTitle>
                <CardDescription>
                  Configure pricing and publish to marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Preview */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm font-medium mb-2">🎵 Generated Audio Preview</p>
                  <p className="text-sm text-muted-foreground mb-3 italic">"{generatedAudio.description}"</p>
                  {generatedAudio.audioUrl ? (
                    <div className="space-y-2">
                      <audio controls className="w-full" preload="auto">
                        <source src={generatedAudio.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <p className="text-xs text-muted-foreground text-center">
                        ✨ Listen to your sample and adjust metadata below
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded border border-dashed">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm text-muted-foreground">Preparing audio preview...</span>
                    </div>
                  )}
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Sample Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Cinematic Impact Boom"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                
                {/* Category & Genre */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)} disabled={isSaving}>
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
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      placeholder="e.g., electronic"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                
                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., cinematic, impact, boom, reverb"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                
                {/* Price & License */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Credit Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min={1}
                      value={creditPrice}
                      onChange={(e) => setCreditPrice(parseInt(e.target.value))}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="license">License Type</Label>
                    <Select value={licenseType} onValueChange={(v: any) => setLicenseType(v)} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="royalty-free">Royalty-Free</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="exclusive">Exclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("generate");
                      setGeneratedAudio(null);
                    }}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleSaveToMarketplace}
                    disabled={isSaving || !title}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Publish to Marketplace
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Preview & Result */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Sample</CardTitle>
              <CardDescription>
                Preview and manage your generated sound effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedSample ? (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <Music className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{generatedSample.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{generatedSample.category}</Badge>
                          <Badge variant="outline">{generatedSample.genre}</Badge>
                          <Badge variant="outline">{generatedSample.creditPrice} credits</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {generatedSample.description || "No description"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {generatedSample.tags?.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Sample Created Successfully
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Ready to sell in your marketplace
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/store/${storeId}/products`)}
                      className="flex-1"
                    >
                      <Music className="h-4 w-4 mr-2" />
                      View in Store
                    </Button>
                    <Button
                      onClick={() => setGeneratedSample(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Create Another
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No samples generated yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Fill in the form and click "Generate Sample" to create AI-powered sound effects
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

