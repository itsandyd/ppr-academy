'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Music,
  Package,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  Play,
  BookOpen,
  Headphones,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export function CreateModeContent() {
  const { user } = useUser();
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Get user's first store
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : 'skip'
  );
  const storeId = stores?.[0]?._id;

  // Fetch created courses (using clerkId)
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch digital products (using storeId)
  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : 'skip'
  );

  const isLoading = !user || convexUser === undefined || stores === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  const allProducts = [...(userCourses || []), ...(digitalProducts || [])];
  const publishedCount = allProducts.filter((p: any) => p.isPublished).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Creator Studio</h1>
          <p className="text-muted-foreground">
            Manage your products and grow your music business
          </p>
        </div>
        {storeId && (
          <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Link href={`/store/${storeId}/products`}>
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Products</p>
                <p className="text-2xl font-bold">{allProducts.length}</p>
                <p className="text-xs text-white/70">Published: {publishedCount}</p>
              </div>
              <Package className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Revenue</p>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-xs text-white/70">All time</p>
              </div>
              <DollarSign className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Downloads</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-white/70">All time</p>
              </div>
              <Download className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Growth</p>
                <p className="text-2xl font-bold">+0%</p>
                <p className="text-xs text-white/70">This month</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Create Actions */}
      {storeId && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Create</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Sample Pack',
                icon: Music,
                color: 'from-purple-500 to-pink-500',
                href: `/store/${storeId}/products/pack/create?type=sample-pack`,
              },
              {
                label: 'Preset Pack',
                icon: Package,
                color: 'from-blue-500 to-cyan-500',
                href: `/store/${storeId}/products/pack/create?type=preset-pack`,
              },
              {
                label: 'Course',
                icon: BookOpen,
                color: 'from-green-500 to-emerald-500',
                href: `/store/${storeId}/course/create`,
              },
              {
                label: 'Coaching',
                icon: Headphones,
                color: 'from-orange-500 to-red-500',
                href: `/store/${storeId}/products/coaching-call/create`,
              },
            ].map((action) => (
              <Card key={action.label} className="cursor-pointer hover:shadow-lg transition-all">
                <Link href={action.href}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium">{action.label}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Products</h2>
          {storeId && allProducts.length > 0 && (
            <Button variant="outline" asChild>
              <Link href={`/store/${storeId}/products`}>View All</Link>
            </Button>
          )}
        </div>
        
        {allProducts.length > 0 ? (
          <div className="space-y-4">
            {allProducts.slice(0, 5).map((product: any) => (
              <Card key={product._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      {product.type === 'course' ? (
                        <Play className="w-6 h-6 text-white" />
                      ) : (
                        <Music className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">${product.price || 0}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first product to start earning from your music
            </p>
            {storeId && (
              <Button asChild>
                <Link href={`/store/${storeId}/products`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </Link>
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
