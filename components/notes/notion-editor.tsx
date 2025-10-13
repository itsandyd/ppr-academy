'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  ImageIcon,
  Code,
  Loader2,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Palette,
  Type,
  Minus,
  Plus,
  Hash
} from 'lucide-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NotionEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  onTitleChange?: (title: string) => void;
  icon?: string;
  onIconChange?: (icon: string) => void;
  editable?: boolean;
}

const EMOJI_LIST = ['📝', '📚', '💡', '🎯', '📊', '🔍', '⚡', '🌟', '🎨', '🔗', '📋', '💭', '🎓', '📖', '✨', '🚀', '💼', '🔧', '📈', '🎪'];

export function NotionEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className,
  title = "Untitled",
  onTitleChange,
  icon = "📝",
  onIconChange,
  editable = true
}: NotionEditorProps) {
  
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4 cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: () => {
          return placeholder;
        },
        showOnlyWhenEditable: false,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2 ',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      if (editable) {
        onChange(editor.getHTML());
      }
    },
    editable,
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none px-8 py-4 min-h-[300px]',
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor || !editable) return;

    setIsUploading(true);
    
    try {
      // Create a data URL for immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [editor, editable]);

  const handleImageButtonClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor?.commands.focus();
    }
  };

  const handleTitleBlur = () => {
    if (onTitleChange && localTitle !== title) {
      onTitleChange(localTitle);
    }
  };

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg", className)}>
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editable && setShowEmojiPicker(!showEmojiPicker)}
            className="text-2xl p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={!editable}
          >
            {icon}
          </Button>
          
          {showEmojiPicker && editable && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="grid grid-cols-5 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onIconChange?.(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          onBlur={handleTitleBlur}
          className="flex-1 text-3xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600"
          placeholder="Untitled"
          disabled={!editable}
        />
      </div>

      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Heading1 className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Heading2 className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Heading3 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Palette className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Code className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <CheckSquare className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <Quote className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImageButtonClick}
            disabled={isUploading}
            title="Insert Image"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[400px]"
        />
        
        {/* Floating add button for empty lines */}
        {editable && (
          <div className="absolute left-2 top-4 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => editor.commands.focus()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
