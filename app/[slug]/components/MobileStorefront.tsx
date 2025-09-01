"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkInBioLayout } from "./LinkInBioLayout";

interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  style?: string;
  isPublished?: boolean;
  imageUrl?: string;
  buttonLabel?: string;
  downloadUrl?: string;
  _creationTime: number;
}

interface MobileStorefrontProps {
  store: {
    _id: string;
    userId: string;
    name: string;
    slug: string;
  };
  user: {
    name?: string;
    imageUrl?: string;
  } | null;
  products: Product[];
  displayName: string;
  initials: string;
  avatarUrl: string;
  leadMagnetData?: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    downloadUrl?: string;
  } | null;
}

export function MobileStorefront({ store, user, products, displayName, initials, avatarUrl, leadMagnetData }: MobileStorefrontProps) {
  return (
    <div className="lg:hidden min-h-screen bg-background flex flex-col">
      {/* Mobile App Header (matches PhonePreview) */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
            <AvatarFallback className="text-sm font-semibold bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm truncate block">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate block">@{store.slug}</span>
          </div>
        </div>
      </div>
      
      {/* Mobile App Content (matches PhonePreview) */}
      <div className="flex-1 p-4 overflow-y-auto bg-background">
        <LinkInBioLayout products={products || []} leadMagnetData={leadMagnetData} storeData={{ store, user }} />
      </div>
    </div>
  );
}
