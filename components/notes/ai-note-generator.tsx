'use client';

import { useState, useCallback } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Youtube,
  Globe,
  FileText,
  Type,
  Mic,
  Sparkles,
  Loader2,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  Wand2,
  BookOpen,
  List,
  FileSearch,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUploadThing } from '@/lib/uploadthing-hooks';
import { formatDistanceToNow } from 'date-fns';

interface AINoteGeneratorProps {
  userId: string;
  storeId: string;
  folderId?: string;
  onNoteCreated?: (noteId: Id<"notes">) => void;
}

type SourceType = 'youtube' | 'website' | 'pdf' | 'text';
type NoteStyle = 'summary' | 'detailed' | 'bullet_points' | 'study_guide' | 'outline';

const sourceTypeIcons: Record<SourceType, React.ReactNode> = {
  youtube: <Youtube className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
};

const noteStyleInfo: Record<NoteStyle, { label: string; description: string; icon: React.ReactNode }> = {
  summary: {
    label: 'Summary',
    description: 'Concise overview with key takeaways',
    icon: <FileSearch className="h-4 w-4" />,
  },
  detailed: {
    label: 'Detailed Notes',
    description: 'Comprehensive notes with explanations',
    icon: <BookOpen className="h-4 w-4" />,
  },
  bullet_points: {
    label: 'Bullet Points',
    description: 'Organized bullet-point format',
    icon: <List className="h-4 w-4" />,
  },
  study_guide: {
    label: 'Study Guide',
    description: 'Learning objectives and review questions',
    icon: <GraduationCap className="h-4 w-4" />,
  },
  outline: {
    label: 'Outline',
    description: 'Hierarchical structure of content',
    icon: <FileText className="h-4 w-4" />,
  },
};

