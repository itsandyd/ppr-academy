'use client';

import { ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Monitor, 
  Eye,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PreviewPaneProps {
  title?: string;
  children: ReactNode;
  variant?: 'desktop' | 'mobile' | 'both';
  showDeviceToggle?: boolean;
}

export function PreviewPane({
  title = 'Live Preview',
  children,
  variant = 'both',
  showDeviceToggle = true,
}: PreviewPaneProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('mobile');

  return (
    <div className="sticky top-24">
      <Card className="border-dashed">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                {title}
              </CardTitle>
            </div>
            
            {showDeviceToggle && variant === 'both' && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setDevice('mobile')}
                  className={cn(
                    'p-1.5 rounded transition-all',
                    device === 'mobile' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  )}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDevice('desktop')}
                  className={cn(
                    'p-1.5 rounded transition-all',
                    device === 'desktop' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  )}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className={cn(
            'mx-auto transition-all',
            device === 'mobile' && 'max-w-[375px]',
            device === 'desktop' && 'w-full'
          )}>
            <div className={cn(
              'bg-background rounded-lg border overflow-hidden',
              device === 'mobile' && 'aspect-[9/16]',
            )}>
              {children}
            </div>
          </div>

          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-xs">
              Updates in real-time
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mobile preview dialog (for when preview is hidden on small screens)
interface MobilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function MobilePreviewDialog({
  open,
  onOpenChange,
  children,
}: MobilePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </DialogTitle>
        </DialogHeader>
        <div className="max-w-[375px] mx-auto">
          <div className="aspect-[9/16] bg-background rounded-lg border overflow-hidden">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}


