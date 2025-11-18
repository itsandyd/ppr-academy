'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles } from 'lucide-react';

interface StepCardProps {
  title: string;
  description?: string;
  icon?: any;
  estimatedTime?: string;
  stepNumber?: number;
  totalSteps?: number;
  isCompleted?: boolean;
  children: ReactNode;
  variant?: 'default' | 'accent' | 'muted';
}

export function StepCard({
  title,
  description,
  icon: Icon,
  estimatedTime,
  stepNumber,
  totalSteps,
  isCompleted = false,
  children,
  variant = 'default',
}: StepCardProps) {
  return (
    <Card className={cn(
      variant === 'accent' && 'border-primary/50 shadow-md',
      variant === 'muted' && 'bg-muted/50',
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {title}
                </CardTitle>
                {isCompleted && (
                  <Badge className="bg-green-600">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {stepNumber && totalSteps && (
              <Badge variant="outline" className="text-xs">
                {stepNumber}/{totalSteps}
              </Badge>
            )}
            {estimatedTime && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {estimatedTime}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}


