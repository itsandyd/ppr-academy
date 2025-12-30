"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Zap,
  Brain,
  Database,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Sparkles,
  RotateCw,
  Target,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AIFlywheelPage() {
  const flywheelStats = useQuery(api.aiPlatform.contentFlywheel.getFlywheelStats);
  const contentGaps = useQuery(api.aiPlatform.contentFlywheel.analyzeContentGaps);
  const suggestions = useQuery(api.aiPlatform.contentFlywheel.getAutoSuggestions);

  const healthColors: Record<string, string> = {
    starting: "bg-gray-500",
    warming: "bg-yellow-500",
    spinning: "bg-blue-500",
    accelerating: "bg-green-500",
  };

  const healthEmojis: Record<string, string> = {
    starting: "🌱",
    warming: "🔥",
    spinning: "🔄",
    accelerating: "🚀",
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <RotateCw className="h-8 w-8 text-chart-1" />
            AI Flywheel
          </h1>
          <p className="mt-2 text-muted-foreground">
            Self-improving platform intelligence powered by user content
          </p>
        </div>
        {flywheelStats && (
          <Badge
            className={`${healthColors[flywheelStats.flyWheelHealth]} px-4 py-2 text-lg text-white`}
          >
            {healthEmojis[flywheelStats.flyWheelHealth]}{" "}
            {flywheelStats.flyWheelHealth.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Flywheel Visualization */}
      <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-3/5">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center rounded-xl border bg-background/50 p-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-1/20">
                <span className="text-2xl">👥</span>
              </div>
              <span className="font-semibold">Users Create</span>
              <span className="text-xs text-muted-foreground">Courses, Notes, Products</span>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            {/* Step 2 */}
            <div className="flex flex-col items-center rounded-xl border bg-background/50 p-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/20">
                <Database className="h-6 w-6 text-chart-2" />
              </div>
              <span className="font-semibold">AI Indexes</span>
              <span className="text-xs text-muted-foreground">Embeddings & Knowledge</span>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            {/* Step 3 */}
            <div className="flex flex-col items-center rounded-xl border bg-background/50 p-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/20">
                <Brain className="h-6 w-6 text-chart-3" />
              </div>
              <span className="font-semibold">AI Learns</span>
              <span className="text-xs text-muted-foreground">Quality Signals</span>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            {/* Step 4 */}
            <div className="flex flex-col items-center rounded-xl border bg-background/50 p-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chart-4/20">
                <Sparkles className="h-6 w-6 text-chart-4" />
              </div>
              <span className="font-semibold">AI Creates</span>
              <span className="text-xs text-muted-foreground">Better Content</span>
            </div>

            <ArrowRight className="h-6 w-6 rotate-[135deg] text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Content Created */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Content Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!flywheelStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold">{flywheelStats.contentCreated.total}</div>
                <p className="text-xs text-muted-foreground">
                  {flywheelStats.contentCreated.thisMonth} this month{" "}
                  {flywheelStats.contentCreated.growth}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI Generated */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!flywheelStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold">{flywheelStats.aiGenerated.total}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(flywheelStats.aiGenerated.accuracy * 100)}% satisfaction
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!flywheelStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {flywheelStats.knowledgeBase.embeddingsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {flywheelStats.knowledgeBase.topicsIndexed} topics indexed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Opportunity Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Opportunity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!contentGaps ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold">{contentGaps.opportunityScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {contentGaps.missingTopics.length} gaps to fill
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Suggestions
          </CardTitle>
          <CardDescription>
            Automatically generated based on platform activity and content gaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!suggestions ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing platform...
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-muted-foreground">No suggestions yet - keep creating content!</p>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card/50 p-4 transition-colors hover:bg-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-2xl">
                      {suggestion.type === "course" && "📚"}
                      {suggestion.type === "sample_pack" && "🥁"}
                      {suggestion.type === "preset" && "🎛️"}
                      {suggestion.type === "product" && "📦"}
                      {suggestion.type === "feature" && "⚙️"}
                      {suggestion.type === "system" && "🔧"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                        {suggestion.specs?.synth && (
                          <Badge className="border-purple-500/20 bg-purple-500/10 text-xs text-purple-500">
                            {suggestion.specs.synth}
                          </Badge>
                        )}
                        {suggestion.specs?.genre && (
                          <Badge className="border-blue-500/20 bg-blue-500/10 text-xs text-blue-500">
                            {suggestion.specs.genre}
                          </Badge>
                        )}
                        {suggestion.specs?.daw && (
                          <Badge className="border-green-500/20 bg-green-500/10 text-xs text-green-500">
                            {suggestion.specs.daw}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>

                      {/* Specs section */}
                      {suggestion.specs && (
                        <div className="mt-3 rounded-md border border-border/50 bg-muted/50 p-3">
                          <div className="mb-2 flex flex-wrap gap-4 text-xs">
                            {suggestion.specs.sampleCount && (
                              <span className="text-muted-foreground">
                                <strong>Samples:</strong> {suggestion.specs.sampleCount}
                              </span>
                            )}
                            {suggestion.specs.presetCount && (
                              <span className="text-muted-foreground">
                                <strong>Presets:</strong> {suggestion.specs.presetCount}
                              </span>
                            )}
                          </div>
                          {suggestion.specs.details && suggestion.specs.details.length > 0 && (
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              {suggestion.specs.details.map((detail: any, j: number) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="text-chart-1">•</span>
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      <p className="mt-2 text-xs italic text-muted-foreground">
                        💡 {suggestion.basedOn}
                      </p>
                    </div>
                    {suggestion.actionUrl && (
                      <Link href={suggestion.actionUrl}>
                        <Button size="sm" variant="outline">
                          <Rocket className="mr-1 h-3 w-3" />
                          Create
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Gaps */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Missing Topics
            </CardTitle>
            <CardDescription>Topics that should have more content</CardDescription>
          </CardHeader>
          <CardContent>
            {!contentGaps ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : contentGaps.missingTopics.length === 0 ? (
              <p className="flex items-center gap-2 text-green-500">✅ All major topics covered!</p>
            ) : (
              <div className="space-y-2">
                {contentGaps.missingTopics.map((topic: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded border p-2">
                    <div>
                      <span className="font-medium">{topic.topic}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({topic.suggestedContentType})
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={topic.priority === "high" ? "border-red-500 text-red-500" : ""}
                    >
                      {topic.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Low Coverage Areas
            </CardTitle>
            <CardDescription>Product categories that need more items</CardDescription>
          </CardHeader>
          <CardContent>
            {!contentGaps ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : contentGaps.lowCoverageAreas.length === 0 ? (
              <p className="flex items-center gap-2 text-green-500">✅ All areas well covered!</p>
            ) : (
              <div className="space-y-3">
                {contentGaps.lowCoverageAreas.map((area: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{area.area}</span>
                      <span className="text-muted-foreground">
                        {area.currentCount}/{area.recommendedCount}
                      </span>
                    </div>
                    <Progress
                      value={(area.currentCount / area.recommendedCount) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Links to other tools */}
      <div className="flex flex-wrap gap-4">
        <Link href="/admin/feature-discovery">
          <Button variant="outline">
            <Lightbulb className="mr-2 h-4 w-4" />
            Feature Discovery
          </Button>
        </Link>
        <Link href="/admin/embeddings">
          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Manage Embeddings
          </Button>
        </Link>
        <Link href="/ai">
          <Button variant="outline">
            <Brain className="mr-2 h-4 w-4" />
            AI Assistant
          </Button>
        </Link>
      </div>
    </div>
  );
}
