"use client";

import { options } from "../components/options";
import { OptionCard } from "../components/OptionCard";
import { useParams, useRouter } from "next/navigation";

export default function ChooseProductTypePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const handleOptionClick = (optionId: string) => {
    if (!storeId) {
      console.error('No storeId provided');
      return;
    }

    // Map option IDs to their respective creation pages
    const routeMap: Record<string, string> = {
      'emails': `/store/${storeId}/products/lead-magnet`,
      'digital': `/store/${storeId}/page/digital-download/create`,
      'coaching': `/store/${storeId}/page/coaching-call/create`,
      // TODO: Add routes for other product types when pages are created
      'custom': '#', // Custom Product
      'ecourse': '#', // eCourse  
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
        <h2 className="text-[28px] font-bold leading-tight text-[#0F0F1C]">
          Choose Product Type
        </h2>
        <p className="mt-1 text-base font-normal text-[#6B6E85]">
          Pick the format that best fits what you're selling — guides, courses, coaching, or more!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {options.map((option) => (
          <OptionCard 
            key={option.id} 
            {...option} 
            onClick={() => handleOptionClick(option.id)}
          />
        ))}
      </div>
    </div>
  );
} 