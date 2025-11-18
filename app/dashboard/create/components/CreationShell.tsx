'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepConfig } from '../types';

interface CreationShellProps {
  productLabel: string;
  productIcon: string;
  steps: StepConfig[];
  currentStepId: string;
  completedSteps: string[];
  onNavigateToStep: (stepId: string) => void;
  onSaveDraft?: () => Promise<void>;
  onPublish?: () => Promise<void>;
  canPublish?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
  children: ReactNode;
  preview?: ReactNode;
}

export function CreationShell({
  productLabel,
  productIcon,
  steps,
  currentStepId,
  completedSteps,
  onNavigateToStep,
  onSaveDraft,
  onPublish,
  canPublish = false,
  isSaving = false,
  isPublishing = false,
  children,
  preview,
}: CreationShellProps) {
  const router = useRouter();
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard?mode=create')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{productIcon}</span>
                  <h1 className="text-xl font-bold">Create {productLabel}</h1>
                </div>
                {currentStep && (
                  <p className="text-sm text-muted-foreground">
                    {currentStep.description}
                  </p>
                )}
              </div>
            </div>

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
                  disabled={isPublishing}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isPublishing ? 'Publishing...' : 'Publish'}
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStepId;
                const isPast = index < currentStepIndex;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => onNavigateToStep(step.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap',
                      isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                      !isCurrent && isPast && 'bg-muted text-foreground hover:bg-muted/80',
                      !isCurrent && !isPast && 'text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">{step.label}</span>
                    <span className="md:hidden">{index + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 md:p-8">
                {children}
              </CardContent>
            </Card>
          </div>

          {/* Preview pane */}
          {preview && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        Live Preview
                      </Badge>
                    </div>
                    {preview}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

