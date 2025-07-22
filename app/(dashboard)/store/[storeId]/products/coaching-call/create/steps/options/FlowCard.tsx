"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash, Plus, ChevronDown } from "lucide-react";
import { Control, FieldArrayWithId, UseFormRegister, useFieldArray } from "react-hook-form";
import { OptionsSchema } from "./schema";
import { RecipientRow } from "./RecipientRow";

interface FlowCardProps {
  flow: any;
  index: number;
  control: Control<OptionsSchema>;
  register: UseFormRegister<OptionsSchema>;
  onDelete: () => void;
}

export function FlowCard({ flow, index, control, register, onDelete }: FlowCardProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `flows.${index}.recipients`,
  });

  const addRecipient = () => {
    append({ delay: 15, audience: 'new' as const });
  };

  return (
    <Card className="p-6 space-y-4 bg-[#F8F8FF] border border-[#E5E7F5] rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">Reminder</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8">
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      <Input
        {...register(`flows.${index}.subject` as const)}
        placeholder="Email subject line"
        className="h-9 border-[#D6D9F3]"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Body</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Personalise <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>{"{customer_name}"}</DropdownMenuItem>
              <DropdownMenuItem>{"{product_name}"}</DropdownMenuItem>
              <DropdownMenuItem>{"{session_date}"}</DropdownMenuItem>
              <DropdownMenuItem>{"{session_time}"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="border border-[#E5E7F5] rounded-lg bg-white">
          <div className="bg-[#F3F3FF] px-3 py-2 border-b border-[#E5E7F5] flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <span className="font-bold text-xs">B</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <span className="italic text-xs">I</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <span className="text-xs">•</span>
            </Button>
          </div>
          <div className="p-3">
            <textarea
              {...register(`flows.${index}.body` as const)}
              placeholder="Email body content..."
              className="w-full h-[200px] border-none resize-none bg-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="space-y-3">
        <div className="grid grid-cols-[120px_1fr_40px] gap-3 text-sm font-medium text-[#6B6E85]">
          <span>Delay (min)</span>
          <span>Send to</span>
          <span></span>
        </div>
        
        <div className="space-y-2">
          {fields.map((field, rIdx) => (
            <RecipientRow
              key={field.id}
              index={rIdx}
              flowIndex={index}
              control={control}
              register={register}
              onRemove={() => remove(rIdx)}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addRecipient}
          className="h-8 text-xs"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Recipient
        </Button>
      </div>
    </Card>
  );
} 