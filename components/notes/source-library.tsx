'use client';

import { useState } from 'react';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SourceLibraryProps {
  userId: string;
  storeId: string;
  folderId?: string;
  onGenerateNotes?: (sourceId: Id<"noteSources">) => void;
}

type SourceType = 'pdf' | 'youtube' | 'website' | 'audio' | 'text';

const sourceTypeConfig: Record<SourceType, { icon: React.ReactNode; label: string; color: string }> = {
  youtube: {
    icon: <Youtube className="h-4 w-4" />,
    label: 'YouTube',
    color: 'text-red-500',
  },
  website: {
    icon: <Globe className="h-4 w-4" />,
    label: 'Website',
    color: 'text-blue-500',
  },
  pdf: {
    icon: <FileText className="h-4 w-4" />,
    label: 'PDF',
    color: 'text-orange-500',
  },
  audio: {
    icon: <Mic className="h-4 w-4" />,
    label: 'Audio',
    color: 'text-purple-500',
  },
  text: {
    icon: <Type className="h-4 w-4" />,
    label: 'Text',
    color: 'text-gray-500',
  },
};

export function SourceLibrary({
  userId,
  storeId,
  folderId,
  onGenerateNotes,
}: SourceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<SourceType | 'all'>('all');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sources = useQuery(api.langchainNotes.getSources, { userId, storeId }) ?? [];
  const generateNotes = useAction(api.langchainNotesActions.generateNotesFromSource);
  const deleteSource = useMutation(api.langchainNotes.deleteSource);

  // Filter sources
  const filteredSources = sources.filter((source) => {
    const matchesSearch = source.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || source.sourceType === filterType;
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
        noteStyle: 'detailed',
      });
      
      if (result.success) {
        toast({
          title: 'Notes Generated!',
          description: 'Your AI-generated notes are ready.',
        });
        onGenerateNotes?.(sourceId);
      } else {
        throw new Error(result.error || 'Failed to generate notes');
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate notes',
        variant: 'destructive',
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
          title: 'Source Deleted',
          description: 'The source has been removed.',
        });
      } else {
        throw new Error(result.error || 'Failed to delete source');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete source',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileStack className="h-4 w-4" />
            Source Library
          </h3>
          <Badge variant="secondary" className="text-xs">
            {sources.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-1 mt-3 overflow-x-auto">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
            className="text-xs h-7 px-2"
          >
            All
          </Button>
          {(Object.keys(sourceTypeConfig) as SourceType[]).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="text-xs h-7 px-2"
            >
              {sourceTypeConfig[type].icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredSources.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FileStack className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No sources found' : 'No sources yet'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Add YouTube videos, websites, or PDFs to generate notes
              </p>
            </div>
          ) : (
            filteredSources.map((source) => (
              <div
                key={source._id}
                className="group rounded-lg border border-gray-200 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div className={cn(
                    "p-2 rounded-md bg-gray-100 dark:bg-gray-800",
                    sourceTypeConfig[source.sourceType].color
                  )}>
                    {sourceTypeConfig[source.sourceType].icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {source.title}
                      </h4>
                      {getStatusIcon(source.status)}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {sourceTypeConfig[source.sourceType].label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(source.createdAt, { addSuffix: true })}
                      </span>
                    </div>

                    {source.summary && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {source.summary}
                      </p>
                    )}

                    {/* Generated Notes Badge */}
                    {source.generatedNoteIds && source.generatedNoteIds.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileText className="h-3 w-3" />
                          {source.generatedNoteIds.length} note{source.generatedNoteIds.length > 1 ? 's' : ''}
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
                      {source.status === 'completed' && (
                        <DropdownMenuItem
                          onClick={() => handleGenerateNotes(source._id)}
                          disabled={generatingId === source._id}
                        >
                          {generatingId === source._id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Generate Notes
                        </DropdownMenuItem>
                      )}
                      {source.url && (
                        <DropdownMenuItem asChild>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
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
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
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

