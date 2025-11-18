'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowLeft, 
  Sparkles,
  Package,
  DollarSign,
  Gift,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import { BaseProductFormData } from '../types';

interface PublishStepProps {
  formData: Partial<BaseProductFormData>;
  onBack: () => void;
  onPublish: () => void;
}

export function PublishStep({
  formData,
  onBack,
  onPublish,
}: PublishStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Publish</h2>
        <p className="text-muted-foreground">
          Everything looks good? Let's publish your product!
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-4">
        {/* Product details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Product Details</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onBack()}>
                Edit
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{formData.title || 'Untitled'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm line-clamp-2">{formData.description || 'No description'}</p>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Pricing</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {formData.pricingModel === 'free_with_gate' ? (
                  <>
                    <Gift className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">Free with Download Gate</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">${formData.price}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publish confirmation */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Ready to Publish?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your product will be immediately available on your storefront. You can always edit or unpublish it later.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Product will appear in your store</li>
                <li>✓ Customers can purchase immediately</li>
                <li>✓ You'll get notified of sales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onPublish}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Publish Product
        </Button>
      </div>
    </div>
  );
}


