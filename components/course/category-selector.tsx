"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles } from "lucide-react";
import { COURSE_CATEGORIES, getSubcategories, suggestTags } from "@/lib/course-categories";

interface CategorySelectorProps {
  category?: string;
  subcategory?: string;
  tags?: string[];
  title?: string;
  description?: string;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
  onTagsChange: (tags: string[]) => void;
  errors?: {
    category?: boolean;
    subcategory?: boolean;
  };
}

export function CategorySelector({
  category,
  subcategory,
  tags = [],
  title = "",
  description = "",
  onCategoryChange,
  onSubcategoryChange,
  onTagsChange,
  errors,
}: CategorySelectorProps) {
  const [tagInput, setTagInput] = useState("");
  const [suggestedTagsList, setSuggestedTagsList] = useState<string[]>([]);

  // Get subcategories for selected category
  const subcategories = category ? getSubcategories(category) : [];

  // Auto-suggest tags based on title and description
  useEffect(() => {
    if (title || description) {
      const suggestions = suggestTags(title, description);
      setSuggestedTagsList(suggestions.filter(tag => !tags.includes(tag)));
    }
  }, [title, description, tags]);

  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
    // Reset subcategory when category changes
    onSubcategoryChange("");
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      onTagsChange([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category */}
        <div className="space-y-3">
          <Label htmlFor="category" className="text-base font-semibold text-gray-900 flex items-center gap-1">
            Category <span className="text-red-600">*</span>
          </Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger 
              className={`h-14 border-2 rounded-xl text-base ${
                errors?.category
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            >
              <SelectValue placeholder="Choose primary category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {COURSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-base py-3">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.category && (
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Category is required
            </p>
          )}
          {!errors?.category && (
            <p className="text-sm text-gray-500">
              Select the broad area your course belongs to
            </p>
          )}
        </div>

        {/* Subcategory */}
        <div className="space-y-3">
          <Label htmlFor="subcategory" className="text-base font-semibold text-gray-900 flex items-center gap-1">
            Subcategory <span className="text-red-600">*</span>
          </Label>
          <Select 
            value={subcategory} 
            onValueChange={onSubcategoryChange}
            disabled={!category}
          >
            <SelectTrigger 
              className={`h-14 border-2 rounded-xl text-base ${
                errors?.subcategory
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              } ${!category ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <SelectValue placeholder={category ? "Choose specific topic" : "Select category first"} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black max-h-[400px]">
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub} className="text-base py-3">
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.subcategory && (
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Subcategory is required
            </p>
          )}
          {!errors?.subcategory && category && (
            <p className="text-sm text-gray-500">
              Be specific to help students find your course
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label htmlFor="tags" className="text-base font-semibold text-gray-900">
          Tags (2-5 recommended)
        </Label>
        
        {/* Tag Input */}
        <div className="flex gap-2">
          <Input
            id="tags"
            type="text"
            placeholder="Add a tag (press Enter)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            disabled={tags.length >= 5}
            className="h-12 border-2 border-gray-200 rounded-xl text-base focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="px-3 py-1.5 text-sm font-medium"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 hover:text-destructive transition-colors"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* AI Suggested Tags */}
        {suggestedTagsList.length > 0 && tags.length < 5 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Suggested tags based on your course:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedTagsList.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  type="button"
                  className="px-3 py-1.5 text-sm border border-dashed border-purple-300 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          Add relevant keywords to help students discover your course. Tags improve search and recommendations.
        </p>
      </div>
    </div>
  );
}

