"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { ScriptCard } from "./ScriptCard";
import { ScriptFilters } from "./ScriptFilters";
import { PerformanceFeedbackDialog } from "./PerformanceFeedbackDialog";
import { GenerationJobStatus } from "../agent/GenerationJobStatus";
import { useToast } from "@/hooks/use-toast";

interface ScriptLibraryProps {
  storeId: string;
  userId: string;
}

export function ScriptLibrary({ storeId, userId }: ScriptLibraryProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Get initial account filter from URL
  const initialAccount = searchParams.get("account") || "all";

  // Filters
  const [accountFilter, setAccountFilter] = useState(initialAccount);
  const [statusFilter, setStatusFilter] = useState("all");
  const [minViralityScore, setMinViralityScore] = useState(1);
  const [courseFilter, setCourseFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Feedback dialog state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedScriptForFeedback, setSelectedScriptForFeedback] = useState<{
    id: Id<"generatedScripts">;
    title: string;
    viralityScore: number;
  } | null>(null);

  // Update filter when URL changes
  useEffect(() => {
    const account = searchParams.get("account");
    if (account) {
      setAccountFilter(account);
    }
  }, [searchParams]);

  // Get scripts
  // @ts-ignore - Convex type inference depth issue
  const scriptsData = useQuery(api.generatedScripts.getGeneratedScripts, {
    storeId,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    accountProfileId:
      accountFilter !== "all" && accountFilter !== "unassigned"
        ? (accountFilter as Id<"socialAccountProfiles">)
        : undefined,
    minViralityScore: minViralityScore > 1 ? minViralityScore : undefined,
    limit: 50,
  });

  // Get account profiles for mapping
  const profiles = useQuery(api.socialAccountProfiles.getAccountProfiles, {
    storeId,
  });

  // Get active jobs
  const activeJobs = useQuery(api.masterAI.socialScriptAgentMutations.getActiveJobs, {
    userId,
  });

  // Get stats
  const stats = useQuery(api.generatedScripts.getScriptStats, { storeId });

  // Start generation action
  const startGeneration = useAction(api.masterAI.socialScriptAgent.startScriptGeneration);

  const handleStartGeneration = async (
    jobType: "full_scan" | "incremental"
  ) => {
    setIsGenerating(true);
    try {
      await startGeneration({
        storeId,
        userId,
        jobType,
      });
      toast({
        title: "Generation started",
        description:
          jobType === "full_scan"
            ? "Processing all your course content..."
            : "Processing new content...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start generation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearFilters = () => {
    setAccountFilter("all");
    setStatusFilter("all");
    setMinViralityScore(1);
    setCourseFilter("all");
  };

  const handleFeedback = (scriptId: Id<"generatedScripts">) => {
    const script = filteredScripts.find((s: any) => s._id === scriptId);
    if (script) {
      setSelectedScriptForFeedback({
        id: script._id,
        title: script.chapterTitle,
        viralityScore: script.viralityScore,
      });
      setFeedbackDialogOpen(true);
    }
  };

  // Create account name lookup
  const accountNameMap = new Map<Id<"socialAccountProfiles">, string>(
    profiles?.map((p: any) => [p._id, p.name] as [Id<"socialAccountProfiles">, string]) || []
  );

  // Filter for unassigned if needed
  const allScripts = scriptsData?.scripts || [];
  const filteredScripts = accountFilter === "unassigned"
    ? allScripts.filter((s: any) => !s.suggestedAccountProfileId)
    : allScripts;

  const hasActiveJob = activeJobs && activeJobs.length > 0;

  if (scriptsData === undefined || profiles === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Script Library</h2>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-lg border bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Script Library</h2>
          <p className="text-sm text-muted-foreground">
            {stats?.total || 0} scripts generated
            {stats && stats.averageViralityScore > 0 && (
              <> &bull; Avg virality: {stats.averageViralityScore.toFixed(1)}/10</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleStartGeneration("incremental")}
            disabled={isGenerating || hasActiveJob}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate New
          </Button>
          <Button
            onClick={() => handleStartGeneration("full_scan")}
            disabled={isGenerating || hasActiveJob}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate All
          </Button>
        </div>
      </div>

      {/* Active Job Status */}
      {activeJobs && activeJobs.length > 0 && (
        <GenerationJobStatus job={activeJobs[0]} />
      )}

      {/* Filters */}
      <ScriptFilters
        storeId={storeId}
        accountFilter={accountFilter}
        onAccountFilterChange={setAccountFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        minViralityScore={minViralityScore}
        onMinViralityScoreChange={setMinViralityScore}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Scripts Grid */}
      {filteredScripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No scripts found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            {scriptsData.total === 0
              ? "Generate scripts from your course content to get started."
              : "No scripts match your current filters. Try adjusting them."}
          </p>
          {scriptsData.total === 0 && (
            <Button onClick={() => handleStartGeneration("full_scan")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Scripts
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredScripts.map((script: any) => (
            <ScriptCard
              key={script._id}
              script={script}
              accountName={
                script.suggestedAccountProfileId
                  ? accountNameMap.get(script.suggestedAccountProfileId)
                  : undefined
              }
              onFeedback={handleFeedback}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {scriptsData.hasMore && (
        <div className="flex justify-center">
          <Button variant="outline">Load more</Button>
        </div>
      )}

      {/* Performance Feedback Dialog */}
      {selectedScriptForFeedback && (
        <PerformanceFeedbackDialog
          scriptId={selectedScriptForFeedback.id}
          scriptTitle={selectedScriptForFeedback.title}
          viralityScore={selectedScriptForFeedback.viralityScore}
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
        />
      )}
    </div>
  );
}
