/**
 * Optimized React Query configuration for the marketplace
 * Includes intelligent caching strategies and background refetching
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default query options optimized for marketplace data
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time - how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes for most data
    
    // Cache time - how long data stays in cache when unused
    cacheTime: 10 * 60 * 1000, // 10 minutes
    
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Background refetch options
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    
    // Network mode
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('network') && failureCount < 1) {
        return true;
      }
      return false;
    },
    
    // Network mode for mutations
    networkMode: 'online',
  },
};

// Create the query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Custom cache configurations for different data types
export const cacheConfig = {
  // User data - rarely changes, long cache
  user: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Product data - moderate changes
  products: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  },
  
  // Creator store data - rarely changes
  creatorStore: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Analytics data - changes frequently
  analytics: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Search results - short cache due to dynamic nature
  search: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
  },
  
  // Reviews - moderate frequency updates
  reviews: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 20 * 60 * 1000, // 20 minutes
  },
  
  // Static/reference data - very long cache
  categories: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Prefetch strategies for common user flows
export const prefetchStrategies = {
  // Prefetch user's products when they visit dashboard
  creatorDashboard: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['products', 'my-products'],
      staleTime: cacheConfig.products.staleTime,
    });
  },
  
  // Prefetch featured products for homepage
  homepage: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['products', 'featured'],
      staleTime: cacheConfig.products.staleTime,
    });
  },
  
  // Prefetch related products when viewing a product
  productPage: async (productId: string, creatorId: string) => {
    // Prefetch creator's other products
    queryClient.prefetchQuery({
      queryKey: ['products', 'by-creator', creatorId],
      staleTime: cacheConfig.products.staleTime,
    });
    
    // Prefetch product reviews
    queryClient.prefetchQuery({
      queryKey: ['reviews', productId],
      staleTime: cacheConfig.reviews.staleTime,
    });
  },
};

// Cache invalidation patterns
export const cacheInvalidation = {
  // Invalidate all product-related caches when a product is updated
  productUpdated: (productId: string, creatorId: string) => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['products', productId] });
    queryClient.invalidateQueries({ queryKey: ['products', 'by-creator', creatorId] });
    queryClient.invalidateQueries({ queryKey: ['analytics', creatorId] });
  },
  
  // Invalidate user-related caches when user data changes
  userUpdated: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
    queryClient.invalidateQueries({ queryKey: ['creator-store', userId] });
  },
  
  // Invalidate review caches when a review is added/updated
  reviewUpdated: (productId: string) => {
    queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    queryClient.invalidateQueries({ queryKey: ['products', productId] });
  },
  
  // Invalidate purchase-related caches
  purchaseCompleted: (userId: string, productId: string, creatorId: string) => {
    queryClient.invalidateQueries({ queryKey: ['purchases', userId] });
    queryClient.invalidateQueries({ queryKey: ['analytics', creatorId] });
    queryClient.invalidateQueries({ queryKey: ['products', productId] });
  },
};

// Background sync for critical data
export const backgroundSync = {
  // Sync user's critical data every 5 minutes when active
  startUserSync: (userId: string) => {
    return setInterval(() => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ 
          queryKey: ['user', userId],
          refetchType: 'active',
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['products', 'my-products'],
          refetchType: 'active',
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  },
  
  // Sync marketplace data periodically
  startMarketplaceSync: () => {
    return setInterval(() => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ 
          queryKey: ['products', 'featured'],
          refetchType: 'active',
        });
      }
    }, 10 * 60 * 1000); // 10 minutes
  },
  
  stopSync: (intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
  },
};

// Optimistic updates for better UX
export const optimisticUpdates = {
  // Optimistically update product data when user makes changes
  updateProduct: (productId: string, updates: any) => {
    queryClient.setQueryData(['products', productId], (old: any) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  },
  
  // Optimistically add a review
  addReview: (productId: string, review: any) => {
    queryClient.setQueryData(['reviews', productId], (old: any[]) => {
      if (!old) return [review];
      return [review, ...old];
    });
  },
  
  // Rollback optimistic update on error
  rollback: (queryKey: any[], previousData: any) => {
    queryClient.setQueryData(queryKey, previousData);
  },
};

// Error handling
export const errorHandling = {
  // Global error handler for queries
  onError: (error: any, query: any) => {
    console.error('Query error:', error, query);
    
    // Handle specific error types
    if (error?.status === 401) {
      // Handle authentication errors
      window.location.href = '/sign-in';
    } else if (error?.status >= 500) {
      // Handle server errors - could show a toast notification
      console.error('Server error occurred');
    }
  },
  
  // Global error handler for mutations
  onMutationError: (error: any, variables: any, context: any, mutation: any) => {
    console.error('Mutation error:', error, mutation);
    
    // Rollback optimistic updates if they exist
    if (context?.previousData && context?.queryKey) {
      optimisticUpdates.rollback(context.queryKey, context.previousData);
    }
  },
};

// Utility functions for cache management
export const cacheUtils = {
  // Clear all caches (useful for logout)
  clearAll: () => {
    queryClient.clear();
  },
  
  // Clear specific cache patterns
  clearUserData: (userId: string) => {
    queryClient.removeQueries({ queryKey: ['user', userId] });
    queryClient.removeQueries({ queryKey: ['products', 'my-products'] });
    queryClient.removeQueries({ queryKey: ['creator-store', userId] });
  },
  
  // Prefetch common data patterns
  prefetchCommon: async () => {
    await Promise.all([
      prefetchStrategies.homepage(),
      // Add other common prefetch strategies
    ]);
  },
  
  // Get cache statistics for debugging
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      invalidQueries: queries.filter(q => q.isInvalidated()).length,
    };
  },
};