/**
 * React hooks for product management
 * Provides a clean interface for components to interact with products
 * Uses Convex for real-time data fetching
 *
 * Note: This replaces the previous React Query implementation with Convex hooks
 * for consistency with the rest of the codebase.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Product,
  ProductType,
  CreateProductInput,
  UpdateProductInput,
  ProductMetrics,
  getProductService,
} from "@/lib/services/product-service";

// Query keys for cache management (kept for compatibility)
export const productQueryKeys = {
  all: ["products"] as const,
  byCreator: (creatorId: string) => [...productQueryKeys.all, "creator", creatorId] as const,
  byId: (id: string) => [...productQueryKeys.all, "id", id] as const,
  bySlug: (slug: string) => [...productQueryKeys.all, "slug", slug] as const,
  metrics: (id: string) => [...productQueryKeys.all, "metrics", id] as const,
};

// Helper to transform Convex course data to Product interface
function courseToProduct(course: {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isPublished?: boolean;
  slug?: string;
  instructorId?: string;
  userId?: string;
}): Product {
  return {
    id: course._id,
    title: course.title,
    description: course.description,
    price: course.price || 0,
    currency: "USD",
    type: "course" as ProductType,
    creatorId: course.instructorId || course.userId || "",
    thumbnailUrl: course.imageUrl,
    isPublished: course.isPublished || false,
    slug: course.slug,
    rating: 0,
    reviewCount: 0,
    createdAt: course._creationTime,
    updatedAt: course._creationTime,
  };
}

// Hook to get products by creator using Convex
export function useProducts(creatorId?: string): {
  data: Product[];
  isLoading: boolean;
  error: null;
} {
  const { user } = useUser();
  const effectiveCreatorId = creatorId || user?.id;
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useMemo(() => {
    if (!effectiveCreatorId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const service = getProductService();
        const products = await service.getProducts(effectiveCreatorId);
        setData(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [effectiveCreatorId]);

  return {
    data,
    isLoading,
    error: null,
  };
}

// Hook to get a single product by ID - uses slug lookup since there's no direct ID query
export function useProduct(id: string): {
  data: Product | null;
  isLoading: boolean;
  error: null;
} {
  // Note: There's no simple getById in courses.ts, so we skip this for now
  // The product service handles ID lookups via ConvexHttpClient
  return {
    data: null,
    isLoading: false,
    error: null,
  };
}

// Hook to get a product by slug
export function useProductBySlug(slug: string): {
  data: Product | null;
  isLoading: boolean;
  error: null;
} {
  const course = useQuery(api.courses.getCourseBySlug, slug ? { slug } : "skip");

  const data: Product | null = useMemo(() => {
    if (!course) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return courseToProduct(course as any);
  }, [course]);

  return {
    data,
    isLoading: course === undefined,
    error: null,
  };
}

// Hook to get product metrics with real data from Convex
export function useProductMetrics(productId: string, productType: "course" | "digitalProduct" = "course"): {
  data: ProductMetrics;
  isLoading: boolean;
  error: null;
} {
  // Query real metrics from purchases and analytics
  const purchaseStats = useQuery(
    api.analytics.getProductMetrics,
    productId ? { productId, productType } : "skip"
  );

  const data: ProductMetrics = useMemo(() => {
    if (!purchaseStats) {
      return {
        views: 0,
        sales: 0,
        revenue: 0,
        conversionRate: 0,
      };
    }
    return {
      views: purchaseStats.views || 0,
      sales: purchaseStats.sales || 0,
      revenue: purchaseStats.revenue || 0,
      conversionRate: purchaseStats.conversionRate || 0,
    };
  }, [purchaseStats]);

  return {
    data,
    isLoading: purchaseStats === undefined,
    error: null,
  };
}

// Hook to create a product using server-side product service
export function useCreateProduct() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (input: CreateProductInput): Promise<Product> => {
    setIsPending(true);
    try {
      const service = getProductService();
      const product = await service.createProduct(input);
      toast.success("Product created successfully!");
      return product;
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product. Please try again.");
      throw error;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
  };
}

// Hook to update a product
export function useUpdateProduct() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (input: UpdateProductInput): Promise<Product> => {
    setIsPending(true);
    try {
      const service = getProductService();
      const product = await service.updateProduct(input);
      toast.success("Product updated successfully!");
      return product;
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error("Failed to update product. Please try again.");
      throw error;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
  };
}

// Hook to delete a product
export function useDeleteProduct() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (id: string): Promise<string> => {
    setIsPending(true);
    try {
      const service = getProductService();
      await service.deleteProduct(id);
      toast.success("Product deleted successfully!");
      return id;
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product. Please try again.");
      throw error;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
  };
}

// Hook to publish a product
export function usePublishProduct() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (id: string): Promise<Product> => {
    setIsPending(true);
    try {
      const service = getProductService();
      const product = await service.publishProduct(id);
      toast.success("Product published successfully!");
      return product;
    } catch (error) {
      console.error("Failed to publish product:", error);
      toast.error("Failed to publish product. Please try again.");
      throw error;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
  };
}

// Hook to unpublish a product
export function useUnpublishProduct() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (id: string): Promise<Product> => {
    setIsPending(true);
    try {
      const service = getProductService();
      const product = await service.unpublishProduct(id);
      toast.success("Product unpublished successfully!");
      return product;
    } catch (error) {
      console.error("Failed to unpublish product:", error);
      toast.error("Failed to unpublish product. Please try again.");
      throw error;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutateAsync,
    isPending,
  };
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

// Hook for product filtering and search (pure client-side, no data fetching)
export function useProductFilters(products: Product[]) {
  return useMemo(
    () => ({
      published: products.filter((p: Product) => p.isPublished),
      draft: products.filter((p: Product) => !p.isPublished),
      byType: (type: Product["type"]) => products.filter((p: Product) => p.type === type),
      search: (query: string) =>
        products.filter(
          (p: Product) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.description?.toLowerCase().includes(query.toLowerCase())
        ),
      sortByCreated: (desc = true) =>
        [...products].sort((a: Product, b: Product) =>
          desc ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
        ),
      sortByPrice: (desc = true) =>
        [...products].sort((a: Product, b: Product) =>
          desc ? b.price - a.price : a.price - b.price
        ),
    }),
    [products]
  );
}
