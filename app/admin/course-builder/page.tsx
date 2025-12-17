"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Shield,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Store,
  Wand2,
  Settings2,
  Globe,
  Brain,
  Zap,
  Crown,
  Copy,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Eye,
  EyeOff,
  RotateCcw,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface StoreInfo {
  _id: Id<"stores">;
  name: string;
  slug: string;
  userId: string;
}

interface CourseOutline {
  title: string;
  description: string;
  category?: string;
  skillLevel?: string;
  estimatedDuration?: number;
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      description: string;
      chapters: Array<{
        title: string;
        content: string;
        duration?: number;
        expanded?: boolean;
        expandedContent?: string;
      }>;
    }>;
  }>;
}

interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  detail?: string;
}

interface ExistingCourseInfo {
  _id: Id<"courses">;
  title: string;
  description?: string;
  skillLevel?: string;
  isPublished?: boolean;
}

interface ExistingCourseStructure {
  course: {
    _id: Id<"courses">;
    title: string;
    description?: string;
    skillLevel?: string;
  };
  modules: Array<{
    _id: Id<"courseModules">;
    title: string;
    description?: string;
    lessons: Array<{
      _id: Id<"courseLessons">;
      title: string;
      description?: string;
      chapters: Array<{
        _id: Id<"courseChapters">;
        title: string;
        description?: string;
        hasContent: boolean;
        wordCount: number;
      }>;
    }>;
  }>;
  totalChapters: number;
  chaptersWithContent: number;
}

interface PipelineStatus {
  stage: string;
  model: string;
  isActive: boolean;
  description?: string;
  facets?: string[];
  chunksRetrieved?: number;
  webResults?: number;
  summariesGenerated?: number;
  ideasGenerated?: number;
}

// Course Builder Settings
interface AISettings {
  // Course structure settings
  skillLevel: "beginner" | "intermediate" | "advanced";
  targetModules: number;
  targetLessonsPerModule: number;
  // Parallel processing
  parallelBatchSize: number; // How many chapters to expand in parallel (lower for full pipeline)
  // AI pipeline settings - SAME as main AI chat!
  preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
  maxFacets: number;
  chunksPerFacet: number;
  similarityThreshold: number;
  enableCritic: boolean;
  enableCreativeMode: boolean;
  enableWebResearch: boolean;
  enableFactVerification: boolean;
  autoSaveWebResearch: boolean;
  webSearchMaxResults: number;
  responseStyle: "structured" | "conversational" | "concise";
}

const DEFAULT_AI_SETTINGS: AISettings = {
  // Course structure defaults
  skillLevel: "intermediate",
  targetModules: 4,
  targetLessonsPerModule: 3,
  // Parallel processing - lower for full pipeline (each chapter runs entire pipeline)
  parallelBatchSize: 2, // 2 chapters at a time (full pipeline is heavier)
  // AI pipeline defaults - SAME as main AI chat!
  preset: "premium",
  maxFacets: 5,
  chunksPerFacet: 50,
  similarityThreshold: 0.7,
  enableCritic: true,
  enableCreativeMode: true,
  enableWebResearch: true,
  enableFactVerification: false,
  autoSaveWebResearch: false,
  webSearchMaxResults: 10,
  responseStyle: "structured",
};

const PRESET_DESCRIPTIONS: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  speed: { 
    icon: <Zap className="w-4 h-4" />, 
    label: "Speed", 
    description: "Fast responses, basic analysis" 
  },
  balanced: { 
    icon: <Brain className="w-4 h-4" />, 
    label: "Balanced", 
    description: "Good balance of speed and quality" 
  },
  quality: { 
    icon: <Sparkles className="w-4 h-4" />, 
    label: "Quality", 
    description: "Higher quality, more thorough" 
  },
  deepReasoning: { 
    icon: <Brain className="w-4 h-4" />, 
    label: "Deep Reasoning", 
    description: "Complex analysis and reasoning" 
  },
  premium: { 
    icon: <Crown className="w-4 h-4" />, 
    label: "Premium", 
    description: "Claude 4.5 Opus + Gemini 3 Pro (~$0.50/query)" 
  },
};

