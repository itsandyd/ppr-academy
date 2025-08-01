/**
 * Product Service Abstraction Layer
 * This allows us to use both legacy course system and new unified product model
 * seamlessly during the migration period.
 */

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { features } from "@/lib/features";

// Unified product interface that both systems implement
export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  type: ProductType;
  creatorId: string;
  creatorUsername?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  isPublished: boolean;
  slug?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: number;
  updatedAt: number;
}

export type ProductType = 
  | "course" 
  | "coaching" 
  | "digital_product" 
  | "consultation" 
  | "membership"
  | "preset_pack"
  | "sample_pack"
  | "template";

export interface CreateProductInput {
  title: string;
  description?: string;
  price: number;
  type: ProductType;
  content?: any;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

// Abstract interface for product services
export interface IProductService {
  getProducts(creatorId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  getProductBySlug(slug: string): Promise<Product | null>;
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(input: UpdateProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  publishProduct(id: string): Promise<Product>;
  unpublishProduct(id: string): Promise<Product>;
  getProductMetrics(id: string): Promise<ProductMetrics>;
}

export interface ProductMetrics {
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

// Legacy course service implementation
class LegacyCourseService implements IProductService {
  constructor(private convex: ConvexHttpClient) {}

  async getProducts(creatorId: string): Promise<Product[]> {
    const courses = await this.convex.query(api.courses.getByInstructorId, {
      instructorId: creatorId as Id<"users">
    });

    return courses.map(this.courseToProduct);
  }

  async getProduct(id: string): Promise<Product | null> {
    const course = await this.convex.query(api.courses.getById, {
      id: id as Id<"courses">
    });

    return course ? this.courseToProduct(course) : null;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const course = await this.convex.query(api.courses.getBySlug, { slug });
    return course ? this.courseToProduct(course) : null;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    if (input.type !== "course") {
      throw new Error("Legacy service only supports courses");
    }

    const courseId = await this.convex.mutation(api.courses.create, {
      title: input.title,
      description: input.description,
      price: input.price,
      imageUrl: input.thumbnailUrl,
    });

    const course = await this.convex.query(api.courses.getById, { id: courseId });
    return this.courseToProduct(course!);
  }

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    await this.convex.mutation(api.courses.update, {
      id: input.id as Id<"courses">,
      title: input.title,
      description: input.description,
      price: input.price,
      imageUrl: input.thumbnailUrl,
    });

    const course = await this.convex.query(api.courses.getById, {
      id: input.id as Id<"courses">
    });
    return this.courseToProduct(course!);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.convex.mutation(api.courses.remove, {
      id: id as Id<"courses">
    });
  }

  async publishProduct(id: string): Promise<Product> {
    await this.convex.mutation(api.courses.publish, {
      id: id as Id<"courses">
    });

    const course = await this.convex.query(api.courses.getById, {
      id: id as Id<"courses">
    });
    return this.courseToProduct(course!);
  }

  async unpublishProduct(id: string): Promise<Product> {
    await this.convex.mutation(api.courses.unpublish, {
      id: id as Id<"courses">
    });

    const course = await this.convex.query(api.courses.getById, {
      id: id as Id<"courses">
    });
    return this.courseToProduct(course!);
  }

  async getProductMetrics(id: string): Promise<ProductMetrics> {
    // Legacy implementation - simplified metrics
    return {
      views: 0,
      sales: 0,
      revenue: 0,
      conversionRate: 0,
    };
  }

  private courseToProduct(course: any): Product {
    return {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      currency: "USD",
      type: "course",
      creatorId: course.instructorId || course.userId,
      thumbnailUrl: course.imageUrl,
      isPublished: course.isPublished || false,
      slug: course.slug,
      rating: 0, // Legacy courses don't have ratings yet
      reviewCount: 0,
      createdAt: course._creationTime,
      updatedAt: course._creationTime,
    };
  }
}

// New marketplace product service implementation
class MarketplaceProductService implements IProductService {
  constructor(private convex: ConvexHttpClient) {}

  async getProducts(creatorId: string): Promise<Product[]> {
    // This would use the new schema when implemented
    return [];
  }

  async getProduct(id: string): Promise<Product | null> {
    // Implementation for new schema
    return null;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return null;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    // Implementation for new schema
    throw new Error("Not implemented yet");
  }

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    throw new Error("Not implemented yet");
  }

  async deleteProduct(id: string): Promise<void> {
    throw new Error("Not implemented yet");
  }

  async publishProduct(id: string): Promise<Product> {
    throw new Error("Not implemented yet");
  }

  async unpublishProduct(id: string): Promise<Product> {
    throw new Error("Not implemented yet");
  }

  async getProductMetrics(id: string): Promise<ProductMetrics> {
    // Implementation for new schema with proper analytics
    return {
      views: 0,
      sales: 0,
      revenue: 0,
      conversionRate: 0,
    };
  }
}

// Hybrid service that can use both systems
class HybridProductService implements IProductService {
  private legacyService: LegacyCourseService;
  private marketplaceService: MarketplaceProductService;

