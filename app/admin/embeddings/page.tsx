"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/lib/convex-api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  ArrowUpCircle,
  BookOpen,
  Video,
  Package,
  FileText,
  Globe,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Content type configuration
const CONTENT_TYPES = [
  { id: "courseContent", label: "Course Content", icon: BookOpen, description: "All courses, chapters, modules & lessons" },
  { id: "products", label: "Digital Products", icon: Package, description: "Sample packs, presets, beats, PDFs, etc." },
  { id: "plugins", label: "Plugins & Effect Chains", icon: Zap, description: "Ableton Racks, effect chains, audio tools" },
  { id: "notes", label: "User Notes", icon: FileText, description: "Personal notes and documentation" },
] as const;

type ContentTypeId = typeof CONTENT_TYPES[number]["id"];

// Stats type definition
type EmbeddingStats = {
  totalEmbeddings: number;
  bySourceType: {
    courses: number;
    chapters: number;
    lessons: number;
    products: number;
    notes: number;
    webResearch: number;
    other: number;
  };
  contentCounts: {
    courses: number;
    chapters: number;
    lessons: number;
    products: number;
    notes: number;
  };
  coveragePercentage: number;
};

export default function EmbeddingsAdminPage() {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<ContentTypeId[]>(["courseContent", "products", "plugins"]);
  const [results, setResults] = useState<{
    success: boolean;
    processed: number;
    skipped?: number;
    deleted?: number;
    errors: string[];
    results?: Record<string, { processed: number; skipped: number; errors: number }>;
  } | null>(null);

  // Convex hooks
  const generateAllContent = useAction(api.embeddingActions.generateAllContentEmbeddings);
  const migrateEmbeddings = useAction(api.embeddingActions.migrateToNewEmbeddingModel);
  const getEmbeddingStats = useAction(api.embeddings.getEmbeddingStats);

  // Fetch embedding stats
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const stats = await getEmbeddingStats({});
      setEmbeddingStats(stats);
    } catch (error) {
      console.error("Error fetching embedding stats:", error);
      setStatsError(error instanceof Error ? error.message : "Failed to load stats");
    } finally {
      setIsLoadingStats(false);
    }
  }, [getEmbeddingStats]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleContentType = (type: ContentTypeId) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerateEmbeddings = async (overwrite: boolean = false) => {
    if (!user || selectedTypes.length === 0) return;

    setIsGenerating(true);
    setResults(null);

    try {
      const result = await generateAllContent({
        userId: user.id,
        overwrite,
        contentTypes: selectedTypes,
      });

      setResults({
        success: result.success,
        processed: result.totalProcessed,
        errors: result.totalErrors,
        results: result.results,
      });
      // Refresh stats after generation
      await fetchStats();
    } catch (error) {
      console.error("Error generating embeddings:", error);
      setResults({
        success: false,
        processed: 0,
        errors: [`Failed to generate embeddings: ${error}`],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMigrateEmbeddings = async () => {
    if (!user) return;
    
    if (!confirm(
      "⚠️ This will DELETE all existing embeddings and regenerate them with the new text-embedding-3-small model.\n\n" +
      "This is necessary because the old embeddings use a different vector space.\n\n" +
      "Continue?"
    )) {
      return;
    }

    setIsMigrating(true);
    setResults(null);

    try {
      const result = await migrateEmbeddings({
        userId: user.id,
      });

      setResults({
        success: result.success,
        processed: result.processed,
        deleted: result.deleted,
        errors: result.errors,
      });
      // Refresh stats after migration
      await fetchStats();
    } catch (error) {
      console.error("Error migrating embeddings:", error);
      setResults({
        success: false,
        processed: 0,
        deleted: 0,
        errors: [`Failed to migrate embeddings: ${error}`],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access the embeddings admin panel.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isProcessing = isGenerating || isMigrating;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base Embeddings</h1>
          <p className="text-muted-foreground">
            Generate vector embeddings for your content to power AI search & chat
          </p>
        </div>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Knowledge Base Statistics
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStats}
              disabled={isLoadingStats}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {statsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load statistics: {statsError}
                <Button variant="link" onClick={fetchStats} className="ml-2 p-0 h-auto">
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : embeddingStats ? (
            <>
              {/* Summary Row */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
                <div>
                  <div className="text-3xl font-bold text-primary">{embeddingStats.totalEmbeddings}</div>
                  <div className="text-sm text-muted-foreground">Total Embeddings</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{embeddingStats.coveragePercentage}%</div>
                  <div className="text-sm text-muted-foreground">Coverage</div>
                </div>
              </div>

              {/* Embedded vs Content Breakdown */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Embedded Content */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Embedded Content</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{embeddingStats.bySourceType.courses}</div>
                      <div className="text-xs text-muted-foreground">Courses</div>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{embeddingStats.bySourceType.chapters}</div>
                      <div className="text-xs text-muted-foreground">Chapters</div>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-600">{embeddingStats.bySourceType.lessons}</div>
                      <div className="text-xs text-muted-foreground">Lessons</div>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                      <div className="text-lg font-bold text-orange-600">{embeddingStats.bySourceType.products}</div>
                      <div className="text-xs text-muted-foreground">Products</div>
                    </div>
                    <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg text-center">
                      <div className="text-lg font-bold text-pink-600">{embeddingStats.bySourceType.notes}</div>
                      <div className="text-xs text-muted-foreground">Notes</div>
                    </div>
                    <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg text-center">
                      <div className="text-lg font-bold text-cyan-600">{embeddingStats.bySourceType.webResearch}</div>
                      <div className="text-xs text-muted-foreground">Web Research</div>
                    </div>
                  </div>
                </div>

                {/* Total Content */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Total Content Available</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{embeddingStats.contentCounts.courses}</div>
                      <div className="text-xs text-muted-foreground">Courses</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{embeddingStats.contentCounts.chapters}</div>
                      <div className="text-xs text-muted-foreground">Chapters</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{embeddingStats.contentCounts.lessons}</div>
                      <div className="text-xs text-muted-foreground">Lessons</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{embeddingStats.contentCounts.products}</div>
                      <div className="text-xs text-muted-foreground">Products</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-center col-span-2">
                      <div className="text-lg font-bold">{embeddingStats.contentCounts.notes}</div>
                      <div className="text-xs text-muted-foreground">Notes</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading statistics...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Embeddings
          </CardTitle>
          <CardDescription>
            Select which content types to process. More content = smarter AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Type Checkboxes */}
          <div className="grid md:grid-cols-2 gap-4">
            {CONTENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              return (
                <div
                  key={type.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                  onClick={() => toggleContentType(type.id)}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => toggleContentType(type.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <Label className="font-medium cursor-pointer">{type.label}</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleGenerateEmbeddings(false)}
              disabled={isProcessing || selectedTypes.length === 0}
              size="lg"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Generate New Embeddings
            </Button>

            <Button
              onClick={() => handleGenerateEmbeddings(true)}
              disabled={isProcessing || selectedTypes.length === 0}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate All
            </Button>
          </div>

          {selectedTypes.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one content type to generate embeddings.
              </AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  {isMigrating ? "Migrating embeddings..." : `Generating embeddings for ${selectedTypes.length} content types...`}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                This may take several minutes depending on the amount of content.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Migration Card */}
      <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <ArrowUpCircle className="h-5 w-5" />
            Upgrade Embedding Model
          </CardTitle>
          <CardDescription>
            Migrate to OpenAI's improved embedding model with better quality at lower cost.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 p-3 rounded-lg bg-white/80 dark:bg-black/20 border">
              <div className="text-xs text-muted-foreground">Old Model</div>
              <div className="font-mono text-sm">text-embedding-ada-002</div>
              <div className="text-xs text-muted-foreground">$0.10/M tokens</div>
            </div>
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div className="flex-1 p-3 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-300">
              <div className="text-xs text-amber-600 dark:text-amber-400">New Model</div>
              <div className="font-mono text-sm font-semibold">text-embedding-3-small</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">$0.02/M tokens • 5x cheaper!</div>
            </div>
          </div>

          <Button
            onClick={handleMigrateEmbeddings}
            disabled={isProcessing}
            variant="outline"
            className="w-full border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50"
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Migrating...
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Migrate All Embeddings
              </>
            )}
          </Button>

          <div className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ This will delete all existing embeddings and regenerate them. Required if you previously used the old model.
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Per-type breakdown */}
            {results.results && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(results.results).map(([type, data]) => {
                  const config = CONTENT_TYPES.find(t => t.id === type);
                  const Icon = config?.icon || Database;
                  return (
                    <div key={type} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {data.processed} new
                        </Badge>
                        {data.skipped > 0 && (
                          <Badge variant="outline">{data.skipped} skipped</Badge>
                        )}
                        {data.errors > 0 && (
                          <Badge variant="destructive">{data.errors} errors</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {results.deleted !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{results.deleted}</div>
                  <div className="text-sm text-muted-foreground">Deleted</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.processed}</div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {results.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Embedding generation completed successfully! {results.processed} items processed.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Some errors occurred during processing. Check the error list below.
                </AlertDescription>
              </Alert>
            )}

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {results.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {results.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ...and {results.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>1. Content Selection:</strong> Choose which types of content to embed (courses, lessons, products, notes).
          </p>
          <p>
            <strong>2. Vector Embedding:</strong> Each piece of content is converted into a 1536-dimensional vector using OpenAI's <code className="px-1 py-0.5 bg-muted rounded">text-embedding-3-small</code> model.
          </p>
          <p>
            <strong>3. Smart Storage:</strong> Vectors are stored in Convex with deduplication - existing content won't be re-processed.
          </p>
          <p>
            <strong>4. AI Features:</strong> The Master AI Assistant uses these embeddings for semantic search, Q&A, and intelligent recommendations.
          </p>
          <div className="flex items-center gap-2 pt-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>Web research results are also automatically indexed when using the AI Assistant with web search enabled.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
