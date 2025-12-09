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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

// ============================================================================
// TYPES
// ============================================================================

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

interface ToolCallResult {
  tool: string;
  success: boolean;
  result?: {
    message?: string;
    link?: string;
    courseId?: string;
    slug?: string;
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
  budget: <Feather className="w-4 h-4" />,
  speed: <Zap className="w-4 h-4" />,
  balanced: <Scale className="w-4 h-4" />,
  deepReasoning: <Brain className="w-4 h-4" />,
  premium: <Crown className="w-4 h-4" />,
};

const RESPONSE_STYLE_OPTIONS: Record<ResponseStyle, { name: string; description: string; icon: React.ReactNode }> = {
  structured: {
    name: "Structured",
    description: "Organized with headings and bullet points",
    icon: <LayoutList className="w-4 h-4" />,
  },
  conversational: {
    name: "Conversational",
    description: "Natural, flowing responses",
    icon: <Bot className="w-4 h-4" />,
  },
  concise: {
    name: "Concise",
    description: "Brief and to the point",
    icon: <Zap className="w-4 h-4" />,
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
  const [currentConversationId, setCurrentConversationId] = useState<Id<"aiConversations"> | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Convex actions
  const askMasterAI = useAction((api as any).masterAI.index.askMasterAI);
  const askAgenticAI = useAction((api as any).masterAI.index.askAgenticAI);
  const executeConfirmedActions = useAction((api as any).masterAI.index.executeConfirmedActions);
  
  // Conversation mutations
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
      const loadedMessages: Message[] = conversationMessages.map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        timestamp: new Date(m.createdAt),
        pipelineMetadata: m.pipelineMetadata ? {
          processingTimeMs: m.pipelineMetadata.processingTimeMs,
          totalChunksProcessed: m.pipelineMetadata.totalChunksProcessed,
          facetsUsed: m.facetsUsed,
        } : undefined,
      }));
      setMessages(loadedMessages);
    }
  }, [conversationMessages]);
  
  // Load settings when conversation changes
  useEffect(() => {
    if (currentConversation?.settings) {
      // Load full settings object from conversation
      setSettings({
        preset: (currentConversation.settings.preset as PresetId) || "balanced",
        maxFacets: currentConversation.settings.maxFacets ?? DEFAULT_CHAT_SETTINGS.maxFacets,
        chunksPerFacet: currentConversation.settings.chunksPerFacet ?? DEFAULT_CHAT_SETTINGS.chunksPerFacet,
        similarityThreshold: currentConversation.settings.similarityThreshold ?? DEFAULT_CHAT_SETTINGS.similarityThreshold,
        enableCritic: currentConversation.settings.enableCritic ?? DEFAULT_CHAT_SETTINGS.enableCritic,
        enableCreativeMode: currentConversation.settings.enableCreativeMode ?? DEFAULT_CHAT_SETTINGS.enableCreativeMode,
        enableWebResearch: currentConversation.settings.enableWebResearch ?? DEFAULT_CHAT_SETTINGS.enableWebResearch,
        enableFactVerification: currentConversation.settings.enableFactVerification ?? DEFAULT_CHAT_SETTINGS.enableFactVerification,
        autoSaveWebResearch: currentConversation.settings.autoSaveWebResearch ?? DEFAULT_CHAT_SETTINGS.autoSaveWebResearch,
        webSearchMaxResults: currentConversation.settings.webSearchMaxResults ?? DEFAULT_CHAT_SETTINGS.webSearchMaxResults,
        responseStyle: (currentConversation.settings.responseStyle as ResponseStyle) || "structured",
      });
      if (currentConversation.settings.agenticMode !== undefined) {
        setAgenticMode(currentConversation.settings.agenticMode);
      }
    } else if (currentConversation && !currentConversation.settings) {
      // Legacy conversation - use preset/responseStyle if available
      if (currentConversation.preset) {
        setSettings(prev => ({
          ...prev,
          preset: currentConversation.preset as PresetId,
        }));
      }
      if (currentConversation.responseStyle) {
        setSettings(prev => ({
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
  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setVisibleMessageCount(INITIAL_VISIBLE_MESSAGES);
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
    setVisibleMessageCount(prev => prev + LOAD_MORE_INCREMENT);
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
        }),
        signal: abortController.signal, // Allow cancellation
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }
      
      // Check if this request is still relevant (conversation hasn't changed)
      if (activeConversationRef.current !== conversationId) {
        console.log("Ignoring response - conversation changed");
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
            pipelineMetadata: finalResponse.pipelineMetadata ? {
              processingTimeMs: finalResponse.pipelineMetadata.processingTimeMs,
              totalChunksProcessed: finalResponse.pipelineMetadata.totalChunksProcessed,
              plannerModel: finalResponse.pipelineMetadata.plannerModel,
              summarizerModel: finalResponse.pipelineMetadata.summarizerModel,
              finalWriterModel: finalResponse.pipelineMetadata.finalWriterModel,
            } : undefined,
          });
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
    } catch (error) {
      // Check if request was aborted (user switched conversations)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request cancelled - user switched conversations");
        return; // Don't show error, just exit
      }
      
      // Check if conversation changed during request
      if (activeConversationRef.current !== conversationId) {
        console.log("Ignoring error - conversation changed");
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
            content: "I'm sorry, I encountered an error while processing your question. Please try again.",
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
        setPipelineStatus((prev) =>
          prev ? { ...prev, isActive: false } : null
        );
        break;

      case "facets_identified":
        setPipelineStatus((prev) => prev ? { ...prev, facets: event.facets } : null);
        break;

      case "chunks_retrieved":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          chunksRetrieved: (prev.chunksRetrieved || 0) + event.count,
          details: `${event.facet}: ${event.count} sources`
        } : null);
        break;

      case "web_research_start":
        setPipelineStatus((prev) => prev ? { ...prev, details: "Searching web..." } : null);
        break;

      case "web_research_result":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          webResults: (prev.webResults || 0) + event.count,
          details: `Web: ${event.facet} (${event.count} results)`
        } : null);
        break;

      case "web_research_complete":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          webResults: event.totalResults,
          details: event.savedToEmbeddings ? "Web results saved to knowledge" : undefined
        } : null);
        break;

      case "summary_generated":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          summariesGenerated: (prev.summariesGenerated || 0) + 1,
          details: `Summarizing: ${event.facet}`
        } : null);
        break;

      case "ideas_generated":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          ideasGenerated: event.count 
        } : null);
        break;

      case "fact_verification_start":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          details: `Verifying ${event.claimCount} claims...`
        } : null);
        break;

      case "fact_verification_complete":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          verifiedClaims: event.verifiedCount,
          confidence: event.confidence
        } : null);
        break;

      case "critic_review":
        setPipelineStatus((prev) => prev ? { 
          ...prev, 
          details: event.approved ? `Quality: ${Math.round(event.quality * 100)}%` : "Revising..."
        } : null);
        break;

      case "text_delta":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: m.content + event.delta }
              : m
          )
        );
        break;

      case "complete":
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: event.response.answer,
                  citations: event.response.citations,
                  isStreaming: false,
                  pipelineMetadata: {
                    processingTimeMs: event.response.pipelineMetadata.processingTimeMs,
                    totalChunksProcessed: event.response.pipelineMetadata.totalChunksProcessed,
                    facetsUsed: event.response.facetsUsed,
                  },
                }
              : m
          )
        );
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
  const handleFeedback = useCallback(async (messageId: string, vote: "up" | "down") => {
    if (!user || !currentConversationId) return;
    
    // Find the message to get its database ID
    const message = messages.find(m => m.id === messageId);
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
      console.log(`Feedback ${vote} submitted for message ${messageId}`);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  }, [user, currentConversationId, messages, submitFeedback]);

  // Handle regenerating a response
  const handleRegenerate = useCallback((messageId: string, customSettings?: { preset?: PresetId; responseStyle?: ResponseStyle }) => {
    if (!user || isLoading) return;
    
    // Find the AI message and the preceding user message
    const messageIndex = messages.findIndex(m => m.id === messageId);
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
      setSettings(prev => ({
        ...prev,
        ...(customSettings.preset && { preset: customSettings.preset }),
        ...(customSettings.responseStyle && { responseStyle: customSettings.responseStyle }),
      }));
    }
    
    // Remove the AI response we're regenerating (and any responses after it)
    setMessages(prev => prev.slice(0, messageIndex));
    
    // Re-submit the user's question by setting input and triggering form submit
    setInputValue(userMessage.content);
    
    // Use a ref-based approach to submit the form (slight delay to allow settings to update)
    setTimeout(() => {
      inputRef.current?.form?.requestSubmit();
    }, 100);
  }, [user, isLoading, messages]);

  // Handle confirming proposed actions
  const handleConfirmActions = useCallback(async () => {
    if (!pendingProposal || !user) return;
    
    setIsExecutingActions(true);
    
    try {
      // Get the user's store ID (you may need to fetch this differently)
      const storeId = ""; // TODO: Get from user context or query
      
      const result = await executeConfirmedActions({
        actions: pendingProposal.proposal.proposedActions.map(a => ({
          tool: a.tool,
          parameters: a.parameters,
        })),
        userId: user.id,
        storeId,
      });

      // Update the message with executed actions
      setMessages(prev => prev.map(m => 
        m.id === pendingProposal.messageId
          ? {
              ...m,
              content: result.summary,
              actionProposal: undefined,
              executedActions: result,
            }
          : m
      ));
      
      setPendingProposal(null);
    } catch (error) {
      console.error("Failed to execute actions:", error);
      // Add error message
      setMessages(prev => prev.map(m => 
        m.id === pendingProposal.messageId
          ? {
              ...m,
              content: `Error executing actions: ${error instanceof Error ? error.message : 'Unknown error'}`,
              actionProposal: undefined,
            }
          : m
      ));
      setPendingProposal(null);
    } finally {
      setIsExecutingActions(false);
    }
  }, [pendingProposal, user, executeConfirmedActions]);

  // Handle canceling proposed actions
  const handleCancelActions = useCallback(() => {
    if (!pendingProposal) return;
    
    // Update the message to show cancellation
    setMessages(prev => prev.map(m => 
      m.id === pendingProposal.messageId
        ? {
            ...m,
            content: "I've cancelled the proposed actions. Let me know if you'd like to try something different!",
            actionProposal: undefined,
          }
        : m
    ));
    
    setPendingProposal(null);
  }, [pendingProposal]);

  // Not loaded yet
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Brain className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">Please sign in to use the AI Assistant</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-card overflow-x-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden flex-shrink-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
            
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 hidden sm:flex">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-xl font-bold truncate">AI Assistant</h1>
              <p className="text-sm text-muted-foreground truncate">
                {currentConversationId ? "Continue conversation" : "New conversation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Memory indicator - hidden on mobile */}
            {userMemories && userMemories.length > 0 && (
              <Badge variant="secondary" className="hidden lg:flex items-center gap-1.5">
                <Brain className="w-3 h-3" />
                <span>{userMemories.length} memories</span>
              </Badge>
            )}
            
            {/* Model Preset Selector */}
            <Select
              value={settings.preset}
              onValueChange={(value: PresetId) => setSettings(prev => ({ ...prev, preset: value }))}
            >
              <SelectTrigger className="w-[100px] sm:w-[130px] md:w-[150px] h-8 sm:h-9 bg-background text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  {PRESET_ICONS[settings.preset]}
                  <span className="truncate hidden xs:inline">{MODEL_PRESETS[settings.preset].name}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {(Object.keys(MODEL_PRESETS) as PresetId[]).map((presetId) => (
                  <SelectItem key={presetId} value={presetId}>
                    <div className="flex items-center gap-2">
                      {PRESET_ICONS[presetId]}
                      <div className="flex flex-col">
                        <span className="font-medium">{MODEL_PRESETS[presetId].name}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
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
              onValueChange={(value: ResponseStyle) => setSettings(prev => ({ ...prev, responseStyle: value }))}
            >
              <SelectTrigger className="w-[90px] sm:w-[120px] md:w-[140px] h-8 sm:h-9 bg-background text-xs sm:text-sm hidden xs:flex">
                <div className="flex items-center gap-1 sm:gap-2">
                  {RESPONSE_STYLE_OPTIONS[settings.responseStyle].icon}
                  <span className="truncate hidden sm:inline">{RESPONSE_STYLE_OPTIONS[settings.responseStyle].name}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {(Object.keys(RESPONSE_STYLE_OPTIONS) as ResponseStyle[]).map((style) => (
                  <SelectItem key={style} value={style}>
                    <div className="flex items-center gap-2">
                      {RESPONSE_STYLE_OPTIONS[style].icon}
                      <div className="flex flex-col">
                        <span className="font-medium">{RESPONSE_STYLE_OPTIONS[style].name}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {RESPONSE_STYLE_OPTIONS[style].description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Agentic Mode Toggle */}
            <div className="hidden md:flex items-center gap-2">
              <Label htmlFor="agentic-mode" className="text-xs text-muted-foreground cursor-pointer">
                Actions
              </Label>
              <Switch
                id="agentic-mode"
                checked={agenticMode}
                onCheckedChange={setAgenticMode}
              />
            </div>

            {/* Settings Button */}
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white dark:bg-black w-full sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Chat Settings</SheetTitle>
                  <SheetDescription>
                    Configure the AI pipeline behavior
                  </SheetDescription>
                </SheetHeader>
                <SettingsPanel settings={settings} setSettings={setSettings} agenticMode={agenticMode} setAgenticMode={setAgenticMode} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6 w-full">
            {messages.length === 0 && (
              <WelcomeMessage />
            )}

            {/* Load more button for older messages */}
            {hasHiddenMessages && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMoreMessages}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-4 h-4 mr-2 rotate-180" />
                  Load {Math.min(LOAD_MORE_INCREMENT, messages.length - visibleMessageCount)} older messages
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
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
                  <Badge variant="secondary" className="text-xs ml-auto">
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
                  {pipelineStatus.chunksRetrieved !== undefined && pipelineStatus.chunksRetrieved > 0 && (
                    <Badge variant="outline" className="text-xs">
                      📚 {pipelineStatus.chunksRetrieved} sources
                    </Badge>
                  )}
                  {pipelineStatus.webResults !== undefined && pipelineStatus.webResults > 0 && (
                    <Badge variant="outline" className="text-xs">
                      🌐 {pipelineStatus.webResults} web results
                    </Badge>
                  )}
                  {pipelineStatus.summariesGenerated !== undefined && pipelineStatus.summariesGenerated > 0 && (
                    <Badge variant="outline" className="text-xs">
                      📝 {pipelineStatus.summariesGenerated} summaries
                    </Badge>
                  )}
                  {pipelineStatus.ideasGenerated !== undefined && pipelineStatus.ideasGenerated > 0 && (
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
                  <p className="text-xs text-muted-foreground italic">
                    {pipelineStatus.details}
                  </p>
                )}
              </div>
            )}

            {isLoading && !pipelineStatus && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
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
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
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

function WelcomeMessage() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-600/10 mb-4">
        <Sparkles className="w-12 h-12 text-violet-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Welcome to AI Assistant</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Ask me anything about your courses. I'll search through your knowledge base
        and provide comprehensive answers with sources.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <SuggestionChip text="How do I create a Rufus Du Sol style lead?" />
        <SuggestionChip text="What are the best mixing techniques for vocals?" />
        <SuggestionChip text="Explain sidechain compression" />
      </div>
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button className="px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground">
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
  onRegenerate?: (messageId: string, settings?: { preset?: PresetId; responseStyle?: ResponseStyle }) => void;
  currentSettings?: ChatSettings;
}) {
  const isUser = message.role === "user";
  const [localFeedback, setLocalFeedback] = useState<"up" | "down" | null>(message.feedback || null);
  const [copied, setCopied] = useState(false);
  const [regenPopoverOpen, setRegenPopoverOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(currentSettings?.preset || "balanced");
  const [selectedStyle, setSelectedStyle] = useState<ResponseStyle>(currentSettings?.responseStyle || "structured");

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
    <div className={cn("flex gap-3 w-full overflow-hidden", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 overflow-hidden break-words",
          isUser
            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
            : "bg-card border border-border"
        )}
      >
        {/* Content */}
        <div
          className={cn(
            "prose prose-sm max-w-none",
            isUser ? "prose-invert" : "dark:prose-invert"
          )}
        >
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating response...</span>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code
                    className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-mono",
                      isUser ? "bg-white/20" : "bg-muted"
                    )}
                  >
                    {children}
                  </code>
                ),
                h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Sources:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((citation) => (
                <Badge
                  key={citation.id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <span className="font-mono">[{citation.id}]</span>
                  <span className="truncate max-w-[150px]">{citation.title}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons for user messages */}
        {isUser && !message.isStreaming && (
          <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-end gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md transition-colors text-white/70 hover:bg-white/20 hover:text-white"
              title="Copy message"
            >
              {copied ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Metadata + Feedback + Actions for AI messages */}
        {!isUser && !message.isStreaming && (
          <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {message.pipelineMetadata && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(message.pipelineMetadata.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
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
                  "p-1.5 rounded-md transition-colors",
                  copied
                    ? "bg-green-500/20 text-green-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Copy response"
              >
                {copied ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              
              {/* Regenerate Button with Options */}
              {onRegenerate && (
                <Popover open={regenPopoverOpen} onOpenChange={setRegenPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="p-1.5 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3 bg-white dark:bg-black" align="end">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Regenerate Response</div>
                      
                      {/* Quick regenerate with current settings */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => handleRegenerate(false)}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Use current settings
                      </Button>
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">Or customize:</div>
                        
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
                              {(Object.keys(RESPONSE_STYLE_OPTIONS) as ResponseStyle[]).map((style) => (
                                <SelectItem key={style} value={style} className="text-xs">
                                  <div className="flex items-center gap-2">
                                    {RESPONSE_STYLE_OPTIONS[style].icon}
                                    <span>{RESPONSE_STYLE_OPTIONS[style].name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Regenerate with custom settings */}
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                          onClick={() => handleRegenerate(true)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Regenerate with these settings
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              {/* Divider */}
              <div className="w-px h-4 bg-border mx-1" />
              
              {/* Feedback Buttons */}
              <button
                onClick={() => handleFeedback("up")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  localFeedback === "up"
                    ? "bg-green-500/20 text-green-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Helpful response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  localFeedback === "down"
                    ? "bg-red-500/20 text-red-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
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
    <div className="h-[calc(100vh-120px)] mt-4 overflow-y-auto overflow-x-hidden">
      <div className="space-y-6 pb-8 pr-4">
        {/* Agentic Mode Toggle (visible on mobile) */}
        {setAgenticMode && (
          <div className="flex items-center justify-between md:hidden p-3 rounded-lg bg-muted/50 border border-border">
            <div>
              <Label htmlFor="agentic-mode-settings" className="font-medium">Action Mode</Label>
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
            onValueChange={(value: PresetId) =>
              setSettings((prev) => ({ ...prev, preset: value }))
            }
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
                      <span className="text-xs text-muted-foreground">
                        {preset.description}
                      </span>
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
          onValueChange={([value]) =>
            setSettings((prev) => ({ ...prev, maxFacets: value }))
          }
          min={1}
          max={5}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          Number of sub-topics to analyze
        </p>
      </div>

      {/* Chunks per Facet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Chunks per Facet</Label>
          <span className="text-sm text-muted-foreground">{settings.chunksPerFacet}</span>
        </div>
        <Slider
          value={[settings.chunksPerFacet]}
          onValueChange={([value]) =>
            setSettings((prev) => ({ ...prev, chunksPerFacet: value }))
          }
          min={5}
          max={50}
          step={5}
        />
        <p className="text-xs text-muted-foreground">
          Amount of knowledge to retrieve per topic
        </p>
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
        <p className="text-xs text-muted-foreground">
          Minimum relevance score for sources
        </p>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Label>Critic Stage</Label>
            <p className="text-xs text-muted-foreground">
              Quality review before response
            </p>
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
          <div className="flex-1 min-w-0">
            <Label>Creative Mode</Label>
            <p className="text-xs text-muted-foreground">
              Generate new ideas beyond sources
            </p>
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
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Research & Verification
        </Label>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
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
              <div className="flex-1 min-w-0">
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
                <span className="text-xs text-muted-foreground font-mono">
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
          <div className="flex-1 min-w-0">
            <Label className="text-sm">Fact Verification</Label>
            <p className="text-xs text-muted-foreground">
              Cross-check claims against sources
            </p>
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
                  "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                <span className="text-xl mt-0.5">{style.icon}</span>
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
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
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
      return <BookOpen className="w-4 h-4" />;
    }
    if (toolName.includes("Lesson") || toolName.includes("lesson")) {
      return <FileText className="w-4 h-4" />;
    }
    if (toolName.includes("Module") || toolName.includes("module")) {
      return <LayoutList className="w-4 h-4" />;
    }
    if (toolName.includes("generate") || toolName.includes("Generate")) {
      return <Wand2 className="w-4 h-4" />;
    }
    if (toolName.includes("update") || toolName.includes("Update")) {
      return <Pencil className="w-4 h-4" />;
    }
    if (toolName.includes("delete") || toolName.includes("Delete")) {
      return <Trash2 className="w-4 h-4" />;
    }
    if (toolName.includes("duplicate") || toolName.includes("Duplicate")) {
      return <Copy className="w-4 h-4" />;
    }
    if (toolName.includes("list") || toolName.includes("List")) {
      return <LayoutList className="w-4 h-4" />;
    }
    return <Wand2 className="w-4 h-4" />;
  };

  return (
    <Card className="mt-4 border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-md bg-amber-500/10">
            <Wand2 className="w-5 h-5 text-amber-500" />
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
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                {getToolIcon(action.tool)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {action.tool}
                  </Badge>
                  {action.requiresConfirmation && (
                    <Badge variant="secondary" className="text-xs">
                      Needs confirmation
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1 text-muted-foreground">
                  {action.description}
                </p>
                {/* Show parameters */}
                {Object.keys(action.parameters).length > 0 && (
                  <div className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono">
                    {Object.entries(action.parameters)
                      .filter(([_, v]) => v !== undefined && v !== null)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="truncate">
                            {typeof value === "string" 
                              ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`
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
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Execute
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isExecuting}
          >
            <X className="w-4 h-4 mr-2" />
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
  const successCount = executedActions.results.filter(r => r.success).length;
  const failureCount = executedActions.results.length - successCount;

  return (
    <Card className={cn(
      "mt-4",
      failureCount > 0 
        ? "border-amber-500/50 bg-amber-50/10 dark:bg-amber-950/20"
        : "border-green-500/50 bg-green-50/10 dark:bg-green-950/20"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={cn(
            "p-1.5 rounded-md",
            failureCount > 0 ? "bg-amber-500/10" : "bg-green-500/10"
          )}>
            {failureCount > 0 ? (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            ) : (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
          {failureCount === 0 
            ? `${successCount} action${successCount !== 1 ? 's' : ''} completed successfully`
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
                "flex items-start gap-3 p-3 rounded-lg border",
                result.success 
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              )}
            >
              <div className={cn(
                "p-1 rounded-full",
                result.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              )}>
                {result.success ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {result.tool}
                  </Badge>
                  {result.success && result.result?.link && (
                    <a
                      href={result.result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Link className="w-3 h-3" />
                      View
                    </a>
                  )}
                </div>
                <p className="text-sm mt-1">
                  {result.success 
                    ? result.result?.message || "Completed successfully"
                    : result.error || "Failed"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        {executedActions.links && executedActions.links.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Quick Links:</p>
            <div className="flex flex-wrap gap-2">
              {executedActions.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
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
