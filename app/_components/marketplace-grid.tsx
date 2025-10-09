"use client";

import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Package, Users, Download, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

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

interface MarketplaceGridProps {
  content: ContentItem[];
  emptyMessage?: string;
}

export const MarketplaceGrid: FC<MarketplaceGridProps> = ({
  content,
  emptyMessage = "No content found. Try adjusting your search or filters.",
}) => {
  const router = useRouter();

  if (content.length === 0) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">No content found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{emptyMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {content.map((item, index) => (
        <ContentCard key={item._id} item={item} index={index} />
      ))}
    </div>
  );
};

const ContentCard: FC<{ item: ContentItem; index: number }> = ({ item, index }) => {
  const router = useRouter();
  
  // Determine icon and color based on content type
  const IconComponent = item.contentType === "course" 
    ? BookOpen 
    : item.contentType === "sample-pack"
    ? Package
    : Package;
    
  const badgeColor = item.contentType === "course" 
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
    : item.contentType === "sample-pack"
    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";

  const badgeLabel = item.contentType === "course"
    ? "Course"
    : item.contentType === "sample-pack"
    ? "Sample Pack"
    : "Product";

  const handleClick = () => {
    const slug = item.slug || item.title.toLowerCase().replace(/\s+/g, "-");
    const path = item.contentType === "course" 
      ? `/courses/${slug}` 
      : item.contentType === "sample-pack"
      ? `/sample-packs/${slug}`
      : `/products/${slug}`;
    router.push(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Card
        className="group overflow-hidden border-border bg-card hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
          {(item.thumbnail || item.imageUrl) ? (
            <Image
              src={item.thumbnail || item.imageUrl || ""}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconComponent className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Type Badge */}
          <Badge className={`absolute top-3 left-3 ${badgeColor} font-medium shadow-lg`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {badgeLabel}
          </Badge>

          {/* Price Badge */}
          <Badge className="absolute top-3 right-3 bg-white dark:bg-black text-foreground font-bold shadow-lg">
            {item.price === 0 ? "FREE" : `$${item.price.toFixed(2)}`}
          </Badge>

          {/* Rating (if available) */}
          {item.rating && (
            <Badge className="absolute bottom-3 right-3 bg-yellow-500/90 text-white font-semibold">
              <Star className="w-3 h-3 mr-1 fill-white" />
              {item.rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-5 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Footer: Creator + Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* Creator */}
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={item.creatorAvatar || "/placeholder-avatar.jpg"} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  {item.creatorName?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                {item.creatorName || "Creator"}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {item.contentType === "course" && item.enrollmentCount !== undefined && (
                <>
                  <Users className="w-4 h-4" />
                  <span>{item.enrollmentCount}</span>
                </>
              )}
              {item.contentType === "product" && item.downloadCount !== undefined && (
                <>
                  <Download className="w-4 h-4" />
                  <span>{item.downloadCount}</span>
                </>
              )}
              {item.contentType === "sample-pack" && (
                <>
                  {item.sampleCount !== undefined && (
                    <>
                      <Package className="w-4 h-4" />
                      <span>{item.sampleCount} samples</span>
                    </>
                  )}
                  {item.downloadCount !== undefined && item.sampleCount === undefined && (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{item.downloadCount}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

