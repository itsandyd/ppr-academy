"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bot,
  Search,
  Star,
  MessageSquare,
  Sparkles,
  Megaphone,
  Music,
  Briefcase,
  Share2,
  Palette,
  Clock,
  BookOpen,
  Loader2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  conversationCount: number;
  rating?: number;
  ratingCount?: number;
  isBuiltIn: boolean;
  isFeatured?: boolean;
}

interface AgentPickerProps {
  onSelectAgent: (agent: Agent | null) => void;
  selectedAgentId?: Id<"aiAgents"> | null;
  trigger?: React.ReactNode;
  showDefaultOption?: boolean;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  marketing: <Megaphone className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  productivity: <Clock className="h-4 w-4" />,
  learning: <BookOpen className="h-4 w-4" />,
  custom: <Bot className="h-4 w-4" />,
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    border: "border-violet-500/30",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-500",
    border: "border-pink-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/30",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-500",
    border: "border-yellow-500/30",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/30",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/30",
  },
};

// ============================================================================
// AGENT CARD COMPONENT
// ============================================================================

function AgentCard({
  agent,
  isSelected,
  onSelect,
  compact = false,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const colorClass = agent.color ? COLOR_CLASSES[agent.color] : COLOR_CLASSES.violet;

  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
          isSelected
            ? `${colorClass.bg} ${colorClass.border} ring-1 ring-${agent.color || "violet"}-500/20`
            : "border-border hover:bg-muted/50"
        )}
      >
        <div className={cn("rounded-lg p-2 text-2xl", colorClass.bg)}>{agent.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{agent.name}</div>
          <div className="truncate text-xs text-muted-foreground">{agent.description}</div>
        </div>
        {isSelected && (
          <div className={cn("h-2 w-2 rounded-full", colorClass.text.replace("text-", "bg-"))} />
        )}
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected
          ? `${colorClass.border} ring-2 ring-${agent.color || "violet"}-500/30`
          : "border-border hover:border-muted-foreground/30"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={cn("rounded-xl p-2.5 text-3xl", colorClass.bg)}>{agent.icon}</div>
          <div className="flex items-center gap-2">
            {agent.isFeatured && (
              <Badge variant="secondary" className="text-xs">
                <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                Featured
              </Badge>
            )}
            {isSelected && (
              <div
                className={cn("h-3 w-3 rounded-full", colorClass.text.replace("text-", "bg-"))}
              />
            )}
          </div>
        </div>
        <CardTitle className="mt-3 text-lg">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {CATEGORY_ICONS[agent.category]}
            <span className="capitalize">{agent.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span>{agent.conversationCount.toLocaleString()} chats</span>
          </div>
        </div>
        {agent.tags && agent.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {agent.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AgentPicker({
  onSelectAgent,
  selectedAgentId,
  trigger,
  showDefaultOption = true,
}: AgentPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Convex type instantiation too deep
  const agents: any[] | undefined = useQuery(api.aiAgents.getPublicAgents);
  const featuredAgents = useQuery(api.aiAgents.getFeaturedAgents) as any[] | undefined;

  // Filter agents based on search and category
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    return agents.filter((agent: any) => {
      const matchesSearch =
        !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags?.some((tag: any) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!agents) return [];
    const cats = [...new Set(agents.map((a: any) => a.category))] as string[];
    return cats.sort();
  }, [agents]);

  const handleSelect = (agent: Agent | null) => {
    onSelectAgent(agent);
    setOpen(false);
  };

  const selectedAgent = agents?.find((a: any) => a._id === selectedAgentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            {selectedAgent ? (
              <>
                <span className="text-lg">{selectedAgent.icon}</span>
                <span>{selectedAgent.name}</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                <span>Choose Agent</span>
              </>
            )}
            <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-4xl gap-0 bg-white p-0 dark:bg-black">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Choose an AI Agent
          </DialogTitle>
          <DialogDescription>
            Select a specialized AI agent for your conversation. Each agent has unique expertise and
            capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1" onValueChange={setSelectedCategory}>
          <div className="px-4 pt-2">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-full px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All
              </TabsTrigger>
              {categories.map((category: string) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="rounded-full px-3 py-1.5 text-sm capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {CATEGORY_ICONS[category]}
                  <span className="ml-1.5">{category}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="h-[400px] flex-1">
            <div className="space-y-6 p-4">
              {/* Default Assistant Option */}
              {showDefaultOption && selectedCategory === "all" && !searchQuery && (
                <div className="mb-4">
                  <button
                    onClick={() => handleSelect(null)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all",
                      !selectedAgentId
                        ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Default AI Assistant</div>
                      <div className="text-sm text-muted-foreground">
                        General-purpose assistant with access to all your knowledge
                      </div>
                    </div>
                    {!selectedAgentId && <div className="h-3 w-3 rounded-full bg-primary" />}
                  </button>
                </div>
              )}

              {/* Featured Agents */}
              {selectedCategory === "all" &&
                !searchQuery &&
                featuredAgents &&
                featuredAgents.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      Featured Agents
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {featuredAgents.map((agent: any) => (
                        <AgentCard
                          key={agent._id}
                          agent={agent as Agent}
                          isSelected={selectedAgentId === agent._id}
                          onSelect={() => handleSelect(agent as Agent)}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* All/Filtered Agents */}
              {agents === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="py-12 text-center">
                  <Bot className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No agents found</p>
                  {searchQuery && (
                    <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {(selectedCategory !== "all" || searchQuery) && (
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {searchQuery
                        ? `Results for "${searchQuery}"`
                        : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Agents`}
                    </h3>
                  )}
                  {selectedCategory === "all" && !searchQuery && (
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">All Agents</h3>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredAgents.map((agent: any) => (
                      <AgentCard
                        key={agent._id}
                        agent={agent}
                        isSelected={selectedAgentId === agent._id}
                        onSelect={() => handleSelect(agent)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// COMPACT AGENT SELECTOR (for sidebar/header)
// ============================================================================

export function AgentSelector({
  selectedAgent,
  onSelect,
}: {
  selectedAgent: Agent | null;
  onSelect: (agent: Agent | null) => void;
}) {
  const colorClass = selectedAgent?.color ? COLOR_CLASSES[selectedAgent.color] : null;

  return (
    <AgentPicker
      selectedAgentId={selectedAgent?._id}
      onSelectAgent={onSelect}
      trigger={
        <Button
          variant="ghost"
          className={cn(
            "h-auto w-full justify-start gap-2 px-3 py-2",
            selectedAgent && colorClass && `${colorClass.bg} hover:${colorClass.bg}`
          )}
        >
          {selectedAgent ? (
            <>
              <span className="text-xl">{selectedAgent.icon}</span>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium">{selectedAgent.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {selectedAgent.description}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-medium">AI Assistant</div>
                <div className="text-xs text-muted-foreground">General purpose</div>
              </div>
            </>
          )}
          <Plus className="h-4 w-4 opacity-50" />
        </Button>
      }
    />
  );
}

export default AgentPicker;
