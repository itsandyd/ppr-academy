'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  Star,
  Archive,
  Settings,
  ChevronRight,
  ChevronDown,
  Hash,
  Filter,
  SortAsc
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Note {
  _id: string;
  title: string;
  icon?: string;
  tags: string[];
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  isFavorite: boolean;
  lastEditedAt: number;
  wordCount?: number;
  folderId?: string;
}

interface Folder {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
  isArchived: boolean;
}

interface NotesSidebarProps {
  folders: Folder[];
  notes: Note[];
  selectedNoteId?: string;
  selectedFolderId?: string;
  onNoteSelect: (noteId: string) => void;
  onFolderSelect: (folderId: string | null) => void;
  onCreateNote: (folderId?: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export function NotesSidebar({
  folders,
  notes,
  selectedNoteId,
  selectedFolderId,
  onNoteSelect,
  onFolderSelect,
  onCreateNote,
  onCreateFolder,
  onDeleteFolder,
  onDeleteNote,
  searchQuery,
  onSearchChange,
  className
}: NotesSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'recent' | 'templates'>('all');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const filterNotes = (notes: Note[]) => {
    let filtered = notes.filter(note => !note.status || note.status !== 'archived');
    
    switch (viewMode) {
      case 'favorites':
        filtered = filtered.filter(note => note.isFavorite);
        break;
      case 'recent':
        filtered = filtered
          .sort((a, b) => b.lastEditedAt - a.lastEditedAt)
          .slice(0, 10);
        break;
      case 'templates':
        // Assuming templates are notes with specific tags
        filtered = filtered.filter(note => note.tags.includes('template'));
        break;
    }

    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    if (folder.isArchived) return null;
    
    const isExpanded = expandedFolders.has(folder._id);
    const childFolders = folders.filter(f => f.parentId === folder._id);
    const folderNotes = notes.filter(n => n.folderId === folder._id);
    const hasChildren = childFolders.length > 0 || folderNotes.length > 0;

    return (
      <div key={folder._id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group",
            selectedFolderId === folder._id && "bg-gray-100 dark:bg-gray-800",
          )}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder._id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <div 
            className="flex items-center gap-2 flex-1"
            onClick={() => onFolderSelect(folder._id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Folder className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm font-medium truncate">{folder.name}</span>
            {folderNotes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {folderNotes.length}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 p-0 h-4 w-4"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCreateNote(folder._id)}>
                <FileText className="h-4 w-4 mr-2" />
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateFolder(folder._id)}>
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteFolder(folder._id)}
                className="text-red-600 dark:text-red-400"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <div>
            {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
            {folderNotes.map(note => renderNote(note, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderNote = (note: Note, level: number = 0) => {
    return (
      <div
        key={note._id}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 group",
          selectedNoteId === note._id && "bg-blue-50 dark:bg-blue-950 border-r-2 border-blue-500",
        )}
        style={{ paddingLeft: `${16 + level * 16}px` }}
        onClick={() => onNoteSelect(note._id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">{note.icon || '📝'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{note.title}</span>
              {note.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getStatusColor(note.status))}
              >
                {note.status}
              </Badge>
              
              {note.wordCount && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {note.wordCount} words
                </span>
              )}
            </div>

            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {note.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Hash className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{note.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 p-0 h-4 w-4"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Edit Note
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              {note.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDeleteNote(note._id)}
              className="text-red-600 dark:text-red-400"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const rootFolders = folders.filter(f => !f.parentId && !f.isArchived);
  const rootNotes = filterNotes(notes.filter(n => !n.folderId));
  const filteredNotes = filterNotes(notes);

  return (
    <div className={cn("h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onCreateNote()}>
                <FileText className="h-4 w-4 mr-2" />
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateFolder()}>
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { key: 'all', label: 'All', icon: FileText },
            { key: 'favorites', label: 'Starred', icon: Star },
            { key: 'recent', label: 'Recent', icon: SortAsc },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={viewMode === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(key as any)}
              className="flex-1 text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery ? (
          // Search Results
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
              {filteredNotes.length} results for "{searchQuery}"
            </div>
            {filteredNotes.map(note => renderNote(note))}
          </div>
        ) : (
          // Folder Tree
          <div className="space-y-1">
            {/* Quick Access */}
            <div className="mb-4">
              <Button
                variant={!selectedFolderId ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFolderSelect(null)}
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                All Notes
                <Badge variant="secondary" className="ml-auto">
                  {notes.length}
                </Badge>
              </Button>
            </div>

            {/* Folder Tree */}
            {rootFolders.map(folder => renderFolder(folder))}
            
            {/* Root Notes */}
            {rootNotes.map(note => renderNote(note))}
          </div>
        )}

        {(searchQuery ? filteredNotes.length === 0 : notes.length === 0) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
