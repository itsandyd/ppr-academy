"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";

interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isPublished?: boolean;
  style?: "button" | "card" | "minimal";
  slug?: string; // For courses
}

interface ProductsListProps {
  products?: Product[];
  storeId?: string;
}

export function ProductsList({ products, storeId }: ProductsListProps) {
  const { toast } = useToast();
  const deleteProduct = useMutation(api.digitalProducts.deleteProduct);
  const updateProduct = useMutation(api.digitalProducts.updateProduct);

  const isCourse = (product: Product) => {
    // Courses have a slug property and no style property
    // Digital products have a style property and no slug property
    return product.slug !== undefined && product.style === undefined;
  };

  const handleDelete = async (productId: string, title: string) => {
    try {
      await deleteProduct({ id: productId as any });
      toast({
        title: "Product deleted",
        description: `"${title}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (productId: string, currentStatus: boolean, title: string) => {
    try {
      await updateProduct({ 
        id: productId as any, 
        isPublished: !currentStatus 
      });
      toast({
        title: currentStatus ? "Product unpublished" : "Product published",
        description: `"${title}" is now ${!currentStatus ? "published" : "unpublished"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products yet</p>
            <p className="text-sm">Create your first product to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product._id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate pr-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={product.isPublished ? "default" : "secondary"}>
                        {product.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">${product.price}</Badge>
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isCourse(product) ? (
                      <>
                        <Button variant="outline" size="sm" disabled className="opacity-50">
                          <Eye className="h-3 w-3 mr-1" />
                          Course
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/courses/${product.slug || product._id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            View Course
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublish(product._id, product.isPublished || false, product.title)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {product.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/store/${storeId}/products/${product._id}`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product._id, product.title)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 