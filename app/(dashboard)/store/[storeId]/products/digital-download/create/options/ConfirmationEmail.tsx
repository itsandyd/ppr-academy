"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Control, UseFormRegister, Controller } from "react-hook-form";
import { OptionsProSchema } from "./schema";

interface ConfirmationEmailProps {
  control: Control<OptionsProSchema>;
  register: UseFormRegister<OptionsProSchema>;
}

export function ConfirmationEmail({ control, register }: ConfirmationEmailProps) {
  const defaultSubject = "Thank you for your purchase!";
  const defaultBody = "<p>Hi there!</p><p>Thank you for purchasing our digital product. You can download your files using the link below.</p><p>Best regards,<br/>The Team</p>";

  return (
    <div className="space-y-6">
      {/* Subject Line */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Subject</label>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-[#6356FF] h-auto p-0 text-xs"
            onClick={() => {
              // TODO: Reset to default subject
            }}
          >
            Restore Default
          </Button>
        </div>
        <Input
          {...register("confirmationSubject")}
          placeholder="Enter email subject"
          className="h-9 rounded-md border border-[#D6D9F3] px-4"
          maxLength={120}
        />
      </div>

      {/* Email Body */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Body</label>
        </div>
        <Controller
          control={control}
          name="confirmationBody"
          render={({ field }) => (
            <EmailEditor
              value={field.value || defaultBody}
              onChange={field.onChange}
            />
          )}
        />
        <div className="flex justify-end mt-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-[#6356FF] h-auto p-0 text-xs"
            onClick={() => {
              // TODO: Reset to default body
            }}
          >
            Restore Default
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EmailEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function EmailEditor({ value, onChange }: EmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your confirmation email here...",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const insertMergeTag = (tag: string) => {
    if (editor) {
      editor.chain().focus().insertContent(tag).run();
    }
  };

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
        
        {/* Personalize Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-[#6356FF] hover:text-[#5248E6] px-2"
            >
              Personalize
              <ChevronDown size={12} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => insertMergeTag("{{ customer_name }}")}>
              Customer Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertMergeTag("{{ customer_email }}")}>
              Customer Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertMergeTag("{{ product_name }}")}>
              Product Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertMergeTag("{{ download_link }}")}>
              Download Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertMergeTag("{{ order_date }}")}>
              Order Date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Editor */}
      <div className="p-4 min-h-[200px]">
        <EditorContent 
          editor={editor}
          className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[168px]"
        />
      </div>
    </div>
  );
} 