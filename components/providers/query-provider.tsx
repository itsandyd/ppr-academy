/**
 * React Query Provider with optimized configuration
 * Includes error boundaries and development tools
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient, backgroundSync, errorHandling } from '@/lib/query-client';
import { useUser } from '@clerk/nextjs';
import { features } from '@/lib/features';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const { user } = useUser();
  const [syncIntervals, setSyncIntervals] = useState<{
    user?: NodeJS.Timeout;
    marketplace?: NodeJS.Timeout;
  }>({});

  // Set up background sync when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    // Start user-specific sync
    const userSyncInterval = backgroundSync.startUserSync(user.id);
    
    // Start marketplace sync if enabled
    const marketplaceSyncInterval = features.enableCaching 
      ? backgroundSync.startMarketplaceSync()
      : undefined;

    setSyncIntervals({
      user: userSyncInterval,
      marketplace: marketplaceSyncInterval,
    });

    // Cleanup on unmount or user change
    return () => {
      if (userSyncInterval) {
        backgroundSync.stopSync(userSyncInterval);
      }
      if (marketplaceSyncInterval) {
        backgroundSync.stopSync(marketplaceSyncInterval);
      }
    };
  }, [user?.id]);

  // Set up global error handling
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        onError: errorHandling.onError,
      },
      mutations: {
        ...queryClient.getDefaultOptions().mutations,
        onError: errorHandling.onMutationError,
      },
    });
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      console.log('App is offline - queries will be paused');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Development tools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
      
      {/* Cache statistics in development */}
      {process.env.NODE_ENV === 'development' && <CacheStats />}
    </QueryClientProvider>
  );
}

// Development component to show cache statistics
function CacheStats() {
  const [stats, setStats] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const updateStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      setStats({
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        invalidQueries: queries.filter(q => q.isInvalidated()).length,
        queryKeys: queries.map(q => ({
          key: JSON.stringify(q.queryKey),
          state: q.state.status,
          observers: q.getObserversCount(),
          dataUpdatedAt: new Date(q.state.dataUpdatedAt).toLocaleTimeString(),
        })).slice(0, 10), // Show first 10 queries
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!features.useOptimizedQueries) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700"
      >
        Cache Stats {isOpen ? '−' : '+'}
      </button>
      
      {isOpen && stats && (
        <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">React Query Cache</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-semibold">{stats.totalQueries}</span>
            </div>
            <div>
              <span className="text-gray-600">Active:</span>
              <span className="ml-2 font-semibold text-green-600">{stats.activeQueries}</span>
            </div>
            <div>
              <span className="text-gray-600">Stale:</span>
              <span className="ml-2 font-semibold text-yellow-600">{stats.staleQueries}</span>
            </div>
            <div>
              <span className="text-gray-600">Invalid:</span>
              <span className="ml-2 font-semibold text-red-600">{stats.invalidQueries}</span>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <h4 className="font-medium text-gray-800 mb-2">Recent Queries:</h4>
            <div className="space-y-2 text-xs">
              {stats.queryKeys.map((query: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <div className="font-mono text-gray-700 truncate">
                    {query.key}
                  </div>
                  <div className="flex justify-between mt-1 text-gray-500">
                    <span className={`px-1 rounded ${
                      query.state === 'success' ? 'bg-green-100 text-green-800' :
                      query.state === 'loading' ? 'bg-blue-100 text-blue-800' :
                      query.state === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {query.state}
                    </span>
                    <span>{query.observers} observers</span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    Updated: {query.dataUpdatedAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <button
              onClick={() => {
                queryClient.clear();
                setStats(null);
              }}
              className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
            >
              Clear All Cache
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for cache management in components
export function useCacheManager() {
  const { user } = useUser();

  return {
    clearUserCache: () => {
      if (user?.id) {
        queryClient.removeQueries({ queryKey: ['user', user.id] });
        queryClient.removeQueries({ queryKey: ['products', 'my-products'] });
        queryClient.removeQueries({ queryKey: ['creator-store', user.id] });
      }
    },
    
    invalidateProducts: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    
    prefetchFeaturedProducts: () => {
      queryClient.prefetchQuery({
        queryKey: ['products', 'featured'],
        staleTime: 5 * 60 * 1000,
      });
    },
    
    getCacheStats: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      return {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
      };
    },
  };
}