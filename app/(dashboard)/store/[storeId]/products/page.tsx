"use client";

import { options } from "../components/options";
import { OptionCard } from "../components/OptionCard";
import { useParams, useRouter } from "next/navigation";
import { useValidStoreId } from "@/hooks/useStoreId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ChooseProductTypePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = useValidStoreId();

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Store Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The store you're trying to access could not be found or is invalid.
            </p>
            <Button onClick={() => router.push('/store')} variant="outline">
              Go Back to Store Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (!storeId) {
      console.error('No storeId provided');
      return;
    }

    // Map option IDs to their respective creation pages
    const routeMap: Record<string, string> = {
      'emails': `/store/${storeId}/products/lead-magnet`,
      'digital': `/store/${storeId}/products/digital-download/create`,
      'coaching': `/store/${storeId}/products/coaching-call/create`,
      'ecourse': `/store/${storeId}/course/create`, // eCourse creation page
      // TODO: Add routes for other product types when pages are created
      'custom': '#', // Custom Product
      'membership': '#', // Recurring Membership
      'webinar': '#', // Webinar
      'community': '#', // Community
      'url': '#', // URL / Media
      'affiliate': '#', // Stan Affiliate Link
    };

    const route = routeMap[optionId];
    if (route && route !== '#') {
      router.push(route);
    } else {
      console.log(`Route not implemented yet for: ${optionId}`);
      // TODO: Show coming soon message or create placeholder pages
    }
  };

  return (
    <div className="max-w-[1140px] mx-auto px-8 pt-12 pb-24">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold leading-tight text-foreground">
          Choose Product Type
        </h2>
        <p className="mt-1 text-base font-normal text-muted-foreground">
          Pick the format that best fits what you're selling — guides, courses, coaching, or more!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {options.map((option) => (
          <OptionCard 
            key={option.id} 
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
            colorClass={option.colorClass}
            iconColorClass={option.iconColorClass}
            onClick={() => handleOptionClick(option.id)}
          />
        ))}
      </div>
    </div>
  );
} 