"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Youtube,
  Globe,
  FileText,
  Type,
  Mic,
  Search,
  MoreHorizontal,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  FileStack,
  Filter,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SourceLibraryProps {
  userId: string;
  storeId: string;
  folderId?: string;
  onGenerateNotes?: (sourceId: Id<"noteSources">) => void;
}

type SourceType = "pdf" | "youtube" | "website" | "audio" | "text";

const sourceTypeConfig: Record<
  SourceType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  youtube: {
    icon: <Youtube className="h-4 w-4" />,
    label: "YouTube",
    color: "text-red-500",
  },
  website: {
    icon: <Globe className="h-4 w-4" />,
    label: "Website",
    color: "text-blue-500",
  },
  pdf: {
    icon: <FileText className="h-4 w-4" />,
    label: "PDF",
    color: "text-orange-500",
  },
  audio: {
    icon: <Mic className="h-4 w-4" />,
    label: "Audio",
    color: "text-purple-500",
  },
  text: {
    icon: <Type className="h-4 w-4" />,
    label: "Text",
    color: "text-gray-500",
  },
};

export function SourceLibrary({ userId, storeId, folderId, onGenerateNotes }: SourceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<SourceType | "all">("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sources = useQuery(api.langchainNotes.getSources, { userId, storeId }) ?? [];
  const generateNotes = useAction(api.langchainNotesActions.generateNotesFromSource);
  const deleteSource = useMutation(api.langchainNotes.deleteSource);

  // Filter sources
  const filteredSources = sources.filter((source: any) => {
    const matchesSearch = source.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || source.sourceType === filterType;
    return matchesSearch && matchesType;
  });

  const handleGenerateNotes = async (sourceId: Id<"noteSources">) => {
    setGeneratingId(sourceId);

    try {
      const result = await generateNotes({
        sourceId,
        userId,
        storeId,
        folderId: folderId as Id<"noteFolders"> | undefined,
        noteStyle: "detailed",
      });

      if (result.success) {
        toast({
          title: "Notes Generated!",
          description: "Your AI-generated notes are ready.",
        });
        onGenerateNotes?.(sourceId);
      } else {
        throw new Error(result.error || "Failed to generate notes");
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDeleteSource = async (sourceId: Id<"noteSources">) => {
    setDeletingId(sourceId);

    try {
      const result = await deleteSource({
        sourceId,
        userId,
      });

      if (result.success) {
        toast({
          title: "Source Deleted",
          description: "The source has been removed.",
        });
      } else {
        throw new Error(result.error || "Failed to delete source");
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete source",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "processing":
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />;
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <FileStack className="h-4 w-4" />
            Source Library
          </h3>
          <Badge variant="secondary" className="text-xs">
            {sources.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        {/* Filter */}
        <div className="mt-3 flex gap-1 overflow-x-auto">
          <Button
            variant={filterType === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterType("all")}
            className="h-7 px-2 text-xs"
          >
            All
          </Button>
          {(Object.keys(sourceTypeConfig) as SourceType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterType(type)}
              className="h-7 px-2 text-xs"
            >
              {sourceTypeConfig[type].icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredSources.length === 0 ? (
            <EmptyState
              icon={FileStack}
              title={searchQuery ? "No sources found" : "No sources yet"}
              description="Add YouTube videos, websites, or PDFs to generate notes."
              compact
            />
          ) : (
            filteredSources.map((source: any) => (
              <div
                key={source._id}
                className="group rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div
                    className={cn(
                      "rounded-md bg-gray-100 p-2 dark:bg-gray-800",
                      sourceTypeConfig[source.sourceType as SourceType]?.color
                    )}
                  >
                    {sourceTypeConfig[source.sourceType as SourceType]?.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {source.title}
                      </h4>
                      {getStatusIcon(source.status)}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {sourceTypeConfig[source.sourceType as SourceType]?.label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(source.createdAt, { addSuffix: true })}
                      </span>
                    </div>

                    {source.summary && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">{source.summary}</p>
                    )}

                    {/* Generated Notes Badge */}
                    {source.generatedNoteIds && source.generatedNoteIds.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <FileText className="h-3 w-3" />
                          {source.generatedNoteIds.length} note
                          {source.generatedNoteIds.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-[#1e1e1e]">
                      {source.status === "completed" && (
                        <DropdownMenuItem
                          onClick={() => handleGenerateNotes(source._id)}
                          disabled={generatingId === source._id}
                        >
                          {generatingId === source._id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Generate Notes
                        </DropdownMenuItem>
                      )}
                      {source.url && (
                        <DropdownMenuItem asChild>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Source
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => handleDeleteSource(source._id)}
                        disabled={deletingId === source._id}
                      >
                        {deletingId === source._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
