"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, User, Mail, Phone, FileText } from "lucide-react";

interface Field {
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea';
  required: boolean;
}

interface InfoFieldsProps {
  fields: Field[];
  onChange: (fields: Field[]) => void;
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: User },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'textarea', label: 'Long Text', icon: FileText },
];

export function InfoFields({ fields, onChange }: InfoFieldsProps) {
  const addField = () => {
    const newField: Field = {
      label: '',
      type: 'text',
      required: false,
    };
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B6E85]">
          Collect additional information from clients before booking
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          className="text-[#6356FF] border-[#6356FF] hover:bg-[#6356FF]/5"
        >
          <Plus size={14} className="mr-1" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-[#DDE1F7]">
          <div className="text-[#6B6E85] text-sm">
            No custom fields yet. Add fields to collect specific information from your clients.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const FieldIcon = fieldTypes.find(t => t.value === field.type)?.icon || User;
            
            return (
              <Card key={index} className="p-4 border-[#E5E7F5]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Field Label */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Field Label
                    </label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="e.g., What's your experience level?"
                      className="h-10 rounded-lg border-[#E5E7F5]"
                    />
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Type
                    </label>
                    <Select 
                      value={field.type} 
                      onValueChange={(value: 'text' | 'email' | 'phone' | 'textarea') => 
                        updateField(index, { type: value })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-lg border-[#E5E7F5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon size={14} className="text-[#6B6E85]" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(index, { required: checked })}
                        className="data-[state=checked]:bg-[#6356FF]"
                      />
                      <span className="text-xs text-[#6B6E85]">Required</span>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 