"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Send,
  Settings,
  Bot,
  User,
  Loader2,
  Sparkles,
  Zap,
  Scale,
  Crown,
  Feather,
  ChevronDown,
  ExternalLink,
  Clock,
  Database,
  PanelLeftClose,
  PanelLeft,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Shield,
  Save,
  Wand2,
  Check,
  X,
  BookOpen,
  FileText,
  LayoutList,
  Pencil,
  Trash2,
  Copy,
  Link,
  AlertCircle,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  DEFAULT_CHAT_SETTINGS,
  MODEL_PRESETS,
  type ChatSettings,
  type PresetId,
  type Citation,
  type ResponseStyle,
} from "@/convex/masterAI/types";
import ConversationSidebar from "@/components/ai/ConversationSidebar";
import { AgentPicker, AgentSelector } from "@/components/ai/AgentPicker";

// ============================================================================
// TYPES
// ============================================================================

interface Agent {
  _id: Id<"aiAgents">;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  icon: string;
  color?: string;
  category: string;
  tags?: string[];
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  enabledTools?: string[];
  systemPrompt?: string;
  knowledgeFilters?: {
    categories?: string[];
    sourceTypes?: string[];
    tags?: string[];
  };
  defaultSettings?: {
    preset?: string;
    responseStyle?: string;
    maxFacets?: number;
    chunksPerFacet?: number;
    enableWebResearch?: boolean;
    enableCreativeMode?: boolean;
  };
  conversationCount?: number;
  rating?: number;
  ratingCount?: number;
  isBuiltIn: boolean;
  isFeatured?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
  pipelineMetadata?: {
    processingTimeMs: number;
    totalChunksProcessed: number;
    facetsUsed?: string[];
  };
  isStreaming?: boolean;
  feedback?: "up" | "down" | null;
  dbId?: Id<"aiMessages">; // Database ID for feedback
  // NEW: Action-related fields
  actionProposal?: ActionProposal;
  executedActions?: ActionsExecuted;
}

// Action Proposal Types
interface ProposedAction {
  tool: string;
  parameters: Record<string, unknown>;
  description: string;
  requiresConfirmation: boolean;
}

interface ActionProposal {
  type: "action_proposal";
  proposedActions: ProposedAction[];
  message: string;
  summary: string;
}

interface ScriptResult {
  script?: string;
  hook?: string;
  cta?: string;
  hashtags?: string[];
  notes?: string;
}

interface ToolCallResult {
  tool: string;
  success: boolean;
  result?: {
    message?: string;
    link?: string;
    courseId?: string;
    slug?: string;
    script?: ScriptResult;
    content?: Array<{ platform: string; text: string }>;
    [key: string]: unknown;
  };
  error?: string;
}

interface ActionsExecuted {
  type: "actions_executed";
  results: ToolCallResult[];
  summary: string;
  links?: Array<{
    label: string;
    url: string;
  }>;
}

interface PipelineStatus {
  stage: string;
  model: string;
  isActive: boolean;
  details?: string;
  facets?: string[];
  chunksRetrieved?: number;
  webResults?: number;
  summariesGenerated?: number;
  ideasGenerated?: number;
  verifiedClaims?: number;
  confidence?: number;
}

// ============================================================================
// PRESET ICONS
// ============================================================================

const PRESET_ICONS: Record<PresetId, React.ReactNode> = {
  budget: <Feather className="h-4 w-4" />,
  speed: <Zap className="h-4 w-4" />,
  balanced: <Scale className="h-4 w-4" />,
  deepReasoning: <Brain className="h-4 w-4" />,
  premium: <Crown className="h-4 w-4" />,
};

const RESPONSE_STYLE_OPTIONS: Record<
  ResponseStyle,
  { name: string; description: string; icon: React.ReactNode }
