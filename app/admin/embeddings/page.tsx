"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Zap, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmbeddingsAdminPage() {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    processed: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Convex hooks
  const generateEmbeddings = useAction(api.embeddingActions.generateAllCourseEmbeddings);
  const embeddingStats = useQuery(api.embeddings.getEmbeddingStats);

  const handleGenerateEmbeddings = async (overwrite: boolean = false) => {
    if (!user) return;

    setIsGenerating(true);
    setResults(null);

    try {
      const result = await generateEmbeddings({
        userId: user.id,
        overwrite,
      });

      setResults(result);
    } catch (error) {
      console.error("Error generating embeddings:", error);
      setResults({
        success: false,
        processed: 0,
        skipped: 0,
        errors: [`Failed to generate embeddings: ${error}`],
      });
    } finally {
      setIsGenerating(false);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Course Embeddings Admin</h1>
          <p className="text-muted-foreground">
            Generate and manage vector embeddings for your course content
          </p>
        </div>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Current Statistics
        </CardTitle>
        </CardHeader>
        <CardContent>
          {embeddingStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{embeddingStats.totalEmbeddings}</div>
                <div className="text-sm text-muted-foreground">Total Embeddings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{embeddingStats.courseEmbeddings}</div>
                <div className="text-sm text-muted-foreground">Course Embeddings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{embeddingStats.chapterEmbeddings}</div>
                <div className="text-sm text-muted-foreground">Chapter Embeddings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{embeddingStats.totalCourses}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{embeddingStats.totalChapters}</div>
                <div className="text-sm text-muted-foreground">Total Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{embeddingStats.coveragePercentage}%</div>
                <div className="text-sm text-muted-foreground">Coverage</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading statistics...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Embeddings
          </CardTitle>
          <CardDescription>
            Generate vector embeddings for all course titles, descriptions, and chapter content.
            This will enable semantic search and AI-powered Q&A for your courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => handleGenerateEmbeddings(false)}
              disabled={isGenerating}
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
              disabled={isGenerating}
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

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>Generate New:</strong> Only creates embeddings for content that doesn't have them yet</p>
            <p>• <strong>Regenerate All:</strong> Overwrites existing embeddings with fresh ones</p>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating embeddings...</span>
              </div>
              <div className="text-xs text-muted-foreground">
                This may take a few minutes depending on the amount of content.
              </div>
            </div>
          )}
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
              Generation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
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
                  Embedding generation completed successfully! Processed {results.processed} items, skipped {results.skipped} existing items.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Embedding generation encountered errors. Check the error list below.
                </AlertDescription>
              </Alert>
            )}

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Errors:</h4>
                <div className="space-y-1">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
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
            <strong>1. Content Extraction:</strong> The system reads all your course titles, descriptions, and chapter content.
          </p>
          <p>
            <strong>2. Embedding Generation:</strong> Each piece of content is converted into a 1536-dimensional vector using OpenAI's embedding model.
          </p>
          <p>
            <strong>3. Vector Storage:</strong> All embeddings are stored in your Convex database for fast semantic search.
          </p>
          <p>
            <strong>4. AI-Powered Features:</strong> Once generated, you can use these embeddings for semantic search, Q&A systems, and content recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
