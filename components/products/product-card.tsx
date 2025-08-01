/**
 * Universal Product Card Component
 * Works with both legacy courses and new marketplace products
 * through the unified Product interface
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Star,
  Eye,
  ShoppingCart,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Play,
  Music,
  BookOpen,
  MessageCircle,
  Gift,
  Crown,
  Package,
  FileText,
} from 'lucide-react';
import { Product } from '@/lib/services/product-service';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'minimal';
  showActions?: boolean;
  showCreator?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPublish?: (product: Product) => void;
  onUnpublish?: (product: Product) => void;
  className?: string;
}

// Product type icons mapping
const PRODUCT_TYPE_ICONS = {
  course: BookOpen,
  coaching: MessageCircle,
  digital_product: Gift,
  consultation: MessageCircle,
  membership: Crown,
  preset_pack: Package,
  sample_pack: Music,
  template: FileText,
} as const;

// Product type colors
const PRODUCT_TYPE_COLORS = {
  course: 'bg-blue-100 text-blue-800',
  coaching: 'bg-green-100 text-green-800',
  digital_product: 'bg-purple-100 text-purple-800',
  consultation: 'bg-orange-100 text-orange-800',
  membership: 'bg-yellow-100 text-yellow-800',
  preset_pack: 'bg-pink-100 text-pink-800',
  sample_pack: 'bg-indigo-100 text-indigo-800',
  template: 'bg-gray-100 text-gray-800',
} as const;

export function ProductCard({
  product,
  variant = 'default',
  showActions = false,
  showCreator = false,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  className,
}: ProductCardProps) {
  const TypeIcon = PRODUCT_TYPE_ICONS[product.type];
  const typeColor = PRODUCT_TYPE_COLORS[product.type];

  const productUrl = product.type === 'course' 
    ? `/courses/${product.slug || product.id}`
    : `/products/${product.slug || product.id}`;

  if (variant === 'minimal') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {product.thumbnailUrl ? (
                <Image
                  src={product.thumbnailUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TypeIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={productUrl}>
                <h4 className="font-medium text-sm truncate hover:text-primary">
                  {product.title}
                </h4>
              </Link>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className={cn('text-xs', typeColor)}>
                  {product.type.replace('_', ' ')}
                </Badge>
                <span className="text-sm font-medium">
                  {formatCurrency(product.price)}
                </span>
              </div>
            </div>

            {showActions && (
              <ProductActions
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onUnpublish={onUnpublish}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <div className="flex">
          <div className="relative w-24 h-24 bg-gray-100 flex-shrink-0">
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <CardContent className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <Link href={productUrl}>
                  <h3 className="font-semibold text-base truncate hover:text-primary">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center space-x-3 mt-2">
                  <Badge variant="secondary" className={typeColor}>
                    {product.type.replace('_', ' ')}
                  </Badge>
                  <span className="font-semibold text-lg">
                    {formatCurrency(product.price)}
                  </span>
                  {!product.isPublished && (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </div>
              </div>

              {showActions && (
                <ProductActions
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPublish={onPublish}
                  onUnpublish={onUnpublish}
                />
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', className)}>
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {product.thumbnailUrl ? (
            <Image
              src={product.thumbnailUrl}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Status badges */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className={typeColor}>
              {product.type.replace('_', ' ')}
            </Badge>
          </div>
          
          {!product.isPublished && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-white">
                Draft
              </Badge>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="absolute top-3 right-3">
              <ProductActions
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onUnpublish={onUnpublish}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Link href={productUrl}>
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary mb-2">
            {product.title}
          </h3>
        </Link>

        {product.description && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
            {product.description}
          </p>
        )}

        {/* Metrics */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          {product.rating && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{product.rating.toFixed(1)}</span>
              {product.reviewCount && (
                <span>({product.reviewCount})</span>
              )}
            </div>
          )}
          
          {/* This would come from analytics in a real implementation */}
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>0 views</span>
          </div>
        </div>

        {showCreator && product.creatorUsername && (
          <p className="text-sm text-gray-500 mb-3">
            by @{product.creatorUsername}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">
            {formatCurrency(product.price)}
          </span>
          {product.currency && product.currency !== 'USD' && (
            <span className="text-sm text-gray-500">{product.currency}</span>
          )}
        </div>

        <div className="flex space-x-2">
          {product.previewUrl && (
            <Button variant="outline" size="sm" asChild>
              <Link href={product.previewUrl} target="_blank">
                <Play className="w-4 h-4 mr-1" />
                Preview
              </Link>
            </Button>
          )}
          
          <Button size="sm" asChild>
            <Link href={productUrl}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              {product.price > 0 ? 'Buy Now' : 'Get Free'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Product actions dropdown
function ProductActions({
  product,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPublish?: (product: Product) => void;
  onUnpublish?: (product: Product) => void;
}) {
  const productUrl = product.type === 'course' 
    ? `/courses/${product.slug || product.id}`
    : `/products/${product.slug || product.id}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={productUrl}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View
          </Link>
        </DropdownMenuItem>
        
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(product)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}

        {onPublish && !product.isPublished && (
          <DropdownMenuItem onClick={() => onPublish(product)}>
            <Eye className="w-4 h-4 mr-2" />
            Publish
          </DropdownMenuItem>
        )}

        {onUnpublish && product.isPublished && (
          <DropdownMenuItem onClick={() => onUnpublish(product)}>
            <Eye className="w-4 h-4 mr-2" />
            Unpublish
          </DropdownMenuItem>
        )}

        {onDelete && (
          <DropdownMenuItem 
            onClick={() => onDelete(product)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}