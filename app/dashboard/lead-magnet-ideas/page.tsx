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
import { Loader2, Sparkles, Image, FileText, Zap, ChevronDown, ChevronUp, CheckCircle2, Search, Brain, ArrowLeft } from "lucide-react";
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
const coursesApi = api.courses as any;
const leadMagnetApi = api.masterAI.leadMagnetAnalyzer as any;

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

function VisualIdeaCard({ idea, index }: { idea: VisualIdea; index: number }) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
          <Badge variant="outline" className={cn("text-xs", importanceColors[idea.importance])}>
            {idea.importance}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[idea.category] || idea.category}
          </Badge>
        </div>
        <ScoreIndicator score={idea.leadMagnetPotential} />
      </div>

      <h4 className="font-medium text-sm mb-2 line-clamp-2">{idea.sentenceOrConcept}</h4>
      
      <p className="text-sm text-muted-foreground mb-3">{idea.visualDescription}</p>

      <div className="flex items-center gap-2">
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

function ChapterCard({ chapter, isExpanded, onToggle }: { 
  chapter: ChapterAnalysis; 
  isExpanded: boolean;
  onToggle: () => void;
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
              .map((idea, i) => (
                <VisualIdeaCard key={i} idea={idea} index={i} />
              ))}
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

  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Fetch user's courses (using clerkId)
  const courses = useQuery(
    coursesApi.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  ) as Array<{ _id: string; title: string }> | undefined;

  // Actions
  const analyzeAction = useAction(leadMagnetApi.analyzeLeadMagnetOpportunities);
  const searchAction = useAction(leadMagnetApi.findSimilarVisualIdeas);

  const handleAnalyze = async () => {
    if (!selectedCourse) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setSearchResults(null);
    
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Lead Magnet Visual Ideas
        </h1>
        <p className="text-muted-foreground">
          Analyze your course chapters to discover visual illustration opportunities for lead magnets and PDF resources.
        </p>
      </div>

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
            <div className="space-y-4">
              {analysis.chapters
                .sort((a, b) => b.overallLeadMagnetScore - a.overallLeadMagnetScore)
                .map((chapter) => (
                  <div key={chapter.chapterId} id={`chapter-${chapter.chapterId}`}>
                    <ChapterCard
                      chapter={chapter}
                      isExpanded={expandedChapters.has(chapter.chapterId)}
                      onToggle={() => toggleChapter(chapter.chapterId)}
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

