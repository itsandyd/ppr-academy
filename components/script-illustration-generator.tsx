"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ImageIcon, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Search,
  Sparkles,
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ScriptIllustrationGeneratorProps {
  userId: string;
  storeId?: string;
  sourceType?: "course" | "lesson" | "script" | "custom";
  sourceId?: string;
  initialScript?: string;
}

export function ScriptIllustrationGenerator({
  userId,
  storeId,
  sourceType = "custom",
  sourceId,
  initialScript = "",
}: ScriptIllustrationGeneratorProps) {
  const [scriptText, setScriptText] = useState(initialScript);
  const [scriptTitle, setScriptTitle] = useState("");
  const [currentJobId, setCurrentJobId] = useState<Id<"scriptIllustrationJobs"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "search">("generate");

  const generateIllustrations = useMutation(api.scriptIllustrations.generateScriptIllustrations);
  const jobStatus = useQuery(
    api.scriptIllustrationSearch.getJobStatus,
    currentJobId ? { jobId: currentJobId } : "skip"
  );
  const userJobs = useQuery(api.scriptIllustrationSearch.getUserJobs, { userId, limit: 10 });
  const illustrations = useQuery(
    api.scriptIllustrationSearch.getIllustrationsByScript,
    sourceId ? { scriptId: sourceId } : "skip"
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!scriptText.trim()) {
      toast.error("Please enter a script to generate illustrations from");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateIllustrations({
        userId,
        scriptText,
        scriptTitle: scriptTitle || undefined,
        sourceType,
        sourceId,
        storeId,
        generateEmbeddings: true,
        skipEmptySentences: true,
      });

      if (result.success && result.jobId) {
        setCurrentJobId(result.jobId);
        toast.success(`Started generating ${result.totalSentences} illustrations!`);
      } else {
        toast.error(result.error || "Failed to start generation");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate illustrations");
    } finally {
      setIsGenerating(false);
    }
  };

  const sentenceCount = scriptText
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 10).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Script-to-Illustration Generator
          </CardTitle>
          <CardDescription>
            Generate AI illustrations for each sentence in your script using FAL AI and semantic search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="search">Search & Browse</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Script Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Compression"
                  value={scriptTitle}
                  onChange={(e) => setScriptTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="script">Script Content</Label>
                  <Badge variant="outline">
                    ~{sentenceCount} sentences
                  </Badge>
                </div>
                <Textarea
                  id="script"
                  placeholder="Paste your script here... Each sentence will get its own illustration."
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The script will be split into sentences, and each sentence will get an AI-generated illustration
                  based on its content.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !scriptText.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate {sentenceCount} Illustrations
                    </>
                  )}
                </Button>
              </div>

              {/* Current Job Progress */}
              {currentJobId && jobStatus && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {jobStatus.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : jobStatus.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                      )}
                      Generation Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {jobStatus.processedSentences} / {jobStatus.totalSentences}
                        </span>
                        <span className="font-semibold">{jobStatus.progress}%</span>
                      </div>
                      <Progress value={jobStatus.progress} className="h-2" />
                    </div>

                    {jobStatus.failedSentences > 0 && (
                      <div className="text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ {jobStatus.failedSentences} illustration(s) failed
                      </div>
                    )}

                    {jobStatus.status === "completed" && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        ✅ Generation complete! View results in the Search & Browse tab.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <IllustrationSearch userId={userId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      {userJobs && userJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Generation Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userJobs.map((job) => (
                <JobStatusCard
                  key={job._id}
                  job={job}
                  onSelect={() => setCurrentJobId(job._id)}
                  isSelected={currentJobId === job._id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Illustrations */}
      {illustrations && illustrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generated Illustrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {illustrations.map((illustration) => (
                <IllustrationCard key={illustration._id} illustration={illustration} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function JobStatusCard({ job, onSelect, isSelected }: any) {
  const statusColors = {
    pending: "bg-gray-500",
    processing: "bg-blue-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
  };

  const progress = job.totalSentences > 0 
    ? Math.round((job.processedSentences / job.totalSentences) * 100)
    : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm truncate">
          {job.scriptTitle || "Untitled Script"}
        </div>
        <Badge className={statusColors[job.status as keyof typeof statusColors]}>
          {job.status}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          {job.processedSentences} / {job.totalSentences} completed
        </div>
        {job.status === "processing" && (
          <Progress value={progress} className="h-1 mt-1" />
        )}
      </div>
    </button>
  );
}

function IllustrationCard({ illustration }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-muted">
        {illustration.imageUrl ? (
          <Image
            src={illustration.imageUrl}
            alt={illustration.sentence}
            fill
            className="object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsExpanded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge variant="secondary">
            #{illustration.sentenceIndex + 1}
          </Badge>
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <p className="text-xs line-clamp-2">{illustration.sentence}</p>
        
        {illustration.generationStatus === "completed" && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs flex-1"
              onClick={() => setIsExpanded(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs flex-1"
              onClick={() => {
                const link = document.createElement('a');
                link.href = illustration.imageUrl;
                link.download = `illustration-${illustration.sentenceIndex + 1}.png`;
                link.click();
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        )}

        {illustration.generationStatus === "failed" && (
          <div className="text-xs text-red-500">
            Failed: {illustration.generationError}
          </div>
        )}
      </CardContent>

      {/* Expanded View Modal */}
      {isExpanded && illustration.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-black rounded-lg overflow-hidden">
            <Image
              src={illustration.imageUrl}
              alt={illustration.sentence}
              width={1024}
              height={576}
              className="object-contain max-h-[70vh]"
            />
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium">{illustration.sentence}</p>
              <p className="text-xs text-muted-foreground">
                Prompt: {illustration.illustrationPrompt}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function IllustrationSearch({ userId }: { userId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchIllustrations = useMutation(api.scriptIllustrationSearch.searchIllustrations);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);

    try {
      const result = await searchIllustrations({
        query: searchQuery,
        userId,
        limit: 20,
        minSimilarity: 0.6,
      });

      if (result.success) {
        setSearchResults(result.results);
        toast.success(`Found ${result.results.length} matching illustrations`);
      } else {
        toast.error(result.error || "Search failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search illustrations by concept, topic, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((result) => (
            <SearchResultCard key={result.illustrationId} result={result} />
          ))}
        </div>
      )}

      {searchResults.length === 0 && searchQuery && !isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          No illustrations found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }: any) {
  const similarityColor = 
    result.similarity > 0.9 ? "text-green-500" :
    result.similarity > 0.8 ? "text-blue-500" :
    result.similarity > 0.7 ? "text-yellow-500" :
    "text-gray-500";

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <Image
          src={result.imageUrl}
          alt={result.sentence}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className={similarityColor}>
            {Math.round(result.similarity * 100)}% match
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-xs line-clamp-3">{result.sentence}</p>
      </CardContent>
    </Card>
  );
}

