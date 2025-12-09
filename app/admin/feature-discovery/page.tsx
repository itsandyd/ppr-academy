"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Sparkles, 
  Search, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  BookOpen,
  Save,
  BarChart3,
  ArrowRight,
  Code2,
  FileText,
  Brain,
  Zap,
  Archive,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

// Feature categories with icons
const FEATURE_CATEGORIES = [
  { id: "marketing", name: "Marketing & Funnels", icon: "📈" },
  { id: "automation", name: "Automation & AI", icon: "🤖" },
  { id: "content", name: "Content Creation", icon: "✍️" },
  { id: "monetization", name: "Monetization", icon: "💰" },
  { id: "engagement", name: "User Engagement", icon: "🎯" },
  { id: "analytics", name: "Analytics & Insights", icon: "📊" },
  { id: "social", name: "Social & Community", icon: "👥" },
  { id: "audio", name: "Audio & Production", icon: "🎵" },
  { id: "workflow", name: "Workflow & Tools", icon: "⚙️" },
  { id: "other", name: "Other", icon: "📦" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "reviewing", label: "Reviewing", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  { value: "planned", label: "Planned", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "building", label: "Building", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { value: "completed", label: "Completed", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20" },
] as const;

// Types for category
type CategoryItem = { id: string; name: string; icon: string };
type StatusItem = { value: string; label: string; color: string };

interface FeatureSuggestion {
  name: string;
  description: string;
  category: string;
  sourceCourse: string;
  sourceChapters: string[];
  priority: "high" | "medium" | "low";
  reasoning: string;
  existsPartially?: string;
  implementationHint?: string;
  cursorPrompt?: string;
}

export default function FeatureDiscoveryPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<FeatureSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("analyze");

  // Queries
  const quickScan = useQuery(api.admin.featureDiscovery.quickFeatureGapScan);
  const coursesForAnalysis = useQuery(api.admin.featureDiscovery.getCoursesForAnalysis);
  const savedSuggestions = useQuery(api.admin.featureDiscovery.getSavedSuggestions, {
    status: selectedStatus !== "all" ? selectedStatus as any : undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
  });
  const featureStats = useQuery(api.admin.featureDiscovery.getFeatureStats);
  
  // Actions & Mutations
  const analyzeWithAI = useAction(api.admin.featureDiscovery.analyzeCoursesForFeatures);
  const updateStatus = useMutation(api.admin.featureDiscovery.updateSuggestionStatus);
  const deleteSuggestion = useMutation(api.admin.featureDiscovery.deleteSuggestion);

  const handleAIAnalysis = async (saveResults: boolean = false) => {
    if (!coursesForAnalysis || coursesForAnalysis.length === 0) {
      toast.error("No courses found to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    // Show loading toast
    const loadingToast = toast.loading(
      `Analyzing ${coursesForAnalysis.length} courses with GPT-4o... This may take 30-60 seconds.`
    );
    
    try {
      const results = await analyzeWithAI({
        courseData: coursesForAnalysis.map((c: { courseId: string; title: string; description?: string; category?: string; chapters: { title: string; content?: string }[] }) => ({
          courseId: c.courseId,
          title: c.title,
          description: c.description,
          category: c.category,
          chapters: c.chapters,
        })),
        saveResults,
      });
      
      toast.dismiss(loadingToast);
      
      setAiSuggestions(results.suggestions);
      
      if (results.suggestions.length === 0) {
        toast.info("No new feature suggestions found. Your courses are well covered!");
      } else if (saveResults) {
        toast.success(`Saved ${results.suggestions.length} feature suggestions to database`);
      } else {
        toast.success(`Found ${results.suggestions.length} feature suggestions!`);
      }
      
      if (results.tokensUsed) {
        console.log(`Analysis used ~${results.tokensUsed.toLocaleString()} tokens`);
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      const errorMsg = e instanceof Error ? e.message : "Analysis failed";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      toast.error("Failed to copy");
    }
  };

  const generateCursorPrompt = (suggestion: FeatureSuggestion) => {
    return `# Feature Request: ${suggestion.name}

## Description
${suggestion.description}

## Context
This feature was identified from analyzing course content in: ${suggestion.sourceCourse}
${suggestion.sourceChapters.length > 0 ? `\nRelevant chapters: ${suggestion.sourceChapters.join(", ")}` : ""}

## Why This Matters
${suggestion.reasoning}

${suggestion.existsPartially ? `## Related Existing Feature\n${suggestion.existsPartially} - consider how this integrates or extends it.\n` : ""}

## Implementation Notes
${suggestion.implementationHint || "No specific implementation hints provided."}

## Tasks
Please implement this feature following these steps:
1. Create the necessary database schema (if needed)
2. Create Convex functions (queries, mutations, actions)
3. Build the UI components
4. Add to the appropriate dashboard/page
5. Test the functionality

## Requirements
- Follow existing code patterns in the codebase
- Use shadcn/ui components
- Store data in Convex
- Ensure mobile responsiveness
- Add proper error handling`;
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const getCategoryIcon = (categoryId: string) => {
    return FEATURE_CATEGORIES.find((c: CategoryItem) => c.id === categoryId)?.icon || "📦";
  };

  const getCategoryName = (categoryId: string) => {
    return FEATURE_CATEGORIES.find((c: CategoryItem) => c.id === categoryId)?.name || categoryId;
  };

  const getStatusStyle = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "";
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-chart-1" />
          Feature Discovery
        </h1>
        <p className="text-muted-foreground mt-2">
          Scan your courses to identify potential product features. Your teaching content becomes the roadmap for platform development.
        </p>
      </div>

      {/* Stats Overview */}
      {featureStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="bg-gradient-to-br from-chart-1/5 to-chart-1/10">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold">{featureStats.totalSuggestions}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          {Object.entries(featureStats.byStatus).map(([status, count]) => (
            <Card key={status} className="bg-card/50">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="text-2xl font-bold">{count as number}</div>
                <div className="text-xs text-muted-foreground capitalize">{status}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Analyze Courses
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Saved Suggestions
            {featureStats && featureStats.totalSuggestions > 0 && (
              <Badge variant="secondary" className="ml-1">{featureStats.totalSuggestions}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Scan
          </TabsTrigger>
        </TabsList>

        {/* Analyze Tab */}
        <TabsContent value="analyze" className="space-y-6">
          {/* Course Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Content Overview
              </CardTitle>
              <CardDescription>
                {coursesForAnalysis?.length || 0} courses with {coursesForAnalysis?.reduce((acc: number, c: { chapters: unknown[] }) => acc + c.chapters.length, 0) || 0} chapters available for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!coursesForAnalysis ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading courses...
                </div>
              ) : coursesForAnalysis.length === 0 ? (
                <p className="text-muted-foreground">No courses found. Create some courses first!</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {coursesForAnalysis.slice(0, 10).map((course: { courseId: string; title: string; category?: string; chapters: unknown[]; totalContentLength: number }) => (
                    <div key={course.courseId} className="border rounded-lg p-3 bg-card/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {course.category || "Uncategorized"} • {course.chapters.length} chapters • {(course.totalContentLength / 1000).toFixed(1)}k chars
                          </p>
                        </div>
                        <Badge variant="outline">{course.chapters.length}</Badge>
                      </div>
                    </div>
                  ))}
                  {coursesForAnalysis.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ...and {coursesForAnalysis.length - 10} more courses
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Analysis
              </CardTitle>
              <CardDescription>
                Deep analysis of course content using GPT-4o to identify specific feature opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Button 
                  onClick={() => handleAIAnalysis(false)} 
                  disabled={isAnalyzing || !coursesForAnalysis || coursesForAnalysis.length === 0}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing {coursesForAnalysis?.length || 0} courses...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Analysis (Preview)
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => handleAIAnalysis(true)} 
                  disabled={isAnalyzing || !coursesForAnalysis || coursesForAnalysis.length === 0}
                  variant="outline"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Run & Save Results
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {aiSuggestions.length > 0 && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Feature Suggestions ({aiSuggestions.length})
                    </h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {aiSuggestions
                      .sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      })
                      .map((suggestion, i) => (
                        <SuggestionCard
                          key={i}
                          suggestion={suggestion}
                          onCopy={() => copyToClipboard(
                            suggestion.cursorPrompt || generateCursorPrompt(suggestion),
                            `ai-${i}`
                          )}
                          isCopied={copiedId === `ai-${i}`}
                          priorityColors={priorityColors}
                          getCategoryIcon={getCategoryIcon}
                          getCategoryName={getCategoryName}
                        />
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Suggestions Tab */}
        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Saved Feature Suggestions</CardTitle>
                  <CardDescription>
                    Track and manage feature suggestions from AI analysis
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="all">All Categories</SelectItem>
                      {FEATURE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!savedSuggestions ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading saved suggestions...
                </div>
              ) : savedSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved suggestions yet.</p>
                  <p className="text-sm">Run an AI analysis and save the results to see them here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedSuggestions.map((suggestion: {
                    _id: Id<"suggestedFeatures">;
                    name: string;
                    description: string;
                    category: string;
                    sourceCourses: string[];
                    sourceChapters: string[];
                    priority: string;
                    reasoning: string;
                    existsPartially?: string;
                    implementationHint?: string;
                    cursorPrompt?: string;
                    status: string;
                  }) => (
                    <Card key={suggestion._id} className="bg-card/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                              <h4 className="font-semibold">{suggestion.name}</h4>
                              <Badge className={priorityColors[suggestion.priority as keyof typeof priorityColors]}>
                                {suggestion.priority}
                              </Badge>
                              <Select
                                value={suggestion.status}
                                onValueChange={(value) => updateStatus({
                                  suggestionId: suggestion._id,
                                  status: value as any,
                                })}
                              >
                                <SelectTrigger className={`w-[120px] h-7 text-xs ${getStatusStyle(suggestion.status)}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                  {STATUS_OPTIONS.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {suggestion.description}
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>
                                <span className="font-medium">Source:</span> {suggestion.sourceCourses.join(", ")}
                              </p>
                              <p>
                                <span className="font-medium">Why:</span> {suggestion.reasoning}
                              </p>
                              {suggestion.existsPartially && (
                                <p className="text-yellow-500">
                                  <span className="font-medium">Related:</span> {suggestion.existsPartially}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(
                                suggestion.cursorPrompt || generateCursorPrompt({
                                  ...suggestion,
                                  sourceCourse: suggestion.sourceCourses[0] || "",
                                  sourceChapters: suggestion.sourceChapters,
                                  priority: suggestion.priority as "high" | "medium" | "low",
                                }),
                                suggestion._id
                              )}
                            >
                              {copiedId === suggestion._id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Delete this suggestion?")) {
                                  deleteSuggestion({ suggestionId: suggestion._id });
                                  toast.success("Suggestion deleted");
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Scan Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Feature Scan
              </CardTitle>
              <CardDescription>
                Instant scan of your course content to identify features you could build (no AI cost)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!quickScan ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning courses...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats */}
                  {quickScan.courseStats && (
                    <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>📚 {quickScan.courseStats.totalCourses} courses</span>
                      <span>📄 {quickScan.courseStats.totalChapters} chapters</span>
                      <span>📝 {(quickScan.courseStats.totalContentChars / 1000).toFixed(1)}k chars scanned</span>
                    </div>
                  )}

                  {!quickScan.featureOpportunities || quickScan.featureOpportunities.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-500 p-4 border rounded-lg bg-green-500/5">
                      <CheckCircle className="h-5 w-5" />
                      <span>Your courses are well-covered! No obvious feature gaps detected.</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">
                        Found <span className="font-bold text-chart-1">{quickScan.featureOpportunities?.length || 0}</span> potential features you could build based on your course content:
                      </p>
                      <div className="grid gap-4">
                        {(quickScan.featureOpportunities || []).map((opportunity: {
                          featureName: string;
                          featureDescription: string;
                          category: string;
                          keywordsFound: string[];
                          foundIn: string[];
                          hasExistingFeature: boolean;
                          existingFeatureName?: string;
                        }, i: number) => (
                          <Card key={i} className="bg-card/50 border-chart-1/20">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg">{getCategoryIcon(opportunity.category)}</span>
                                    <h4 className="font-semibold">{opportunity.featureName}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {getCategoryName(opportunity.category)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {opportunity.featureDescription}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {opportunity.keywordsFound.map((keyword: string, j: number) => (
                                      <Badge key={j} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    <span className="font-medium">Found in:</span> {opportunity.foundIn.slice(0, 3).join(", ")}
                                    {opportunity.foundIn.length > 3 && ` +${opportunity.foundIn.length - 3} more`}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const prompt = `# Feature Request: ${opportunity.featureName}

## Description
${opportunity.featureDescription}

## Context
This feature was identified because your course content mentions: ${opportunity.keywordsFound.join(", ")}
Found in courses: ${opportunity.foundIn.join(", ")}

## Category
${getCategoryName(opportunity.category)}

## Tasks
Please implement this feature:
1. Create database schema if needed
2. Create Convex functions (queries, mutations)
3. Build UI components
4. Add to appropriate dashboard page
5. Test functionality`;
                                    copyToClipboard(prompt, `quick-${i}`);
                                  }}
                                >
                                  {copiedId === `quick-${i}` ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Suggestion Card Component
function SuggestionCard({
  suggestion,
  onCopy,
  isCopied,
  priorityColors,
  getCategoryIcon,
  getCategoryName,
}: {
  suggestion: FeatureSuggestion;
  onCopy: () => void;
  isCopied: boolean;
  priorityColors: Record<string, string>;
  getCategoryIcon: (id: string) => string;
  getCategoryName: (id: string) => string;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <Card className="bg-card/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
              <h4 className="font-semibold">{suggestion.name}</h4>
              <Badge className={priorityColors[suggestion.priority]}>
                {suggestion.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getCategoryName(suggestion.category)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {suggestion.description}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">Source:</span> {suggestion.sourceCourse}
                {suggestion.sourceChapters.length > 0 && ` → ${suggestion.sourceChapters.slice(0, 2).join(", ")}${suggestion.sourceChapters.length > 2 ? ` +${suggestion.sourceChapters.length - 2} more` : ""}`}
              </p>
              <p>
                <span className="font-medium">Why:</span> {suggestion.reasoning}
              </p>
              {suggestion.existsPartially && (
                <p className="text-yellow-500">
                  <span className="font-medium">Related existing feature:</span> {suggestion.existsPartially}
                </p>
              )}
              {suggestion.implementationHint && (
                <p className="text-chart-1">
                  <span className="font-medium">Implementation hint:</span> {suggestion.implementationHint}
                </p>
              )}
            </div>

            {/* Expandable Cursor Prompt */}
            {showPrompt && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Code2 className="h-3 w-3" />
                    Cursor Prompt
                  </span>
                  <Button size="sm" variant="ghost" onClick={onCopy}>
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-[200px] overflow-y-auto">
                  {suggestion.cursorPrompt || "Click 'Copy for Cursor' to generate prompt"}
                </pre>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onCopy}
              className="flex items-center gap-1"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy for Cursor
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              <FileText className="h-3 w-3 mr-1" />
              {showPrompt ? "Hide" : "Preview"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}