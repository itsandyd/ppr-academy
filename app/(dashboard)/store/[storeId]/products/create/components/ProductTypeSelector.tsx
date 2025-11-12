"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_TYPE_INFO, ProductCategory } from "../types";
import { useState } from "react";
import { Search } from "lucide-react";

interface ProductTypeSelectorProps {
  selectedCategory?: ProductCategory;
  onSelect: (category: ProductCategory) => void;
  onContinue: () => void;
  onDoubleClick?: (category: ProductCategory) => void;
}

export function ProductTypeSelector({
  selectedCategory,
  onSelect,
  onContinue,
  onDoubleClick,
}: ProductTypeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const groupedProducts = PRODUCT_TYPE_INFO.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, typeof PRODUCT_TYPE_INFO>);

  const filteredProducts = searchQuery
    ? PRODUCT_TYPE_INFO.filter(p =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : PRODUCT_TYPE_INFO;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Product Type</h2>
        <p className="text-muted-foreground mt-1">
          Select what type of product you want to create
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search product types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product Grid */}
      {searchQuery ? (
        // Flat list when searching
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductTypeCard
              key={product.id}
              product={product}
              isSelected={selectedCategory === product.id}
              onSelect={() => onSelect(product.id as ProductCategory)}
              onDoubleClick={() => {
                onSelect(product.id as ProductCategory);
                if (onDoubleClick) {
                  onDoubleClick(product.id as ProductCategory);
                } else {
                  // Auto-advance if no custom handler
                  onContinue();
                }
              }}
            />
          ))}
        </div>
      ) : (
        // Grouped by category when not searching
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, products]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductTypeCard
                    key={product.id}
                    product={product}
                    isSelected={selectedCategory === product.id}
                    onSelect={() => onSelect(product.id as ProductCategory)}
                    onDoubleClick={() => {
                      onSelect(product.id as ProductCategory);
                      if (onDoubleClick) {
                        onDoubleClick(product.id as ProductCategory);
                      } else {
                        // Auto-advance if no custom handler
                        onContinue();
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onContinue}
          disabled={!selectedCategory}
          size="lg"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

interface ProductTypeCardProps {
  product: typeof PRODUCT_TYPE_INFO[number];
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

function ProductTypeCard({ product, isSelected, onSelect, onDoubleClick }: ProductTypeCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{product.icon}</span>
          <div>
            <CardTitle className="text-base">{product.label}</CardTitle>
            <CardDescription className="text-sm">
              {product.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

