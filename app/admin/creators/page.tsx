"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  Trophy,
  AlertTriangle,
  Mail,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Star,
  DollarSign,
  Package,
  GraduationCap,
  CheckCircle,
  Circle,
  Send,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminLoading } from "../components/admin-loading";

export default function AdminCreatorsPage() {
  const { user } = useUser();
  const [leaderboardSort, setLeaderboardSort] = useState<
    "revenue" | "healthScore" | "products" | "enrollments"
  >("revenue");
  const [emailFilter, setEmailFilter] = useState<
    "all" | "no_sales_30d" | "low_health" | "new_creators" | "top_performers"
  >("all");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  // Fetch data
  const leaderboard = useQuery(api.analytics.creatorPipeline.getCreatorLeaderboard, {
    limit: 20,
    sortBy: leaderboardSort,
  });
  const needsAttention = useQuery(api.analytics.creatorPipeline.getCreatorsNeedingAttention, {});
  const bulkEmailList = useQuery(api.analytics.creatorPipeline.getCreatorsForBulkEmail, {
    filter: emailFilter,
  });
  const pipelineStats = useQuery(api.analytics.creatorPipeline.getPipelineStats, {});

  if (!leaderboard || !needsAttention || !bulkEmailList || !pipelineStats) {
    return <AdminLoading variant="dashboard" />;
  }

  const healthStatusColors: Record<string, string> = {
    excellent: "bg-green-500",
    good: "bg-emerald-500",
    fair: "bg-yellow-500",
    poor: "bg-orange-500",
    critical: "bg-red-500",
  };

  const healthStatusBadgeColors: Record<string, string> = {
    excellent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    fair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    poor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const toggleCreatorSelection = (userId: string) => {
    setSelectedCreators((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllCreators = () => {
    if (selectedCreators.length === bulkEmailList.length) {
      setSelectedCreators([]);
    } else {
      setSelectedCreators(bulkEmailList.map((c) => c.userId));
    }
  };

  // Calculate summary stats
  const totalCreators = leaderboard.length;
  const healthyCreators = leaderboard.filter((c) => c.healthScore >= 60).length;
  const atRiskCreators = needsAttention.length;
  const totalCreatorRevenue = leaderboard.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Creator Success</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Monitor creator health, identify at-risk creators, and drive engagement
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalCreators}</p>
                <p className="text-sm text-muted-foreground">Total Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <Heart className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{healthyCreators}</p>
                <p className="text-sm text-muted-foreground">Healthy (60+ score)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{atRiskCreators}</p>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-500/10 p-3">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{formatCurrency(totalCreatorRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Creator Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1 sm:grid sm:h-12 sm:grid-cols-3">
          <TabsTrigger value="leaderboard" className="flex-1 gap-1 text-xs sm:gap-2 sm:text-base">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Leaderboard</span>
            <span className="xs:hidden">Top</span>
          </TabsTrigger>
          <TabsTrigger value="attention" className="flex-1 gap-1 text-xs sm:gap-2 sm:text-base">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Needs</span> Attention
            {atRiskCreators > 0 && (
              <Badge variant="destructive" className="ml-1">
                {atRiskCreators}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outreach" className="flex-1 gap-1 text-xs sm:gap-2 sm:text-base">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Bulk</span> Outreach
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Creator Leaderboard</CardTitle>
                <Select
                  value={leaderboardSort}
                  onValueChange={(v) => setLeaderboardSort(v as typeof leaderboardSort)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="healthScore">Health Score</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="enrollments">Enrollments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((creator) => (
                  <div
                    key={creator.userId}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Mobile layout */}
                    <div className="lg:hidden space-y-3">
                      {/* Top row: Rank + Name + Score */}
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold",
                            creator.rank === 1
                              ? "bg-yellow-500 text-white"
                              : creator.rank === 2
                                ? "bg-gray-400 text-white"
                                : creator.rank === 3
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                          )}
                        >
                          {creator.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">{creator.userName}</p>
                            <Badge className={cn("text-xs", healthStatusBadgeColors[creator.healthStatus])}>
                              {creator.healthScore}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {creator.storeName || "No store"} • {creator.courseCount} courses
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-sm">
                            {formatCurrency(creator.totalRevenue)}
                          </p>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded bg-muted/50 p-2">
                          <p className="font-bold">{creator.totalEnrollments}</p>
                          <p className="text-muted-foreground">Enrollments</p>
                        </div>
                        <div className="rounded bg-muted/50 p-2">
                          <p className="font-bold flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {creator.avgRating.toFixed(1)}
                          </p>
                          <p className="text-muted-foreground">Rating</p>
                        </div>
                        <div className="rounded bg-muted/50 p-2">
                          <p className="font-bold">{creator.onboardingProgress}%</p>
                          <p className="text-muted-foreground">Setup</p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:flex items-center gap-4">
                      {/* Rank */}
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold",
                          creator.rank === 1
                            ? "bg-yellow-500 text-white"
                            : creator.rank === 2
                              ? "bg-gray-400 text-white"
                              : creator.rank === 3
                                ? "bg-amber-600 text-white"
                                : "bg-muted text-muted-foreground"
                        )}
                      >
                        {creator.rank}
                      </div>

                      {/* Creator Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{creator.userName}</p>
                          <Badge className={healthStatusBadgeColors[creator.healthStatus]}>
                            {creator.healthScore}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {creator.storeName || "No store"} • {creator.courseCount} courses •{" "}
                          {creator.productCount} products
                        </p>
                      </div>

                      {/* Health Bar */}
                      <div className="w-32">
                        <div className="mb-1 flex justify-between text-xs">
                          <span>Health</span>
                          <span>{creator.healthScore}%</span>
                        </div>
                        <Progress
                          value={creator.healthScore}
                          className={cn("h-2", healthStatusColors[creator.healthStatus])}
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-green-600">
                            {formatCurrency(creator.totalRevenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{creator.totalEnrollments}</p>
                          <p className="text-xs text-muted-foreground">Enrollments</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {creator.avgRating.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>

                      {/* Onboarding Progress */}
                      <div className="w-24">
                        <div className="mb-1 flex justify-between text-xs">
                          <span>Setup</span>
                          <span>{creator.onboardingProgress}%</span>
                        </div>
                        <Progress value={creator.onboardingProgress} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Needs Attention Tab */}
        <TabsContent value="attention">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-orange-900 dark:text-orange-300">
                <AlertTriangle className="h-5 w-5" />
                Creators Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {needsAttention.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="font-semibold">All creators are on track!</p>
                  <p className="text-sm text-muted-foreground">
                    No creators currently need outreach
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {needsAttention.map((creator) => (
                    <div
                      key={creator.userId}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-4",
                        creator.severity === "high"
                          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{creator.userName}</p>
                          <Badge
                            variant={creator.severity === "high" ? "destructive" : "secondary"}
                          >
                            {creator.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{creator.userEmail}</p>
                        <p className="mt-1 text-sm font-medium text-orange-700 dark:text-orange-400">
                          {creator.issue}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Suggested: {creator.suggestedAction}
                        </p>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Outreach Tab */}
        <TabsContent value="outreach">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Bulk Email Campaign</CardTitle>
                <div className="flex items-center gap-3">
                  <Select
                    value={emailFilter}
                    onValueChange={(v) => setEmailFilter(v as typeof emailFilter)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter creators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      <SelectItem value="no_sales_30d">No Sales (30d)</SelectItem>
                      <SelectItem value="low_health">Low Health Score</SelectItem>
                      <SelectItem value="new_creators">New Creators</SelectItem>
                      <SelectItem value="top_performers">Top Performers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={selectAllCreators}
                    disabled={bulkEmailList.length === 0}
                  >
                    {selectedCreators.length === bulkEmailList.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  <Button disabled={selectedCreators.length === 0} className="gap-2">
                    <Send className="h-4 w-4" />
                    Send to {selectedCreators.length} creators
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bulkEmailList.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold">No creators match this filter</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different filter to find creators
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bulkEmailList.map((creator) => (
                    <div
                      key={creator.userId}
                      onClick={() => toggleCreatorSelection(creator.userId)}
                      className={cn(
                        "flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors",
                        selectedCreators.includes(creator.userId)
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex h-6 w-6 items-center justify-center">
                        {selectedCreators.includes(creator.userId) ? (
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{creator.userName}</p>
                        <p className="text-sm text-muted-foreground">{creator.email}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {creator.storeName || "No store"}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-600">
                            {formatCurrency(creator.totalRevenue)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{creator.productCount}</span> products
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
