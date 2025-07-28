"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, DollarSign, CreditCard, Save } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useCourseCreation } from "../context";

export function CheckoutForm() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const { state, updateData, saveCourse } = useCourseCreation();

  const [formData, setFormData] = useState({
    price: "",
    originalPrice: "",
    hasDiscount: false,
    paymentDescription: "",
    checkoutHeadline: "",
    checkoutDescription: "",
    guaranteeText: "",
    showGuarantee: true,
    acceptsPayPal: true,
    acceptsStripe: true,
  });

  // Load data from context when available
  useEffect(() => {
    if (state.data) {
      setFormData({
        price: state.data.price || "",
        originalPrice: state.data.originalPrice || "",
        hasDiscount: state.data.hasDiscount || false,
        paymentDescription: state.data.paymentDescription || "",
        checkoutHeadline: state.data.checkoutHeadline || "",
        checkoutDescription: state.data.checkoutDescription || "",
        guaranteeText: state.data.guaranteeText || "",
        showGuarantee: state.data.showGuarantee ?? true,
        acceptsPayPal: state.data.acceptsPayPal ?? true,
        acceptsStripe: state.data.acceptsStripe ?? true,
      });
    }
  }, [state.data]);

  const handleInputChange = (field: string, value: string | boolean) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Update context with new data
    updateData("checkout", newData);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/course/create?step=thumbnail`);
  };

  const handleNext = () => {
    router.push(`/store/${storeId}/course/create?step=course`);
  };

  const discountPercentage = formData.originalPrice && formData.price 
    ? Math.round((1 - parseFloat(formData.price) / parseFloat(formData.originalPrice)) * 100)
    : 0;

  const isValid = formData.price && formData.checkoutHeadline;

  return (
    <div className="space-y-8">
      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-foreground">Course Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="99.00"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="original-price" className="text-foreground">Original Price (optional)</Label>
              <Input
                id="original-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                placeholder="149.00"
                className="mt-2"
              />
              {discountPercentage > 0 && (
                <p className="text-sm text-primary mt-1">
                  {discountPercentage}% discount
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="payment-description" className="text-foreground">Payment Description</Label>
            <Input
              id="payment-description"
              value={formData.paymentDescription}
              onChange={(e) => handleInputChange("paymentDescription", e.target.value)}
              placeholder="Complete Course Access"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This appears on the payment button
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Checkout Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="checkout-headline" className="text-foreground">Checkout Headline *</Label>
            <Input
              id="checkout-headline"
              value={formData.checkoutHeadline}
              onChange={(e) => handleInputChange("checkoutHeadline", e.target.value)}
              placeholder="Get Instant Access to the Complete Course"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="checkout-description" className="text-foreground">Checkout Description</Label>
            <Textarea
              id="checkout-description"
              value={formData.checkoutDescription}
              onChange={(e) => handleInputChange("checkoutDescription", e.target.value)}
              placeholder="Describe the value and what students get..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Money-Back Guarantee</Label>
                <p className="text-sm text-muted-foreground">
                  Display a guarantee badge on checkout
                </p>
              </div>
              <Switch
                checked={formData.showGuarantee}
                onCheckedChange={(checked) => handleInputChange("showGuarantee", checked)}
              />
            </div>

            {formData.showGuarantee && (
              <div>
                <Label htmlFor="guarantee-text" className="text-foreground">Guarantee Text</Label>
                <Input
                  id="guarantee-text"
                  value={formData.guaranteeText}
                  onChange={(e) => handleInputChange("guaranteeText", e.target.value)}
                  placeholder="30-Day Money-Back Guarantee"
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Accept Stripe Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Credit cards, Apple Pay, Google Pay
                </p>
              </div>
              <Switch
                checked={formData.acceptsStripe}
                onCheckedChange={(checked) => handleInputChange("acceptsStripe", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Accept PayPal</Label>
                <p className="text-sm text-muted-foreground">
                  PayPal and PayPal Pay Later
                </p>
              </div>
              <Switch
                checked={formData.acceptsPayPal}
                onCheckedChange={(checked) => handleInputChange("acceptsPayPal", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Thumbnail
        </Button>
        
        <div className="flex gap-2">
                      <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save Course"}
            </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!isValid}
            className="gap-2"
          >
            Continue to Course Content
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 