"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Flame,
  ThermometerSun,
  Snowflake,
  AlertTriangle,
  RefreshCw,
  Star,
  Mail,
  MousePointerClick,
  Clock,
  ChevronRight,
} from "lucide-react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Score badge component
function ScoreBadge({ score }: { score: number }) {
  const getConfig = () => {
    if (score >= 70) return { label: "Hot", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Flame };
    if (score >= 40) return { label: "Warm", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: ThermometerSun };
    if (score >= 10) return { label: "Cold", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Snowflake };
    return { label: "Inactive", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400", icon: Clock };
  };

  const { label, color, icon: Icon } = getConfig();

  return (
    <Badge variant="secondary" className={cn("gap-1", color)}>
      <Icon className="h-3 w-3" />
      {label} ({score})
    </Badge>
  );
}

// Distribution bar
function DistributionBar({ distribution, total }: { distribution: { hot: number; warm: number; cold: number; inactive: number }; total: number }) {
  if (total === 0) return null;

  const getPercent = (count: number) => Math.round((count / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex h-4 overflow-hidden rounded-full">
        {distribution.hot > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${getPercent(distribution.hot)}%` }}
            title={`Hot: ${distribution.hot}`}
          />
        )}
        {distribution.warm > 0 && (
          <div
            className="bg-orange-500"
            style={{ width: `${getPercent(distribution.warm)}%` }}
            title={`Warm: ${distribution.warm}`}
          />
        )}
        {distribution.cold > 0 && (
          <div
            className="bg-blue-500"
            style={{ width: `${getPercent(distribution.cold)}%` }}
            title={`Cold: ${distribution.cold}`}
          />
        )}
        {distribution.inactive > 0 && (
          <div
            className="bg-zinc-400"
            style={{ width: `${getPercent(distribution.inactive)}%` }}
            title={`Inactive: ${distribution.inactive}`}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          Hot {getPercent(distribution.hot)}%
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          Warm {getPercent(distribution.warm)}%
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          Cold {getPercent(distribution.cold)}%
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-zinc-400" />
          Inactive {getPercent(distribution.inactive)}%
        </div>
      </div>
    </div>
  );
}

export default function LeadScoringPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [isRecalculating, setIsRecalculating] = useState(false);

  const storeId = user?.id ?? "";

  // Queries
  const summary = useQuery(
    api.leadScoring.getLeadScoringSummary,
    storeId ? { storeId } : "skip"
  );

  const topLeads = useQuery(
    api.leadScoring.getTopLeads,
    storeId ? { storeId, limit: 15 } : "skip"
  );

  const needsAttention = useQuery(
    api.leadScoring.getLeadsNeedingAttention,
    storeId ? { storeId, limit: 15 } : "skip"
  );

  const scoringRules = useQuery(
    api.leadScoring.getScoringRules,
    storeId ? { storeId } : "skip"
  );

  const recalculateScores = useMutation(api.leadScoring.recalculateAllScores);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const result = await recalculateScores({ storeId });
      toast({
        title: "Recalculation started",
        description: result.message || "Score recalculation is processing in the background",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start score recalculation",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:space-y-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/emails?mode=create")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <Target className="h-5 w-5 text-cyan-600 md:h-6 md:w-6" />
              Lead Scoring
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Identify and prioritize your most engaged contacts
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRecalculating && "animate-spin")} />
          Recalculate Scores
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top-leads">Top Leads</TabsTrigger>
          <TabsTrigger value="attention">Needs Attention</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{summary?.averageScore || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                    <Target className="h-5 w-5 text-cyan-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hot Leads</p>
                    <p className="text-2xl font-bold text-red-500">{summary?.distribution.hot || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                    <Flame className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Warm Leads</p>
                    <p className="text-2xl font-bold text-orange-500">{summary?.distribution.warm || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                    <ThermometerSun className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Need Attention</p>
                    <p className="text-2xl font-bold text-yellow-500">{summary?.needsAttention || 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Score Distribution</CardTitle>
              <CardDescription>
                How your {summary?.total || 0} contacts are distributed by engagement level
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.distribution && (
                <DistributionBar distribution={summary.distribution} total={summary.total} />
              )}
            </CardContent>
          </Card>

          {/* Score Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Score Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
                    <Flame className="h-4 w-4" />
                    Hot (70-100)
                  </div>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                    Highly engaged, ready for conversion
                  </p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
                  <div className="flex items-center gap-2 font-medium text-orange-700 dark:text-orange-400">
                    <ThermometerSun className="h-4 w-4" />
                    Warm (40-69)
                  </div>
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-500">
                    Interested, nurture with content
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-400">
                    <Snowflake className="h-4 w-4" />
                    Cold (10-39)
                  </div>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                    Low engagement, needs re-engagement
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-400">
                    <Clock className="h-4 w-4" />
                    Inactive (0-9)
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
                    Consider removal or win-back
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Leads Tab */}
        <TabsContent value="top-leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4 text-yellow-500" />
                Top Performing Leads
              </CardTitle>
              <CardDescription>
                Your most engaged contacts ranked by score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!topLeads || topLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No leads found. Import contacts to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {topLeads.map((lead: any, index: number) => (
                    <div
                      key={lead._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {lead.firstName || lead.lastName
                              ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
                              : lead.email}
                          </div>
                          {(lead.firstName || lead.lastName) && (
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden text-right text-xs text-muted-foreground md:block">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.emailsOpened} opens
                          </div>
                          <div className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            {lead.emailsClicked} clicks
                          </div>
                        </div>
                        <ScoreBadge score={lead.score} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Needs Attention Tab */}
        <TabsContent value="attention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Leads Needing Attention
              </CardTitle>
              <CardDescription>
                Previously engaged contacts who haven't interacted recently
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!needsAttention || needsAttention.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <TrendingUp className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  All your engaged leads are active!
                </div>
              ) : (
                <div className="space-y-2">
                  {needsAttention.map((lead: any) => (
                    <div
                      key={lead._id}
                      className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 dark:border-yellow-900 dark:bg-yellow-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {lead.firstName || lead.lastName
                              ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
                              : lead.email}
                          </div>
                          {(lead.firstName || lead.lastName) && (
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-muted-foreground">
                          {lead.daysSinceLastOpen !== null ? (
                            <div className="text-yellow-600 dark:text-yellow-400">
                              {lead.daysSinceLastOpen} days since last open
                            </div>
                          ) : (
                            <div>Never opened</div>
                          )}
                          <div>{lead.emailsSent} emails sent</div>
                        </div>
                        <ScoreBadge score={lead.score} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Re-engagement Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Re-engagement Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  Send a "We miss you" email with a special offer
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  Try a different email subject line style
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  Segment and send more relevant content
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  Consider removing contacts inactive for 90+ days
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
