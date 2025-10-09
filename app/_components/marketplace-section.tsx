"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MarketplaceGrid } from "./marketplace-grid";

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  price: number;
  thumbnail?: string;
  imageUrl?: string;
  contentType: "course" | "product" | "sample-pack";
  creatorName?: string;
  creatorAvatar?: string;
  enrollmentCount?: number;
  downloadCount?: number;
  sampleCount?: number;
  rating?: number;
  slug?: string;
}

interface MarketplaceSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  content: ContentItem[];
  viewAllLink?: string;
  emptyMessage?: string;
  limit?: number;
  gradient?: string;
}

export const MarketplaceSection: FC<MarketplaceSectionProps> = ({
  title,
  subtitle,
  icon,
  content,
  viewAllLink,
  emptyMessage,
  limit,
  gradient = "from-purple-500 to-blue-500",
}) => {
  // Limit content if specified
  const displayContent = limit ? content.slice(0, limit) : content;
  const hasMore = limit && content.length > limit;

  if (content.length === 0) {
    return null; // Don't show empty sections
  }

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        {/* Section Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            {icon && (
              <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {viewAllLink && hasMore && (
            <Link href={viewAllLink}>
              <Button variant="outline" className="group">
                View All
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Content Grid */}
        <MarketplaceGrid content={displayContent} emptyMessage={emptyMessage} />

        {/* View All Button (Mobile) */}
        {viewAllLink && hasMore && (
          <motion.div
            className="mt-8 text-center md:hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href={viewAllLink}>
              <Button variant="outline" className="group">
                View All {content.length} {title}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

