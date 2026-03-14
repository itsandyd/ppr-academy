import { fetchQuery } from "convex/nextjs";
import { api } from "@/lib/convex-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductActions } from "./_components/ProductActions";

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function isConvexId(str: string): boolean {
  return /^[a-z0-9]{32}$/.test(str) || str.includes(":");
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Fetch product by slug first, fall back to by ID
  let product: any = null;
  if (!isConvexId(slug)) {
    product = await fetchQuery(api.digitalProducts.getProductByGlobalSlug, {
      slug,
    }).catch(() => null);
  }

  if (!product) {
    product = await fetchQuery(api.digitalProducts.getProductById, {
      productId: slug,
    }).catch(() => null);
  }

  if (!product) {
    notFound();
  }

  // Fetch store and related products in parallel
  const [store, relatedProducts] = await Promise.all([
    product.storeId
      ? fetchQuery(api.stores.getStoreById, { storeId: product.storeId }).catch(
          () => null
        )
      : null,
    fetchQuery(api.digitalProducts.getRelatedProducts, {
      productId: product._id,
      limit: 4,
    }).catch(() => []),
  ]);

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Product Image */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-2xl">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category Badge */}
              {(product.productType || product.category) && (
                <Badge className="border-chart-1/20 bg-chart-1/10 text-chart-1">
                  {product.productType || product.category}
                </Badge>
              )}

              {/* Title */}
              <div>
                <h1 className="mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold text-transparent">
                  {product.title}
                </h1>
                {product.description && (
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Creator Info */}
              <Link href={`/${store.slug}`}>
                <Card className="cursor-pointer border-border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={store.logoUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-primary-foreground">
                        {store.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <p className="text-lg font-semibold">{store.name}</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-5xl font-bold text-transparent">
                  {product.price === 0 ? "FREE" : `$${product.price}`}
                </span>
                {product.price === 0 && (
                  <Badge className="bg-chart-1/10 text-chart-1">No credit card required</Badge>
                )}
              </div>

              {/* Benefits */}
              <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-chart-4/5 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-5 w-5 text-chart-1" />
                  What&apos;s Included
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>Instant access after purchase</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>Lifetime access to product</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>Direct support from creator</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>30-day money-back guarantee</span>
                  </li>
                </ul>
              </Card>

              {/* Client: Social Proof + Action Buttons */}
              <ProductActions
                productId={product._id}
                productSlug={product.slug || slug}
                productTitle={product.title}
                productDescription={product.description}
                productPrice={product.price}
                productImageUrl={product.imageUrl}
                productDownloadUrl={product.downloadUrl}
                productUrl={product.url}
                productButtonLabel={product.buttonLabel}
                productType={product.category || product.productType}
                storeId={product.storeId}
              />

              {/* Trust Indicators */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Details Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border-border bg-card p-8">
          <h2 className="mb-6 text-2xl font-bold">About This Product</h2>
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            <p className="leading-relaxed text-muted-foreground">
              {product.description || "No additional details available."}
            </p>
          </div>
        </Card>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">More from {store.name}</h2>
              <Link href={`/${store.slug}`}>
                <Button variant="outline">View All Products</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct: any) => (
                <Link
                  key={relatedProduct._id}
                  href={`/marketplace/products/${relatedProduct.slug || relatedProduct._id}`}
                >
                  <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                      {relatedProduct.imageUrl ? (
                        <Image
                          src={relatedProduct.imageUrl}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="line-clamp-1 font-semibold">{relatedProduct.title}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {relatedProduct.category}
                        </Badge>
                        <span className="font-bold text-chart-1">
                          ${relatedProduct.price.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
