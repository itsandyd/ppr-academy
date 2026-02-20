"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smartphone, Monitor, Store, Package, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StorefrontPreviewProps {
  product: {
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    productType?: string;
    productCategory?: string;
    isPublished?: boolean;
  };
  store?: {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
  };
  user?: {
    name?: string;
    imageUrl?: string;
  };
  otherProducts?: Array<{
    _id: string;
    title: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isPublished?: boolean;
  }>;
  defaultDevice?: "desktop" | "mobile";
}

function ProductCard({
  product,
  isCurrentProduct = false,
}: {
  product: { title?: string; description?: string; price?: number; imageUrl?: string };
  isCurrentProduct?: boolean;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isCurrentProduct && "ring-2 ring-purple-500 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="relative">
        <div className="flex aspect-video items-center justify-center overflow-hidden bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title || "Product"}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {isCurrentProduct && (
          <Badge className="absolute right-2 top-2 bg-purple-500 px-1.5 py-0.5 text-[10px] text-white hover:bg-purple-600">
            Preview
          </Badge>
        )}
      </div>

      <CardContent className="p-3">
        <h4 className="truncate text-sm font-medium">{product.title || "Untitled Product"}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {product.description || "No description"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">
            {product.price !== undefined ? `$${product.price}` : "Free"}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function DesktopFrame({ children, slug }: { children: React.ReactNode; slug?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-white shadow-lg dark:bg-black">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-xs truncate rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            pauseplayrepeat.com/{slug || "your-store"}
          </div>
        </div>

        <div className="w-14" />
      </div>

      <div className="max-h-[400px] min-h-[300px] overflow-y-auto p-4">{children}</div>
    </div>
  );
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[200px]">
      <div className="overflow-hidden rounded-[24px] border-4 border-gray-800 bg-white shadow-xl dark:border-gray-600 dark:bg-black">
        <div className="flex h-6 items-center justify-center bg-gray-800 dark:bg-gray-600">
          <div className="h-3 w-16 rounded-full bg-black dark:bg-gray-800" />
        </div>

        <div className="aspect-[9/16] overflow-y-auto p-2">{children}</div>

        <div className="flex h-4 items-center justify-center bg-gray-800 dark:bg-gray-600">
          <div className="h-1 w-12 rounded-full bg-gray-500" />
        </div>
      </div>
    </div>
  );
}

function StorefrontContent({
  product,
  store,
  user,
  otherProducts = [],
  compact = false,
}: StorefrontPreviewProps & { compact?: boolean }) {
  const displayName = user?.name || store?.name || "Creator";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      <div
        className={cn(
          "flex items-center gap-3 border-b border-border pb-3",
          compact && "gap-2 pb-2"
        )}
      >
        <Avatar className={cn("h-10 w-10", compact && "h-8 w-8")}>
          <AvatarImage src={user?.imageUrl || store?.logoUrl} />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className={cn("truncate font-semibold", compact ? "text-xs" : "text-sm")}>
            {store?.name || "Your Store"}
          </h3>
          {!compact && store?.description && (
            <p className="truncate text-xs text-muted-foreground">{store.description}</p>
          )}
        </div>
      </div>

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-2")}>
        <ProductCard product={product} isCurrentProduct={true} />

        {otherProducts
          .filter((p) => p.isPublished !== false)
          .slice(0, compact ? 1 : 3)
          .map((p) => (
            <ProductCard key={p._id} product={p} isCurrentProduct={false} />
          ))}

        {otherProducts.length === 0 && !compact && (
          <Card className="flex aspect-video items-center justify-center border-dashed">
            <div className="p-4 text-center">
              <Store className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">More products</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export function StorefrontPreview({
  product,
  store,
  user,
  otherProducts = [],
  defaultDevice = "mobile",
}: StorefrontPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">(defaultDevice);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-all",
              device === "mobile"
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:bg-background/50"
            )}
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-all",
              device === "desktop"
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:bg-background/50"
            )}
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>
      </div>

      <div className="transition-all duration-300">
        {device === "desktop" ? (
          <DesktopFrame slug={store?.slug}>
            <StorefrontContent
              product={product}
              store={store}
              user={user}
              otherProducts={otherProducts}
              compact={false}
            />
          </DesktopFrame>
        ) : (
          <MobileFrame>
            <StorefrontContent
              product={product}
              store={store}
              user={user}
              otherProducts={otherProducts}
              compact={true}
            />
          </MobileFrame>
        )}
      </div>

      <div className="text-center">
        <Badge variant="secondary" className="text-xs">
          Updates in real-time
        </Badge>
      </div>
    </div>
  );
}

export default StorefrontPreview;
