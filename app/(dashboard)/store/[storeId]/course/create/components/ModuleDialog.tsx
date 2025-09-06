"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen, Save, X } from "lucide-react";

interface Module {
  title: string;
  description: string;
  orderIndex: number;
  lessons: any[];
}

interface ModuleDialogProps {
  onModuleAdd: (module: Omit<Module, 'lessons'>) => void;
  onModuleEdit?: (module: Omit<Module, 'lessons'>) => void;
  existingModules: Module[];
  editData?: Module;
  trigger?: React.ReactNode;
}

export function ModuleDialog({ onModuleAdd, onModuleEdit, existingModules, editData, trigger }: ModuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [moduleData, setModuleData] = useState({
    title: editData?.title || "",
    description: editData?.description || "",
  });

  const isEditing = !!editData;

  const handleSave = () => {
    if (!moduleData.title.trim()) {
      alert("Module title is required");
      return;
    }

    const moduleToSave = {
      title: moduleData.title.trim(),
      description: moduleData.description.trim(),
      orderIndex: isEditing ? editData!.orderIndex : existingModules.length + 1,
    };

    if (isEditing && onModuleEdit) {
      onModuleEdit(moduleToSave);
    } else {
      onModuleAdd(moduleToSave);
    }
    
    // Reset form and close dialog
    if (!isEditing) {
      setModuleData({ title: "", description: "" });
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (isEditing && editData) {
      setModuleData({ title: editData.title, description: editData.description });
    } else {
      setModuleData({ title: "", description: "" });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Module
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {isEditing ? "Edit Module" : "Add New Module"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Module Title */}
          <div className="space-y-2">
            <Label htmlFor="module-title">Module Title *</Label>
            <Input
              id="module-title"
              placeholder="e.g., EQ and Filters"
              value={moduleData.title}
              onChange={(e) => setModuleData(prev => ({ ...prev, title: e.target.value }))}
              className="h-10 sm:h-12"
            />
            <p className="text-xs text-muted-foreground">
              {isEditing ? `Editing Module ${editData?.orderIndex}` : `This will be Module ${existingModules.length + 1}`}
            </p>
          </div>

          {/* Module Description */}
          <div className="space-y-2">
            <Label htmlFor="module-description">Module Description</Label>
            <Textarea
              id="module-description"
              placeholder="Describe what students will learn in this module..."
              value={moduleData.description}
              onChange={(e) => setModuleData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="resize-none min-h-[72px] sm:min-h-[96px]"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Provide an overview of the module content
            </p>
          </div>

          {/* Module Preview */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-emerald-800 mb-2 text-sm sm:text-base">Preview:</h4>
            <div className="text-sm">
              <div className="font-medium text-emerald-700">
                Module {isEditing ? editData?.orderIndex : existingModules.length + 1}: {moduleData.title || "Module Title"}
              </div>
              {moduleData.description && (
                <div className="text-emerald-600 mt-1 text-xs sm:text-sm">
                  {moduleData.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end pt-4 sm:pt-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!moduleData.title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Update Module" : "Add Module"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
