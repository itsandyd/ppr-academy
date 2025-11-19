'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PRODUCT_CATEGORIES, getFlowForCategory, ProductCategory } from './types';
import { motion } from 'framer-motion';
import { useValidStoreId } from '@/hooks/useStoreId';

export default function ProductTypeSelectorPage() {
  const router = useRouter();
  const storeId = useValidStoreId();

  const handleSelectCategory = (categoryId: ProductCategory) => {
    // Special routing for different product types
    
    // Packs (sample, preset, MIDI) go to pack creator
    if (categoryId === 'sample-pack' || categoryId === 'preset-pack' || categoryId === 'midi-pack') {
      router.push(`/dashboard/create/pack?type=${categoryId}`);
      return;
    }
    
    // Courses go to course creator
    if (categoryId === 'course') {
      router.push(`/dashboard/create/course?category=${categoryId}`);
      return;
    }
    
    // Coaching sessions (live calls)
    if (categoryId === 'coaching' || categoryId === 'workshop') {
      router.push(`/dashboard/create/coaching?category=${categoryId}`);
      return;
    }
    
    // Services (async work) - coming soon
    if (categoryId === 'mixing-service' || categoryId === 'mastering-service') {
      // TODO: Create service creator for async work
      router.push(`/dashboard/create`);
      return;
    }
    
    // Playlist curation (coming soon)
    if (categoryId === 'playlist-curation') {
      // TODO: Build playlist curation creator
      router.push(`/dashboard/create`);
      return;
    }
    
    // Bundles go to bundle creator
    if (categoryId === 'bundle') {
      router.push(`/dashboard/create/bundle?category=${categoryId}`);
      return;
    }
    
    // Effect chains go to chain creator
    if (categoryId === 'effect-chain') {
      router.push(`/dashboard/create/chain?category=${categoryId}`);
      return;
    }
    
    // PDFs go to PDF creator
    if (categoryId === 'pdf') {
      router.push(`/dashboard/create/pdf?type=guide`);
      return;
    }
    
    // Blog posts go to blog creator
    if (categoryId === 'blog-post') {
      router.push(`/dashboard/create/blog`);
      return;
    }
    
    // Beat leases go to beat lease creator
    if (categoryId === 'beat-lease') {
      router.push(`/dashboard/create/beat-lease`);
      return;
    }
    
    // Everything else goes to digital creator
    const flow = getFlowForCategory(categoryId);
    router.push(`/dashboard/create/${flow}?category=${categoryId}`);
  };

  // Group products by category for better organization
  const groupedProducts = PRODUCT_CATEGORIES.reduce((acc, product) => {
    const cat = product.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, typeof PRODUCT_CATEGORIES>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20 rounded-3xl p-12 mb-12 border border-purple-200 dark:border-purple-800"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-black/50 px-4 py-2 rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Unified Product Creation
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              What would you like to create?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Select a product type below. Each has a streamlined creation flow optimized for your workflow.
            </p>
          </div>
        </motion.div>

        {/* Product Categories */}
        <div className="space-y-10">
          {Object.entries(groupedProducts).map(([categoryName, products], categoryIndex) => (
            <motion.div
              key={categoryName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{categoryName}</h2>
                <p className="text-muted-foreground">
                  {categoryName === 'Music Production' && 'Create and sell beats, samples, presets, and more'}
                  {categoryName === 'Education' && 'Share your knowledge through courses and workshops'}
                  {categoryName === 'Services' && 'Offer coaching, mixing, mastering, and curation services'}
                  {categoryName === 'Digital Content' && 'Share guides, templates, and content'}
                  {categoryName === 'Community' && 'Build and monetize your community'}
                  {categoryName === 'Support' && 'Let fans support your work'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                  >
                    <Card 
                      className="group cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-border h-full"
                      onClick={() => handleSelectCategory(product.id as ProductCategory)}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center h-full">
                        <div className="text-5xl mb-4">{product.icon}</div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-600 transition-colors">
                          {product.label}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-1">
                          {product.description}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {product.flow === 'digital' && '3-step wizard'}
                          {product.flow === 'course' && '4-step wizard'}
                          {product.flow === 'service' && '4-step wizard'}
                          {product.flow === 'bundle' && '3-step wizard'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-8">
              <h3 className="font-semibold mb-2">Not sure which to choose?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Don't worry! You can always change the product type later. Each wizard guides you through the process step-by-step.
              </p>
              <Button variant="outline" onClick={() => router.push('/dashboard?mode=create')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

