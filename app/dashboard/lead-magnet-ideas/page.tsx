/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Image, ImagePlus, FileText, Zap, ChevronDown, ChevronUp, CheckCircle2, Search, Brain, ArrowLeft, Download, Check, X, RefreshCw, Save, FolderOpen, Trash2, Clock, MoreVertical, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

// Store API references to avoid TypeScript deep instantiation issues
const usersApi = api.users as any;
const coursesApi = api.courses as any;
const leadMagnetApi = api.masterAI.leadMagnetAnalyzer as any;
const savedAnalysesApi = api.leadMagnetAnalysisMutations as any;

type VisualCategory = "concept_diagram" | "process_flow" | "comparison" | "equipment_setup" | "waveform_visual" | "ui_screenshot" | "metaphor" | "example";

type VisualIdea = {
  sentenceOrConcept: string;
  visualDescription: string;
  illustrationPrompt: string;
  importance: "critical" | "helpful" | "optional";
  category: VisualCategory;
  leadMagnetPotential: number;
  estimatedPosition: number;
  embedding?: number[];
  embeddingText?: string;
};

type ChapterAnalysis = {
  chapterId: string;
  chapterTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
  wordCount: number;
  visualIdeas: VisualIdea[];
  overallLeadMagnetScore: number;
  leadMagnetSuggestions: string[];
  keyTopics: string[];
};

type CourseLeadMagnetAnalysis = {
  courseId: string;
  courseTitle: string;
  totalChapters: number;
  analyzedChapters: number;
  totalVisualIdeas: number;
  chapters: ChapterAnalysis[];
  topLeadMagnetCandidates: Array<{
    chapterId: string;
    chapterTitle: string;
    score: number;
    reason: string;
  }>;
  bundleIdeas: Array<{
    name: string;
    description: string;
    chapterIds: string[];
    estimatedVisuals: number;
  }>;
  analysisTimestamp: number;
};

const categoryLabels: Record<string, string> = {
  concept_diagram: "Concept Diagram",
  process_flow: "Process Flow",
  comparison: "Comparison",
  equipment_setup: "Equipment Setup",
  waveform_visual: "Waveform Visual",
  ui_screenshot: "UI Screenshot",
  metaphor: "Metaphor",
  example: "Example",
};

const importanceColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  helpful: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  optional: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

function ScoreIndicator({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 8) return "bg-green-500";
    if (s >= 6) return "bg-amber-500";
    if (s >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-4 rounded-sm transition-colors",
              i < score ? getColor(score) : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{score}/10</span>
    </div>
  );
}

