'use client';

import { ReactNode } from 'react';

interface CreationLayoutProps {
  header: ReactNode;
  progress?: ReactNode;
  content: ReactNode;
  preview?: ReactNode;
  actions: ReactNode;
  variant?: 'default' | 'full-width';
}

export function CreationLayout({
  header,
  progress,
  content,
  preview,
  actions,
  variant = 'default',
}: CreationLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with progress */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          {header}
          {progress}
        </div>
      </div>

      {/* Main content area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className={cn(
          'mx-auto',
          variant === 'full-width' ? 'max-w-7xl' : 'max-w-6xl'
        )}>
          <div className={cn(
            'grid gap-8',
            variant === 'default' && preview ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
          )}>
            {/* Form/Content area */}
            <div className={cn(
              variant === 'default' && preview ? 'lg:col-span-2' : 'w-full'
            )}>
              <div className="space-y-6">
                {content}
                <div className="lg:hidden">
                  {actions}
                </div>
              </div>
            </div>

            {/* Preview pane (desktop only) */}
            {preview && variant === 'default' && (
              <div className="hidden lg:block lg:col-span-1">
                {preview}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky action bar (desktop, at bottom of form) */}
      <div className="hidden lg:block sticky bottom-0 z-30 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8 py-4',
          variant === 'full-width' ? 'max-w-7xl' : 'max-w-6xl',
          preview && variant === 'default' && 'grid grid-cols-3 gap-8'
        )}>
          <div className={preview && variant === 'default' ? 'col-span-2' : ''}>
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