> = {
  structured: {
    name: "Structured",
    description: "Organized with headings and bullet points",
    icon: <LayoutList className="h-4 w-4" />,
  },
  conversational: {
    name: "Conversational",
    description: "Natural, flowing responses",
    icon: <Bot className="h-4 w-4" />,
  },
  concise: {
    name: "Concise",
    description: "Brief and to the point",
    icon: <Zap className="h-4 w-4" />,
  },
  educational: {
    name: "Educational",
    description: "Detailed explanations with examples",
    icon: <BookOpen className="h-4 w-4" />,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Performance: Max messages to render at once (older ones are hidden but kept for context)
const INITIAL_VISIBLE_MESSAGES = 20;
const LOAD_MORE_INCREMENT = 20;

export default function AIAssistantPage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [visibleMessageCount, setVisibleMessageCount] = useState(INITIAL_VISIBLE_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);

  // Conversation management
  const [currentConversationId, setCurrentConversationId] = useState<Id<"aiConversations"> | null>(
    null
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Agent selection
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Action proposal state
  const [pendingProposal, setPendingProposal] = useState<{
    messageId: string;
    proposal: ActionProposal;
  } | null>(null);
  const [isExecutingActions, setIsExecutingActions] = useState(false);

  // Agentic mode toggle
  const [agenticMode, setAgenticMode] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeConversationRef = useRef<string | null>(null);

  const askMasterAI = useAction((api as any).masterAI.index.askMasterAI);
  const askAgenticAI = useAction((api as any).masterAI.index.askAgenticAI);
  const executeConfirmedActions = useAction((api as any).masterAI.index.executeConfirmedActions);

  const createConversation = useMutation(api.aiConversations.createConversation);
  const saveMessage = useMutation(api.aiConversations.saveMessage);
  const updateConversationSettings = useMutation(api.aiConversations.updateConversationSettings);

  // Feedback mutation
  const submitFeedback = useMutation(api.aiMessageFeedback.submitFeedback);

  // Query to get conversation details (including settings)
  const currentConversation = useQuery(
    api.aiConversations.getConversation,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  );

  // Query to get agent details if conversation has an agent
  const conversationAgent = useQuery(
    api.aiAgents.getAgent,
    currentConversation?.agentId ? { agentId: currentConversation.agentId } : "skip"
  );

  // Load conversation messages when switching
  // Use a high limit to ensure all messages are fetched for long conversations
  const conversationMessages = useQuery(
    api.aiConversations.getConversationMessages,
    currentConversationId ? { conversationId: currentConversationId, limit: 1000 } : "skip"
  );

  // Get user's long-term memories for context
  const userMemories = useQuery(
    api.aiMemories.getRelevantMemories,
    user ? { userId: user.id, limit: 5 } : "skip"
  );

  // Cancel any pending request and reset state when conversation changes
  useEffect(() => {
    // Cancel any pending request from previous conversation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset loading state
    setIsLoading(false);
    setPipelineStatus(null);

    // Update active conversation ref
    activeConversationRef.current = currentConversationId;
  }, [currentConversationId]);

  // Load messages from database when conversation changes
  useEffect(() => {
    if (conversationMessages) {
      const loadedMessages: Message[] = conversationMessages.map((m: any) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        timestamp: new Date(m.createdAt),
        pipelineMetadata: m.pipelineMetadata
          ? {
              processingTimeMs: m.pipelineMetadata.processingTimeMs,
              totalChunksProcessed: m.pipelineMetadata.totalChunksProcessed,
              facetsUsed: m.facetsUsed,
            }
          : undefined,
      }));
      setMessages(loadedMessages);
    }
  }, [conversationMessages]);

  // Sync agent when conversation changes
  useEffect(() => {
    if (currentConversation) {
      if (currentConversation.agentId && conversationAgent) {
        // Set agent from loaded data
        setSelectedAgent(conversationAgent as Agent);
      } else if (!currentConversation.agentId) {
        // No agent for this conversation
        setSelectedAgent(null);
      }
    }
  }, [currentConversation, conversationAgent]);

  // Load settings when conversation changes
  useEffect(() => {
    if (currentConversation?.settings) {
      // Load full settings object from conversation
      setSettings({
        preset: (currentConversation.settings.preset as PresetId) || "balanced",
        maxFacets: currentConversation.settings.maxFacets ?? DEFAULT_CHAT_SETTINGS.maxFacets,
        chunksPerFacet:
          currentConversation.settings.chunksPerFacet ?? DEFAULT_CHAT_SETTINGS.chunksPerFacet,
        similarityThreshold:
          currentConversation.settings.similarityThreshold ??
          DEFAULT_CHAT_SETTINGS.similarityThreshold,
        enableCritic:
          currentConversation.settings.enableCritic ?? DEFAULT_CHAT_SETTINGS.enableCritic,
        enableCreativeMode:
          currentConversation.settings.enableCreativeMode ??
          DEFAULT_CHAT_SETTINGS.enableCreativeMode,
        enableWebResearch:
          currentConversation.settings.enableWebResearch ?? DEFAULT_CHAT_SETTINGS.enableWebResearch,
        enableFactVerification:
          currentConversation.settings.enableFactVerification ??
          DEFAULT_CHAT_SETTINGS.enableFactVerification,
        autoSaveWebResearch:
          currentConversation.settings.autoSaveWebResearch ??
          DEFAULT_CHAT_SETTINGS.autoSaveWebResearch,
        webSearchMaxResults:
          currentConversation.settings.webSearchMaxResults ??
          DEFAULT_CHAT_SETTINGS.webSearchMaxResults,
        responseStyle:
          (currentConversation.settings.responseStyle as ResponseStyle) || "structured",
      });
      if (currentConversation.settings.agenticMode !== undefined) {
        setAgenticMode(currentConversation.settings.agenticMode);
      }
    } else if (currentConversation && !currentConversation.settings) {
      // Legacy conversation - use preset/responseStyle if available
      if (currentConversation.preset) {
        setSettings((prev) => ({
          ...prev,
          preset: currentConversation.preset as PresetId,
        }));
      }
      if (currentConversation.responseStyle) {
        setSettings((prev) => ({
          ...prev,
          responseStyle: currentConversation.responseStyle as ResponseStyle,
        }));
      }
    }
  }, [currentConversation]);

  // Save settings when they change (debounced)
  const settingsToSaveRef = useRef<ChatSettings | null>(null);
  const agenticModeRef = useRef(agenticMode);
  agenticModeRef.current = agenticMode;

  useEffect(() => {
    if (!currentConversationId) return;

    // Store current settings for saving
    settingsToSaveRef.current = settings;

    // Debounce the save operation
    const timeoutId = setTimeout(async () => {
      if (settingsToSaveRef.current && currentConversationId) {
        try {
          await updateConversationSettings({
            conversationId: currentConversationId,
            settings: {
              preset: settingsToSaveRef.current.preset,
              maxFacets: settingsToSaveRef.current.maxFacets,
              chunksPerFacet: settingsToSaveRef.current.chunksPerFacet,
              similarityThreshold: settingsToSaveRef.current.similarityThreshold,
              enableCritic: settingsToSaveRef.current.enableCritic,
              enableCreativeMode: settingsToSaveRef.current.enableCreativeMode,
              enableWebResearch: settingsToSaveRef.current.enableWebResearch,
              enableFactVerification: settingsToSaveRef.current.enableFactVerification,
              autoSaveWebResearch: settingsToSaveRef.current.autoSaveWebResearch,
              webSearchMaxResults: settingsToSaveRef.current.webSearchMaxResults,
              responseStyle: settingsToSaveRef.current.responseStyle,
              agenticMode: agenticModeRef.current,
            },
          });
        } catch (error) {
          console.error("Failed to save settings:", error);
        }
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [settings, currentConversationId, updateConversationSettings]);

  // Also save when agentic mode changes
  useEffect(() => {
    if (!currentConversationId) return;

    const timeoutId = setTimeout(async () => {
      if (settingsToSaveRef.current && currentConversationId) {
        try {
          await updateConversationSettings({
            conversationId: currentConversationId,
            settings: {
              ...settingsToSaveRef.current,
              agenticMode,
            },
          });
        } catch (error) {
          console.error("Failed to save agentic mode:", error);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [agenticMode, currentConversationId, updateConversationSettings]);

  // Clear messages when starting a new conversation
  const handleNewConversation = (agent?: Agent | null) => {
    setCurrentConversationId(null);
    setMessages([]);
    setVisibleMessageCount(INITIAL_VISIBLE_MESSAGES);
    // If an agent is passed, use it; otherwise keep current or clear
    if (agent !== undefined) {
      setSelectedAgent(agent);
    }
    inputRef.current?.focus();
  };

  // Select an existing conversation
  const handleSelectConversation = (id: Id<"aiConversations"> | null) => {
    setCurrentConversationId(id);
    setVisibleMessageCount(INITIAL_VISIBLE_MESSAGES);
    if (!id) {
      setMessages([]);
    }
  };

  // Load more messages handler
  const handleLoadMoreMessages = useCallback(() => {
    setVisibleMessageCount((prev) => prev + LOAD_MORE_INCREMENT);
  }, []);

  // Compute visible messages (memoized for performance)
  const visibleMessages = useMemo(() => {
    if (messages.length <= visibleMessageCount) {
      return messages;
    }
    // Show the most recent messages
    return messages.slice(-visibleMessageCount);
  }, [messages, visibleMessageCount]);

  const hasHiddenMessages = messages.length > visibleMessageCount;

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on load
  useEffect(() => {
    if (isLoaded && user) {
      inputRef.current?.focus();
    }
  }, [isLoaded, user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create conversation if this is the first message
    let conversationId = currentConversationId;
    if (!conversationId) {
      try {
        conversationId = await createConversation({
          userId: user.id,
          preset: settings.preset,
          responseStyle: settings.responseStyle,
          // Include agent info if selected
          agentId: selectedAgent?._id,
          agentSlug: selectedAgent?.slug,
          agentName: selectedAgent?.name,
        });
        setCurrentConversationId(conversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }

    // Save user message to database
    if (conversationId) {
      try {
        await saveMessage({
          conversationId,
          userId: user.id,
          role: "user",
          content: userMessage.content,
        });
      } catch (error) {
        console.error("Failed to save user message:", error);
      }
    }

    // Build conversation context from recent messages (short-term memory)
    const conversationContext = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Note: Long-term memories are now fetched and formatted by the backend pipeline
    // This is more reliable and doesn't pollute the question text

    // Cancel any existing request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Track which conversation this request is for
    activeConversationRef.current = conversationId;

    try {
      // Try streaming endpoint first
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content, // Clean question, no memory appending
          settings,
          conversationContext,
          conversationId, // Use local variable (not state) for newly created conversations
          // Agent-specific parameters for tool filtering
          agentId: selectedAgent?._id,
          agentEnabledTools: selectedAgent?.enabledTools,
          agentSystemPrompt: selectedAgent?.systemPrompt,
        }),
        signal: abortController.signal, // Allow cancellation
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      // Check if this request is still relevant (conversation hasn't changed)
      if (activeConversationRef.current !== conversationId) {
        return;
      }

      // Create placeholder for assistant message
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let finalResponse: any = null;

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
              handleStreamEvent(event, assistantMessageId);

              // Capture the final response for saving to database
              if (event.type === "complete") {
                finalResponse = event.response;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Save assistant message to database after streaming completes
      if (conversationId && finalResponse) {
        try {
          await saveMessage({
            conversationId,
            userId: user.id,
            role: "assistant",
            content: finalResponse.answer,
            citations: finalResponse.citations,
            facetsUsed: finalResponse.facetsUsed,
            pipelineMetadata: finalResponse.pipelineMetadata
              ? {
                  processingTimeMs: finalResponse.pipelineMetadata.processingTimeMs,
                  totalChunksProcessed: finalResponse.pipelineMetadata.totalChunksProcessed,
                  plannerModel: finalResponse.pipelineMetadata.plannerModel,
                  summarizerModel: finalResponse.pipelineMetadata.summarizerModel,
                  finalWriterModel: finalResponse.pipelineMetadata.finalWriterModel,
                }
              : undefined,
          });
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
    } catch (error) {
      // Check if request was aborted (user switched conversations)
      if (error instanceof Error && error.name === "AbortError") {
        return; // Don't show error, just exit
      }

      // Check if conversation changed during request
      if (activeConversationRef.current !== conversationId) {
        return;
      }

      console.error("Chat error:", error);

      // Fallback to direct Convex action
      try {
        // Use agentic endpoint if enabled, otherwise use standard
        if (agenticMode) {
          const result = await askAgenticAI({
            question: userMessage.content,
            settings,
            userId: user.id,
            storeId: "", // TODO: Get user's store ID
            userRole: "creator",
            conversationContext,
            // Pass agent-specific parameters
            agentId: selectedAgent?._id,
            agentEnabledTools: selectedAgent?.enabledTools,
            agentSystemPrompt: selectedAgent?.systemPrompt,
          });

          const assistantMessageId = (Date.now() + 1).toString();

          // Check if this is an action proposal
          if (result.type === "action_proposal") {
            const assistantMessage: Message = {
              id: assistantMessageId,
              role: "assistant",
              content: result.message,
              timestamp: new Date(),
              actionProposal: result,
            };

            setMessages((prev) => {
              const filtered = prev.filter((m) => !m.isStreaming);
              return [...filtered, assistantMessage];
            });

            // Set pending proposal for confirmation
            setPendingProposal({
              messageId: assistantMessageId,
              proposal: result,
            });
          } else if (result.type === "actions_executed") {
            const assistantMessage: Message = {
              id: assistantMessageId,
              role: "assistant",
              content: result.summary,
              timestamp: new Date(),
              executedActions: result,
            };

            setMessages((prev) => {
              const filtered = prev.filter((m) => !m.isStreaming);
              return [...filtered, assistantMessage];
            });
          } else {
            // Standard Q&A response
            const assistantMessage: Message = {
              id: assistantMessageId,
              role: "assistant",
              content: result.answer,
              citations: result.citations,
              timestamp: new Date(),
              pipelineMetadata: {
                processingTimeMs: result.pipelineMetadata?.processingTimeMs || 0,
                totalChunksProcessed: result.pipelineMetadata?.totalChunksProcessed || 0,
                facetsUsed: result.facetsUsed,
              },
            };

            setMessages((prev) => {
              const filtered = prev.filter((m) => !m.isStreaming);
              return [...filtered, assistantMessage];
            });
          }
        } else {
          // Standard Q&A mode
          const result = await askMasterAI({
            question: userMessage.content,
            settings,
            userId: user.id,
            conversationContext,
          });

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: result.answer,
            citations: result.citations,
            timestamp: new Date(),
            pipelineMetadata: {
              processingTimeMs: result.pipelineMetadata.processingTimeMs,
              totalChunksProcessed: result.pipelineMetadata.totalChunksProcessed,
              facetsUsed: result.facetsUsed,
            },
          };

          // Save assistant message to database
          if (conversationId) {
            try {
              await saveMessage({
                conversationId,
                userId: user.id,
                role: "assistant",
                content: result.answer,
                citations: result.citations,
                facetsUsed: result.facetsUsed,
                pipelineMetadata: {
                  processingTimeMs: result.pipelineMetadata.processingTimeMs,
                  totalChunksProcessed: result.pipelineMetadata.totalChunksProcessed,
                  plannerModel: result.pipelineMetadata.plannerModel,
                  summarizerModel: result.pipelineMetadata.summarizerModel,
                  finalWriterModel: result.pipelineMetadata.finalWriterModel,
                },
              });
            } catch (error) {
              console.error("Failed to save assistant message:", error);
            }
          }

          setMessages((prev) => {
            // Remove any streaming placeholder
            const filtered = prev.filter((m) => !m.isStreaming);
            return [...filtered, assistantMessage];
          });
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        setMessages((prev) => [
          ...prev.filter((m) => !m.isStreaming),
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "I'm sorry, I encountered an error while processing your question. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setPipelineStatus(null);
    }
  };

  // Handle stream events
  const handleStreamEvent = (event: any, messageId: string) => {
    switch (event.type) {
      case "stage_start":
        setPipelineStatus((prev) => ({
          ...prev,
          stage: event.stage,
          model: event.model,
          isActive: true,
        }));
        break;

      case "stage_complete":
        setPipelineStatus((prev) => (prev ? { ...prev, isActive: false } : null));
        break;

      case "facets_identified":
        setPipelineStatus((prev) => (prev ? { ...prev, facets: event.facets } : null));
        break;

      case "chunks_retrieved":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                chunksRetrieved: (prev.chunksRetrieved || 0) + event.count,
                details: `${event.facet}: ${event.count} sources`,
              }
            : null
        );
        break;

      case "web_research_start":
        setPipelineStatus((prev) => (prev ? { ...prev, details: "Searching web..." } : null));
        break;

      case "web_research_result":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                webResults: (prev.webResults || 0) + event.count,
                details: `Web: ${event.facet} (${event.count} results)`,
              }
            : null
        );
        break;

      case "web_research_complete":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                webResults: event.totalResults,
                details: event.savedToEmbeddings ? "Web results saved to knowledge" : undefined,
              }
            : null
        );
        break;

      case "summary_generated":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                summariesGenerated: (prev.summariesGenerated || 0) + 1,
                details: `Summarizing: ${event.facet}`,
              }
            : null
        );
        break;

      case "ideas_generated":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                ideasGenerated: event.count,
              }
            : null
        );
        break;

      case "fact_verification_start":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                details: `Verifying ${event.claimCount} claims...`,
              }
            : null
        );
        break;

      case "fact_verification_complete":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                verifiedClaims: event.verifiedCount,
                confidence: event.confidence,
              }
            : null
        );
        break;

      case "critic_review":
        setPipelineStatus((prev) =>
          prev
            ? {
                ...prev,
                details: event.approved
                  ? `Quality: ${Math.round(event.quality * 100)}%`
                  : "Revising...",
              }
            : null
        );
        break;

      case "text_delta":
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: m.content + event.delta } : m))
        );
        break;

      case "complete":
        // Handle different response types (standard Q&A vs agentic responses)
        const response = event.response;

        // Check if this is an action proposal or executed actions (from agentic AI)
        if (response.type === "action_proposal") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: response.message,
                    isStreaming: false,
                    actionProposal: response,
                  }
                : m
            )
          );
          // Set pending proposal for confirmation
          setPendingProposal({
            messageId,
            proposal: response,
          });
        } else if (response.type === "actions_executed") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: response.summary,
                    isStreaming: false,
                    executedActions: response,
                  }
                : m
            )
          );
        } else {
          // Standard Q&A response with pipelineMetadata
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: response.answer,
                    citations: response.citations,
                    isStreaming: false,
                    pipelineMetadata: response.pipelineMetadata
                      ? {
                          processingTimeMs: response.pipelineMetadata.processingTimeMs,
                          totalChunksProcessed: response.pipelineMetadata.totalChunksProcessed,
                          facetsUsed: response.facetsUsed,
                        }
                      : undefined,
                  }
                : m
            )
          );
        }
        break;

      case "error":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: `Error: ${event.message}`,
                  isStreaming: false,
                }
              : m
          )
        );
        break;
    }
  };

  // Handle feedback submission
  const handleFeedback = useCallback(
    async (messageId: string, vote: "up" | "down") => {
      if (!user || !currentConversationId) return;

      // Find the message to get its database ID
      const message = messages.find((m) => m.id === messageId);
      if (!message?.dbId) {
        console.warn("No database ID for message, feedback not saved");
        return;
      }

      try {
        await submitFeedback({
          messageId: message.dbId,
          conversationId: currentConversationId,
          userId: user.id,
          vote,
        });
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    },
    [user, currentConversationId, messages, submitFeedback]
  );

  // Handle regenerating a response
  const handleRegenerate = useCallback(
    (messageId: string, customSettings?: { preset?: PresetId; responseStyle?: ResponseStyle }) => {
      if (!user || isLoading) return;

      // Find the AI message and the preceding user message
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Look for the user message before this AI message
      let userMessageIndex = messageIndex - 1;
      while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
        userMessageIndex--;
      }

      if (userMessageIndex < 0) {
        console.warn("Could not find user message to regenerate from");
        return;
      }

      const userMessage = messages[userMessageIndex];

      // If custom settings provided, update the settings first
      if (customSettings) {
        setSettings((prev) => ({
          ...prev,
          ...(customSettings.preset && { preset: customSettings.preset }),
          ...(customSettings.responseStyle && { responseStyle: customSettings.responseStyle }),
        }));
      }

      // Remove the AI response we're regenerating (and any responses after it)
      setMessages((prev) => prev.slice(0, messageIndex));

      // Re-submit the user's question by setting input and triggering form submit
      setInputValue(userMessage.content);

      // Use a ref-based approach to submit the form (slight delay to allow settings to update)
      setTimeout(() => {
        inputRef.current?.form?.requestSubmit();
      }, 100);
    },
    [user, isLoading, messages]
  );

  // Handle confirming proposed actions
  const handleConfirmActions = useCallback(async () => {
    if (!pendingProposal || !user) return;

    setIsExecutingActions(true);

    try {
      // Get the user's store ID (you may need to fetch this differently)
      const storeId = ""; // TODO: Get from user context or query

      const result = await executeConfirmedActions({
        actions: pendingProposal.proposal.proposedActions.map((a) => ({
          tool: a.tool,
          parameters: a.parameters,
        })),
        userId: user.id,
        storeId,
      });

      // Update the message with executed actions
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingProposal.messageId
            ? {
                ...m,
                content: result.summary,
                actionProposal: undefined,
                executedActions: result,
              }
            : m
        )
      );

      setPendingProposal(null);
    } catch (error) {
      console.error("Failed to execute actions:", error);
      // Add error message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingProposal.messageId
            ? {
                ...m,
                content: `Error executing actions: ${error instanceof Error ? error.message : "Unknown error"}`,
                actionProposal: undefined,
              }
            : m
        )
      );
      setPendingProposal(null);
    } finally {
      setIsExecutingActions(false);
    }
  }, [pendingProposal, user, executeConfirmedActions]);

  // Handle canceling proposed actions
  const handleCancelActions = useCallback(() => {
    if (!pendingProposal) return;

    // Update the message to show cancellation
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingProposal.messageId
          ? {
              ...m,
              content:
                "I've cancelled the proposed actions. Let me know if you'd like to try something different!",
              actionProposal: undefined,
            }
          : m
      )
    );

    setPendingProposal(null);
  }, [pendingProposal]);

  // Not loaded yet
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Brain className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">Please sign in to use the AI Assistant</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Conversation Sidebar */}
      {user && (
        <ConversationSidebar
          userId={user.id}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between overflow-x-hidden border-b border-border bg-card px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 md:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>

            <div className="hidden flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2 sm:flex">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <h1 className="truncate text-xl font-bold">AI Assistant</h1>
              <p className="truncate text-sm text-muted-foreground">
                {currentConversationId ? "Continue conversation" : "New conversation"}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
            {/* Agent Picker */}
            <AgentPicker
              selectedAgentId={selectedAgent?._id}
              onSelectAgent={(agent) => {
                if (!currentConversationId) {
                  // If no active conversation, just set the agent
                  setSelectedAgent(agent);
                } else {
                  // Start new conversation with the agent
                  handleNewConversation(agent);
                }
              }}
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs sm:h-9 sm:text-sm">
                  {selectedAgent ? (
                    <>
                      <span className="text-base">{selectedAgent.icon}</span>
                      <span className="hidden max-w-[100px] truncate sm:inline">
                        {selectedAgent.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      <span className="hidden sm:inline">Default</span>
                    </>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              }
            />

            {/* Memory indicator - hidden on mobile */}
            {userMemories && userMemories.length > 0 && (
              <Badge variant="secondary" className="hidden items-center gap-1.5 lg:flex">
                <Brain className="h-3 w-3" />
                <span>{userMemories.length} memories</span>
              </Badge>
            )}

            {/* Model Preset Selector */}
            <Select
              value={settings.preset}
              onValueChange={(value: PresetId) =>
                setSettings((prev) => ({ ...prev, preset: value }))
              }
            >
              <SelectTrigger className="h-8 w-[100px] bg-background text-xs sm:h-9 sm:w-[130px] sm:text-sm md:w-[150px]">
                <div className="flex items-center gap-1 sm:gap-2">
                  {PRESET_ICONS[settings.preset]}
                  <span className="xs:inline hidden truncate">
                    {MODEL_PRESETS[settings.preset].name}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {(Object.keys(MODEL_PRESETS) as PresetId[]).map((presetId) => (
                  <SelectItem key={presetId} value={presetId}>
                    <div className="flex items-center gap-2">
                      {PRESET_ICONS[presetId]}
                      <div className="flex flex-col">
                        <span className="font-medium">{MODEL_PRESETS[presetId].name}</span>
                        <span className="hidden text-xs text-muted-foreground sm:block">
                          {MODEL_PRESETS[presetId].description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Response Style Selector - hidden on smallest screens */}
            <Select
              value={settings.responseStyle}
              onValueChange={(value: ResponseStyle) =>
                setSettings((prev) => ({ ...prev, responseStyle: value }))
              }
            >
              <SelectTrigger className="xs:flex hidden h-8 w-[90px] bg-background text-xs sm:h-9 sm:w-[120px] sm:text-sm md:w-[140px]">
                <div className="flex items-center gap-1 sm:gap-2">
                  {RESPONSE_STYLE_OPTIONS[settings.responseStyle].icon}
                  <span className="hidden truncate sm:inline">
                    {RESPONSE_STYLE_OPTIONS[settings.responseStyle].name}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {(Object.keys(RESPONSE_STYLE_OPTIONS) as ResponseStyle[]).map((style) => (
                  <SelectItem key={style} value={style}>
                    <div className="flex items-center gap-2">
                      {RESPONSE_STYLE_OPTIONS[style].icon}
                      <div className="flex flex-col">
                        <span className="font-medium">{RESPONSE_STYLE_OPTIONS[style].name}</span>
                        <span className="hidden text-xs text-muted-foreground sm:block">
                          {RESPONSE_STYLE_OPTIONS[style].description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Agentic Mode Toggle */}
            <div className="hidden items-center gap-2 md:flex">
              <Label
                htmlFor="agentic-mode"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                Actions
              </Label>
              <Switch id="agentic-mode" checked={agenticMode} onCheckedChange={setAgenticMode} />
            </div>

            {/* Settings Button */}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full bg-white dark:bg-black sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Chat Settings</SheetTitle>
                  <SheetDescription>Configure the AI pipeline behavior</SheetDescription>
                </SheetHeader>
                <SettingsPanel
                  settings={settings}
                  setSettings={setSettings}
                  agenticMode={agenticMode}
                  setAgenticMode={setAgenticMode}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            {messages.length === 0 && <WelcomeMessage agent={selectedAgent} />}

            {/* Load more button for older messages */}
            {hasHiddenMessages && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMoreMessages}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="mr-2 h-4 w-4 rotate-180" />
                  Load {Math.min(LOAD_MORE_INCREMENT, messages.length - visibleMessageCount)} older
                  messages
                  <span className="ml-2 text-xs opacity-60">
                    ({messages.length - visibleMessageCount} hidden)
                  </span>
                </Button>
              </div>
            )}

            {visibleMessages.map((message) => (
              <div key={message.id}>
                <MemoizedMessageBubble
                  message={message}
                  onFeedback={handleFeedback}
                  currentConversationId={currentConversationId}
                  onRegenerate={message.role === "assistant" ? handleRegenerate : undefined}
                  currentSettings={settings}
                />

                {/* Show Action Proposal Card if this message has one */}
                {message.actionProposal && pendingProposal?.messageId === message.id && (
                  <ActionProposalCard
                    proposal={message.actionProposal}
                    onConfirm={handleConfirmActions}
                    onCancel={handleCancelActions}
                    isExecuting={isExecutingActions}
                  />
                )}

                {/* Show Executed Actions if this message has them */}
                {message.executedActions && (
                  <ExecutedActionsCard executedActions={message.executedActions} />
                )}
              </div>
            ))}

            {/* Pipeline Status */}
            {isLoading && pipelineStatus && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-medium">
                    {pipelineStatus.stage === "planner" && "📋 Analyzing question..."}
                    {pipelineStatus.stage === "retriever" && "🔍 Searching knowledge base..."}
                    {pipelineStatus.stage === "webResearch" && "🌐 Researching the web..."}
                    {pipelineStatus.stage === "summarizer" && "📝 Synthesizing information..."}
                    {pipelineStatus.stage === "ideaGenerator" && "💡 Generating creative ideas..."}
                    {pipelineStatus.stage === "factVerifier" && "🔬 Verifying facts..."}
                    {pipelineStatus.stage === "critic" && "🎯 Quality review..."}
                    {pipelineStatus.stage === "finalWriter" && "✍️ Writing response..."}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {pipelineStatus.model}
                  </Badge>
                </div>

                {/* Progress details */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {pipelineStatus.facets && pipelineStatus.facets.length > 0 && (
                    <span className="flex items-center gap-1">
                      Topics: {pipelineStatus.facets.join(", ")}
                    </span>
                  )}
                  {pipelineStatus.chunksRetrieved !== undefined &&
                    pipelineStatus.chunksRetrieved > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📚 {pipelineStatus.chunksRetrieved} sources
                      </Badge>
                    )}
                  {pipelineStatus.webResults !== undefined && pipelineStatus.webResults > 0 && (
                    <Badge variant="outline" className="text-xs">
                      🌐 {pipelineStatus.webResults} web results
                    </Badge>
                  )}
                  {pipelineStatus.summariesGenerated !== undefined &&
                    pipelineStatus.summariesGenerated > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📝 {pipelineStatus.summariesGenerated} summaries
                      </Badge>
                    )}
                  {pipelineStatus.ideasGenerated !== undefined &&
                    pipelineStatus.ideasGenerated > 0 && (
                      <Badge variant="outline" className="text-xs">
                        💡 {pipelineStatus.ideasGenerated} ideas
                      </Badge>
                    )}
                  {pipelineStatus.confidence !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      ✓ {Math.round(pipelineStatus.confidence * 100)}% verified
                    </Badge>
                  )}
                </div>

                {/* Current detail */}
                {pipelineStatus.details && (
                  <p className="text-xs italic text-muted-foreground">{pipelineStatus.details}</p>
                )}
              </div>
            )}

            {isLoading && !pipelineStatus && (
              <div className="flex animate-pulse items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about your courses..."
                disabled={isLoading}
                className="flex-1 bg-background"
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WELCOME MESSAGE
// ============================================================================

const COLOR_BG_CLASSES: Record<string, string> = {
  violet: "from-violet-500/10 to-purple-600/10",
  amber: "from-amber-500/10 to-orange-600/10",
  pink: "from-pink-500/10 to-rose-600/10",
  emerald: "from-emerald-500/10 to-teal-600/10",
  yellow: "from-yellow-500/10 to-amber-600/10",
  blue: "from-blue-500/10 to-indigo-600/10",
  red: "from-red-500/10 to-rose-600/10",
};

const COLOR_TEXT_CLASSES: Record<string, string> = {
  violet: "text-violet-500",
  amber: "text-amber-500",
  pink: "text-pink-500",
  emerald: "text-emerald-500",
  yellow: "text-yellow-500",
  blue: "text-blue-500",
  red: "text-red-500",
};

function WelcomeMessage({ agent }: { agent?: Agent | null }) {
  const bgColor = agent?.color
    ? COLOR_BG_CLASSES[agent.color]
    : "from-violet-500/10 to-purple-600/10";
  const textColor = agent?.color ? COLOR_TEXT_CLASSES[agent.color] : "text-violet-500";

  // Default suggestions if no agent or agent has no suggestions
  const defaultSuggestions = [
    "How do I create a Rufus Du Sol style lead?",
    "What are the best mixing techniques for vocals?",
    "Explain sidechain compression",
  ];

  const suggestions = agent?.suggestedQuestions?.length
    ? agent.suggestedQuestions
    : defaultSuggestions;

  return (
    <div className="py-12 text-center">
      <div className={cn("mb-4 inline-flex rounded-full bg-gradient-to-br p-4", bgColor)}>
        {agent ? (
          <span className="text-5xl">{agent.icon}</span>
        ) : (
          <Sparkles className={cn("h-12 w-12", textColor)} />
        )}
      </div>
      <h2 className="mb-2 text-2xl font-bold">
        {agent ? `Chat with ${agent.name}` : "Welcome to AI Assistant"}
      </h2>
      <p className="mx-auto mb-6 max-w-md text-muted-foreground">
        {agent?.welcomeMessage ||
          agent?.description ||
          "Ask me anything about your courses. I'll search through your knowledge base and provide comprehensive answers with sources."}
      </p>
      {agent?.longDescription && (
        <p className="mx-auto mb-6 max-w-lg text-sm text-muted-foreground opacity-80">
          {agent.longDescription}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((text, i) => (
          <SuggestionChip key={i} text={text} />
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {text}
    </button>
  );
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({
  message,
  onFeedback,
  currentConversationId,
  onCopy,
  onRegenerate,
  currentSettings,
}: {
  message: Message;
  onFeedback?: (messageId: string, vote: "up" | "down") => void;
  currentConversationId?: Id<"aiConversations"> | null;
  onCopy?: (content: string) => void;
  onRegenerate?: (
    messageId: string,
    settings?: { preset?: PresetId; responseStyle?: ResponseStyle }
  ) => void;
  currentSettings?: ChatSettings;
}) {
  const isUser = message.role === "user";
  const [localFeedback, setLocalFeedback] = useState<"up" | "down" | null>(
    message.feedback || null
  );
  const [copied, setCopied] = useState(false);
  const [regenPopoverOpen, setRegenPopoverOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(
    currentSettings?.preset || "balanced"
  );
  const [selectedStyle, setSelectedStyle] = useState<ResponseStyle>(
    currentSettings?.responseStyle || "structured"
  );

  // Sync with current settings when they change (use specific values, not the object)
  const currentPreset = currentSettings?.preset;
  const currentResponseStyle = currentSettings?.responseStyle;

  useEffect(() => {
    if (currentPreset) {
      setSelectedPreset(currentPreset);
    }
  }, [currentPreset]);

  useEffect(() => {
    if (currentResponseStyle) {
      setSelectedStyle(currentResponseStyle);
    }
  }, [currentResponseStyle]);

  const handleFeedback = (vote: "up" | "down") => {
    const newVote = localFeedback === vote ? null : vote;
    setLocalFeedback(newVote);
    if (onFeedback && newVote) {
      onFeedback(message.id, vote);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleRegenerate = (withCustomSettings: boolean = false) => {
    if (withCustomSettings) {
      onRegenerate?.(message.id, { preset: selectedPreset, responseStyle: selectedStyle });
    } else {
      onRegenerate?.(message.id);
    }
    setRegenPopoverOpen(false);
  };

  return (
    <div
      className={cn("flex w-full gap-3 overflow-hidden", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] overflow-hidden break-words rounded-2xl px-4 py-3 sm:max-w-[80%]",
          isUser
            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
            : "border border-border bg-card"
        )}
      >
        {/* Content */}
        <div
          className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "dark:prose-invert")}
        >
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating response...</span>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => (
                  <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-xs",
                      isUser ? "bg-white/20" : "bg-muted"
                    )}
                  >
                    {children}
                  </code>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 mt-4 text-lg font-semibold">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-1 mt-3 text-base font-semibold">{children}</h3>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Sources:</p>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((citation) => (
                <Badge
                  key={citation.id}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  <span className="font-mono">[{citation.id}]</span>
                  <span className="max-w-[150px] truncate">{citation.title}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons for user messages */}
        {isUser && !message.isStreaming && (
          <div className="mt-2 flex items-center justify-end gap-1 border-t border-white/20 pt-2">
            <button
              onClick={handleCopy}
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              title="Copy message"
            >
              {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {/* Metadata + Feedback + Actions for AI messages */}
        {!isUser && !message.isStreaming && (
          <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {message.pipelineMetadata && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(message.pipelineMetadata.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {message.pipelineMetadata.totalChunksProcessed} sources
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons: Copy, Regenerate, Feedback */}
            <div className="flex items-center gap-1">
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  copied
                    ? "bg-green-500/20 text-green-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Copy response"
              >
                {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              {/* Regenerate Button with Options */}
              {onRegenerate && (
                <Popover open={regenPopoverOpen} onOpenChange={setRegenPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Regenerate response"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 bg-white p-3 dark:bg-black" align="end">
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Regenerate Response</div>

                      {/* Quick regenerate with current settings */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleRegenerate(false)}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Use current settings
                      </Button>

                      <div className="space-y-2 border-t pt-3">
                        <div className="text-xs font-medium text-muted-foreground">
                          Or customize:
                        </div>

                        {/* Preset selector */}
                        <div className="space-y-1">
                          <Label className="text-xs">Model Preset</Label>
                          <Select
                            value={selectedPreset}
                            onValueChange={(v: PresetId) => setSelectedPreset(v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <div className="flex items-center gap-2">
                                {PRESET_ICONS[selectedPreset]}
                                <span>{MODEL_PRESETS[selectedPreset].name}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              {(Object.keys(MODEL_PRESETS) as PresetId[]).map((presetId) => (
                                <SelectItem key={presetId} value={presetId} className="text-xs">
                                  <div className="flex items-center gap-2">
                                    {PRESET_ICONS[presetId]}
                                    <span>{MODEL_PRESETS[presetId].name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Response style selector */}
                        <div className="space-y-1">
                          <Label className="text-xs">Response Style</Label>
                          <Select
                            value={selectedStyle}
                            onValueChange={(v: ResponseStyle) => setSelectedStyle(v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <div className="flex items-center gap-2">
                                {RESPONSE_STYLE_OPTIONS[selectedStyle].icon}
                                <span>{RESPONSE_STYLE_OPTIONS[selectedStyle].name}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              {(Object.keys(RESPONSE_STYLE_OPTIONS) as ResponseStyle[]).map(
                                (style) => (
                                  <SelectItem key={style} value={style} className="text-xs">
                                    <div className="flex items-center gap-2">
                                      {RESPONSE_STYLE_OPTIONS[style].icon}
                                      <span>{RESPONSE_STYLE_OPTIONS[style].name}</span>
                                    </div>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Regenerate with custom settings */}
                        <Button
                          size="sm"
                          className="mt-2 w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                          onClick={() => handleRegenerate(true)}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Regenerate with these settings
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Divider */}
              <div className="mx-1 h-4 w-px bg-border" />

              {/* Feedback Buttons */}
              <button
                onClick={() => handleFeedback("up")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  localFeedback === "up"
                    ? "bg-green-500/20 text-green-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Helpful response"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  localFeedback === "down"
                    ? "bg-red-500/20 text-red-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Not helpful"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Memoized version for performance - only re-renders when props actually change
const MemoizedMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific things change
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.message.feedback === nextProps.message.feedback &&
    prevProps.currentConversationId === nextProps.currentConversationId &&
    prevProps.currentSettings?.preset === nextProps.currentSettings?.preset &&
    prevProps.currentSettings?.responseStyle === nextProps.currentSettings?.responseStyle
  );
});

// ============================================================================
// SETTINGS PANEL
// ============================================================================

function SettingsPanel({
  settings,
  setSettings,
  agenticMode,
  setAgenticMode,
}: {
  settings: ChatSettings;
  setSettings: React.Dispatch<React.SetStateAction<ChatSettings>>;
  agenticMode?: boolean;
  setAgenticMode?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="mt-4 h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden">
      <div className="space-y-6 pb-8 pr-4">
        {/* Agentic Mode Toggle (visible on mobile) */}
        {setAgenticMode && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3 md:hidden">
            <div>
              <Label htmlFor="agentic-mode-settings" className="font-medium">
                Action Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow AI to create courses, lessons, etc.
              </p>
            </div>
            <Switch
              id="agentic-mode-settings"
              checked={agenticMode}
              onCheckedChange={setAgenticMode}
            />
          </div>
        )}

        {/* Preset Selection */}
        <div className="space-y-3">
          <Label>Model Preset</Label>
          <Select
            value={settings.preset}
            onValueChange={(value: PresetId) => setSettings((prev) => ({ ...prev, preset: value }))}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {(Object.keys(MODEL_PRESETS) as PresetId[]).map((presetId) => {
                const preset = MODEL_PRESETS[presetId];
                return (
                  <SelectItem key={presetId} value={presetId}>
                    <div className="flex items-center gap-2">
                      {PRESET_ICONS[presetId]}
                      <span>{preset.name}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Max Facets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Max Facets</Label>
            <span className="text-sm text-muted-foreground">{settings.maxFacets}</span>
          </div>
          <Slider
            value={[settings.maxFacets]}
            onValueChange={([value]) => setSettings((prev) => ({ ...prev, maxFacets: value }))}
            min={1}
            max={5}
            step={1}
          />
          <p className="text-xs text-muted-foreground">Number of sub-topics to analyze</p>
        </div>

        {/* Chunks per Facet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Chunks per Facet</Label>
            <span className="text-sm text-muted-foreground">{settings.chunksPerFacet}</span>
          </div>
          <Slider
            value={[settings.chunksPerFacet]}
            onValueChange={([value]) => setSettings((prev) => ({ ...prev, chunksPerFacet: value }))}
            min={5}
            max={50}
            step={5}
          />
          <p className="text-xs text-muted-foreground">Amount of knowledge to retrieve per topic</p>
        </div>

        {/* Similarity Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Similarity Threshold</Label>
            <span className="text-sm text-muted-foreground">
              {settings.similarityThreshold.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[settings.similarityThreshold]}
            onValueChange={([value]) =>
              setSettings((prev) => ({ ...prev, similarityThreshold: value }))
            }
            min={0.5}
            max={0.95}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">Minimum relevance score for sources</p>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label>Critic Stage</Label>
              <p className="text-xs text-muted-foreground">Quality review before response</p>
            </div>
            <Switch
              className="flex-shrink-0"
              checked={settings.enableCritic}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enableCritic: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label>Creative Mode</Label>
              <p className="text-xs text-muted-foreground">Generate new ideas beyond sources</p>
            </div>
            <Switch
              className="flex-shrink-0"
              checked={settings.enableCreativeMode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enableCreativeMode: checked }))
              }
            />
          </div>
        </div>

        {/* Research & Verification */}
        <div className="space-y-4 border-t border-border pt-4">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4" />
            Research & Verification
          </Label>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label className="text-sm">Web Research</Label>
              <p className="text-xs text-muted-foreground">
                Search web for additional context (uses Tavily API)
              </p>
            </div>
            <Switch
              className="flex-shrink-0"
              checked={settings.enableWebResearch}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enableWebResearch: checked }))
              }
            />
          </div>

          {settings.enableWebResearch && (
            <div className="ml-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Label className="text-sm">Auto-Save to Knowledge</Label>
                  <p className="text-xs text-muted-foreground">
                    Save web findings for future queries
                  </p>
                </div>
                <Switch
                  className="flex-shrink-0"
                  checked={settings.autoSaveWebResearch}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, autoSaveWebResearch: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Results per Topic</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {settings.webSearchMaxResults || 3}
                  </span>
                </div>
                <Slider
                  value={[settings.webSearchMaxResults || 3]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({ ...prev, webSearchMaxResults: value }))
                  }
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Label className="text-sm">Fact Verification</Label>
              <p className="text-xs text-muted-foreground">Cross-check claims against sources</p>
            </div>
            <Switch
              className="flex-shrink-0"
              checked={settings.enableFactVerification}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enableFactVerification: checked }))
              }
            />
          </div>
        </div>

        {/* Response Style - Visual Cards */}
        <div className="space-y-3">
          <Label>Response Style</Label>
          <div className="grid gap-2">
            {[
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
            ].map((style) => {
              const isSelected = (settings.responseStyle || "structured") === style.value;
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, responseStyle: style.value }))}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}
                >
                  <span className="mt-0.5 text-xl">{style.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", isSelected && "text-primary")}>
                        {style.label}
                      </span>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {style.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTION PROPOSAL CARD
// ============================================================================

function ActionProposalCard({
  proposal,
  onConfirm,
  onCancel,
  isExecuting,
}: {
  proposal: ActionProposal;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}) {
  const getToolIcon = (toolName: string) => {
    if (toolName.includes("Course") || toolName.includes("course")) {
      return <BookOpen className="h-4 w-4" />;
    }
    if (toolName.includes("Lesson") || toolName.includes("lesson")) {
      return <FileText className="h-4 w-4" />;
    }
    if (toolName.includes("Module") || toolName.includes("module")) {
      return <LayoutList className="h-4 w-4" />;
    }
    if (toolName.includes("generate") || toolName.includes("Generate")) {
      return <Wand2 className="h-4 w-4" />;
    }
    if (toolName.includes("update") || toolName.includes("Update")) {
      return <Pencil className="h-4 w-4" />;
    }
    if (toolName.includes("delete") || toolName.includes("Delete")) {
      return <Trash2 className="h-4 w-4" />;
    }
    if (toolName.includes("duplicate") || toolName.includes("Duplicate")) {
      return <Copy className="h-4 w-4" />;
    }
    if (toolName.includes("list") || toolName.includes("List")) {
      return <LayoutList className="h-4 w-4" />;
    }
    return <Wand2 className="h-4 w-4" />;
  };

  return (
    <Card className="mt-4 border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="rounded-md bg-amber-500/10 p-1.5">
            <Wand2 className="h-5 w-5 text-amber-500" />
          </div>
          I'd like to take these actions:
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proposed Actions List */}
        <div className="space-y-2">
          {proposal.proposedActions.map((action, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-3"
            >
              <div className="rounded-md bg-primary/10 p-1.5">{getToolIcon(action.tool)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {action.tool}
                  </Badge>
                  {action.requiresConfirmation && (
                    <Badge variant="secondary" className="text-xs">
                      Needs confirmation
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                {/* Show parameters */}
                {Object.keys(action.parameters).length > 0 && (
                  <div className="mt-2 rounded bg-muted/50 p-2 font-mono text-xs">
                    {Object.entries(action.parameters)
                      .filter(([_, v]) => v !== undefined && v !== null)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="truncate">
                            {typeof value === "string"
                              ? `"${value.substring(0, 50)}${value.length > 50 ? "..." : ""}"`
                              : JSON.stringify(value).substring(0, 50)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onConfirm}
            disabled={isExecuting}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirm & Execute
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isExecuting}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXECUTED ACTIONS CARD
// ============================================================================

function ExecutedActionsCard({ executedActions }: { executedActions: ActionsExecuted }) {
  const successCount = executedActions.results.filter((r) => r.success).length;
  const failureCount = executedActions.results.length - successCount;

  return (
    <Card
      className={cn(
        "mt-4",
        failureCount > 0
          ? "border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/20"
          : "border-green-500/50 bg-green-50/10 dark:bg-green-950/20"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div
            className={cn(
              "rounded-md p-1.5",
              failureCount > 0 ? "bg-amber-500/10" : "bg-green-500/10"
            )}
          >
            {failureCount > 0 ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : (
              <Check className="h-5 w-5 text-green-500" />
            )}
          </div>
          {failureCount === 0
            ? `${successCount} action${successCount !== 1 ? "s" : ""} completed successfully`
            : `${successCount}/${executedActions.results.length} actions completed`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Results List */}
        <div className="space-y-2">
          {executedActions.results.map((result, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                result.success
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}
            >
              <div
                className={cn(
                  "rounded-full p-1",
                  result.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                )}
              >
                {result.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {result.tool}
                  </Badge>
                  {result.success && result.result?.link && (
                    <a
                      href={result.result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link className="h-3 w-3" />
                      View
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm">
                  {result.success
                    ? result.result?.message || "Completed successfully"
                    : result.error || "Failed"}
                </p>

                {/* Display generated content for content-generation tools */}
                {result.success && result.result?.script && (
                  <div className="mt-3 space-y-3">
                    {/* Main Script */}
                    {result.result.script.script && (
                      <div className="rounded-lg border border-border bg-black/5 p-4 dark:bg-white/5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Script
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              if (result.result?.script?.script) {
                                navigator.clipboard.writeText(result.result.script.script);
                              }
                            }}
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {result.result.script.script}
                        </div>
                      </div>
                    )}

                    {/* Hook */}
                    {result.result.script.hook && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 dark:bg-amber-500/10">
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          🪝 Hook
                        </span>
                        <p className="mt-1 text-sm">{result.result.script.hook}</p>
                      </div>
                    )}

                    {/* CTA */}
                    {result.result.script.cta && (
                      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 dark:bg-blue-500/10">
                        <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                          📢 Call to Action
                        </span>
                        <p className="mt-1 text-sm">{result.result.script.cta}</p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {result.result.script.hashtags && result.result.script.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.result.script.hashtags.map((tag: string, tagIndex: number) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            #{tag.replace(/^#/, "")}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Production Notes */}
                    {result.result.script.notes && (
                      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 dark:bg-purple-500/10">
                        <span className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                          📝 Production Notes
                        </span>
                        <p className="mt-1 whitespace-pre-wrap text-sm">
                          {result.result.script.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Display multi-platform content */}
                {result.success &&
                  result.result?.content &&
                  Array.isArray(result.result.content) && (
                    <div className="mt-3 space-y-3">
                      {result.result.content.map((item: any, itemIndex: number) => (
                        <div
                          key={itemIndex}
                          className="rounded-lg border border-border bg-black/5 p-4 dark:bg-white/5"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.platform}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(item.content);
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Copy
                            </Button>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{item.content}</div>
                          {item.hashtags && item.hashtags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.hashtags.map((tag: string, tagIdx: number) => (
                                <Badge key={tagIdx} variant="secondary" className="text-xs">
                                  #{tag.replace(/^#/, "")}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        {executedActions.links && executedActions.links.length > 0 && (
          <div className="border-t border-border pt-2">
            <p className="mb-2 text-xs text-muted-foreground">Quick Links:</p>
            <div className="flex flex-wrap gap-2">
              {executedActions.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/20"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