const RESPONSE_STYLES = [
  {
    value: "structured" as const,
    icon: "📋",
    label: "Structured",
    description: "Bullet points, numbered lists, clear sections",
  },
  {
    value: "conversational" as const,
    icon: "💬",
    label: "Conversational",
    description: "Flowing paragraphs, essay-style prose",
  },
  {
    value: "concise" as const,
    icon: "⚡",
    label: "Concise",
    description: "Brief, direct answers without fluff",
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AdminCourseBuilderPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // State
  const [prompt, setPrompt] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullAuto, setIsFullAuto] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generatedOutline, setGeneratedOutline] = useState<CourseOutline | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  
  // Creation state
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdCourseSlug, setCreatedCourseSlug] = useState<string | null>(null);

  // Track current IDs for real-time updates (must be declared before queries that use them)
  const [currentOutlineId, setCurrentOutlineId] = useState<Id<"aiCourseOutlines"> | null>(null);
  
  // Pipeline status for real-time progress
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [pipelineMetadata, setPipelineMetadata] = useState<{
    facetsUsed?: string[];
    totalChunksProcessed?: number;
    webResearchResults?: number;
    processingTimeMs?: number;
  } | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"create" | "existing">("create");
  
  // Existing course expansion state
  const [selectedExistingCourseId, setSelectedExistingCourseId] = useState<string>("");
  const [existingCourseStructure, setExistingCourseStructure] = useState<ExistingCourseStructure | null>(null);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [isExpandingExisting, setIsExpandingExisting] = useState(false);
  const [expandExistingSteps, setExpandExistingSteps] = useState<GenerationStep[]>([]);

  // Queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminCheck = useQuery(
    api.users.checkIsAdmin as any,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const stores = useQuery(api.stores.getAllStores) as StoreInfo[] | undefined;
  const getOutline = useQuery(
    api.aiCourseBuilderQueries.getOutline,
    currentOutlineId ? { outlineId: currentOutlineId } : "skip"
  );

  // Mutations & Actions - Use the dedicated aiCourseBuilder backend functions (guaranteed JSON output)
  const addToQueue = useMutation(api.aiCourseBuilderQueries.addToQueue);
  const generateOutlineAction = useAction(api.aiCourseBuilder.generateOutline);
  const expandAllChaptersAction = useAction(api.aiCourseBuilder.expandAllChapters);
  const createCourseFromOutlineAction = useAction(api.aiCourseBuilder.createCourseFromOutline);
  
  // Existing course expansion actions
  const getCourseStructureAction = useAction(api.aiCourseBuilder.getCourseStructureForExpansion);
  const expandExistingCourseAction = useAction(api.aiCourseBuilder.expandExistingCourseChapters);
  const expandSingleChapterAction = useAction(api.aiCourseBuilder.expandExistingChapter);
  const reformatSingleChapterAction = useAction(api.aiCourseBuilder.reformatChapterContent);
  const reformatAllChaptersAction = useAction(api.aiCourseBuilder.reformatCourseChapters);
  
  // State for chapter preview and regeneration
  const [expandedChapterPreviews, setExpandedChapterPreviews] = useState<Set<string>>(new Set());
  const [regeneratingChapterId, setRegeneratingChapterId] = useState<string | null>(null);
  const [reformattingChapterId, setReformattingChapterId] = useState<string | null>(null);
  const [isReformattingAll, setIsReformattingAll] = useState(false);
  
  // Get courses for the selected store
  const storeCourses = useQuery(
    api.courses.getCoursesByStore,
    selectedStoreId ? { storeId: selectedStoreId } : "skip"
  ) as ExistingCourseInfo[] | undefined;

  // Set default store when stores load
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0]._id);
    }
  }, [stores, selectedStoreId]);

  // Auth check
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in?redirect_url=/admin/course-builder");
    } else if (adminCheck !== undefined && !adminCheck.isAdmin) {
      router.push("/");
    }
  }, [isLoaded, user, adminCheck, router]);

  // Update step status
  const updateStep = useCallback((stepId: string, updates: Partial<GenerationStep>) => {
    setGenerationSteps(prev => 
      prev.map(step => step.id === stepId ? { ...step, ...updates } : step)
    );
  }, []);

  // =============================================================================
  // FULL AUTO - Generate complete course using the full AI pipeline (streaming)
  // Uses: Planner → Retriever → Web Research → Summarizer → Idea Generator → Course Writer
  // =============================================================================
  const handleFullAutoGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a course topic or description");
      return;
    }
    if (!selectedStoreId) {
      toast.error("Please select a store");
      return;
    }

    setIsGenerating(true);
    setIsFullAuto(true);
    setGeneratedOutline(null);
    setCreatedCourseId(null);
    setCreatedCourseSlug(null);
    setCurrentOutlineId(null);
    setPipelineStatus(null);
    setPipelineMetadata(null);

    // Initialize pipeline steps
    setGenerationSteps([
      { id: "planner", label: "📋 Analyzing course topic", status: "pending" },
      { id: "retriever", label: "🔍 Searching knowledge base", status: "pending" },
      ...(settings.enableWebResearch ? [{ id: "webResearch", label: "🌐 Researching the web", status: "pending" as const }] : []),
      { id: "summarizer", label: "📝 Synthesizing information", status: "pending" },
      ...(settings.enableCreativeMode ? [{ id: "ideaGenerator", label: "💡 Generating ideas", status: "pending" as const }] : []),
      ...(settings.enableCritic ? [{ id: "critic", label: "🎯 Quality review", status: "pending" as const }] : []),
      { id: "courseWriter", label: "✍️ Creating course outline", status: "pending" },
      { id: "expand", label: "📖 Expanding chapters", status: "pending" },
      { id: "create", label: "🚀 Creating course", status: "pending" },
    ]);

    try {
      // Step 0: Add to queue first
      updateStep("planner", { status: "running", detail: "Initializing pipeline..." });
      
      const queueId = await addToQueue({
        userId: user!.id,
        storeId: selectedStoreId,
        prompt: prompt,
        skillLevel: settings.skillLevel || "intermediate",
        targetModules: settings.targetModules || 4,
        targetLessonsPerModule: settings.targetLessonsPerModule || 3,
      });
      
      setCurrentQueueId(queueId);
      console.log("✅ Added to queue:", queueId);

      // Use streaming endpoint for full pipeline
      const response = await fetch("/api/ai/course-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          settings: {
            preset: settings.preset,
            maxFacets: settings.maxFacets,
            chunksPerFacet: settings.chunksPerFacet,
            similarityThreshold: settings.similarityThreshold,
            enableCritic: settings.enableCritic,
            enableCreativeMode: settings.enableCreativeMode,
            enableWebResearch: settings.enableWebResearch,
            enableFactVerification: settings.enableFactVerification,
            autoSaveWebResearch: settings.autoSaveWebResearch,
            webSearchMaxResults: settings.webSearchMaxResults,
            responseStyle: settings.responseStyle,
          },
          storeId: selectedStoreId,
          queueId,
          mode: "outline",
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let outlineResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.replace("data: ", ""));
              handlePipelineStreamEvent(event);
              
              if (event.type === "complete") {
                outlineResult = event.response;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (!outlineResult?.success || !outlineResult?.outlineId) {
        throw new Error(outlineResult?.error || "Failed to generate outline with pipeline");
      }
      
      setCurrentOutlineId(outlineResult.outlineId);
      setPipelineMetadata(outlineResult.pipelineMetadata || null);
      
      // Update the outline display from the result
      if (outlineResult.outline) {
        const displayOutline = convertOutlineForDisplay({ outline: outlineResult.outline });
        if (displayOutline) {
          setGeneratedOutline(displayOutline);
        }
      }
      
      updateStep("courseWriter", { 
        status: "completed", 
        detail: `Course structure created (${outlineResult.pipelineMetadata?.totalChunksProcessed || 0} sources used)` 
      });

      // Step 2: Expand all chapters BY LESSON using FULL masterAI pipeline
      updateStep("expand", { 
        status: "running", 
        detail: `Expanding chapters using full AI pipeline (${settings.preset} preset)...` 
      });
      
      const expandResult = await expandAllChaptersAction({ 
        outlineId: outlineResult.outlineId, 
        queueId,
        parallelBatchSize: settings.parallelBatchSize,
        settings: {
          preset: settings.preset,
          maxFacets: settings.maxFacets,
          chunksPerFacet: settings.chunksPerFacet,
          similarityThreshold: settings.similarityThreshold,
          enableCritic: settings.enableCritic,
          enableCreativeMode: settings.enableCreativeMode,
          enableWebResearch: settings.enableWebResearch,
          enableFactVerification: settings.enableFactVerification,
          autoSaveWebResearch: settings.autoSaveWebResearch,
          webSearchMaxResults: settings.webSearchMaxResults,
          responseStyle: settings.responseStyle,
        },
      });
      
      updateStep("expand", { 
        status: expandResult.success ? "completed" : "failed", 
        detail: `${expandResult.expandedCount} chapters expanded${expandResult.failedCount > 0 ? `, ${expandResult.failedCount} failed` : ""}` 
      });
      
      if (!expandResult.success && expandResult.failedCount > expandResult.expandedCount) {
        throw new Error(`Too many chapters failed to expand: ${expandResult.failedCount}/${expandResult.expandedCount + expandResult.failedCount}`);
      }

      // Step 3: Create the course
      updateStep("create", { status: "running", detail: "Creating course in database..." });
      
      const createResult = await createCourseFromOutlineAction({
        outlineId: outlineResult.outlineId,
        queueId,
        price: 0,
        publish: false,
      });
      
      if (createResult.success && createResult.courseId) {
        setCreatedCourseId(createResult.courseId);
        setCreatedCourseSlug(createResult.slug || null);
        updateStep("create", { 
          status: "completed", 
          detail: "Course created successfully!" 
        });
        
        toast.success("🎉 Course created successfully!", {
          description: `Used ${outlineResult.pipelineMetadata?.totalChunksProcessed || 0} knowledge sources${outlineResult.pipelineMetadata?.webResearchResults ? ` and ${outlineResult.pipelineMetadata.webResearchResults} web results` : ""}`,
          action: createResult.courseId ? {
            label: "Edit Course",
            onClick: () => window.open(`/store/${selectedStoreId}/courses/${createResult.courseId}`, "_blank"),
          } : undefined,
          duration: 10000,
        });
      } else {
        throw new Error(createResult.error || "Failed to create course");
      }

    } catch (error) {
      console.error("Full auto generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      setGenerationSteps(prev => 
        prev.map(step => 
          step.status === "running" 
            ? { ...step, status: "failed", detail: errorMessage }
            : step
        )
      );
      
      toast.error(`Generation failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
      setIsFullAuto(false);
      setPipelineStatus(null);
    }
  };

  // Handle streaming events from the pipeline
  const handlePipelineStreamEvent = (event: any) => {
    switch (event.type) {
      case "stage_start":
        setPipelineStatus({
          stage: event.stage,
          model: event.model,
          isActive: true,
          description: event.description,
        });
        // Map pipeline stage to generation step
        const stageMap: Record<string, string> = {
          planner: "planner",
          retriever: "retriever",
          webResearch: "webResearch",
          summarizer: "summarizer",
          ideaGenerator: "ideaGenerator",
          factVerifier: "factVerifier",
          critic: "critic",
          courseWriter: "courseWriter",
        };
        const stepId = stageMap[event.stage];
        if (stepId) {
          updateStep(stepId, { status: "running", detail: event.description || event.model });
        }
        break;

      case "facets_identified":
        setPipelineStatus(prev => prev ? { ...prev, facets: event.facets } : null);
        break;

      case "chunks_retrieved":
        setPipelineStatus(prev => prev ? { 
          ...prev, 
          chunksRetrieved: (prev.chunksRetrieved || 0) + event.count,
        } : null);
        updateStep("retriever", { 
          status: "running", 
          detail: `Retrieved ${event.count} sources from ${event.facet}` 
        });
        break;

      case "web_research_result":
        setPipelineStatus(prev => prev ? { 
          ...prev, 
          webResults: (prev.webResults || 0) + event.count,
        } : null);
        updateStep("webResearch", { 
          status: "running", 
          detail: `Found ${event.count} web results for ${event.facet}` 
        });
        break;

      case "web_research_complete":
        setPipelineStatus(prev => prev ? { 
          ...prev, 
          webResults: event.totalResults,
        } : null);
        updateStep("webResearch", { 
          status: "completed", 
          detail: `${event.totalResults} web results${event.savedToEmbeddings ? " (saved to knowledge)" : ""}` 
        });
        break;

      case "summary_generated":
        setPipelineStatus(prev => prev ? { 
          ...prev, 
          summariesGenerated: (prev.summariesGenerated || 0) + 1,
        } : null);
        break;

      case "heartbeat":
        // Keep connection alive
        break;

      case "complete":
        // Mark all running steps as completed
        setGenerationSteps(prev => prev.map(step => {
          if (step.status === "running" && ["planner", "retriever", "webResearch", "summarizer", "ideaGenerator", "critic"].includes(step.id)) {
            return { ...step, status: "completed" };
          }
          return step;
        }));
        break;

      case "error":
        setGenerationSteps(prev => prev.map(step => 
          step.status === "running" 
            ? { ...step, status: "failed", detail: event.message }
            : step
        ));
        break;
    }
  };

  // Track queue item for step-by-step mode
  const [currentQueueId, setCurrentQueueId] = useState<Id<"aiCourseQueue"> | null>(null);

  // Convert backend outline to frontend format for display
  const convertOutlineForDisplay = useCallback((backendOutline: any): CourseOutline | null => {
    if (!backendOutline?.outline) return null;
    
    const data = backendOutline.outline;
    const course = data.course || data;
    
    return {
      title: course.title || backendOutline.title || "Untitled Course",
      description: course.description || backendOutline.description || "",
      category: course.category || backendOutline.category,
      skillLevel: course.skillLevel || backendOutline.skillLevel,
      estimatedDuration: course.estimatedDuration || backendOutline.estimatedDuration,
      modules: (data.modules || []).map((module: any) => ({
        title: module.title || "Untitled Module",
        description: module.description || "",
        lessons: (module.lessons || []).map((lesson: any) => ({
          title: lesson.title || "Untitled Lesson",
          description: lesson.description || "",
          chapters: (lesson.chapters || []).map((chapter: any) => ({
            title: chapter.title || "Untitled Chapter",
            content: chapter.content || chapter.description || "",
            duration: chapter.duration,
            expanded: chapter.hasDetailedContent || (chapter.wordCount && chapter.wordCount > 500),
            expandedContent: chapter.hasDetailedContent ? chapter.content : undefined,
          })),
        })),
      })),
    };
  }, []);

  // Update displayed outline when backend outline changes
  useEffect(() => {
    if (getOutline) {
      const converted = convertOutlineForDisplay(getOutline);
      if (converted) {
        setGeneratedOutline(converted);
      }
    }
  }, [getOutline, convertOutlineForDisplay]);

  // =============================================================================
  // GENERATE COURSE (Outline Only - for manual review)
  // Uses the full AI pipeline for rich, context-aware course generation
  // =============================================================================
  const handleGenerateCourse = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a course topic or description");
      return;
    }
    if (!selectedStoreId) {
      toast.error("Please select a store");
      return;
    }

    setIsGenerating(true);
    setIsFullAuto(false);
    setGeneratedOutline(null);
    setCreatedCourseId(null);
    setCreatedCourseSlug(null);
    setCurrentOutlineId(null);
    setCurrentQueueId(null);
    setPipelineStatus(null);
    setPipelineMetadata(null);
    
    // Initialize pipeline steps
    setGenerationSteps([
      { id: "planner", label: "📋 Analyzing course topic", status: "pending" },
      { id: "retriever", label: "🔍 Searching knowledge base", status: "pending" },
      ...(settings.enableWebResearch ? [{ id: "webResearch", label: "🌐 Researching the web", status: "pending" as const }] : []),
      { id: "summarizer", label: "📝 Synthesizing information", status: "pending" },
      ...(settings.enableCreativeMode ? [{ id: "ideaGenerator", label: "💡 Generating ideas", status: "pending" as const }] : []),
      { id: "courseWriter", label: "✍️ Creating course outline", status: "pending" },
    ]);

    try {
      // Add to queue first
      updateStep("planner", { status: "running", detail: "Initializing pipeline..." });
      
      const queueId = await addToQueue({
        userId: user!.id,
        storeId: selectedStoreId,
        prompt: prompt,
        skillLevel: settings.skillLevel || "intermediate",
        targetModules: settings.targetModules || 4,
        targetLessonsPerModule: settings.targetLessonsPerModule || 3,
      });
      
      setCurrentQueueId(queueId);

      // Use streaming endpoint for full pipeline
      const response = await fetch("/api/ai/course-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          settings: {
            preset: settings.preset,
            maxFacets: settings.maxFacets,
            chunksPerFacet: settings.chunksPerFacet,
            similarityThreshold: settings.similarityThreshold,
            enableCritic: settings.enableCritic,
            enableCreativeMode: settings.enableCreativeMode,
            enableWebResearch: settings.enableWebResearch,
            enableFactVerification: settings.enableFactVerification,
            autoSaveWebResearch: settings.autoSaveWebResearch,
            webSearchMaxResults: settings.webSearchMaxResults,
            responseStyle: settings.responseStyle,
          },
          storeId: selectedStoreId,
          queueId,
          mode: "outline",
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let outlineResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.replace("data: ", ""));
              handlePipelineStreamEvent(event);
              
              if (event.type === "complete") {
                outlineResult = event.response;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (!outlineResult?.success || !outlineResult?.outlineId) {
        throw new Error(outlineResult?.error || "Failed to generate outline with pipeline");
      }
      
      setCurrentOutlineId(outlineResult.outlineId);
      setPipelineMetadata(outlineResult.pipelineMetadata || null);
      
      // Update the outline display from the result
      if (outlineResult.outline) {
        const displayOutline = convertOutlineForDisplay({ outline: outlineResult.outline });
        if (displayOutline) {
          setGeneratedOutline(displayOutline);
        }
      }
      
      updateStep("courseWriter", { 
        status: "completed", 
        detail: `Generated with ${outlineResult.pipelineMetadata?.totalChunksProcessed || 0} sources - review below` 
      });
      
      toast.success("Course outline generated!", {
        description: `Used ${outlineResult.pipelineMetadata?.totalChunksProcessed || 0} knowledge sources${outlineResult.pipelineMetadata?.webResearchResults ? ` and ${outlineResult.pipelineMetadata.webResearchResults} web results` : ""}`,
      });

    } catch (error) {
      console.error("Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Mark current step as failed
      setGenerationSteps(prev => 
        prev.map(step => 
          step.status === "running" 
            ? { ...step, status: "failed", detail: errorMessage }
            : step
        )
      );
      
      toast.error(`Generation failed: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
      setPipelineStatus(null);
    }
  };

  // =============================================================================
  // EXPAND CHAPTER - Uses backend action for JSON-guaranteed content
  // =============================================================================
  const expandChapterAction = useAction(api.aiCourseBuilder.expandChapterContent);
  
  const handleExpandChapter = async (
    moduleIndex: number, 
    lessonIndex: number, 
    chapterIndex: number
  ) => {
    if (!generatedOutline || !currentOutlineId) {
      toast.error("No outline loaded - please generate an outline first");
      return;
    }
    
    const chapter = generatedOutline.modules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex];
    
    toast.promise(
      (async () => {
        const result = await expandChapterAction({
          outlineId: currentOutlineId,
          moduleIndex,
          lessonIndex,
          chapterIndex,
        });

        if (!result.success || !result.content) {
          throw new Error(result.error || "No content generated");
        }

        // Update local state (the getOutline query will also update, but this is faster for UI)
        setGeneratedOutline(prev => {
          if (!prev) return null;
          const updated = { ...prev };
          updated.modules = [...prev.modules];
          updated.modules[moduleIndex] = { ...prev.modules[moduleIndex] };
          updated.modules[moduleIndex].lessons = [...prev.modules[moduleIndex].lessons];
          updated.modules[moduleIndex].lessons[lessonIndex] = { 
            ...prev.modules[moduleIndex].lessons[lessonIndex] 
          };
          updated.modules[moduleIndex].lessons[lessonIndex].chapters = [
            ...prev.modules[moduleIndex].lessons[lessonIndex].chapters
          ];
          updated.modules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex] = {
            ...chapter,
            expanded: true,
            expandedContent: result.content,
          };
          return updated;
        });

        return result.wordCount || result.content.split(" ").length;
      })(),
      {
        loading: `Expanding "${chapter.title}"...`,
        success: (wordCount) => `Expanded with ${wordCount} words`,
        error: (err) => `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      }
    );
  };

  // =============================================================================
  // EXPAND ALL CHAPTERS
  // =============================================================================
  const handleExpandAllChapters = async () => {
    if (!generatedOutline) return;

    const chaptersToExpand: Array<{
      moduleIndex: number;
      lessonIndex: number;
      chapterIndex: number;
      chapter: CourseOutline["modules"][0]["lessons"][0]["chapters"][0];
    }> = [];

    generatedOutline.modules.forEach((module, mi) => {
      module.lessons.forEach((lesson, li) => {
        lesson.chapters.forEach((chapter, ci) => {
          if (!chapter.expanded) {
            chaptersToExpand.push({
              moduleIndex: mi,
              lessonIndex: li,
              chapterIndex: ci,
              chapter,
            });
          }
        });
      });
    });

    if (chaptersToExpand.length === 0) {
      toast.info("All chapters are already expanded");
      return;
    }

    toast.info(`Expanding ${chaptersToExpand.length} chapters...`);

    for (let i = 0; i < chaptersToExpand.length; i++) {
      const { moduleIndex, lessonIndex, chapterIndex } = chaptersToExpand[i];
      await handleExpandChapter(moduleIndex, lessonIndex, chapterIndex);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    toast.success("All chapters expanded!");
  };

  // =============================================================================
  // CREATE COURSE - Uses backend action for course creation
  // =============================================================================
  const handleCreateCourse = async () => {
    if (!generatedOutline || !selectedStoreId) {
      toast.error("No outline to create or store not selected");
      return;
    }
    
    if (!currentOutlineId || !currentQueueId) {
      toast.error("Outline context missing - please regenerate the outline");
      return;
    }

    setIsCreatingCourse(true);

    try {
      const result = await createCourseFromOutlineAction({
        outlineId: currentOutlineId,
        queueId: currentQueueId,
        price: 0,
        publish: false,
      });

      if (result.success && result.courseId) {
        setCreatedCourseId(result.courseId);
        setCreatedCourseSlug(result.slug || null);
        toast.success("Course created successfully!", {
          action: {
            label: "Edit Course",
            onClick: () => window.open(`/store/${selectedStoreId}/courses/${result.courseId}`, "_blank"),
          },
        });
      } else {
        throw new Error(result.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Course creation error:", error);
      toast.error(`Failed to create course: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // =============================================================================
  // EXISTING COURSE EXPANSION
  // =============================================================================
  
  // Load course structure when a course is selected
  const handleLoadCourseStructure = async () => {
    if (!selectedExistingCourseId) {
      toast.error("Please select a course first");
      return;
    }
    
    setIsLoadingStructure(true);
    setExistingCourseStructure(null);
    
    try {
      const result = await getCourseStructureAction({
        courseId: selectedExistingCourseId as Id<"courses">,
      });
      
      if (result.success && result.course && result.modules) {
        setExistingCourseStructure({
          course: result.course,
          modules: result.modules,
          totalChapters: result.totalChapters || 0,
          chaptersWithContent: result.chaptersWithContent || 0,
        });
        toast.success(`Loaded structure: ${result.totalChapters} chapters (${result.chaptersWithContent} with content)`);
      } else {
        throw new Error(result.error || "Failed to load course structure");
      }
    } catch (error) {
      console.error("Error loading course structure:", error);
      toast.error(`Failed to load course: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoadingStructure(false);
    }
  };
  
  // Expand all chapters in an existing course
  const handleExpandExistingCourse = async (onlyEmpty: boolean = true) => {
    if (!existingCourseStructure) {
      toast.error("Please load a course structure first");
      return;
    }
    
    setIsExpandingExisting(true);
    
    const chaptersToExpand = onlyEmpty 
      ? existingCourseStructure.totalChapters - existingCourseStructure.chaptersWithContent
      : existingCourseStructure.totalChapters;
    
    setExpandExistingSteps([
      { id: "prepare", label: "📋 Preparing expansion", status: "running" },
      { id: "expand", label: `📖 Expanding ${chaptersToExpand} chapters`, status: "pending" },
      { id: "complete", label: "✅ Finishing up", status: "pending" },
    ]);
    
    try {
      setExpandExistingSteps(prev => prev.map(s => 
        s.id === "prepare" ? { ...s, status: "completed" as const } :
        s.id === "expand" ? { ...s, status: "running" as const, detail: `Using ${settings.preset} preset...` } : s
      ));
      
      const result = await expandExistingCourseAction({
        courseId: existingCourseStructure.course._id,
        onlyEmpty,
        parallelBatchSize: settings.parallelBatchSize,
        settings: {
          preset: settings.preset,
          maxFacets: settings.maxFacets,
          chunksPerFacet: settings.chunksPerFacet,
          similarityThreshold: settings.similarityThreshold,
          enableCritic: settings.enableCritic,
          enableCreativeMode: settings.enableCreativeMode,
          enableWebResearch: settings.enableWebResearch,
          enableFactVerification: settings.enableFactVerification,
          autoSaveWebResearch: settings.autoSaveWebResearch,
          webSearchMaxResults: settings.webSearchMaxResults,
          responseStyle: settings.responseStyle,
        },
      });
      
      setExpandExistingSteps(prev => prev.map(s => 
        s.id === "expand" ? { 
          ...s, 
          status: result.success ? "completed" as const : "failed" as const,
          detail: `${result.expandedCount} expanded, ${result.skippedCount} skipped, ${result.failedCount} failed`
        } :
        s.id === "complete" ? { ...s, status: result.success ? "completed" as const : "failed" as const } : s
      ));
      
      if (result.success) {
        toast.success(`Expanded ${result.expandedCount} chapters!`, {
          description: result.skippedCount > 0 ? `${result.skippedCount} already had content` : undefined,
        });
        // Reload structure to show updated content
        await handleLoadCourseStructure();
      } else {
        throw new Error(result.error || `${result.failedCount} chapters failed`);
      }
    } catch (error) {
      console.error("Expansion error:", error);
      toast.error(`Expansion failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      setExpandExistingSteps(prev => prev.map(s => 
        s.status === "running" ? { ...s, status: "failed" as const } : s
      ));
    } finally {
      setIsExpandingExisting(false);
    }
  };

  // Regenerate a single chapter
  const handleRegenerateSingleChapter = async (
    chapterId: Id<"courseChapters">,
    moduleTitle: string,
    lessonTitle: string
  ) => {
    if (!existingCourseStructure) return;
    
    setRegeneratingChapterId(chapterId);
    
    try {
      const result = await expandSingleChapterAction({
        chapterId,
        courseTitle: existingCourseStructure.course.title,
        moduleTitle,
        lessonTitle,
        skillLevel: existingCourseStructure.course.skillLevel,
        settings: {
          preset: settings.preset,
          maxFacets: settings.maxFacets,
          chunksPerFacet: settings.chunksPerFacet,
          similarityThreshold: settings.similarityThreshold,
          enableCritic: settings.enableCritic,
          enableCreativeMode: settings.enableCreativeMode,
          enableWebResearch: settings.enableWebResearch,
          enableFactVerification: settings.enableFactVerification,
          autoSaveWebResearch: settings.autoSaveWebResearch,
          webSearchMaxResults: settings.webSearchMaxResults,
          responseStyle: settings.responseStyle,
        },
      });
      
      if (result.success) {
        toast.success(`Chapter regenerated! (${result.wordCount} words)`);
        // Reload the structure to show updated content
        await handleLoadCourseStructure();
        // Expand the preview to show the new content
        setExpandedChapterPreviews(prev => new Set(prev).add(chapterId));
      } else {
        throw new Error(result.error || "Failed to regenerate chapter");
      }
    } catch (error) {
      console.error("Error regenerating chapter:", error);
      toast.error(`Failed to regenerate: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setRegeneratingChapterId(null);
    }
  };

  // Reformat a single chapter (just add markdown formatting, don't regenerate)
  const handleReformatSingleChapter = async (
    chapterId: Id<"courseChapters">,
    chapterTitle: string
  ) => {
    if (!existingCourseStructure) return;
    
    setReformattingChapterId(chapterId);
    
    try {
      const result = await reformatSingleChapterAction({
        chapterId,
        chapterTitle,
      });
      
      if (result.success) {
        toast.success(`Chapter reformatted! (${result.wordCount} words)`);
        // Reload the structure to show updated content
        await handleLoadCourseStructure();
        // Expand the preview to show the formatted content
        setExpandedChapterPreviews(prev => new Set(prev).add(chapterId));
      } else {
        throw new Error(result.error || "Failed to reformat chapter");
      }
    } catch (error) {
      console.error("Error reformatting chapter:", error);
      toast.error(`Failed to reformat: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setReformattingChapterId(null);
    }
  };

  // Reformat all chapters in the course
  const handleReformatAllChapters = async () => {
    if (!selectedExistingCourseId || !existingCourseStructure) {
      toast.error("No course loaded");
      return;
    }
    
    setIsReformattingAll(true);
    
    try {
      const result = await reformatAllChaptersAction({
        courseId: selectedExistingCourseId,
        parallelBatchSize: 3, // Can be higher since reformatting is cheaper
      });
      
      if (result.success) {
        toast.success(`Reformatted ${result.reformattedCount} chapters!`);
        // Reload the structure to show updated content
        await handleLoadCourseStructure();
      } else {
        toast.warning(`Reformatted ${result.reformattedCount} chapters, ${result.failedCount} failed`);
      }
    } catch (error) {
      console.error("Error reformatting all chapters:", error);
      toast.error(`Failed to reformat: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsReformattingAll(false);
    }
  };

  // Toggle chapter content preview
  const toggleChapterPreview = (chapterId: string) => {
    setExpandedChapterPreviews(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // =============================================================================
  // HELPERS
  // =============================================================================

  const toggleModule = (index: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleLesson = (moduleIndex: number, lessonIndex: number) => {
    const key = `${moduleIndex}-${lessonIndex}`;
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Parse outline from text response (fallback)
  const parseOutlineFromText = (text: string, topic: string): CourseOutline | null => {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse if the whole thing is JSON
      if (text.trim().startsWith("{")) {
        return JSON.parse(text);
      }

      // Manual parsing from structured text
      const modules: CourseOutline["modules"] = [];
      const lines = text.split("\n").filter(l => l.trim());
      
      let currentModule: CourseOutline["modules"][0] | null = null;
      let currentLesson: CourseOutline["modules"][0]["lessons"][0] | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Module header (e.g., "## Module 1: Introduction" or "**Module 1:**")
        if (/^(#{1,2}|module\s+\d+:|\*\*module)/i.test(trimmed)) {
          if (currentModule) {
            if (currentLesson) currentModule.lessons.push(currentLesson);
            modules.push(currentModule);
          }
          currentModule = {
            title: trimmed.replace(/^#+\s*|module\s+\d+:\s*|\*\*/gi, "").trim(),
            description: "",
            lessons: [],
          };
          currentLesson = null;
        }
        // Lesson header (e.g., "### Lesson 1:" or "- Lesson 1:")
        else if (/^(###|lesson\s+\d+:|-\s*lesson)/i.test(trimmed)) {
          if (currentModule && currentLesson) {
            currentModule.lessons.push(currentLesson);
          }
          currentLesson = {
            title: trimmed.replace(/^#+\s*|lesson\s+\d+:\s*|-\s*/gi, "").trim(),
            description: "",
            chapters: [],
          };
        }
        // Chapter (e.g., "- Chapter:" or numbered item)
        else if (currentLesson && /^(-|\d+\.|\*)\s+/i.test(trimmed)) {
          currentLesson.chapters.push({
            title: trimmed.replace(/^(-|\d+\.|\*)\s+/, "").trim(),
            content: "",
          });
        }
      }

      // Add last items
      if (currentModule) {
        if (currentLesson) currentModule.lessons.push(currentLesson);
        modules.push(currentModule);
      }

      if (modules.length > 0) {
        return {
          title: topic.replace(/^create\s+(me\s+)?a?\s*course\s+(on|about)\s*/i, "").trim(),
          description: `A comprehensive course covering ${topic}`,
          modules,
        };
      }

      return null;
    } catch (e) {
      console.error("Failed to parse outline:", e);
      return null;
    }
  };

  // Count stats
  const getOutlineStats = () => {
    if (!generatedOutline) return { modules: 0, lessons: 0, chapters: 0, expanded: 0 };
    
    let lessons = 0;
    let chapters = 0;
    let expanded = 0;
    
    generatedOutline.modules.forEach(m => {
      lessons += m.lessons.length;
      m.lessons.forEach(l => {
        chapters += l.chapters.length;
        l.chapters.forEach(c => {
          if (c.expanded) expanded++;
        });
      });
    });
    
    return { modules: generatedOutline.modules.length, lessons, chapters, expanded };
  };

  const stats = getOutlineStats();

  // =============================================================================
  // LOADING & ACCESS CHECK
  // =============================================================================
  
  if (!isLoaded || adminCheck === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminCheck.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">Admin access required.</p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            AI Course Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate complete courses using your AI settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "existing")} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Create New Course
          </TabsTrigger>
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Expand Existing
          </TabsTrigger>
        </TabsList>

        {/* CREATE NEW COURSE TAB */}
        <TabsContent value="create">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input & Settings */}
        <div className="lg:col-span-1 space-y-4">
          {/* Topic Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Course Topic</CardTitle>
              <CardDescription>
                Describe the course you want to create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Create me a course on how to make a tour style track in Ableton Live 12..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] bg-background"
                disabled={isGenerating}
              />

              {/* Store Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Target Store</Label>
                <Select 
                  value={selectedStoreId} 
                  onValueChange={setSelectedStoreId}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    {stores?.map(store => (
                      <SelectItem key={store._id} value={store._id}>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          {store.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Buttons */}
              <div className="space-y-2">
                {/* Full Auto Button - One click, complete course */}
                <Button
                  onClick={handleFullAutoGenerate}
                  disabled={isGenerating || !prompt.trim() || !selectedStoreId}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-12"
                >
                  {isGenerating && isFullAuto ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Complete Course
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  One click → Outline + Expand All + Create
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Manual Mode Button - Just outline */}
              <Button
                onClick={handleGenerateCourse}
                disabled={isGenerating || !prompt.trim() || !selectedStoreId}
                variant="outline"
                className="w-full"
              >
                {isGenerating && !isFullAuto ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Outline...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outline Only
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <Collapsible open={showSettings} onOpenChange={setShowSettings}>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      <CardTitle className="text-lg">AI Settings</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {PRESET_DESCRIPTIONS[settings.preset]?.label}
                      </Badge>
                      {showSettings ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {/* Preset */}
                  <div className="space-y-2">
                    <Label className="text-sm">Model Preset</Label>
                    <Select 
                      value={settings.preset} 
                      onValueChange={(v: any) => setSettings(s => ({ ...s, preset: v }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        {Object.entries(PRESET_DESCRIPTIONS).map(([key, { icon, label, description }]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {icon}
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground">- {description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Max Facets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Facets</Label>
                      <span className="text-sm text-muted-foreground">{settings.maxFacets}</span>
                    </div>
                    <Slider
                      value={[settings.maxFacets]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, maxFacets: v }))}
                      min={1}
                      max={5}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Number of sub-topics to analyze</p>
                  </div>

                  {/* Chunks per Facet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Chunks per Facet</Label>
                      <span className="text-sm text-muted-foreground">{settings.chunksPerFacet}</span>
                    </div>
                    <Slider
                      value={[settings.chunksPerFacet]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, chunksPerFacet: v }))}
                      min={5}
                      max={50}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">Amount of knowledge to retrieve per topic</p>
                  </div>

                  {/* Similarity Threshold */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Similarity Threshold</Label>
                      <span className="text-sm text-muted-foreground">{settings.similarityThreshold.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[settings.similarityThreshold]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, similarityThreshold: v }))}
                      min={0.5}
                      max={0.95}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">Minimum relevance score for sources</p>
                  </div>

                  {/* Parallel Processing */}
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Processing Speed
                    </Label>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Parallel Chapters</Label>
                        <span className="text-sm text-muted-foreground">{settings.parallelBatchSize} at a time</span>
                      </div>
                      <Slider
                        value={[settings.parallelBatchSize]}
                        onValueChange={([v]) => setSettings(s => ({ ...s, parallelBatchSize: v }))}
                        min={1}
                        max={5}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Each chapter runs the full AI pipeline. Keep low (1-3) to avoid rate limits.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 Chapter content now uses the <strong>same full AI pipeline</strong> as the main AI chat:
                        Planner → Retriever → Web Research → Summarizer → Idea Generator → Critic → Final Writer
                      </p>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm">Critic Stage</Label>
                        <p className="text-xs text-muted-foreground">Quality review before response</p>
                      </div>
                      <Switch
                        checked={settings.enableCritic}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableCritic: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm">Creative Mode</Label>
                        <p className="text-xs text-muted-foreground">Generate new ideas beyond sources</p>
                      </div>
                      <Switch
                        checked={settings.enableCreativeMode}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableCreativeMode: v }))}
                      />
                    </div>
                  </div>

                  {/* Research & Verification Section */}
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Research & Verification
                    </Label>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm">Web Research</Label>
                        <p className="text-xs text-muted-foreground">Search web for additional context (uses Tavily API)</p>
                      </div>
                      <Switch
                        checked={settings.enableWebResearch}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableWebResearch: v }))}
                      />
                    </div>

                    {settings.enableWebResearch && (
                      <div className="ml-4 space-y-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm">Auto-Save to Knowledge</Label>
                            <p className="text-xs text-muted-foreground">Save web findings for future queries</p>
                          </div>
                          <Switch
                            checked={settings.autoSaveWebResearch}
                            onCheckedChange={(v) => setSettings(s => ({ ...s, autoSaveWebResearch: v }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Results per Topic</Label>
                            <span className="text-xs text-muted-foreground font-mono">{settings.webSearchMaxResults}</span>
                          </div>
                          <Slider
                            value={[settings.webSearchMaxResults]}
                            onValueChange={([v]) => setSettings(s => ({ ...s, webSearchMaxResults: v }))}
                            min={1}
                            max={10}
                            step={1}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm">Fact Verification</Label>
                        <p className="text-xs text-muted-foreground">Cross-check claims against sources</p>
                      </div>
                      <Switch
                        checked={settings.enableFactVerification}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableFactVerification: v }))}
                      />
                    </div>
                  </div>

                  {/* Response Style */}
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium">Response Style</Label>
                    <div className="grid gap-2">
                      {RESPONSE_STYLES.map((style) => {
                        const isSelected = settings.responseStyle === style.value;
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => setSettings(s => ({ ...s, responseStyle: style.value }))}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                            )}
                          >
                            <span className="text-lg">{style.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium text-sm",
                                  isSelected && "text-primary"
                                )}>
                                  {style.label}
                                </span>
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {style.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Generation Progress */}
          {generationSteps.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pipeline Progress</CardTitle>
                  {pipelineStatus?.isActive && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      {pipelineStatus.model}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {generationSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    {step.status === "pending" && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    {step.status === "running" && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {step.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {step.status === "failed" && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        step.status === "pending" && "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                      {step.detail && (
                        <p className="text-xs text-muted-foreground truncate">
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Pipeline metadata summary */}
                {pipelineMetadata && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                    {pipelineMetadata.facetsUsed && pipelineMetadata.facetsUsed.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📚 {pipelineMetadata.facetsUsed.length} topics analyzed
                      </Badge>
                    )}
                    {pipelineMetadata.totalChunksProcessed !== undefined && pipelineMetadata.totalChunksProcessed > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📖 {pipelineMetadata.totalChunksProcessed} knowledge sources
                      </Badge>
                    )}
                    {pipelineMetadata.webResearchResults !== undefined && pipelineMetadata.webResearchResults > 0 && (
                      <Badge variant="outline" className="text-xs">
                        🌐 {pipelineMetadata.webResearchResults} web results
                      </Badge>
                    )}
                    {pipelineMetadata.processingTimeMs !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        ⏱️ {(pipelineMetadata.processingTimeMs / 1000).toFixed(1)}s
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Outline Preview */}
        <div className="lg:col-span-2">
          {generatedOutline ? (
            <Card className="h-full">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{generatedOutline.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {generatedOutline.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {generatedOutline.skillLevel && (
                      <Badge variant="outline">{generatedOutline.skillLevel}</Badge>
                    )}
                    {generatedOutline.category && (
                      <Badge variant="secondary">{generatedOutline.category}</Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>{stats.modules} modules</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{stats.lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>{stats.chapters} chapters</span>
                  </div>
                  {stats.expanded > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      {stats.expanded}/{stats.chapters} expanded
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExpandAllChapters}
                    disabled={isGenerating || stats.expanded === stats.chapters}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Expand All Chapters
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateCourse}
                    disabled={isCreatingCourse}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isCreatingCourse ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Create Course
                      </>
                    )}
                  </Button>
                  {createdCourseId && selectedStoreId && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={`/store/${selectedStoreId}/courses/${createdCourseId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Edit Course
                      </a>
                    </Button>
                  )}
                </div>

                {/* Success Banner */}
                {createdCourseId && selectedStoreId && (
                  <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          Course Created Successfully!
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Your course has been created with all modules, lessons, and chapters. Click below to view and edit it in the course dashboard.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            asChild
                          >
                            <a 
                              href={`/store/${selectedStoreId}/courses/${createdCourseId}`}
                            >
                              Open Course Editor
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={createdCourseSlug ? `/courses/${createdCourseSlug}` : `/courses/${createdCourseId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Preview Public Page
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>

              <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
                <CardContent className="pt-4 space-y-3">
                  {generatedOutline.modules.map((module, mi) => (
                    <Collapsible
                      key={mi}
                      open={expandedModules.has(mi)}
                      onOpenChange={() => toggleModule(mi)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                          {expandedModules.has(mi) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <Layers className="w-4 h-4 text-primary" />
                          <span className="font-medium flex-1">
                            Module {mi + 1}: {module.title}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {module.lessons.length} lessons
                          </Badge>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pl-6 mt-2 space-y-2">
                        {module.description && (
                          <p className="text-sm text-muted-foreground px-3 py-1">
                            {module.description}
                          </p>
                        )}

                        {module.lessons.map((lesson, li) => {
                          const lessonKey = `${mi}-${li}`;
                          return (
                            <Collapsible
                              key={li}
                              open={expandedLessons.has(lessonKey)}
                              onOpenChange={() => toggleLesson(mi, li)}
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-2 p-2 rounded bg-background border cursor-pointer hover:bg-muted/30 transition-colors">
                                  {expandedLessons.has(lessonKey) ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm flex-1">
                                    Lesson {li + 1}: {lesson.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.chapters.length} chapters
                                  </Badge>
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                                {lesson.chapters.map((chapter, ci) => (
                                  <div
                                    key={ci}
                                    className={cn(
                                      "flex items-start gap-2 p-2 rounded border text-xs",
                                      chapter.expanded 
                                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                                        : "bg-background"
                                    )}
                                  >
                                    <FileText className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{chapter.title}</span>
                                        {chapter.expanded ? (
                                          <Badge variant="default" className="text-[10px] px-1.5 bg-green-500">
                                            <Check className="w-2 h-2 mr-0.5" />
                                            Expanded
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-[10px] px-1.5">
                                            Outline
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground mt-0.5 line-clamp-2">
                                        {chapter.content}
                                      </p>
                                    </div>
                                    {!chapter.expanded && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs flex-shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleExpandChapter(mi, li, ci);
                                        }}
                                      >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Expand
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Course Generated Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Enter a topic like &ldquo;Create me a course on how to make a tour style track in Ableton Live 12&rdquo; and click Generate Course.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        </TabsContent>

        {/* EXPAND EXISTING COURSE TAB */}
        <TabsContent value="existing">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Course Selection */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Select Course
                  </CardTitle>
                  <CardDescription>
                    Choose an existing course to expand its chapters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Store Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Store</Label>
                    <Select 
                      value={selectedStoreId} 
                      onValueChange={(v) => {
                        setSelectedStoreId(v);
                        setSelectedExistingCourseId("");
                        setExistingCourseStructure(null);
                      }}
                      disabled={isExpandingExisting}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a store" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        {stores?.map(store => (
                          <SelectItem key={store._id} value={store._id}>
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              {store.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Course</Label>
                    <Select 
                      value={selectedExistingCourseId} 
                      onValueChange={(v) => {
                        setSelectedExistingCourseId(v);
                        setExistingCourseStructure(null);
                      }}
                      disabled={isExpandingExisting || !selectedStoreId}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={selectedStoreId ? "Select a course" : "Select a store first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black max-h-[300px]">
                        {storeCourses?.map(course => (
                          <SelectItem key={course._id} value={course._id}>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{course.title}</span>
                              {course.isPublished && (
                                <Badge variant="outline" className="text-[10px]">Published</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {(!storeCourses || storeCourses.length === 0) && selectedStoreId && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No courses found in this store
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Load Structure Button */}
                  <Button
                    onClick={handleLoadCourseStructure}
                    disabled={!selectedExistingCourseId || isLoadingStructure || isExpandingExisting}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoadingStructure ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading Structure...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Load Course Structure
                      </>
                    )}
                  </Button>

                  {/* Course Stats */}
                  {existingCourseStructure && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <h4 className="font-medium text-sm">{existingCourseStructure.course.title}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-muted-foreground" />
                          {existingCourseStructure.modules.length} modules
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-muted-foreground" />
                          {existingCourseStructure.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          {existingCourseStructure.totalChapters} chapters
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />
                          {existingCourseStructure.chaptersWithContent} with content
                        </div>
                      </div>
                      
                      {existingCourseStructure.totalChapters - existingCourseStructure.chaptersWithContent > 0 ? (
                        <Badge variant="secondary" className="w-full justify-center py-1">
                          {existingCourseStructure.totalChapters - existingCourseStructure.chaptersWithContent} chapters need content
                        </Badge>
                      ) : (
                        <Badge variant="default" className="w-full justify-center py-1 bg-green-500">
                          All chapters have content!
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Expand Buttons */}
                  {existingCourseStructure && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleExpandExistingCourse(true)}
                        disabled={isExpandingExisting || existingCourseStructure.chaptersWithContent === existingCourseStructure.totalChapters}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        {isExpandingExisting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Expanding Chapters...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Expand Empty Chapters ({existingCourseStructure.totalChapters - existingCourseStructure.chaptersWithContent})
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleExpandExistingCourse(false)}
                        disabled={isExpandingExisting || isReformattingAll}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate All Chapters ({existingCourseStructure.totalChapters})
                      </Button>
                      
                      <div className="border-t pt-3 mt-1">
                        <Button
                          onClick={handleReformatAllChapters}
                          disabled={isExpandingExisting || isReformattingAll}
                          variant="secondary"
                          className="w-full"
                        >
                          {isReformattingAll ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Reformatting...
                            </>
                          ) : (
                            <>
                              <Type className="w-4 h-4 mr-2" />
                              Reformat All (Add Markdown)
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                          Adds proper # headers, ## sections, **bold** etc. without regenerating content
                        </p>
                      </div>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        Uses your AI settings ({settings.preset} preset)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Full AI Settings - Same as Create Tab */}
              <Card>
                <Collapsible open={showSettings} onOpenChange={setShowSettings}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 rounded-t-lg transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-4 h-4" />
                          <CardTitle className="text-lg">AI Settings</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {PRESET_DESCRIPTIONS[settings.preset]?.label}
                          </Badge>
                          {showSettings ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      {/* Preset */}
                      <div className="space-y-2">
                        <Label className="text-sm">Model Preset</Label>
                        <Select 
                          value={settings.preset} 
                          onValueChange={(v: any) => setSettings(s => ({ ...s, preset: v }))}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {Object.entries(PRESET_DESCRIPTIONS).map(([key, { icon, label, description }]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  {icon}
                                  <span>{label}</span>
                                  <span className="text-xs text-muted-foreground">- {description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Max Facets */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Max Facets</Label>
                          <span className="text-sm text-muted-foreground">{settings.maxFacets}</span>
                        </div>
                        <Slider
                          value={[settings.maxFacets]}
                          onValueChange={([v]) => setSettings(s => ({ ...s, maxFacets: v }))}
                          min={1}
                          max={5}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">Number of sub-topics to analyze</p>
                      </div>

                      {/* Chunks per Facet */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Chunks per Facet</Label>
                          <span className="text-sm text-muted-foreground">{settings.chunksPerFacet}</span>
                        </div>
                        <Slider
                          value={[settings.chunksPerFacet]}
                          onValueChange={([v]) => setSettings(s => ({ ...s, chunksPerFacet: v }))}
                          min={5}
                          max={50}
                          step={5}
                        />
                        <p className="text-xs text-muted-foreground">Amount of knowledge per topic</p>
                      </div>

                      {/* Similarity Threshold */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Similarity Threshold</Label>
                          <span className="text-sm text-muted-foreground">{settings.similarityThreshold.toFixed(2)}</span>
                        </div>
                        <Slider
                          value={[settings.similarityThreshold]}
                          onValueChange={([v]) => setSettings(s => ({ ...s, similarityThreshold: v }))}
                          min={0.5}
                          max={0.95}
                          step={0.05}
                        />
                      </div>

                      {/* Parallel Processing */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Parallel Chapters</Label>
                          <span className="text-sm text-muted-foreground">{settings.parallelBatchSize} at a time</span>
                        </div>
                        <Slider
                          value={[settings.parallelBatchSize]}
                          onValueChange={([v]) => setSettings(s => ({ ...s, parallelBatchSize: v }))}
                          min={1}
                          max={5}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          Each chapter runs the full AI pipeline
                        </p>
                      </div>

                      {/* Feature Toggles */}
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-sm">Critic Stage</Label>
                            <p className="text-xs text-muted-foreground">Quality review</p>
                          </div>
                          <Switch
                            checked={settings.enableCritic}
                            onCheckedChange={(v) => setSettings(s => ({ ...s, enableCritic: v }))}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-sm">Creative Mode</Label>
                            <p className="text-xs text-muted-foreground">Generate ideas beyond sources</p>
                          </div>
                          <Switch
                            checked={settings.enableCreativeMode}
                            onCheckedChange={(v) => setSettings(s => ({ ...s, enableCreativeMode: v }))}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-sm">Web Research</Label>
                            <p className="text-xs text-muted-foreground">Search web via Tavily API</p>
                          </div>
                          <Switch
                            checked={settings.enableWebResearch}
                            onCheckedChange={(v) => setSettings(s => ({ ...s, enableWebResearch: v }))}
                          />
                        </div>

                        {settings.enableWebResearch && (
                          <div className="ml-4 space-y-2 p-2 bg-muted/30 rounded">
                            <div className="flex items-center justify-between gap-4">
                              <Label className="text-xs">Auto-Save to Knowledge</Label>
                              <Switch
                                checked={settings.autoSaveWebResearch}
                                onCheckedChange={(v) => setSettings(s => ({ ...s, autoSaveWebResearch: v }))}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Results per Topic</Label>
                              <span className="text-xs text-muted-foreground">{settings.webSearchMaxResults}</span>
                            </div>
                            <Slider
                              value={[settings.webSearchMaxResults]}
                              onValueChange={([v]) => setSettings(s => ({ ...s, webSearchMaxResults: v }))}
                              min={1}
                              max={10}
                              step={1}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label className="text-sm">Fact Verification</Label>
                            <p className="text-xs text-muted-foreground">Cross-check claims</p>
                          </div>
                          <Switch
                            checked={settings.enableFactVerification}
                            onCheckedChange={(v) => setSettings(s => ({ ...s, enableFactVerification: v }))}
                          />
                        </div>
                      </div>

                      {/* Response Style */}
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-sm">Response Style</Label>
                        <div className="grid gap-1">
                          {RESPONSE_STYLES.map((style) => {
                            const isSelected = settings.responseStyle === style.value;
                            return (
                              <button
                                key={style.value}
                                type="button"
                                onClick={() => setSettings(s => ({ ...s, responseStyle: style.value }))}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded border text-left text-xs transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/30"
                                )}
                              >
                                <span>{style.icon}</span>
                                <span className="font-medium">{style.label}</span>
                                <span className="text-muted-foreground">{style.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>

            {/* Right Column - Course Structure Preview */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              {expandExistingSteps.length > 0 && (
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {expandExistingSteps.map((step) => (
                        <div
                          key={step.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg transition-colors",
                            step.status === "running" && "bg-blue-50 dark:bg-blue-950/30",
                            step.status === "completed" && "bg-green-50 dark:bg-green-950/30",
                            step.status === "failed" && "bg-red-50 dark:bg-red-950/30"
                          )}
                        >
                          {step.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-muted" />}
                          {step.status === "running" && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                          {step.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {step.status === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
                          <span className={cn(
                            "text-sm flex-1",
                            step.status === "pending" && "text-muted-foreground"
                          )}>
                            {step.label}
                          </span>
                          {step.detail && (
                            <span className="text-xs text-muted-foreground">{step.detail}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Structure Display */}
              {existingCourseStructure ? (
                <Card className="flex flex-col max-h-[calc(100vh-200px)]">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{existingCourseStructure.course.title}</CardTitle>
                      <Badge variant="outline" className="flex-shrink-0">
                        {existingCourseStructure.chaptersWithContent}/{existingCourseStructure.totalChapters} chapters
                      </Badge>
                    </div>
                    {existingCourseStructure.course.description && (
                      <CardDescription className="line-clamp-3">{existingCourseStructure.course.description}</CardDescription>
                    )}
                  </CardHeader>
                  <ScrollArea className="flex-1 min-h-0">
                    <CardContent className="space-y-2 pb-6">
                      {existingCourseStructure.modules.map((mod, mi) => (
                        <Collapsible
                          key={mi}
                          open={expandedModules.has(mi)}
                          onOpenChange={() => toggleModule(mi)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                              {expandedModules.has(mi) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <Layers className="w-4 h-4 text-violet-500" />
                              <span className="font-medium flex-1">{mod.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {mod.lessons.length} lessons
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-6 mt-2 space-y-2">
                            {mod.lessons.map((lesson, li) => (
                              <div key={li} className="space-y-1">
                                <div className="flex items-center gap-2 p-2 rounded bg-background border">
                                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm flex-1">{lesson.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.chapters.length} chapters
                                  </Badge>
                                </div>
                                <div className="pl-6 space-y-1">
                                  {lesson.chapters.map((ch, ci) => {
                                    const isExpanded = expandedChapterPreviews.has(ch._id);
                                    const isRegenerating = regeneratingChapterId === ch._id;
                                    
                                    return (
                                      <div key={ci} className="space-y-1">
                                        <div
                                          className={cn(
                                            "flex items-center gap-2 p-2 rounded border text-xs",
                                            ch.hasContent 
                                              ? ch.wordCount < 100 
                                                ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
                                                : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                                              : "bg-background"
                                          )}
                                        >
                                          <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                          <span className="flex-1 truncate">{ch.title}</span>
                                          
                                          {/* Content Status Badge */}
                                          {ch.hasContent ? (
                                            ch.wordCount < 100 ? (
                                              <Badge variant="outline" className="text-[10px] px-1.5 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                                                {ch.wordCount} words (short)
                                              </Badge>
                                            ) : (
                                              <Badge variant="default" className="text-[10px] px-1.5 bg-green-500">
                                                <Check className="w-2 h-2 mr-0.5" />
                                                {ch.wordCount} words
                                              </Badge>
                                            )
                                          ) : (
                                            <Badge variant="secondary" className="text-[10px] px-1.5">
                                              No content
                                            </Badge>
                                          )}
                                          
                                          {/* Preview Toggle Button */}
                                          {ch.hasContent && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0"
                                              onClick={() => toggleChapterPreview(ch._id)}
                                              title={isExpanded ? "Hide preview" : "Show preview"}
                                            >
                                              {isExpanded ? (
                                                <EyeOff className="w-3 h-3" />
                                              ) : (
                                                <Eye className="w-3 h-3" />
                                              )}
                                            </Button>
                                          )}
                                          
                                          {/* Reformat Button (just add markdown) */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleReformatSingleChapter(
                                              ch._id as Id<"courseChapters">,
                                              ch.title
                                            )}
                                            disabled={reformattingChapterId === ch._id || isExpandingExisting || isReformattingAll || !ch.hasContent}
                                            title="Reformat with markdown (keeps content, adds structure)"
                                          >
                                            {reformattingChapterId === ch._id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Type className="w-3 h-3" />
                                            )}
                                          </Button>

                                          {/* Regenerate Button */}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => handleRegenerateSingleChapter(
                                              ch._id as Id<"courseChapters">,
                                              mod.title,
                                              lesson.title
                                            )}
                                            disabled={isRegenerating || isExpandingExisting || isReformattingAll}
                                            title="Regenerate chapter content (full AI pipeline)"
                                          >
                                            {isRegenerating ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <RotateCcw className="w-3 h-3" />
                                            )}
                                          </Button>
                                        </div>
                                        
                                        {/* Content Preview */}
                                        {isExpanded && ch.description && (
                                          <div className="ml-5 p-3 rounded bg-muted/50 border text-xs">
                                            <div 
                                              className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h1:mt-4 prose-h1:mb-2 prose-h2:text-sm prose-h2:mt-3 prose-h2:mb-1.5 prose-h3:text-xs prose-h3:mt-2 prose-h3:mb-1 prose-p:text-muted-foreground prose-p:text-xs prose-p:leading-relaxed prose-p:mb-2 prose-strong:text-foreground prose-ul:my-2 prose-ul:text-xs prose-li:my-0.5 prose-code:bg-background prose-code:px-1 prose-code:rounded prose-code:text-[10px] prose-blockquote:border-l-primary prose-blockquote:text-xs prose-hr:my-4 max-h-[400px] overflow-y-auto"
                                              dangerouslySetInnerHTML={{ 
                                                __html: ch.description.length > 5000 
                                                  ? ch.description.substring(0, 5000) + "<p><em>Content truncated for preview...</em></p>" 
                                                  : ch.description 
                                              }}
                                            />
                                            {ch.description.length > 5000 && (
                                              <p className="text-[10px] text-muted-foreground mt-2 italic">
                                                Full content: {ch.wordCount} words
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </CardContent>
                  </ScrollArea>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[400px]">
                  <CardContent className="text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Select a Course</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Choose a course from the dropdown and click &ldquo;Load Course Structure&rdquo; to see its chapters and expand their content.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
