"use client";

import { useBundleCreation, BundleProduct } from "../context";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Package, BookOpen, X, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { useStoresByUser, useDigitalProductsByStore, useCoursesByStore } from "@/lib/convex-typed-hooks";

export function BundleProductsForm() {
  const { state, updateData, saveBundle } = useBundleCreation();
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;

  const digitalProducts = useDigitalProductsByStore(storeId) || [];

  const courses = useCoursesByStore(storeId) || [];

  const allProducts = useMemo(() => {
    const products: Array<{
      id: string;
      type: "digital" | "course";
      title: string;
      price: number;
      imageUrl?: string;
      productCategory?: string;
      isPublished: boolean;
    }> = [];

    digitalProducts
      .filter((p: any) => p.productCategory !== "bundle" && p.isPublished)
      .forEach((p: any) => {
        products.push({
          id: p._id,
          type: "digital",
          title: p.title,
          price: p.price || 0,
          imageUrl: p.imageUrl,
          productCategory: p.productCategory,
          isPublished: p.isPublished,
        });
      });

    courses
      .filter((c: any) => c.isPublished)
      .forEach((c: any) => {
        products.push({
          id: c._id,
          type: "course",
          title: c.title,
          price: c.price || 0,
          imageUrl: c.imageUrl,
          productCategory: "course",
          isPublished: c.isPublished,
        });
      });

    return products;
  }, [digitalProducts, courses]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const query = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) || p.productCategory?.toLowerCase().includes(query)
    );
  }, [allProducts, searchQuery]);

  const selectedIds = new Set(state.data.products?.map((p) => p.id) || []);

  const toggleProduct = (product: (typeof allProducts)[0]) => {
    const currentProducts = state.data.products || [];
    const isSelected = selectedIds.has(product.id as any);

    if (isSelected) {
      updateData("products", {
        products: currentProducts.filter((p) => p.id !== product.id),
      });
    } else {
      const newProduct: BundleProduct = {
        id: product.id as any,
        type: product.type,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        productCategory: product.productCategory,
      };
      updateData("products", {
        products: [...currentProducts, newProduct],
      });
    }
  };

  const removeProduct = (productId: string) => {
    const currentProducts = state.data.products || [];
    updateData("products", {
      products: currentProducts.filter((p) => p.id !== productId),
    });
  };

  const handleNext = async () => {
    await saveBundle();
    router.push(
      `/dashboard/create/bundle?step=pricing${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const handleBack = () => {
    router.push(
      `/dashboard/create/bundle?step=basics${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const totalOriginalPrice = (state.data.products || []).reduce((sum, p) => sum + p.price, 0);
  const canProceed = (state.data.products?.length || 0) >= 2;

  const getCategoryIcon = (category?: string) => {
    if (category === "course") return <BookOpen className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return "Product";
    return category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Products</h2>
        <p className="mt-1 text-muted-foreground">
          Choose at least 2 products to include in your bundle
        </p>
      </div>

      {state.data.products && state.data.products.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Selected Products ({state.data.products.length})</CardTitle>
                <CardDescription>Combined value: ${totalOriginalPrice.toFixed(2)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {state.data.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        {getCategoryIcon(product.productCategory)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProduct(product.id as string)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Products</CardTitle>
          <CardDescription>Select from your published products and courses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background pl-9"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {allProducts.length === 0
                ? "No published products found. Create and publish products first."
                : "No products match your search."}
            </div>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.id as any);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={isSelected} />
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        {getCategoryIcon(product.productCategory)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(product.productCategory)}
                        </Badge>
                        <span className="flex items-center text-sm text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          {canProceed
            ? "Continue to Pricing"
            : `Select ${2 - (state.data.products?.length || 0)} more`}
        </Button>
      </div>
    </div>
  );
}
