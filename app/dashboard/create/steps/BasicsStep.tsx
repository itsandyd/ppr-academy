'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ProductCategory, getProductInfo } from '../types';

interface BasicsStepProps {
  productCategory: ProductCategory;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onImageChange: (url: string) => void;
  onTagsChange: (tags: string[]) => void;
  onNext: () => void;
}

export function BasicsStep({
  productCategory,
  title,
  description,
  imageUrl,
  tags,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
  onTagsChange,
  onNext,
}: BasicsStepProps) {
  const [tagInput, setTagInput] = useState('');
  const productInfo = getProductInfo(productCategory);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onTagsChange([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  const canProceed = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Product type badge */}
      <div className="flex items-center gap-2">
        <span className="text-3xl">{productInfo?.icon}</span>
        <div>
          <h2 className="text-2xl font-bold">{productInfo?.label}</h2>
          <p className="text-sm text-muted-foreground">{productInfo?.description}</p>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Product Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Ultimate Trap Drum Kit"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={cn(
            'text-lg',
            title.trim().length === 0 && 'border-destructive'
          )}
        />
        <p className="text-xs text-muted-foreground">
          Make it catchy and descriptive
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe what makes this product special..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={6}
          className={cn(
            description.trim().length === 0 && 'border-destructive'
          )}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/1000 characters
        </p>
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label htmlFor="thumbnail">
          Thumbnail Image
        </Label>
        {imageUrl ? (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Thumbnail preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => onImageChange('')}
            >
              Change Image
            </Button>
          </div>
        ) : (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <div 
              className="p-12 text-center"
              onClick={() => {
                // TODO: Open image picker/uploader
                console.log('Open image picker');
              }}
            >
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Upload Thumbnail</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click to upload or drag and drop
              </p>
              <Badge variant="secondary">Recommended: 1200x630px</Badge>
            </div>
          </Card>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">
          Tags (Optional)
        </Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Tags help students find your product
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/create')}
        >
          Cancel
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Continue
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}


