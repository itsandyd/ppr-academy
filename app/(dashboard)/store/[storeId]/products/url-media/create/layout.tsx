"use client";

import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { UrlMediaPhonePreview } from "./UrlMediaPhonePreview";

// Prevent static generation for this layout
export const dynamic = 'force-dynamic';

interface UrlMediaLayoutProps {
  children: React.ReactNode;
}

export default function UrlMediaLayout({ children }: UrlMediaLayoutProps) {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;
  const step = searchParams.get("step") || "url";

  // Get form data from URL params for preview
  const previewData = {
    url: searchParams.get("url") || "",
    title: searchParams.get("title") || "Link Title",
    description: searchParams.get("description") || "",
    displayStyle: searchParams.get("displayStyle") || "card",
  };

  // Get store data
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 lg:flex lg:gap-20">
        <div className="flex-1 space-y-10">{children}</div>
        <div className="w-[356px] h-[678px] bg-gray-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 lg:flex lg:gap-20">
      <div className="flex-1 space-y-10">{children}</div>
      <div className="sticky top-32">
        <UrlMediaPhonePreview 
          user={user}
          store={store || undefined}
          url={previewData.url}
          title={previewData.title}
          description={previewData.description}
          displayStyle={previewData.displayStyle as "embed" | "card" | "button"}
        />
      </div>
    </div>
  );
}
