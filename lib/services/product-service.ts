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
    const courses = await this.convex.query(api.courses.getCoursesByInstructor, {
      instructorId: creatorId
    });

    return courses.map(this.courseToProduct);
  }

  async getProduct(id: string): Promise<Product | null> {
    const courses = await this.convex.query(api.courses.getCourses, {});
    const course = courses.find((c: { _id: string }) => c._id === id);

    return course ? this.courseToProduct(course) : null;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const course = await this.convex.query(api.courses.getCourseBySlug, { slug });
    return course ? this.courseToProduct(course) : null;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    if (input.type !== "course") {
      throw new Error("Legacy service only supports courses");
    }

    const courseId = await this.convex.mutation(api.courses.createCourse, {
      userId: "",
      title: input.title,
      description: input.description,
      price: input.price,
      imageUrl: input.thumbnailUrl,
    });

    const courses = await this.convex.query(api.courses.getCourses, {});
    const course = courses.find((c: { _id: string }) => c._id === courseId);
    return this.courseToProduct(course!);
  }

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    await this.convex.mutation(api.courses.updateCourse, {
      id: input.id as Id<"courses">,
      title: input.title,
      description: input.description,
      price: input.price,
      imageUrl: input.thumbnailUrl,
    });

    const courses = await this.convex.query(api.courses.getCourses, {});
    const course = courses.find((c: { _id: string }) => c._id === input.id);
    return this.courseToProduct(course!);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.convex.mutation(api.courses.deleteCourse, {
      courseId: id as Id<"courses">,
      userId: ""
    });
  }

  async publishProduct(id: string): Promise<Product> {
    await this.convex.mutation(api.courses.updateCourse, {
      id: id as Id<"courses">,
      isPublished: true
    });

    const courses = await this.convex.query(api.courses.getCourses, {});
    const course = courses.find((c: { _id: string }) => c._id === id);
    return this.courseToProduct(course!);
  }

  async unpublishProduct(id: string): Promise<Product> {
    await this.convex.mutation(api.courses.updateCourse, {
      id: id as Id<"courses">,
      isPublished: false
    });

    const courses = await this.convex.query(api.courses.getCourses, {});
    const course = courses.find((c: { _id: string }) => c._id === id);
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
    // Query digital products by store/user
    const products = await this.convex.query(api.digitalProducts.getProductsByUser, {
      userId: creatorId,
    });

    return products.map((p: any) => this.digitalProductToProduct(p));
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const product = await this.convex.query(api.digitalProducts.getProductById, {
        productId: id as Id<"digitalProducts">,
      });
      return product ? this.digitalProductToProduct(product) : null;
    } catch {
      return null;
    }
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const product = await this.convex.query(api.digitalProducts.getProductByGlobalSlug, {
        slug,
      });
      return product ? this.digitalProductToProduct(product) : null;
    } catch {
      return null;
    }
  }

  // Phase 2: Write operations — the UI uses Convex mutations directly
  async createProduct(_input: CreateProductInput): Promise<Product> {
    throw new Error("Phase 2: Not shipping at launch. Use Convex mutations directly.");
  }

  async updateProduct(_input: UpdateProductInput): Promise<Product> {
    throw new Error("Phase 2: Not shipping at launch. Use Convex mutations directly.");
  }

  async deleteProduct(_id: string): Promise<void> {
    throw new Error("Phase 2: Not shipping at launch. Use Convex mutations directly.");
  }

  async publishProduct(_id: string): Promise<Product> {
    throw new Error("Phase 2: Not shipping at launch. Use Convex mutations directly.");
  }

  async unpublishProduct(_id: string): Promise<Product> {
    throw new Error("Phase 2: Not shipping at launch. Use Convex mutations directly.");
  }

  async getProductMetrics(id: string): Promise<ProductMetrics> {
    // Query purchase data for this product to compute metrics
    try {
      const product = await this.convex.query(api.digitalProducts.getProductById, {
        productId: id as Id<"digitalProducts">,
      });
      if (!product) {
        return { views: 0, sales: 0, revenue: 0, conversionRate: 0 };
      }
      // Use available data from the product record
      const sales = (product as any).totalPurchases || 0;
      const revenue = (product as any).totalRevenue || 0;
      return {
        views: 0, // View tracking not implemented yet
        sales,
        revenue,
        conversionRate: 0, // Requires view tracking to calculate
      };
    } catch {
      return { views: 0, sales: 0, revenue: 0, conversionRate: 0 };
    }
  }

  private digitalProductToProduct(product: any): Product {
    const categoryToType: Record<string, ProductType> = {
      "sample-pack": "sample_pack",
      "preset-pack": "preset_pack",
      template: "template",
      coaching: "coaching",
    };

    const productType: ProductType =
      categoryToType[product.productCategory] ||
      (product.productType === "coaching" ? "coaching" : "digital_product");

    return {
      id: product._id,
      title: product.title,
      description: product.description,
      price: product.price || 0,
      currency: "USD",
      type: productType,
      creatorId: product.userId,
      thumbnailUrl: product.imageUrl,
      isPublished: product.isPublished || false,
      slug: product.slug,
      rating: 0,
      reviewCount: 0,
      createdAt: product._creationTime,
      updatedAt: product._creationTime,
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