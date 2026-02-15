'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Music,
  Download,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface LearnProductsViewProps {
  convexUser: any;
}

export function LearnProductsView({ convexUser }: LearnProductsViewProps) {
  // Fetch user's purchased products
  const userPurchases = useQuery(
    api.library.getUserPurchases,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Separate packs from other products
  const purchasedPacks = userPurchases?.filter((purchase: any) => 
    purchase.product?.productCategory === "sample-pack" ||
    purchase.product?.productCategory === "midi-pack" ||
    purchase.product?.productCategory === "preset-pack"
  ) || [];

  const otherProducts = userPurchases?.filter((purchase: any) => 
    purchase.product?.productCategory !== "sample-pack" &&
    purchase.product?.productCategory !== "midi-pack" &&
    purchase.product?.productCategory !== "preset-pack"
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground">
            Products you've purchased and downloaded
          </p>
        </div>
        <Button onClick={() => window.location.href = '/marketplace'}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Tabs for organization */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Products ({userPurchases?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="packs">
            <Music className="w-4 h-4 mr-2" />
            Packs ({purchasedPacks.length})
          </TabsTrigger>
          <TabsTrigger value="other">
            Other ({otherProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {!userPurchases || userPurchases.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Purchase products from the marketplace to build your library."
              action={{ label: "Browse Marketplace", href: "/marketplace" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPurchases.map((purchase: any) => (
                <ProductCard key={purchase._id} purchase={purchase} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packs" className="space-y-6 mt-6">
          {purchasedPacks.length === 0 ? (
            <EmptyState
              icon={Music}
              title="No packs yet"
              description="Purchase sample packs, preset packs, or MIDI packs from the marketplace."
              action={{ label: "Browse Packs", href: "/marketplace/samples" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {purchasedPacks.map((purchase: any) => (
                <PackCard key={purchase._id} purchase={purchase} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-6 mt-6">
          {otherProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No other products"
              description="Other purchased products like coaching sessions and templates will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProducts.map((purchase: any) => (
                <ProductCard key={purchase._id} purchase={purchase} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductCard({ purchase }: { purchase: any }) {
  return (
    <Card className="hover:shadow-lg transition-all overflow-hidden">
      {/* Image or placeholder */}
      {purchase.product?.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={purchase.product.imageUrl} 
            alt={purchase.product?.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
          <Package className="w-16 h-16 text-purple-400 dark:text-purple-600" />
        </div>
      )}
      
      <CardContent className="p-6">
        <h4 className="font-semibold text-lg mb-2 line-clamp-2">{purchase.product?.title}</h4>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {purchase.product?.description}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {purchase.product?.productCategory?.replace('-', ' ')}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(purchase._creationTime).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PackCard({ purchase }: { purchase: any }) {
  const fileCount = purchase.product?.packFiles 
    ? JSON.parse(purchase.product.packFiles).length 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-all overflow-hidden">
      {/* Image or placeholder */}
      {purchase.product?.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={purchase.product.imageUrl} 
            alt={purchase.product?.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
          <Music className="w-16 h-16 text-purple-400 dark:text-purple-600" />
        </div>
      )}
      
      <CardContent className="p-6">
        <h4 className="font-semibold text-lg mb-2 line-clamp-2">{purchase.product?.title}</h4>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {purchase.product?.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {fileCount} files
          </span>
          <span>
            {new Date(purchase._creationTime).toLocaleDateString()}
          </span>
        </div>
        <Button 
          size="sm" 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
        >
          <Download className="w-4 h-4 mr-2" />
          View {fileCount} Samples
        </Button>
      </CardContent>
    </Card>
  );
}