  constructor(convex: ConvexHttpClient) {
    this.legacyService = new LegacyCourseService(convex);
    this.marketplaceService = new MarketplaceProductService(convex);
  }

  async getProducts(creatorId: string): Promise<Product[]> {
    const results: Product[] = [];

    // Always include legacy courses if enabled
    if (features.legacyCoursesEnabled) {
      const legacyProducts = await this.legacyService.getProducts(creatorId);
      results.push(...legacyProducts);
    }

    // Include new marketplace products if enabled
    if (features.useNewMarketplace) {
      const newProducts = await this.marketplaceService.getProducts(creatorId);
      results.push(...newProducts);
    }

    // Sort by creation date, newest first
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getProduct(id: string): Promise<Product | null> {
    // Try legacy first
    if (features.legacyCoursesEnabled) {
      const legacy = await this.legacyService.getProduct(id);
      if (legacy) return legacy;
    }

    // Try new marketplace
    if (features.useNewMarketplace) {
      return await this.marketplaceService.getProduct(id);
    }

    return null;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    // Try legacy first
    if (features.legacyCoursesEnabled) {
      const legacy = await this.legacyService.getProductBySlug(slug);
      if (legacy) return legacy;
    }

    // Try new marketplace
    if (features.useNewMarketplace) {
      return await this.marketplaceService.getProductBySlug(slug);
    }

    return null;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    // Route based on product type and feature flags
    if (input.type === "course" && features.legacyCoursesEnabled && !features.unifiedProductModel) {
      return await this.legacyService.createProduct(input);
    }

    if (features.useNewMarketplace) {
      return await this.marketplaceService.createProduct(input);
    }

    throw new Error("No product service available for this product type");
  }

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    // Try to determine which service owns this product
    const product = await this.getProduct(input.id);
    if (!product) {
      throw new Error("Product not found");
    }

    // Route to appropriate service
    if (product.type === "course" && features.legacyCoursesEnabled) {
      return await this.legacyService.updateProduct(input);
    }

    if (features.useNewMarketplace) {
      return await this.marketplaceService.updateProduct(input);
    }

    throw new Error("Cannot update this product");
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.getProduct(id);
    if (!product) return;

    if (product.type === "course" && features.legacyCoursesEnabled) {
      await this.legacyService.deleteProduct(id);
    } else if (features.useNewMarketplace) {
      await this.marketplaceService.deleteProduct(id);
    }
  }

  async publishProduct(id: string): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.type === "course" && features.legacyCoursesEnabled) {
      return await this.legacyService.publishProduct(id);
    }

    if (features.useNewMarketplace) {
      return await this.marketplaceService.publishProduct(id);
    }

    throw new Error("Cannot publish this product");
  }

  async unpublishProduct(id: string): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.type === "course" && features.legacyCoursesEnabled) {
      return await this.legacyService.unpublishProduct(id);
    }

    if (features.useNewMarketplace) {
      return await this.marketplaceService.unpublishProduct(id);
    }

    throw new Error("Cannot unpublish this product");
  }

  async getProductMetrics(id: string): Promise<ProductMetrics> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.type === "course" && features.legacyCoursesEnabled) {
      return await this.legacyService.getProductMetrics(id);
    }

    if (features.useNewMarketplace) {
      return await this.marketplaceService.getProductMetrics(id);
    }

    throw new Error("Cannot get metrics for this product");
  }
}

// Factory function to create the appropriate service
export function createProductService(convex: ConvexHttpClient): IProductService {
  if (features.parallelSystemRun) {
    return new HybridProductService(convex);
  }

  if (features.useNewMarketplace && features.unifiedProductModel) {
    return new MarketplaceProductService(convex);
  }

  return new LegacyCourseService(convex);
}

// Singleton instance for easy use
let productServiceInstance: IProductService | null = null;

export function getProductService(): IProductService {
  if (!productServiceInstance) {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    productServiceInstance = createProductService(convex);
  }
  return productServiceInstance;
}