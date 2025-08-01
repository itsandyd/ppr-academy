/**
 * Products Grid Component
 * Displays products in a responsive grid layout with filtering and sorting
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from './product-card';
import { Product, ProductType } from '@/lib/services/product-service';
import { useProductFilters } from '@/hooks/use-products';

interface ProductsGridProps {
  products: Product[];
  isLoading?: boolean;
  showActions?: boolean;
  showCreator?: boolean;
  emptyState?: React.ReactNode;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPublish?: (product: Product) => void;
  onUnpublish?: (product: Product) => void;
  className?: string;
}

type SortOption = 'created_desc' | 'created_asc' | 'price_desc' | 'price_asc' | 'title_asc';
type ViewMode = 'grid' | 'list';

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'course', label: 'Courses' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'digital_product', label: 'Digital Products' },
  { value: 'consultation', label: 'Consultations' },
  { value: 'membership', label: 'Memberships' },
  { value: 'preset_pack', label: 'Preset Packs' },
  { value: 'sample_pack', label: 'Sample Packs' },
  { value: 'template', label: 'Templates' },
];

export function ProductsGrid({
  products,
  isLoading = false,
  showActions = false,
  showCreator = false,
  emptyState,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  className,
}: ProductsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filters = useProductFilters(products);

  // Apply filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filters.search(searchQuery);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filters.byType(selectedType);
    }

    // Status filter
    if (statusFilter === 'published') {
      filtered = filters.published;
    } else if (statusFilter === 'draft') {
      filtered = filters.draft;
    }

    // Sorting
    switch (sortBy) {
      case 'created_desc':
        return filters.sortByCreated(true);
      case 'created_asc':
        return filters.sortByCreated(false);
      case 'price_desc':
        return filters.sortByPrice(true);
      case 'price_asc':
        return filters.sortByPrice(false);
      case 'title_asc':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return filtered;
    }
  }, [products, searchQuery, selectedType, statusFilter, sortBy, filters]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && products.length === 0) {
    return (
      <div className={className}>
        {emptyState || (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Grid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first product.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search and View Mode */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ProductType | 'all')}>
            <SelectTrigger className="w-auto">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PRODUCT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'published' | 'draft')}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-auto">
              {sortBy.includes('_desc') ? (
                <SortDesc className="w-4 h-4 mr-2" />
              ) : (
                <SortAsc className="w-4 h-4 mr-2" />
              )}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Newest First</SelectItem>
              <SelectItem value="created_asc">Oldest First</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="title_asc">Title: A to Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Active filters display */}
          {(searchQuery || selectedType !== 'all' || statusFilter !== 'all') && (
            <div className="flex items-center space-x-2">
              {searchQuery && (
                <Badge variant="secondary">
                  Search: {searchQuery}
                </Badge>
              )}
              {selectedType !== 'all' && (
                <Badge variant="secondary">
                  Type: {PRODUCT_TYPES.find(t => t.value === selectedType)?.label}
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary">
                  Status: {statusFilter}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setStatusFilter('all');
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
          {filteredAndSortedProducts.length !== products.length && (
            <span> (filtered from {products.length})</span>
          )}
        </p>
      </div>

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No products match your current filters.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={viewMode === 'list' ? 'compact' : 'default'}
              showActions={showActions}
              showCreator={showCreator}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
            />
          ))}
        </div>
      )}
    </div>
  );
}