'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface CreationHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  badge?: string;
  backHref?: string;
}

export function CreationHeader({
  title,
  description,
  icon,
  badge,
  backHref = '/dashboard?mode=create',
}: CreationHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(backHref)}
        className="flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center gap-3 flex-1">
        {icon && <span className="text-3xl">{icon}</span>}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

