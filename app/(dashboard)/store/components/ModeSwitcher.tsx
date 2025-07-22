"use client";

import { Button } from "@/components/ui/button";
import { Home, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

interface Mode {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModeSwitcherProps {
  storeId?: string;
}

export function ModeSwitcher({ storeId }: ModeSwitcherProps) {
  const pathname = usePathname();
  
  const modes: Mode[] = [
    { 
      label: "Store", 
      href: "/store", 
      icon: Home 
    },
    { 
      label: "Landing Pages", 
      href: storeId ? `/store/landing?storeId=${storeId}` : "/store/landing", 
      icon: ExternalLink 
    },
    { 
      label: "Edit Design", 
      href: storeId ? `/store/design?storeId=${storeId}` : "/store/design", 
      icon: Pencil 
    },
  ];

  return (
    <div className="flex gap-4 items-center sticky top-0 bg-background py-4 border-b">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = pathname === mode.href || pathname.startsWith(mode.href);
        
        return (
          <Button
            key={mode.label}
            variant="outline"
            size="sm"
            asChild
            className={clsx(
              "flex items-center gap-2 transition-colors",
              isActive && "bg-white border-[#6356FF] text-[#6356FF] font-semibold"
            )}
          >
            <Link href={mode.href}>
              <Icon className="w-4 h-4" />
              {mode.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
} 