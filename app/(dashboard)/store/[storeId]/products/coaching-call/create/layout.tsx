'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Image, ShoppingCart, Calendar, Sliders } from 'lucide-react';
import { CoachingCallPhonePreview } from './CoachingCallPhonePreview';

const tabs = [
  { key: 'thumbnail',      label: 'Thumbnail',      icon: Image },
  { key: 'checkout',       label: 'Checkout Page',  icon: ShoppingCart },
  { key: 'availability',   label: 'Availability',   icon: Calendar },
  { key: 'options',        label: 'Options',        icon: Sliders },
];

interface WizardLayoutProps {
  children: React.ReactNode;
}

export default function WizardLayout({ children }: WizardLayoutProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const current = params.get('step') ?? 'thumbnail';

  function go(step: string) {
    const qs = new URLSearchParams(params);
    qs.set('step', step);
    router.push(`${pathname}?${qs.toString()}`, { scroll: false });
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 lg:flex lg:gap-20">
      <aside className="flex-1">
        <nav className="flex gap-3 mb-10">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = current === t.key;
            return (
              <Button
                key={t.key}
                onClick={() => go(t.key)}
                variant="ghost"
                className={`h-9 rounded-full px-4 transition-colors ${
                  isActive
                    ? "bg-white border border-[#6356FF] text-[#6356FF] font-medium hover:bg-white hover:text-[#6356FF]"
                    : "text-[#4B4E68] border border-transparent hover:text-[#6356FF] hover:bg-transparent"
                }`}
              >
                <Icon size={16} className="mr-2" />
                {t.label}
              </Button>
            );
          })}
        </nav>
        {children}
      </aside>

      <div className="sticky top-32">
        <CoachingCallPhonePreview />
      </div>
    </div>
  );
} 