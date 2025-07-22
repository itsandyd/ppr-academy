"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller } from "react-hook-form";
import { Control, UseFormRegister, UseFormWatch } from "react-hook-form";
import { CheckoutSchema } from "./schema";

interface DescriptionEditorProps {
  control: Control<CheckoutSchema>;
  register: UseFormRegister<CheckoutSchema>;
  watch: UseFormWatch<CheckoutSchema>;
}

export function DescriptionEditor({ control, register, watch }: DescriptionEditorProps) {
  const titleLength = watch("title")?.length || 0;
  const buttonTitleLength = watch("buttonTitle")?.length || 0;
  const ctaLength = watch("cta")?.length || 0;

  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <span className={`text-xs ${titleLength >= 48 ? 'text-red-500' : 'text-[#6B6E85]'}`}>
            {titleLength}/50
          </span>
        </div>
        <Input
          {...register("title")}
          placeholder="Enter title"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
          maxLength={50}
        />
      </div>

      {/* Description Body */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Description Body</label>
          <span className="text-xs text-[#6B6E85]">
            Rich text editor
          </span>
        </div>
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <RichTextEditor
              value={field.value || ""}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Button Title */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Button Title</label>
          <span className={`text-xs ${buttonTitleLength >= 30 ? 'text-red-500' : 'text-[#6B6E85]'}`}>
            {buttonTitleLength}/30
          </span>
        </div>
        <Input
          {...register("buttonTitle")}
          placeholder="Enter button title"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
          maxLength={30}
        />
      </div>

      {/* Call-to-Action Button */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Call-to-Action Button</label>
          <span className={`text-xs ${ctaLength >= 20 ? 'text-red-500' : 'text-[#6B6E85]'}`}>
            {ctaLength}/20
          </span>
        </div>
        <Input
          {...register("cta")}
          placeholder="Enter call-to-action text"
          className="h-12 rounded-xl border-[#E5E7F5] px-4"
          maxLength={20}
        />
      </div>
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your product description here...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[#E5E7F5] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#F3F3FF] px-3 h-8 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-6 w-6 p-0 ${editor.isActive("bold") ? "bg-white" : ""}`}
        >
          <Bold size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-6 w-6 p-0 ${editor.isActive("italic") ? "bg-white" : ""}`}
        >
          <Italic size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-6 w-6 p-0 ${editor.isActive("bulletList") ? "bg-white" : ""}`}
        >
          <List size={14} />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-[#6356FF] hover:text-[#5248E6] p-0"
        >
          <Sparkles size={12} className="mr-1" />
          Generate with AI
        </Button>
      </div>

      {/* Editor */}
      <div className="p-4 min-h-[250px]">
        <EditorContent 
          editor={editor}
          className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[218px]"
        />
      </div>
    </div>
  );
} 