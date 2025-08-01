/**
 * React hooks for product management
 * Provides a clean interface for components to interact with products
 * regardless of the underlying system (legacy or new marketplace)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { 
  getProductService, 
  Product, 
  CreateProductInput, 
  UpdateProductInput,
  ProductMetrics 
} from '@/lib/services/product-service';
import { toast } from 'sonner';

// Query keys for React Query
export const productQueryKeys = {
  all: ['products'] as const,
  byCreator: (creatorId: string) => [...productQueryKeys.all, 'creator', creatorId] as const,
  byId: (id: string) => [...productQueryKeys.all, 'id', id] as const,
  bySlug: (slug: string) => [...productQueryKeys.all, 'slug', slug] as const,
  metrics: (id: string) => [...productQueryKeys.all, 'metrics', id] as const,
};

// Hook to get products by creator
export function useProducts(creatorId?: string) {
  const { user } = useUser();
  const effectiveCreatorId = creatorId || user?.id;

  return useQuery({
    queryKey: productQueryKeys.byCreator(effectiveCreatorId || ''),
    queryFn: async () => {
      if (!effectiveCreatorId) return [];
      const service = getProductService();
      return await service.getProducts(effectiveCreatorId);
    },
    enabled: !!effectiveCreatorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get a single product by ID
export function useProduct(id: string) {
  return useQuery({
    queryKey: productQueryKeys.byId(id),
    queryFn: async () => {
      const service = getProductService();
      return await service.getProduct(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

// Hook to get a product by slug
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: productQueryKeys.bySlug(slug),
    queryFn: async () => {
      const service = getProductService();
      return await service.getProductBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

// Hook to get product metrics
export function useProductMetrics(id: string) {
  return useQuery({
    queryKey: productQueryKeys.metrics(id),
    queryFn: async () => {
      const service = getProductService();
      return await service.getProductMetrics(id);
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute (metrics change more frequently)
    cacheTime: 5 * 60 * 1000,
  });
}

// Hook to create a product
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const service = getProductService();
      return await service.createProduct(input);
    },
    onSuccess: (product) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.byCreator(user?.id || '')
      });
      
      // Add the new product to the cache
      queryClient.setQueryData(
        productQueryKeys.byId(product.id),
        product
      );

      toast.success('Product created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product. Please try again.');
    },
  });
}

// Hook to update a product
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const service = getProductService();
      return await service.updateProduct(input);
    },
    onSuccess: (product) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productQueryKeys.byId(product.id),
        product
      );

      // Invalidate products list to ensure consistency
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.byCreator(user?.id || '')
      });

      toast.success('Product updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product. Please try again.');
    },
  });
}

// Hook to delete a product
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      const service = getProductService();
      await service.deleteProduct(id);
      return id;
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: productQueryKeys.byId(id)
      });

      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.byCreator(user?.id || '')
      });

      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product. Please try again.');
    },
  });
}

// Hook to publish a product
export function usePublishProduct() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      const service = getProductService();
      return await service.publishProduct(id);
    },
    onSuccess: (product) => {
      // Update the product in cache
      queryClient.setQueryData(
        productQueryKeys.byId(product.id),
        product
      );

      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.byCreator(user?.id || '')
      });

      toast.success('Product published successfully!');
    },
    onError: (error) => {
      console.error('Failed to publish product:', error);
      toast.error('Failed to publish product. Please try again.');
    },
  });
}

// Hook to unpublish a product
export function useUnpublishProduct() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      const service = getProductService();
      return await service.unpublishProduct(id);
    },
    onSuccess: (product) => {
      // Update the product in cache
      queryClient.setQueryData(
        productQueryKeys.byId(product.id),
        product
      );

      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.byCreator(user?.id || '')
      });

      toast.success('Product unpublished successfully!');
    },
    onError: (error) => {
      console.error('Failed to unpublish product:', error);
      toast.error('Failed to unpublish product. Please try again.');
    },
  });
}

// Combined hook for product actions
export function useProductActions() {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const publishProduct = usePublishProduct();
  const unpublishProduct = useUnpublishProduct();

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    publishProduct,
    unpublishProduct,
    isLoading: 
      createProduct.isPending ||
      updateProduct.isPending ||
      deleteProduct.isPending ||
      publishProduct.isPending ||
      unpublishProduct.isPending,
  };
}

// Hook for product filtering and search
export function useProductFilters(products: Product[]) {
  return {
    published: products.filter(p => p.isPublished),
    draft: products.filter(p => !p.isPublished),
    byType: (type: Product['type']) => products.filter(p => p.type === type),
    search: (query: string) => products.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
    ),
    sortByCreated: (desc = true) => [...products].sort((a, b) => 
      desc ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    ),
    sortByPrice: (desc = true) => [...products].sort((a, b) => 
      desc ? b.price - a.price : a.price - b.price
    ),
  };
}