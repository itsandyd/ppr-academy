'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardMode = 'learn' | 'create';

interface ModeToggleProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border p-1 bg-muted/50">
      <button
        onClick={() => onChange('learn')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
          mode === 'learn'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Learn</span>
      </button>
      
      <button
        onClick={() => onChange('create')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
          mode === 'create'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Create</span>
      </button>
    </div>
  );
}

