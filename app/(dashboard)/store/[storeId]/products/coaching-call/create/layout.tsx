'use client';

import { usePathname, useSearchParams, useRouter, useParams } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from '@/components/ui/button';
import { Image, ShoppingCart, Calendar, Sliders } from 'lucide-react';
import { CoachingCallPhonePreview } from './CoachingCallPhonePreview';
import { CheckoutPhonePreview } from './checkout/CheckoutPhonePreview';
import { CoachingPreviewProvider, useCoachingPreview } from './CoachingPreviewContext';

const tabs = [
  { key: 'thumbnail',      label: 'Thumbnail',      icon: Image },
  { key: 'checkout',       label: 'Checkout Page',  icon: ShoppingCart },
  { key: 'availability',   label: 'Availability',   icon: Calendar },
  { key: 'options',        label: 'Options',        icon: Sliders },
];

interface WizardLayoutProps {
  children: React.ReactNode;
}

function WizardLayoutInner({ children }: WizardLayoutProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const params = useSearchParams();
  const routerParams = useParams();
  const router = useRouter();
  const current = params.get('step') ?? 'thumbnail';
  const storeId = routerParams.storeId as string;
  const { formData, imagePreviewUrl } = useCoachingPreview();
  
  const isCheckoutPage = current === "checkout";
  const isAvailabilityPage = current === "availability";
  const isOptionsPage = current === "options";

  // Get store and user data
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get display name and avatar
  const displayName = convexUser?.name || 
    (user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.lastName || "Coach");
    
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = convexUser?.imageUrl || user?.imageUrl || "";

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
        {isCheckoutPage || isAvailabilityPage || isOptionsPage ? (
          <CheckoutPhonePreview 
            title={formData.title}
            description={formData.description}
            price={formData.price}
            duration={formData.duration}
            imageUrl={imagePreviewUrl}
            user={{
              displayName,
              initials,
              avatarUrl,
              storeSlug: store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"
            }}
          />
        ) : (
          <CoachingCallPhonePreview 
            style={formData.style}
            title={formData.title}
            price={formData.price}
            duration={formData.duration}
            imageUrl={imagePreviewUrl}
            user={{
              displayName,
              initials,
              avatarUrl,
              storeSlug: store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function WizardLayout({ children }: WizardLayoutProps) {
  return (
    <CoachingPreviewProvider>
      <WizardLayoutInner>{children}</WizardLayoutInner>
    </CoachingPreviewProvider>
  );
} 