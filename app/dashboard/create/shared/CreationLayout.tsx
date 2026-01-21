'use client';

import { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';

interface CreationLayoutProps {
  header: ReactNode;
  progress?: ReactNode;
  content: ReactNode;
  preview?: ReactNode;
  actions: ReactNode;
  saveStatus?: ReactNode;
  variant?: 'default' | 'full-width';
  showMobilePreview?: boolean;
}

export function CreationLayout({
  header,
  progress,
  content,
  preview,
  actions,
  saveStatus,
  variant = 'default',
  showMobilePreview = true,
}: CreationLayoutProps) {
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with progress */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">{header}</div>
            {saveStatus && (
              <div className="hidden sm:block ml-4">{saveStatus}</div>
            )}
          </div>
          {progress}
        </div>
      </div>

      {/* Mobile preview toggle (collapsible accordion) */}
      {preview && showMobilePreview && (
        <div className="lg:hidden border-b border-border">
          <button
            onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Eye className="w-4 h-4" />
              Preview
            </span>
            {mobilePreviewOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {mobilePreviewOpen && (
            <div className="p-4 bg-muted/30 border-t border-border">
              {preview}
            </div>
          )}
        </div>
      )}

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

            {/* Preview pane (desktop only - sticky sidebar) */}
            {preview && variant === 'default' && (
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-32">
                  {preview}
                </div>
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
          <div className={cn(
            'flex items-center justify-between',
            preview && variant === 'default' ? 'col-span-2' : ''
          )}>
            <div>{actions}</div>
            {saveStatus && <div className="hidden md:block">{saveStatus}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