export function AINoteGenerator({
  userId,
  storeId,
  folderId,
  onNoteCreated,
}: AINoteGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>('youtube');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [noteStyle, setNoteStyle] = useState<NoteStyle>('detailed');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSourceId, setCurrentSourceId] = useState<Id<"noteSources"> | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Convex hooks
  const createNoteSource = useAction(api.langchainNotesActions.createNoteSource);
  const generateNotes = useAction(api.langchainNotesActions.generateNotesFromSource);
  const sources = useQuery(api.langchainNotes.getSources, { userId, storeId }) ?? [];
  const currentSource = useQuery(
    api.langchainNotes.getSourceById,
    currentSourceId ? { sourceId: currentSourceId } : 'skip'
  );

  // File upload hook
  const { startUpload, isUploading } = useUploadThing('documentUploader', {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        // Create source with the uploaded file URL
        const result = await createNoteSource({
          userId,
          storeId,
          sourceType: 'pdf',
          title: title || res[0].name,
          url: res[0].url, // Use URL for PDF processing
          fileName: res[0].name,
          fileSize: res[0].size,
          tags,
        });
        
        if (result.success && result.sourceId) {
          setCurrentSourceId(result.sourceId);
          toast({
            title: 'PDF Uploaded',
            description: 'Your PDF is being processed. This may take a moment.',
          });
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create source',
            variant: 'destructive',
          });
        }
      }
      setIsProcessing(false);
    },
    onUploadError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreateSource = async () => {
    setIsProcessing(true);
    
    try {
      let result;
      
      if (sourceType === 'pdf' && selectedFile) {
        // Handle PDF upload
        await startUpload([selectedFile]);
        return; // The upload callback will handle the rest
      }
      
      // Create source for other types
      result = await createNoteSource({
        userId,
        storeId,
        sourceType,
        title: title || (sourceType === 'youtube' ? 'YouTube Video' : sourceType === 'website' ? 'Web Article' : 'Text Notes'),
        url: (sourceType === 'youtube' || sourceType === 'website') ? url : undefined,
        rawContent: sourceType === 'text' ? textContent : undefined,
        tags,
      });
      
      if (result.success && result.sourceId) {
        setCurrentSourceId(result.sourceId);
        toast({
          title: 'Source Added',
          description: sourceType === 'text' 
            ? 'Your text is ready for note generation.'
            : 'Content is being extracted. This may take a moment.',
        });
      } else {
        throw new Error(result.error || 'Failed to create source');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process source',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!currentSourceId) return;
    
    setIsProcessing(true);
    
    try {
      const result = await generateNotes({
        sourceId: currentSourceId,
        userId,
        storeId,
        folderId: folderId as Id<"noteFolders"> | undefined,
        noteStyle,
        customPrompt: customPrompt || undefined,
      });
      
      if (result.success && result.noteId) {
        toast({
          title: 'Notes Generated!',
          description: 'Your AI-generated notes are ready.',
        });
        onNoteCreated?.(result.noteId);
        handleClose();
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
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUrl('');
    setTitle('');
    setTextContent('');
    setSelectedFile(null);
    setCurrentSourceId(null);
    setTags([]);
    setTagInput('');
    setCustomPrompt('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Sparkles className="h-4 w-4" />
          Import Content
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Generate Notes from Any Source
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Import content from YouTube, websites, PDFs, or paste text to generate AI-powered notes.
          </DialogDescription>
        </DialogHeader>

        {!currentSourceId ? (
          // Step 1: Source Selection
          <div className="space-y-6 py-4">
            <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="youtube" className="gap-2">
                  <Youtube className="h-4 w-4" />
                  <span className="hidden sm:inline">YouTube</span>
                </TabsTrigger>
                <TabsTrigger value="website" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Website</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Text</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube Video URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="youtube-url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    We'll extract the transcript and generate notes from it.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="website" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="website-url"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Blog posts, articles, documentation - we'll extract the main content.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="pdf" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Upload PDF</Label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      selectedFile 
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                        : "border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400"
                    )}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Click to upload PDF
                          </p>
                          <p className="text-sm text-gray-500">
                            Max 10MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="text-title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="text-title"
                    placeholder="e.g., 'Music Production Masterclass - Mixing Techniques'"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text-context">Context & Description</Label>
                  <Input
                    id="text-context"
                    placeholder="e.g., 'YouTube video transcript about audio compression and EQ'"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Help the AI understand what this content is about. Useful for fixing auto-generated transcript errors.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-content">Paste Your Content <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="text-content"
                    placeholder="Paste your transcript, article, or notes here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    {textContent.length > 0 && `${textContent.split(/\s+/).filter(Boolean).length} words`}
                    {textContent.length > 0 && " • Tip: The AI will use your title and context to better understand the content"}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Title (optional) */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Give your source a name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Step 2: Note Generation Options
          <div className="space-y-6 py-4">
            {/* Source Status */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sourceTypeIcons[currentSource?.sourceType as SourceType]}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {currentSource?.title}
                  </span>
                </div>
                {currentSource && getStatusBadge(currentSource.status)}
              </div>
              
              {currentSource?.status === 'processing' && (
                <p className="text-sm text-gray-500">
                  Extracting content... This may take a moment.
                </p>
              )}
              
              {currentSource?.status === 'failed' && (
                <p className="text-sm text-red-500">
                  {currentSource.errorMessage || 'Failed to extract content'}
                </p>
              )}
              
              {currentSource?.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {currentSource.summary.slice(0, 200)}...
                </p>
              )}
            </div>

            {currentSource?.status === 'completed' && (
              <>
                {/* Note Style Selection */}
                <div className="space-y-3">
                  <Label>Note Style</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.entries(noteStyleInfo) as [NoteStyle, typeof noteStyleInfo[NoteStyle]][]).map(([style, info]) => (
                      <button
                        key={style}
                        onClick={() => setNoteStyle(style)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                          noteStyle === style
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-md",
                          noteStyle === style
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {info.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {info.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {info.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="custom-prompt">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="custom-prompt"
                    placeholder="e.g., Focus on practical examples, include code snippets, emphasize key definitions..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentSourceId ? (
            <>
              <Button
                variant="outline"
                onClick={() => setCurrentSourceId(null)}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleGenerateNotes}
                disabled={isProcessing || currentSource?.status !== 'completed'}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Notes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSource}
                disabled={
                  isProcessing ||
                  isUploading ||
                  (sourceType === 'youtube' && !url) ||
                  (sourceType === 'website' && !url) ||
                  (sourceType === 'pdf' && !selectedFile) ||
                  (sourceType === 'text' && !textContent.trim())
                }
                className="gap-2"
              >
                {isProcessing || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Continue
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

