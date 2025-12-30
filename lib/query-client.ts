/**
 * Legacy React Query configuration file
 *
 * NOTE: This project now uses Convex for real-time data fetching.
 * This file is kept for compatibility but all functionality has been
 * migrated to Convex hooks in hooks/use-products.ts
 *
 * @deprecated Use Convex useQuery/useMutation hooks instead
 */

// Stub exports for compatibility with any remaining imports
export const queryClient = null;

export const cacheConfig = {
  user: { staleTime: 0, cacheTime: 0 },
  products: { staleTime: 0, cacheTime: 0 },
  creatorStore: { staleTime: 0, cacheTime: 0 },
  analytics: { staleTime: 0, cacheTime: 0 },
  search: { staleTime: 0, cacheTime: 0 },
  reviews: { staleTime: 0, cacheTime: 0 },
  categories: { staleTime: 0, cacheTime: 0 },
};

export const prefetchStrategies = {
  creatorDashboard: async () => {},
  homepage: async () => {},
  productPage: async (_productId: string, _creatorId: string) => {},
};

export const cacheInvalidation = {
  productUpdated: (_productId: string, _creatorId: string) => {},
  userUpdated: (_userId: string) => {},
  reviewUpdated: (_productId: string) => {},
  purchaseCompleted: (_userId: string, _productId: string, _creatorId: string) => {},
};

export const backgroundSync = {
  startUserSync: (_userId: string): NodeJS.Timeout => {
    // Return a dummy interval that does nothing
    return setInterval(() => {}, 999999999);
  },
  startMarketplaceSync: (): NodeJS.Timeout => {
    return setInterval(() => {}, 999999999);
  },
  stopSync: (intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
  },
};

export const optimisticUpdates = {
  updateProduct: (_productId: string, _updates: unknown) => {},
  addReview: (_productId: string, _review: unknown) => {},
  rollback: (_queryKey: unknown[], _previousData: unknown) => {},
};

export const errorHandling = {
  onError: (_error: unknown, _query: unknown) => {},
  onMutationError: (
    _error: unknown,
    _variables: unknown,
    _context: unknown,
    _mutation: unknown
  ) => {},
};

export const cacheUtils = {
  clearAll: () => {},
  clearUserData: (_userId: string) => {},
  prefetchCommon: async () => {},
  getCacheStats: () => ({
    totalQueries: 0,
    activeQueries: 0,
    staleQueries: 0,
    invalidQueries: 0,
  }),
};
