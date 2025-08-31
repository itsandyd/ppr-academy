"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea";
  required: boolean;
  placeholder: string;
}

interface CollectInfoProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function CollectInfo({ fields, onChange }: CollectInfoProps) {
  const addField = useCallback(() => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
      placeholder: "Enter placeholder text"
    };
    onChange([...fields, newField]);
  }, [fields, onChange]);

  const removeField = useCallback((fieldId: string) => {
    // Don't allow removing default name and email fields
    const defaultFieldLabels = ["Name", "Email"];
    const field = fields.find(f => f.id === fieldId);
    if (field && defaultFieldLabels.includes(field.label)) {
      return;
    }
    onChange(fields.filter(f => f.id !== fieldId));
  }, [fields, onChange]);

  // Memoize the updateField function to prevent infinite loops
  const updateField = useMemo(() => {
    return (fieldId: string, updates: Partial<FormField>) => {
      const currentField = fields.find(f => f.id === fieldId);
      if (!currentField) return;
      
      // Check if the update would actually change anything
      const hasChanges = Object.entries(updates).some(([key, value]) => 
        currentField[key as keyof FormField] !== value
      );
      
      if (!hasChanges) return;
      
      onChange(fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ));
    };
  }, [fields, onChange]);

  const isDefaultField = useCallback((field: FormField) => {
    return ["Name", "Email"].includes(field.label);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure what information you'll collect from visitors
      </p>
      
      {/* Display existing fields */}
      {fields.map((field) => (
        <div key={field.id} className="p-4 border border-border rounded-lg bg-card space-y-3">
          <div className="flex items-center justify-between">
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Field name"
              disabled={isDefaultField(field)}
            />
            {!isDefaultField(field) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeField(field.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Input
            value={field.placeholder}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
            placeholder="Placeholder text"
            className="text-xs bg-background"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Field Type</Label>
              <Select
                value={field.type}
                onValueChange={(value: "text" | "email" | "phone" | "textarea") => {
                  updateField(field.id, { type: value });
                }}
                disabled={field.label === "Email"} // Email field must stay email type
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Required</Label>
              <Select
                value={field.required ? "yes" : "no"}
                onValueChange={(value) => {
                  updateField(field.id, { required: value === "yes" });
                }}
                disabled={isDefaultField(field)} // Default fields are always required
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      {/* Add field button */}
      <Button
        type="button"
        variant="outline"
        onClick={addField}
        className="w-full border-dashed border-primary text-primary hover:bg-primary/5"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Field
      </Button>
    </div>
  );
} 