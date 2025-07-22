"use client";

import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Bold, Italic, List, Link, Image } from "lucide-react";

interface ConfirmationEmailProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
}

const defaultSubject = "Thank you for downloading your free resource!";
const defaultBody = "<p>Hi there!</p><p>Thank you for downloading our free resource. You can access your download using the link below.</p><p>Best regards,<br/>The Team</p>";

export function ConfirmationEmail({ control, register, setValue }: ConfirmationEmailProps) {
  const insertTag = (tag: string) => {
    // TODO: Implement tag insertion into rich text editor
    console.log("Inserting tag:", tag);
  };

  return (
    <div className="space-y-6">
      {/* Subject */}
      <div className="relative">
        <Input
          {...register('confirmationSubject')}
          placeholder="Subject"
          className="h-9 pr-28 rounded-md border border-[#D6D9F3] px-4"
        />
        <Button
          type="button"
          variant="link"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#6356FF] p-0"
          onClick={() => setValue('confirmationSubject', defaultSubject)}
        >
          Restore Default
        </Button>
      </div>

      {/* Body Rich Text Editor */}
      <div className="relative">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="h-8 bg-[#EFF1FF] px-3 flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0">
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Link className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Image className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {/* Personalize Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-3 bg-white border border-[#D6D9F3] font-semibold"
                >
                  <Plus className="h-3 w-3 mr-1" /> Personalize
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => insertTag('{{ customer_name }}')}>
                  Customer Name
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => insertTag('{{ product_name }}')}>
                  Product Name
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => insertTag('{{ download_link }}')}>
                  Download Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Editor Area */}
          <Textarea
            {...register('confirmationBody')}
            placeholder="Write your confirmation email message..."
            className="min-h-[220px] border-0 rounded-none resize-none focus-visible:ring-0"
            defaultValue={defaultBody}
          />
        </div>

        <Button
          type="button"
          variant="link"
          size="sm"
          className="absolute right-2 -bottom-7 text-xs text-[#6356FF] p-0"
          onClick={() => setValue('confirmationBody', defaultBody)}
        >
          Restore Default
        </Button>
      </div>
    </div>
  );
} 