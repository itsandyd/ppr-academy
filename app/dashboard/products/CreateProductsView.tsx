'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Package, 
  Music, 
  BookOpen,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  Zap,
  FileText,
  PenTool,
  Music2,
  MoreVertical,
  Trash2,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CreateProductsViewProps {
  convexUser: any;
}

export function CreateProductsView({ convexUser }: CreateProductsViewProps) {
  const router = useRouter();
  
  // Mutations for product actions
  const updateProduct = useMutation(api.digitalProducts.updateProduct);
  const deleteProduct = useMutation(api.digitalProducts.deleteProduct);
  const updateCourse = useMutation(api.courses.updateCourse);
  const deleteCourse = useMutation(api.courses.deleteCourse);

  // Product action handlers
  const handleEditProduct = (productId: string) => {
    // Route to appropriate editor based on product type
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    if (product.productCategory === 'sample-pack' || product.productCategory === 'preset-pack' || product.productCategory === 'midi-pack') {
      router.push(`/dashboard/create/pack?type=${product.productCategory}&packId=${productId}`);
    } else if (product.productCategory === 'effect-chain' || product.productCategory === 'ableton-rack') {
      router.push(`/dashboard/create/chain?chainId=${productId}`);
    } else if (product.productCategory === 'pdf') {
      router.push(`/dashboard/create/pdf?pdfId=${productId}`);
    } else if (product.productCategory === 'blog-post') {
      router.push(`/dashboard/create/blog?postId=${productId}`);
    } else if (product.productCategory === 'beat-lease') {
      router.push(`/dashboard/create/beat-lease?beatId=${productId}`);
    } else if (product.productCategory === 'coaching') {
      router.push(`/dashboard/create/coaching?coachingId=${productId}`);
    } else {
      router.push(`/dashboard/create/digital?productId=${productId}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        // Check if it's a course or digital product
        const product = allProducts.find(p => p._id === productId);
        
        if (product?.type === 'course') {
          await deleteCourse({ id: productId as any });
        } else {
          await deleteProduct({ productId: productId as any });
        }
        
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
        console.error('Delete error:', error);
      }
    }
  };

  const handleTogglePublishProduct = async (productId: string, currentState: boolean) => {
    try {
      // Check if it's a course or digital product
      const product = allProducts.find(p => p._id === productId);
      
      if (product?.type === 'course') {
        await updateCourse({ 
          id: productId as any, 
          isPublished: !currentState 
        });
      } else {
        await updateProduct({ 
          id: productId as any, 
          isPublished: !currentState 
        });
      }
      
      toast.success(currentState ? 'Product unpublished' : 'Product published successfully');
    } catch (error) {
      toast.error('Failed to update product');
      console.error('Publish toggle error:', error);
    }
  };
  
  // Fetch user's stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
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

  // Combine and categorize
  const allProducts = [
    ...(userCourses?.map((c: any) => ({ ...c, type: 'course' })) || []),
    ...(digitalProducts?.map((p: any) => ({ ...p, type: 'digital' })) || [])
  ];

  const publishedProducts = allProducts.filter((p: any) => p.isPublished);
  const draftProducts = allProducts.filter((p: any) => !p.isPublished);
  
  const courses = allProducts.filter((p: any) => p.type === 'course');
  const packs = digitalProducts?.filter((p: any) => 
    p.productCategory === 'sample-pack' || 
    p.productCategory === 'preset-pack' || 
    p.productCategory === 'midi-pack'
  ) || [];
  // Effect chains (new + legacy ableton racks)
  const effectChains = digitalProducts?.filter((p: any) => 
    p.productCategory === 'effect-chain' ||
    p.productCategory === 'ableton-rack' ||  // Legacy
    p.productType === 'effectChain' ||
    p.productType === 'abletonRack'  // Legacy
  ) || [];
  
  // PDFs (new + legacy)
  const pdfs = digitalProducts?.filter((p: any) => 
    p.productCategory === 'pdf' ||
    p.productCategory === 'pdf-guide' ||  // Legacy
    p.productCategory === 'cheat-sheet' ||  // Legacy
    p.productCategory === 'template'  // Legacy
  ) || [];
  
  const blogPosts = digitalProducts?.filter((p: any) => 
    p.productCategory === 'blog-post'  // Only actual blog posts, not all urlMedia
  ) || [];
  
  const beats = digitalProducts?.filter((p: any) => 
    p.productCategory === 'beat-lease'
  ) || [];
  
  // Debug logging
  console.log('Products debug:', {
    totalProducts: digitalProducts?.length,
    beats: beats.length,
    beatProducts: beats.map(b => ({ title: b.title, category: b.productCategory }))
  });
  
  // Count by DAW for filtering
  const dawCounts = effectChains.reduce((acc: any, chain: any) => {
    const daw = chain.dawType || 'ableton'; // Default to ableton for legacy
    acc[daw] = (acc[daw] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground">
            Manage your products and track performance
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Link href="/dashboard/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{allProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{publishedProducts.length}</p>
              </div>
              <Eye className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{draftProducts.length}</p>
              </div>
              <Edit className="w-8 h-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product tabs */}
      <TooltipProvider>
        <Tabs defaultValue="all">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="flex-shrink-0">
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="published" className="flex-shrink-0">
              <span>Published</span>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex-shrink-0">
              <span>Drafts</span>
            </TabsTrigger>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="courses" className="flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">Courses</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-zinc-900 text-foreground">
                <p>Courses ({courses.length})</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="packs" className="flex-shrink-0">
                  <Music className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">Packs</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-zinc-900 text-foreground">
                <p>Sample/Preset/MIDI Packs ({packs.length})</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="chains" className="flex-shrink-0">
                  <Zap className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">Chains</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-zinc-900 text-foreground">
                <p>Effect Chains ({effectChains.length})</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="pdfs" className="flex-shrink-0">
                  <FileText className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">PDFs</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-zinc-900 text-foreground">
                <p>PDF Guides & Cheat Sheets ({pdfs.length})</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="blogs" className="flex-shrink-0">
                  <PenTool className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">Blogs</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-zinc-900 text-foreground">
                <p>Blog Posts ({blogPosts.length})</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="beats" className="flex-shrink-0">
                  <Music2 className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">Beats</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-zinc-900 text-foreground">
                <p>Beat Leases ({beats.length})</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {allProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProducts.map((product: any) => (
                <ProductCard 
                  key={product._id} 
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onTogglePublish={handleTogglePublishProduct}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4 mt-6">
          {publishedProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Published Products</h3>
              <p className="text-muted-foreground">
                Publish a product to make it available in your store
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedProducts.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4 mt-6">
          {draftProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <Edit className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Drafts</h3>
              <p className="text-muted-foreground">
                Draft products will appear here
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftProducts.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-6">
          {courses.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
              <Button asChild>
                <Link href="/dashboard/create/course?category=course">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packs" className="space-y-4 mt-6">
          {packs.length === 0 ? (
            <Card className="p-12 text-center">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Packs Yet</h3>
              <Button asChild>
                <Link href="/dashboard/create/pack?type=sample-pack">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Pack
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packs.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chains" className="space-y-4 mt-6">
          {effectChains.length === 0 ? (
            <Card className="p-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Effect Chains Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload effect chains for Ableton, FL Studio, Logic, and more
              </p>
              <Button asChild>
                <Link href="/dashboard/create/chain?category=effect-chain">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Effect Chain
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* DAW Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="cursor-pointer">
                  All DAWs ({effectChains.length})
                </Badge>
                {Object.entries(dawCounts).map(([daw, count]) => (
                  <Badge key={daw} variant="secondary" className="cursor-pointer">
                    {daw === 'ableton' && '🔊 Ableton'}
                    {daw === 'fl-studio' && '🎚️ FL Studio'}
                    {daw === 'logic' && '🎹 Logic'}
                    {daw === 'bitwig' && '⚡ Bitwig'}
                    {daw === 'studio-one' && '🎼 Studio One'}
                    {daw === 'multi-daw' && '🔗 Multi-DAW'}
                    {' '}({count})
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {effectChains.map((product: any) => (
                  <EffectChainCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pdfs" className="space-y-4 mt-6">
          {pdfs.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No PDFs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload PDF guides, cheat sheets, ebooks, and educational content
              </p>
              <Button asChild>
                <Link href="/dashboard/create/pdf">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload PDF
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfs.map((product: any) => (
                <PDFCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blogs" className="space-y-4 mt-6">
          {blogPosts.length === 0 ? (
            <Card className="p-12 text-center">
              <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Blog Posts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Write articles and blog content to share with your audience
              </p>
              <Button asChild>
                <Link href="/dashboard/create/blog">
                  <Plus className="w-4 h-4 mr-2" />
                  Write Blog Post
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((product: any) => (
                <BlogPostCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="beats" className="space-y-4 mt-6">
          {beats.length === 0 ? (
            <Card className="p-12 text-center">
              <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Beat Leases Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload beats with multiple licensing options (free, basic, premium, exclusive)
              </p>
              <Button asChild>
                <Link href="/dashboard/create/beat-lease">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Beat Lease
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beats.map((product: any) => (
                <BeatCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
}

function BeatCard({ product }: { product: any }) {
  return (
    <Card className="group hover:shadow-lg transition-all overflow-hidden">
      {product.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
          <Music2 className="w-16 h-16 text-purple-400 dark:text-purple-600" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {product.title}
          </h3>
          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
            {product.isPublished ? 'Live' : 'Draft'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            Beat Lease
          </Badge>
          {product.bpm && (
            <Badge variant="secondary" className="text-xs">
              {product.bpm} BPM
            </Badge>
          )}
          {product.musicalKey && (
            <Badge variant="secondary" className="text-xs">
              {product.musicalKey}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">From ${product.price || 0}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BlogPostCard({ product }: { product: any }) {
  return (
    <Card className="group hover:shadow-lg transition-all overflow-hidden">
      {product.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
          <PenTool className="w-16 h-16 text-indigo-400 dark:text-indigo-600" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {product.title}
          </h3>
          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
            {product.isPublished ? 'Live' : 'Draft'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            Blog Post
          </Badge>
          {product.readTimeMinutes && (
            <Badge variant="secondary" className="text-xs">
              {product.readTimeMinutes} min read
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description || product.excerpt || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${product.price || 0}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PDFCard({ product }: { product: any }) {
  const pdfTypeLabel = product.pdfType === 'cheat-sheet' ? 'Cheat Sheet' :
                       product.pdfType === 'guide' ? 'Guide' :
                       product.pdfType === 'ebook' ? 'Ebook' :
                       product.pdfType === 'workbook' ? 'Workbook' :
                       product.pdfType === 'template' ? 'Template' :
                       'PDF';

  return (
    <Card className="group hover:shadow-lg transition-all overflow-hidden">
      {product.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
          <FileText className="w-16 h-16 text-blue-400 dark:text-blue-600" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {product.title}
          </h3>
          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
            {product.isPublished ? 'Live' : 'Draft'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {pdfTypeLabel}
          </Badge>
          {product.pageCount && (
            <Badge variant="secondary" className="text-xs">
              {product.pageCount} pages
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${product.price || 0}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EffectChainCard({ product }: { product: any }) {
  const dawLabel = product.dawType === 'ableton' ? 'Ableton Live' :
                   product.dawType === 'fl-studio' ? 'FL Studio' :
                   product.dawType === 'logic' ? 'Logic Pro' :
                   product.dawType === 'bitwig' ? 'Bitwig Studio' :
                   product.dawType === 'studio-one' ? 'Studio One' :
                   product.dawType || 'Ableton Live'; // Legacy default

  return (
    <Card className="group hover:shadow-lg transition-all overflow-hidden">
      {product.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
          <Zap className="w-16 h-16 text-purple-400 dark:text-purple-600" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {product.title}
          </h3>
          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
            {product.isPublished ? 'Live' : 'Draft'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {dawLabel}
          </Badge>
          {product.dawVersion && (
            <Badge variant="secondary" className="text-xs">
              v{product.dawVersion}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${product.price || 0}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductCard({ product, onEdit, onDelete, onTogglePublish }: { 
  product: any;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onTogglePublish?: (productId: string, currentState: boolean) => void;
}) {
  const Icon = product.type === 'course' ? BookOpen : 
               product.productCategory === 'sample-pack' ? Music :
               product.productCategory === 'preset-pack' ? Music :
               product.productCategory === 'midi-pack' ? Music :
               product.productCategory === 'effect-chain' ? Zap :
               product.productCategory === 'ableton-rack' ? Zap :  // Legacy
               product.productType === 'effectChain' ? Zap :
               product.productType === 'abletonRack' ? Zap :  // Legacy
               product.productCategory === 'pdf' ? FileText :
               product.productCategory === 'pdf-guide' ? FileText :  // Legacy
               product.productCategory === 'cheat-sheet' ? FileText :  // Legacy
               product.productCategory === 'blog-post' ? PenTool :
               product.productCategory === 'beat-lease' ? Music2 :
               Package;

  return (
    <Card className="group hover:shadow-lg transition-all overflow-hidden relative">
      {/* Image or placeholder */}
      {product.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
          <Icon className="w-16 h-16 text-purple-400 dark:text-purple-600" />
        </div>
      )}

      {/* Action Dropdown */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 text-foreground">
            <DropdownMenuItem onClick={() => onEdit?.(product._id)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePublish?.(product._id, product.isPublished)}>
              {product.isPublished ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.(product._id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {product.title}
          </h3>
          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
            {product.isPublished ? 'Live' : 'Draft'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${product.price || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first product to start selling
      </p>
      <Button asChild>
        <Link href="/dashboard/create">
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Link>
      </Button>
    </Card>
  );
}

