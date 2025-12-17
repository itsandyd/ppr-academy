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

// AI Settings that mirror the chat settings
interface AISettings {
  preset: "speed" | "balanced" | "quality" | "deepReasoning" | "premium";
  maxFacets: number;
  chunksPerFacet: number;
  similarityThreshold: number;
  enableCritic: boolean;
  enableCreativeMode: boolean;
  enableWebResearch: boolean;
  responseStyle: "structured" | "conversational" | "concise";
}

const DEFAULT_AI_SETTINGS: AISettings = {
  preset: "premium",
  maxFacets: 5,
  chunksPerFacet: 50,
  similarityThreshold: 0.7,
  enableCritic: true,
  enableCreativeMode: true,
  enableWebResearch: true,
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
    description: "Claude 4.5 Opus + Gemini 3 Pro" 
  },
};

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

  // Queries
  const adminCheck = useQuery(
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const stores = useQuery(api.stores.getAllStores) as StoreInfo[] | undefined;

  // Actions
  const askAgenticAI = useAction(api.masterAI.index.askAgenticAI);
  const executeConfirmedActions = useAction(api.masterAI.index.executeConfirmedActions);

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
  // FULL AUTO - Generate complete course in one click
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

    // Initialize all steps
    setGenerationSteps([
      { id: "outline", label: "Generating course outline", status: "pending" },
      { id: "expand", label: "Expanding all chapters", status: "pending" },
      { id: "create", label: "Creating course", status: "pending" },
    ]);

    try {
      // Step 1: Generate outline
      updateStep("outline", { status: "running", detail: "Analyzing topic and creating structure..." });
      
      const outline = await generateOutlineInternal();
      if (!outline) {
        throw new Error("Failed to generate outline");
      }
      
      setGeneratedOutline(outline);
      updateStep("outline", { 
        status: "completed", 
        detail: `${outline.modules.length} modules, ${outline.modules.reduce((acc, m) => acc + m.lessons.reduce((a, l) => a + l.chapters.length, 0), 0)} chapters` 
      });

      // Step 2: Expand all chapters
      updateStep("expand", { status: "running", detail: "Starting chapter expansion..." });
      
      const expandedOutline = await expandAllChaptersInternal(outline);
      setGeneratedOutline(expandedOutline);
      
      const totalChapters = expandedOutline.modules.reduce((acc, m) => 
        acc + m.lessons.reduce((a, l) => a + l.chapters.length, 0), 0
      );
      const expandedCount = expandedOutline.modules.reduce((acc, m) => 
        acc + m.lessons.reduce((a, l) => a + l.chapters.filter(c => c.expanded).length, 0), 0
      );
      
      updateStep("expand", { 
        status: "completed", 
        detail: `${expandedCount}/${totalChapters} chapters expanded` 
      });

      // Step 3: Create the course
      updateStep("create", { status: "running", detail: "Building course in database..." });
      
      const result = await createCourseInternal(expandedOutline);
      
      if (result.success) {
        setCreatedCourseId(result.courseId || null);
        setCreatedCourseSlug(result.slug || null);
        updateStep("create", { 
          status: "completed", 
          detail: "Course created successfully!" 
        });
        
        toast.success("🎉 Course created successfully!", {
          description: `"${expandedOutline.title}" is ready`,
          action: result.link ? {
            label: "View Course",
            onClick: () => window.open(result.link, "_blank"),
          } : undefined,
          duration: 10000,
        });
      } else {
        throw new Error(result.error || "Failed to create course");
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
    }
  };

  // Internal helper for outline generation
  const generateOutlineInternal = async (): Promise<CourseOutline | null> => {
    const outlineResponse = await askAgenticAI({
      question: prompt,
      userId: user!.id,
      storeId: selectedStoreId,
      userRole: "admin",
      settings: {
        preset: settings.preset,
        maxFacets: settings.maxFacets,
        chunksPerFacet: settings.chunksPerFacet,
        similarityThreshold: settings.similarityThreshold,
        enableCritic: settings.enableCritic,
        enableCreativeMode: settings.enableCreativeMode,
        enableWebResearch: settings.enableWebResearch,
        enableFactVerification: false,
        autoSaveWebResearch: false,
        responseStyle: settings.responseStyle,
      },
    });

    if (outlineResponse.type === "action_proposal") {
      const executeResult = await executeConfirmedActions({
        actions: outlineResponse.proposedActions.map(a => ({
          tool: a.tool,
          parameters: a.parameters,
        })),
        userId: user!.id,
        storeId: selectedStoreId,
      });

      if (executeResult.results?.[0]?.success) {
        const outlineData = executeResult.results[0].result as any;
        if (outlineData.outline) {
          return outlineData.outline;
        }
      }
    } else if ("answer" in outlineResponse) {
      return parseOutlineFromText(outlineResponse.answer, prompt);
    }

    return null;
  };

  // Internal helper for expanding all chapters
  const expandAllChaptersInternal = async (outline: CourseOutline): Promise<CourseOutline> => {
    const updatedOutline = JSON.parse(JSON.stringify(outline)) as CourseOutline;
    let chapterIndex = 0;
    const totalChapters = outline.modules.reduce((acc, m) => 
      acc + m.lessons.reduce((a, l) => a + l.chapters.length, 0), 0
    );

    for (let mi = 0; mi < updatedOutline.modules.length; mi++) {
      for (let li = 0; li < updatedOutline.modules[mi].lessons.length; li++) {
        for (let ci = 0; ci < updatedOutline.modules[mi].lessons[li].chapters.length; ci++) {
          chapterIndex++;
          const chapter = updatedOutline.modules[mi].lessons[li].chapters[ci];
          
          updateStep("expand", { 
            status: "running", 
            detail: `Expanding chapter ${chapterIndex}/${totalChapters}: "${chapter.title}"` 
          });

          try {
            const response = await askAgenticAI({
              question: `Write detailed educational content for this chapter: "${chapter.title}". 
Context: This is part of a course about "${outline.title}". 
The chapter should cover: ${chapter.content}
Write 800-1200 words of comprehensive, video-script-ready content suitable for ${outline.skillLevel || "intermediate"} level learners.`,
              userId: user!.id,
              userRole: "admin",
              settings: {
                preset: settings.preset,
                maxFacets: 3,
                chunksPerFacet: 30,
                similarityThreshold: 0.65,
                enableCritic: false, // Faster
                enableCreativeMode: true,
                enableWebResearch: settings.enableWebResearch,
                enableFactVerification: false,
                autoSaveWebResearch: false,
                responseStyle: "conversational",
              },
            });

            let expandedContent = "";
            if ("answer" in response) {
              expandedContent = response.answer;
            } else if (response.type === "actions_executed" && response.results?.[0]?.result) {
              expandedContent = (response.results[0].result as any).content || "";
            }

            if (expandedContent) {
              updatedOutline.modules[mi].lessons[li].chapters[ci] = {
                ...chapter,
                expanded: true,
                expandedContent,
              };
            }

            // Rate limiting to avoid API throttling
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            console.error(`Failed to expand chapter "${chapter.title}":`, error);
            // Continue with other chapters even if one fails
          }
        }
      }
    }

    return updatedOutline;
  };

  // Internal helper for course creation
  const createCourseInternal = async (outline: CourseOutline): Promise<{ 
    success: boolean; 
    courseId?: string; 
    slug?: string;
    link?: string;
    error?: string; 
  }> => {
    const modules = outline.modules.map((module, mi) => ({
      title: module.title,
      description: module.description,
      orderIndex: mi,
      lessons: module.lessons.map((lesson, li) => ({
        title: lesson.title,
        description: lesson.description,
        orderIndex: li,
        chapters: lesson.chapters.map((chapter, ci) => ({
          title: chapter.title,
          content: chapter.expandedContent || chapter.content,
          duration: chapter.duration || 10,
          orderIndex: ci,
        })),
      })),
    }));

    const result = await executeConfirmedActions({
      actions: [{
        tool: "createCourseWithModules",
        parameters: {
          title: outline.title,
          description: outline.description,
          category: outline.category || "Music Production",
          skillLevel: outline.skillLevel || "intermediate",
          price: 0,
          checkoutHeadline: `Master ${outline.title}`,
          modules,
        },
      }],
      userId: user!.id,
      storeId: selectedStoreId,
    });

    if (result.results?.[0]?.success) {
      const courseResult = result.results[0].result as any;
      return {
        success: true,
        courseId: courseResult.courseId || courseResult.id,
        slug: courseResult.slug,
        link: courseResult.link,
      };
    }

    return {
      success: false,
      error: result.results?.[0]?.error || "Failed to create course",
    };
  };

  // =============================================================================
  // GENERATE COURSE (Outline Only - for manual review)
  // =============================================================================
  const handleGenerateCourse = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a course topic or description");
      return;
    }

    setIsGenerating(true);
    setIsFullAuto(false);
    setGeneratedOutline(null);
    setCreatedCourseId(null);
    setCreatedCourseSlug(null);
    
    // Initialize steps
    setGenerationSteps([
      { id: "outline", label: "Generating course outline", status: "pending" },
    ]);

    try {
      // Generate course outline using the AI
      updateStep("outline", { status: "running", detail: "Analyzing topic and creating structure..." });

      const outline = await generateOutlineInternal();
      
      if (outline) {
        setGeneratedOutline(outline);
        const totalChapters = outline.modules.reduce((acc, m) => 
          acc + m.lessons.reduce((a, l) => a + l.chapters.length, 0), 0
        );
        updateStep("outline", { 
          status: "completed", 
          detail: `${outline.modules.length} modules, ${totalChapters} chapters` 
        });
        toast.success("Course outline generated! Review and expand chapters, then create.");
      } else {
        throw new Error("Could not generate course outline. Try rephrasing as: 'Create me a course about [topic]'");
      }

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
    }
  };

  // =============================================================================
  // EXPAND CHAPTER
  // =============================================================================
  const handleExpandChapter = async (
    moduleIndex: number, 
    lessonIndex: number, 
    chapterIndex: number
  ) => {
    if (!generatedOutline) return;
    
    const chapter = generatedOutline.modules[moduleIndex].lessons[lessonIndex].chapters[chapterIndex];
    
    toast.promise(
      (async () => {
        const response = await askAgenticAI({
          question: `Write detailed educational content for this chapter: "${chapter.title}". 
Context: This is part of a course about "${generatedOutline.title}". 
The chapter should cover: ${chapter.content}
Write 800-1200 words of comprehensive, video-script-ready content suitable for ${generatedOutline.skillLevel || "intermediate"} level learners.`,
          userId: user!.id,
          userRole: "admin",
          settings: {
            preset: settings.preset,
            maxFacets: 3,
            chunksPerFacet: 30,
            similarityThreshold: 0.65,
            enableCritic: settings.enableCritic,
            enableCreativeMode: true,
            enableWebResearch: settings.enableWebResearch,
            enableFactVerification: false,
            autoSaveWebResearch: false,
            responseStyle: "conversational",
          },
        });

        let expandedContent = "";
        
        if ("answer" in response) {
          expandedContent = response.answer;
        } else if (response.type === "actions_executed" && response.results?.[0]?.result) {
          expandedContent = (response.results[0].result as any).content || "";
        }

        if (!expandedContent) {
          throw new Error("No content generated");
        }

        // Update the outline with expanded content
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
            expandedContent,
          };
          return updated;
        });

        return expandedContent.split(" ").length;
      })(),
      {
        loading: `Expanding "${chapter.title}"...`,
        success: (wordCount) => `Expanded with ${wordCount} words`,
        error: (err) => `Failed: ${err.message}`,
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
  // CREATE COURSE
  // =============================================================================
  const handleCreateCourse = async () => {
    if (!generatedOutline || !selectedStoreId) {
      toast.error("No outline to create or store not selected");
      return;
    }

    setIsCreatingCourse(true);

    try {
      // Format the outline for the createCourseWithModules tool
      const modules = generatedOutline.modules.map((module, mi) => ({
        title: module.title,
        description: module.description,
        orderIndex: mi,
        lessons: module.lessons.map((lesson, li) => ({
          title: lesson.title,
          description: lesson.description,
          orderIndex: li,
          chapters: lesson.chapters.map((chapter, ci) => ({
            title: chapter.title,
            content: chapter.expandedContent || chapter.content,
            duration: chapter.duration || 10,
            orderIndex: ci,
          })),
        })),
      }));

      const result = await executeConfirmedActions({
        actions: [{
          tool: "createCourseWithModules",
          parameters: {
            title: generatedOutline.title,
            description: generatedOutline.description,
            category: generatedOutline.category || "Music Production",
            skillLevel: generatedOutline.skillLevel || "intermediate",
            price: 0,
            checkoutHeadline: `Master ${generatedOutline.title}`,
            modules,
          },
        }],
        userId: user!.id,
        storeId: selectedStoreId,
      });

      if (result.results?.[0]?.success) {
        const courseResult = result.results[0].result as any;
        setCreatedCourseId(courseResult.courseId || courseResult.id);
        toast.success("Course created successfully!", {
          action: courseResult.link ? {
            label: "View Course",
            onClick: () => window.open(courseResult.link, "_blank"),
          } : undefined,
        });
      } else {
        throw new Error(result.results?.[0]?.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Course creation error:", error);
      toast.error(`Failed to create course: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreatingCourse(false);
    }
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

                  {/* Facets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Facets</Label>
                      <span className="text-sm text-muted-foreground">{settings.maxFacets}</span>
                    </div>
                    <Slider
                      value={[settings.maxFacets]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, maxFacets: v }))}
                      min={1}
                      max={10}
                      step={1}
                    />
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
                      max={100}
                      step={5}
                    />
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

                  {/* Toggles */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Critic Stage</Label>
                      </div>
                      <Switch
                        checked={settings.enableCritic}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableCritic: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Creative Mode</Label>
                      </div>
                      <Switch
                        checked={settings.enableCreativeMode}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableCreativeMode: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Web Research</Label>
                      </div>
                      <Switch
                        checked={settings.enableWebResearch}
                        onCheckedChange={(v) => setSettings(s => ({ ...s, enableWebResearch: v }))}
                      />
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
                <CardTitle className="text-lg">Progress</CardTitle>
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
                  {(createdCourseId || createdCourseSlug) && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={createdCourseSlug ? `/course/${createdCourseSlug}` : `/courses/${createdCourseId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Course
                      </a>
                    </Button>
                  )}
                </div>
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
    </div>
  );
}
