"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Search, Package, Download, DollarSign } from "lucide-react";

export default function ProductsManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all digital products and courses
  const digitalProducts = useQuery(api.digitalProducts.getAllProducts) || [];
  const courses = useQuery(api.courses.getAllCourses) || [];

  // Combine both into a unified list
  const allProducts = [
    ...digitalProducts.map((p: any) => ({ ...p, type: "digital_product" as const })),
    ...courses.map((c: any) => ({ ...c, type: "course" as const })),
  ];

  const filteredProducts = allProducts.filter((product) =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">All Products</h1>
        <p className="text-muted-foreground">
          Manage all courses and digital products on the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{allProducts.length}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{courses.length}</div>
            <div className="text-sm text-muted-foreground">Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{digitalProducts.length}</div>
            <div className="text-sm text-muted-foreground">Digital Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {allProducts.filter((p) => p.isPublished).length}
            </div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {allProducts.filter((p) => !p.isPublished).length}
            </div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Products ({filteredProducts.length} of {allProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {product.description || "No description"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {product.type === "course" ? "Course" : "Digital Product"}
                      </Badge>
                      {product.type === "digital_product" && product.downloads && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Download className="h-3 w-3" />
                          {product.downloads} downloads
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={product.isPublished ? "default" : "secondary"}>
                      {product.isPublished ? "Published" : "Draft"}
                    </Badge>

                    <span className="text-sm font-semibold">
                      ${product.price?.toFixed(2) || "0.00"}
                    </span>

                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No products found</p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Courses and products will appear here once creators start adding them"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