function VisualIdeaCard({ 
  idea, 
  index, 
  onGenerateImage, 
  onAcceptImage,
  onRejectImage,
  generatedImage, 
  isGenerating,
  isSaving,
  isSaved,
}: { 
  idea: VisualIdea; 
  index: number;
  onGenerateImage: (idea: VisualIdea, index: number) => void;
  onAcceptImage: (index: number) => void;
  onRejectImage: (index: number) => void;
  generatedImage?: string;
  isGenerating?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `visual-idea-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-card transition-colors",
      isSaved && "border-green-500/50 bg-green-500/5"
    )}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
          <Badge variant="outline" className={cn("text-xs", importanceColors[idea.importance])}>
            {idea.importance}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[idea.category] || idea.category}
          </Badge>
          {isSaved && (
            <Badge className="text-xs bg-green-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        <ScoreIndicator score={idea.leadMagnetPotential} />
      </div>

      <h4 className="font-medium text-sm mb-2 line-clamp-2">{idea.sentenceOrConcept}</h4>
      
      <p className="text-sm text-muted-foreground mb-3">{idea.visualDescription}</p>

      {/* Generated Image Display */}
      {generatedImage && (
        <div className="mb-4 rounded-lg overflow-hidden border bg-muted/20">
          <img 
            src={generatedImage} 
            alt={idea.sentenceOrConcept}
            className="w-full h-auto max-h-[300px] object-contain"
          />
          <div className="p-2 flex justify-between gap-2 border-t bg-muted/10">
            {!isSaved ? (
              <>
                {/* Review Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAcceptImage(index)}
                    disabled={isSaving}
                    className="text-xs bg-green-500 hover:bg-green-600"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Accept & Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRejectImage(index)}
                    disabled={isSaving}
                    className="text-xs border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </>
            ) : (
              <div className="flex gap-2 w-full justify-between">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Image saved with embeddings
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-xs"
        >
          {showPrompt ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {showPrompt ? "Hide Prompt" : "View AI Prompt"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard.writeText(idea.illustrationPrompt)}
          className="text-xs"
        >
          Copy Prompt
        </Button>
        {(!generatedImage || isSaved) && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onGenerateImage(idea, index)}
            disabled={isGenerating}
            className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : isSaved ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </>
            ) : (
              <>
                <ImagePlus className="w-3 h-3 mr-1" />
                Generate Image
              </>
            )}
          </Button>
        )}
      </div>

      {showPrompt && (
        <div className="mt-3 p-3 bg-muted/50 rounded-md">
          <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
            {idea.illustrationPrompt}
          </p>
        </div>
      )}
    </div>
  );
}

function ChapterCard({ 
  chapter, 
  isExpanded, 
  onToggle,
  onGenerateImage,
  onAcceptImage,
  onRejectImage,
  generatedImages,
  generatingIndex,
  savingIndex,
  savedImages,
}: { 
  chapter: ChapterAnalysis; 
  isExpanded: boolean;
  onToggle: () => void;
  onGenerateImage: (idea: VisualIdea, chapterId: string, index: number, chapterTitle?: string) => void;
  onAcceptImage: (chapterId: string, index: number, idea: VisualIdea) => void;
  onRejectImage: (chapterId: string, index: number) => void;
  generatedImages: Record<string, string>;
  generatingIndex: string | null;
  savingIndex: string | null;
  savedImages: Set<string>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{chapter.chapterTitle}</CardTitle>
            {chapter.moduleTitle && (
              <CardDescription>
                {chapter.moduleTitle} {chapter.lessonTitle && `→ ${chapter.lessonTitle}`}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Image className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{chapter.visualIdeas.length} visuals</span>
              </div>
              <ScoreIndicator score={chapter.overallLeadMagnetScore} />
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {chapter.keyTopics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {chapter.keyTopics.map((topic, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="border-t bg-muted/30">
          {chapter.leadMagnetSuggestions.length > 0 && (
            <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Lead Magnet Ideas
              </h4>
              <ul className="space-y-1">
                {chapter.leadMagnetSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h4 className="font-medium text-sm mb-4">Visual Opportunities ({chapter.visualIdeas.length})</h4>
          <div className="grid gap-4">
            {chapter.visualIdeas
              .sort((a, b) => b.leadMagnetPotential - a.leadMagnetPotential)
              .map((idea, i) => {
                const imageKey = `${chapter.chapterId}-${i}`;
                return (
                  <VisualIdeaCard 
                    key={i} 
                    idea={idea} 
                    index={i}
                    onGenerateImage={(ideaToGen, idx) => onGenerateImage(ideaToGen, chapter.chapterId, idx, chapter.chapterTitle)}
                    onAcceptImage={(idx) => onAcceptImage(chapter.chapterId, idx, idea)}
                    onRejectImage={(idx) => onRejectImage(chapter.chapterId, idx)}
                    generatedImage={generatedImages[imageKey]}
                    isGenerating={generatingIndex === imageKey}
                    isSaving={savingIndex === imageKey}
                    isSaved={savedImages.has(imageKey)}
                  />
                );
              })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function LeadMagnetIdeasPage() {
  const { user } = useUser();

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [analysis, setAnalysis] = useState<CourseLeadMagnetAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [maxChapters, setMaxChapters] = useState<number | undefined>(undefined);
  const [generateEmbeddings, setGenerateEmbeddings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    visualIdea: VisualIdea;
    chapterId: string;
    chapterTitle: string;
    similarityScore: number;
  }> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Image generation state
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingIndex, setGeneratingIndex] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Image save state
  const [savingIndex, setSavingIndex] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Analysis save/load state
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [saveAnalysisName, setSaveAnalysisName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loadedAnalysisId, setLoadedAnalysisId] = useState<string | null>(null);
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false);

  // Get Convex user
  const convexUser = useQuery(
    usersApi.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Fetch user's courses (using clerkId)
  const courses = useQuery(
    coursesApi.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  ) as Array<{ _id: string; title: string }> | undefined;

  // Fetch saved analyses
  const savedAnalyses = useQuery(
    savedAnalysesApi.getUserAnalyses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  ) as Array<{
    _id: string;
    courseId: string;
    courseTitle: string;
    name: string;
    totalChapters: number;
    totalVisualIdeas: number;
    avgLeadMagnetScore: number;
    createdAt: number;
  }> | undefined;

  // Mutations for saving/deleting analyses
  const saveAnalysisMutation = useMutation(savedAnalysesApi.saveAnalysis);
  const deleteAnalysisMutation = useMutation(savedAnalysesApi.deleteAnalysis);
  const updateAnalysisNameMutation = useMutation(savedAnalysesApi.updateAnalysisName);

  // Actions
  const analyzeAction = useAction(leadMagnetApi.analyzeLeadMagnetOpportunities);
  const searchAction = useAction(leadMagnetApi.findSimilarVisualIdeas);
  const generateImageAction = useAction(leadMagnetApi.generateVisualImage);
  const saveImageAction = useAction(leadMagnetApi.saveAcceptedImage);

  const handleGenerateImage = async (
    idea: VisualIdea,
    chapterId: string,
    visualIndex: number,
    chapterTitle?: string
  ) => {
    const imageKey = `${chapterId}-${visualIndex}`;
    setGeneratingIndex(imageKey);
    setImageError(null);
    
    try {
      // Pass rich context for better image generation (taking advantage of 65K context)
      const result = await generateImageAction({
        prompt: idea.illustrationPrompt,
        chapterId,
        visualIndex,
        // Enhanced context for richer prompts
        visualDescription: idea.visualDescription,
        sentenceOrConcept: idea.sentenceOrConcept,
        category: idea.category,
        chapterTitle,
        courseTitle: analysis?.courseTitle,
        importance: idea.importance,
      }) as { success: boolean; imageData?: string; imageUrl?: string; error?: string };
      
      if (result.success && (result.imageData || result.imageUrl)) {
        setGeneratedImages(prev => ({
          ...prev,
          [imageKey]: result.imageUrl || result.imageData || "",
        }));
      } else {
        setImageError(result.error || "Failed to generate image");
        console.error("Image generation failed:", result.error);
      }
    } catch (error) {
      console.error("Image generation error:", error);
      setImageError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setGeneratingIndex(null);
    }
  };

  const handleAcceptImage = async (chapterId: string, visualIndex: number, idea: VisualIdea) => {
    const imageKey = `${chapterId}-${visualIndex}`;
    const imageData = generatedImages[imageKey];
    
    if (!imageData || !convexUser?._id || !analysis) return;
    
    setSavingIndex(imageKey);
    setSaveError(null);
    
    try {
      const result = await saveImageAction({
        userId: convexUser._id,
        chapterId,
        courseId: analysis.courseId,
        sentenceOrConcept: idea.sentenceOrConcept,
        visualDescription: idea.visualDescription,
        illustrationPrompt: idea.illustrationPrompt,
        category: idea.category,
        imageData,
      }) as { success: boolean; illustrationId?: string; imageUrl?: string; error?: string };
      
      if (result.success) {
        setSavedImages(prev => new Set([...prev, imageKey]));
        // Update the generated image URL if we got a new one from storage
        if (result.imageUrl) {
          setGeneratedImages(prev => ({
            ...prev,
            [imageKey]: result.imageUrl!,
          }));
        }
      } else {
        setSaveError(result.error || "Failed to save image");
        console.error("Image save failed:", result.error);
      }
    } catch (error) {
      console.error("Image save error:", error);
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleRejectImage = (chapterId: string, visualIndex: number) => {
    const imageKey = `${chapterId}-${visualIndex}`;
    // Remove the generated image
    setGeneratedImages(prev => {
      const next = { ...prev };
      delete next[imageKey];
      return next;
    });
    // Also remove from saved if it was saved (shouldn't happen but just in case)
    setSavedImages(prev => {
      const next = new Set(prev);
      next.delete(imageKey);
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (!selectedCourse) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setSearchResults(null);
    // Clear image state for new analysis
    setGeneratedImages({});
    setSavedImages(new Set());
    setImageError(null);
    setSaveError(null);
    
    try {
      const result = await analyzeAction({
        courseId: selectedCourse as Id<"courses">,
        maxChapters,
        generateEmbeddings,
      }) as CourseLeadMagnetAnalysis;
      setAnalysis(result);
      // Expand the first chapter by default
      if (result.chapters.length > 0) {
        setExpandedChapters(new Set([result.chapters[0].chapterId]));
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = async () => {
    if (!analysis || !searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchAction({
        query: searchQuery,
        analysisResults: analysis as any,
        topK: 10,
        minScore: 0.3,
      }) as Array<{
        visualIdea: VisualIdea;
        chapterId: string;
        chapterTitle: string;
        similarityScore: number;
      }>;
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Save current analysis
  const handleSaveAnalysis = async () => {
    if (!analysis || !convexUser?.clerkId || !saveAnalysisName.trim()) return;
    
    setIsSavingAnalysis(true);
    try {
      // Calculate average lead magnet score from chapters
      const avgScore = analysis.chapters.length > 0
        ? analysis.chapters.reduce((sum, ch) => sum + ch.overallLeadMagnetScore, 0) / analysis.chapters.length
        : 0;
      
      const analysisId = await saveAnalysisMutation({
        userId: convexUser.clerkId,
        courseId: analysis.courseId as Id<"courses">,
        courseTitle: analysis.courseTitle,
        name: saveAnalysisName.trim(),
        analysisResult: {
          courseId: analysis.courseId,
          courseTitle: analysis.courseTitle,
          totalChapters: analysis.totalChapters,
          totalVisualIdeas: analysis.totalVisualIdeas,
          avgLeadMagnetScore: avgScore,
          chapters: analysis.chapters,
          bundleIdeas: analysis.bundleIdeas,
        },
      });
      
      setLoadedAnalysisId(analysisId);
      setShowSaveDialog(false);
      setSaveAnalysisName("");
    } catch (error) {
      console.error("Failed to save analysis:", error);
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  // Load a saved analysis
  const handleLoadAnalysis = async (savedAnalysis: {
    _id: string;
    courseId: string;
    courseTitle: string;
    name: string;
    totalChapters: number;
    totalVisualIdeas: number;
    avgLeadMagnetScore: number;
  }) => {
    // We need to fetch the full analysis data
    try {
      const fullAnalysis = await fetch(`/api/lead-magnet-analysis/${savedAnalysis._id}`).then(res => res.json());
      if (fullAnalysis) {
        // Convert saved format to CourseLeadMagnetAnalysis format
        // Generate topLeadMagnetCandidates from chapters
        const topCandidates = fullAnalysis.chapters
          .filter((ch: ChapterAnalysis) => ch.overallLeadMagnetScore >= 7)
          .sort((a: ChapterAnalysis, b: ChapterAnalysis) => b.overallLeadMagnetScore - a.overallLeadMagnetScore)
          .slice(0, 5)
          .map((ch: ChapterAnalysis) => ({
            chapterId: ch.chapterId,
            chapterTitle: ch.chapterTitle,
            score: ch.overallLeadMagnetScore,
            reason: ch.leadMagnetSuggestions[0] || "High visual potential",
          }));

        setAnalysis({
          courseId: fullAnalysis.courseId,
          courseTitle: fullAnalysis.courseTitle,
          totalChapters: fullAnalysis.totalChapters,
          analyzedChapters: fullAnalysis.chapters.length,
          totalVisualIdeas: fullAnalysis.totalVisualIdeas,
          chapters: fullAnalysis.chapters,
          topLeadMagnetCandidates: topCandidates,
          bundleIdeas: fullAnalysis.bundleIdeas || [],
          analysisTimestamp: fullAnalysis.createdAt || Date.now(),
        });
        setSelectedCourse(savedAnalysis.courseId);
        setLoadedAnalysisId(savedAnalysis._id);
        setShowSavedAnalyses(false);
        // Expand first chapter
        if (fullAnalysis.chapters.length > 0) {
          setExpandedChapters(new Set([fullAnalysis.chapters[0].chapterId]));
        }
        // Clear image state
        setGeneratedImages({});
        setSavedImages(new Set());
      }
    } catch (error) {
      console.error("Failed to load analysis:", error);
    }
  };

  // Delete a saved analysis
  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      await deleteAnalysisMutation({
        analysisId: analysisId as Id<"leadMagnetAnalyses">,
      });
      if (loadedAnalysisId === analysisId) {
        setLoadedAnalysisId(null);
      }
    } catch (error) {
      console.error("Failed to delete analysis:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to analyze courses</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Back to Dashboard */}
      <Link 
        href="/dashboard?mode=create" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Lead Magnet Visual Ideas
          </h1>
          <p className="text-muted-foreground">
            Analyze your course chapters to discover visual illustration opportunities for lead magnets and PDF resources.
          </p>
        </div>
        
        {/* Saved Analyses Button */}
        {savedAnalyses && savedAnalyses.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowSavedAnalyses(!showSavedAnalyses)}
            className="shrink-0"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Saved ({savedAnalyses.length})
          </Button>
        )}
      </div>

      {/* Saved Analyses Panel */}
      {showSavedAnalyses && savedAnalyses && savedAnalyses.length > 0 && (
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Saved Analyses
            </CardTitle>
            <CardDescription>
              Click on an analysis to load it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {savedAnalyses.map((saved) => (
                <div
                  key={saved._id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    loadedAnalysisId === saved._id 
                      ? "bg-primary/10 border-primary" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleLoadAnalysis(saved)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{saved.name}</span>
                      {loadedAnalysisId === saved._id && (
                        <Badge variant="secondary" className="text-xs">Loaded</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{saved.courseTitle}</span>
                      <span>•</span>
                      <span>{saved.totalVisualIdeas} visuals</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(saved.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnalysis(saved._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Select Course to Analyze</CardTitle>
          <CardDescription>
            Choose a course to analyze its chapters for visual lead magnet opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {courses?.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Select 
                value={maxChapters?.toString() || "all"} 
                onValueChange={(v) => setMaxChapters(v === "all" ? undefined : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chapters to analyze" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="all">All chapters</SelectItem>
                  <SelectItem value="2">First 2 chapters</SelectItem>
                  <SelectItem value="5">First 5 chapters</SelectItem>
                  <SelectItem value="10">First 10 chapters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={!selectedCourse || isAnalyzing}
              className="min-w-[140px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze Course
                </>
              )}
            </Button>
          </div>

          {/* Embedding toggle */}
          <div className="flex items-center gap-3 pt-4 border-t mt-4">
            <Switch
              id="embeddings"
              checked={generateEmbeddings}
              onCheckedChange={setGenerateEmbeddings}
            />
            <Label htmlFor="embeddings" className="flex items-center gap-2 cursor-pointer">
              <Brain className="w-4 h-4 text-primary" />
              <span>Generate embeddings for semantic search</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              (enables finding similar visuals)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-8">
          {/* Header with Save Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Analysis: {analysis.courseTitle}</h2>
              {loadedAnalysisId && (
                <p className="text-sm text-muted-foreground">Loaded from saved analysis</p>
              )}
            </div>
            
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Save className="w-4 h-4" />
                  {loadedAnalysisId ? "Save As New" : "Save Analysis"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-black">
                <DialogHeader>
                  <DialogTitle>Save Analysis</DialogTitle>
                  <DialogDescription>
                    Save this analysis to review later. Give it a memorable name.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="analysis-name">Analysis Name</Label>
                  <Input
                    id="analysis-name"
                    placeholder={`${analysis.courseTitle} - ${new Date().toLocaleDateString()}`}
                    value={saveAnalysisName}
                    onChange={(e) => setSaveAnalysisName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveAnalysis} 
                    disabled={isSavingAnalysis || !saveAnalysisName.trim()}
                  >
                    {isSavingAnalysis ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{analysis.analyzedChapters}</div>
                <div className="text-sm text-muted-foreground">Chapters Analyzed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{analysis.totalVisualIdeas}</div>
                <div className="text-sm text-muted-foreground">Visual Opportunities</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{analysis.topLeadMagnetCandidates.length}</div>
                <div className="text-sm text-muted-foreground">High-Potential Chapters</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{analysis.bundleIdeas.length}</div>
                <div className="text-sm text-muted-foreground">Bundle Ideas</div>
              </CardContent>
            </Card>
          </div>

          {/* Semantic Search */}
          {generateEmbeddings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Semantic Search
                </CardTitle>
                <CardDescription>
                  Find similar visual ideas using natural language (e.g., "diagram showing signal flow" or "comparison chart")
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for visual ideas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-sm">Search Results ({searchResults.length})</h4>
                    {searchResults.map((result, i) => (
                      <div 
                        key={i} 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setExpandedChapters(new Set([result.chapterId]));
                          document.getElementById(`chapter-${result.chapterId}`)?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium text-sm line-clamp-2">{result.visualIdea.sentenceOrConcept}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              From: {result.chapterTitle}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.similarityScore * 100)}% match
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults && searchResults.length === 0 && (
                  <div className="mt-4 text-center py-4 text-muted-foreground">
                    No matching visual ideas found. Try a different search term.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Candidates */}
          {analysis.topLeadMagnetCandidates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Top Lead Magnet Candidates
                </CardTitle>
                <CardDescription>
                  Chapters with the highest potential for standalone PDF resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topLeadMagnetCandidates.map((candidate, i) => (
                    <div 
                      key={candidate.chapterId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setExpandedChapters(new Set([candidate.chapterId]));
                        document.getElementById(`chapter-${candidate.chapterId}`)?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">#{i + 1}</span>
                        <div>
                          <div className="font-medium">{candidate.chapterTitle}</div>
                          <div className="text-sm text-muted-foreground">{candidate.reason}</div>
                        </div>
                      </div>
                      <ScoreIndicator score={candidate.score} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bundle Ideas */}
          {analysis.bundleIdeas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Bundle Ideas
                </CardTitle>
                <CardDescription>
                  Suggested ways to package multiple chapters into comprehensive lead magnets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.bundleIdeas.map((bundle, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium mb-1">{bundle.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{bundle.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {bundle.chapterIds.length} chapters
                        </span>
                        <span className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          ~{bundle.estimatedVisuals} visuals
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chapter Details */}
          <div>
            <h2 className="text-xl font-bold mb-4">Chapter Analysis</h2>
            {(imageError || saveError) && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {imageError && <div>Image generation error: {imageError}</div>}
                {saveError && <div>Save error: {saveError}</div>}
              </div>
            )}
            <div className="space-y-4">
              {analysis.chapters
                .sort((a, b) => b.overallLeadMagnetScore - a.overallLeadMagnetScore)
                .map((chapter) => (
                  <div key={chapter.chapterId} id={`chapter-${chapter.chapterId}`}>
                    <ChapterCard
                      chapter={chapter}
                      isExpanded={expandedChapters.has(chapter.chapterId)}
                      onToggle={() => toggleChapter(chapter.chapterId)}
                      onGenerateImage={handleGenerateImage}
                      onAcceptImage={handleAcceptImage}
                      onRejectImage={handleRejectImage}
                      generatedImages={generatedImages}
                      generatingIndex={generatingIndex}
                      savingIndex={savingIndex}
                      savedImages={savedImages}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Select a course above and click "Analyze Course" to discover visual opportunities 
              for lead magnets and PDF resources.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-2">Analyzing Course Chapters...</h3>
            <p className="text-muted-foreground max-w-md">
              Our AI is reviewing each chapter to identify visual opportunities and lead magnet potential. 
              This may take a minute.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

