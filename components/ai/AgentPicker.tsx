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
  marketing: <Megaphone className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  business: <Briefcase className="w-4 h-4" />,
  social: <Share2 className="w-4 h-4" />,
  creative: <Palette className="w-4 h-4" />,
  productivity: <Clock className="w-4 h-4" />,
  learning: <BookOpen className="w-4 h-4" />,
  custom: <Bot className="w-4 h-4" />,
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
          "flex items-center gap-3 p-3 rounded-lg border transition-all w-full text-left",
          isSelected
            ? `${colorClass.bg} ${colorClass.border} ring-1 ring-${agent.color || "violet"}-500/20`
            : "border-border hover:bg-muted/50"
        )}
      >
        <div className={cn("p-2 rounded-lg text-2xl", colorClass.bg)}>
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{agent.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {agent.description}
          </div>
        </div>
        {isSelected && (
          <div className={cn("w-2 h-2 rounded-full", colorClass.text.replace("text-", "bg-"))} />
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
          <div className={cn("p-2.5 rounded-xl text-3xl", colorClass.bg)}>
            {agent.icon}
          </div>
          <div className="flex items-center gap-2">
            {agent.isFeatured && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                Featured
              </Badge>
            )}
            {isSelected && (
              <div className={cn("w-3 h-3 rounded-full", colorClass.text.replace("text-", "bg-"))} />
            )}
          </div>
        </div>
        <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {agent.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {CATEGORY_ICONS[agent.category]}
            <span className="capitalize">{agent.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{agent.conversationCount.toLocaleString()} chats</span>
          </div>
        </div>
        {agent.tags && agent.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
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

  const agents = useQuery(api.aiAgents.getPublicAgents);
  const featuredAgents = useQuery(api.aiAgents.getFeaturedAgents);

  // Filter agents based on search and category
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    return agents.filter((agent) => {
      const matchesSearch =
        !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || agent.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!agents) return [];
    const cats = [...new Set(agents.map((a) => a.category))];
    return cats.sort();
  }, [agents]);

  const handleSelect = (agent: Agent | null) => {
    onSelectAgent(agent);
    setOpen(false);
  };

  const selectedAgent = agents?.find((a) => a._id === selectedAgentId);

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
                <Bot className="w-4 h-4" />
                <span>Choose Agent</span>
              </>
            )}
            <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] bg-white dark:bg-black p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Choose an AI Agent
          </DialogTitle>
          <DialogDescription>
            Select a specialized AI agent for your conversation. Each agent has unique expertise and capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-sm"
              >
                All
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5 text-sm capitalize"
                >
                  {CATEGORY_ICONS[category]}
                  <span className="ml-1.5">{category}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 h-[400px]">
            <div className="p-4 space-y-6">
              {/* Default Assistant Option */}
              {showDefaultOption && selectedCategory === "all" && !searchQuery && (
                <div className="mb-4">
                  <button
                    onClick={() => handleSelect(null)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-all w-full text-left",
                      !selectedAgentId
                        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Default AI Assistant</div>
                      <div className="text-sm text-muted-foreground">
                        General-purpose assistant with access to all your knowledge
                      </div>
                    </div>
                    {!selectedAgentId && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              )}

              {/* Featured Agents */}
              {selectedCategory === "all" && !searchQuery && featuredAgents && featuredAgents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    Featured Agents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featuredAgents.map((agent) => (
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
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No agents found</p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {(selectedCategory !== "all" || searchQuery) && (
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {searchQuery
                        ? `Results for "${searchQuery}"`
                        : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Agents`}
                    </h3>
                  )}
                  {selectedCategory === "all" && !searchQuery && (
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      All Agents
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredAgents.map((agent) => (
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
  const colorClass = selectedAgent?.color
    ? COLOR_CLASSES[selectedAgent.color]
    : null;

  return (
    <AgentPicker
      selectedAgentId={selectedAgent?._id}
      onSelectAgent={onSelect}
      trigger={
        <Button
          variant="ghost"
          className={cn(
            "h-auto py-2 px-3 justify-start gap-2 w-full",
            selectedAgent && colorClass && `${colorClass.bg} hover:${colorClass.bg}`
          )}
        >
          {selectedAgent ? (
            <>
              <span className="text-xl">{selectedAgent.icon}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm truncate">
                  {selectedAgent.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedAgent.description}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm">AI Assistant</div>
                <div className="text-xs text-muted-foreground">
                  General purpose
                </div>
              </div>
            </>
          )}
          <Plus className="w-4 h-4 opacity-50" />
        </Button>
      }
    />
  );
}

export default AgentPicker;

