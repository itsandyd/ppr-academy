'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Save, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ActionBarProps {
  // Navigation
  onBack?: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  
  // Actions
  onSaveDraft?: () => Promise<void>;
  onPublish?: () => Promise<void>;
  
  // State
  canProceed?: boolean;
  canPublish?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
  
  // Labels
  nextLabel?: string;
  publishLabel?: string;
  
  // Validation
  validationErrors?: string[];
  
  // Layout
  variant?: 'default' | 'compact' | 'sticky';
  showProgress?: boolean;
  progress?: number;
}

export function ActionBar({
  onBack,
  onNext,
  onCancel,
  onSaveDraft,
  onPublish,
  canProceed = true,
  canPublish = false,
  isSaving = false,
  isPublishing = false,
  nextLabel = 'Continue',
  publishLabel = 'Publish Product',
  validationErrors = [],
  variant = 'default',
  showProgress = false,
  progress = 0,
}: ActionBarProps) {
  const hasErrors = validationErrors.length > 0;

  const content = (
    <div className="space-y-4">
      {/* Validation errors */}
      {hasErrors && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Please fix the following:
                </p>
                <ul className="text-sm text-destructive/80 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress indicator (optional) */}
      {showProgress && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Back/Cancel */}
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        {/* Right side: Save/Next/Publish */}
        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <Button 
              variant="outline" 
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
          
          {onPublish && canPublish && (
            <Button
              onClick={onPublish}
              disabled={isPublishing || hasErrors}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : publishLabel}
            </Button>
          )}
          
          {onNext && !onPublish && (
            <Button
              onClick={onNext}
              disabled={!canProceed || hasErrors}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {nextLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'sticky') {
    return (
      <div className="sticky bottom-0 z-30 bg-card/95 backdrop-blur-lg border-t border-border p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {content}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return <div className="pt-6 border-t">{content}</div>;
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-6">
        {content}
      </CardContent>
    </Card>
  );
}

