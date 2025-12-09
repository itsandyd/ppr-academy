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
  Rocket
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <RotateCw className="h-8 w-8 text-chart-1" />
            AI Flywheel
          </h1>
          <p className="text-muted-foreground mt-2">
            Self-improving platform intelligence powered by user content
          </p>
        </div>
        {flywheelStats && (
          <Badge 
            className={`${healthColors[flywheelStats.flyWheelHealth]} text-white text-lg px-4 py-2`}
          >
            {healthEmojis[flywheelStats.flyWheelHealth]} {flywheelStats.flyWheelHealth.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Flywheel Visualization */}
      <Card className="bg-gradient-to-br from-chart-1/5 via-chart-2/5 to-chart-3/5 border-chart-1/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Step 1 */}
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border">
              <div className="w-12 h-12 rounded-full bg-chart-1/20 flex items-center justify-center mb-2">
                <span className="text-2xl">👥</span>
              </div>
              <span className="font-semibold">Users Create</span>
              <span className="text-xs text-muted-foreground">Courses, Notes, Products</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            {/* Step 2 */}
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border">
              <div className="w-12 h-12 rounded-full bg-chart-2/20 flex items-center justify-center mb-2">
                <Database className="h-6 w-6 text-chart-2" />
              </div>
              <span className="font-semibold">AI Indexes</span>
              <span className="text-xs text-muted-foreground">Embeddings & Knowledge</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            {/* Step 3 */}
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border">
              <div className="w-12 h-12 rounded-full bg-chart-3/20 flex items-center justify-center mb-2">
                <Brain className="h-6 w-6 text-chart-3" />
              </div>
              <span className="font-semibold">AI Learns</span>
              <span className="text-xs text-muted-foreground">Quality Signals</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            {/* Step 4 */}
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-xl border">
              <div className="w-12 h-12 rounded-full bg-chart-4/20 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-chart-4" />
              </div>
              <span className="font-semibold">AI Creates</span>
              <span className="text-xs text-muted-foreground">Better Content</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-[135deg]" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Content Created */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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
                  {flywheelStats.contentCreated.thisMonth} this month {flywheelStats.contentCreated.growth}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI Generated */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!flywheelStats ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="text-3xl font-bold">{flywheelStats.knowledgeBase.embeddingsCount}</div>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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
              {suggestions.map((suggestion, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                        {suggestion.specs?.synth && (
                          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                            {suggestion.specs.synth}
                          </Badge>
                        )}
                        {suggestion.specs?.genre && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                            {suggestion.specs.genre}
                          </Badge>
                        )}
                        {suggestion.specs?.daw && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                            {suggestion.specs.daw}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                      
                      {/* Specs section */}
                      {suggestion.specs && (
                        <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border/50">
                          <div className="flex flex-wrap gap-4 text-xs mb-2">
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
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {suggestion.specs.details.map((detail, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="text-chart-1">•</span>
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        💡 {suggestion.basedOn}
                      </p>
                    </div>
                    {suggestion.actionUrl && (
                      <Link href={suggestion.actionUrl}>
                        <Button size="sm" variant="outline">
                          <Rocket className="h-3 w-3 mr-1" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Missing Topics
            </CardTitle>
            <CardDescription>
              Topics that should have more content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!contentGaps ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : contentGaps.missingTopics.length === 0 ? (
              <p className="text-green-500 flex items-center gap-2">
                ✅ All major topics covered!
              </p>
            ) : (
              <div className="space-y-2">
                {contentGaps.missingTopics.map((topic, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <span className="font-medium">{topic.topic}</span>
                      <span className="text-xs text-muted-foreground ml-2">({topic.suggestedContentType})</span>
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
            <CardDescription>
              Product categories that need more items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!contentGaps ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : contentGaps.lowCoverageAreas.length === 0 ? (
              <p className="text-green-500 flex items-center gap-2">
                ✅ All areas well covered!
              </p>
            ) : (
              <div className="space-y-3">
                {contentGaps.lowCoverageAreas.map((area, i) => (
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
      <div className="flex gap-4 flex-wrap">
        <Link href="/admin/feature-discovery">
          <Button variant="outline">
            <Lightbulb className="h-4 w-4 mr-2" />
            Feature Discovery
          </Button>
        </Link>
        <Link href="/admin/embeddings">
          <Button variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Manage Embeddings
          </Button>
        </Link>
        <Link href="/ai">
          <Button variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </Link>
      </div>
    </div>
  );
}

