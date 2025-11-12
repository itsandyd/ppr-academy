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
import { FormFieldWithHelp, courseFieldHelp } from "@/components/ui/form-field-with-help";

export function CheckoutForm() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const { state, updateData, saveCourse } = useCourseCreation();

  // Redirect if course is free with download gate
  useEffect(() => {
    if (state.data.pricingModel === "free_with_gate") {
      router.push(`/store/${storeId}/course/create?step=followGate`);
    }
  }, [state.data.pricingModel, router, storeId]);

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

  const [touched, setTouched] = useState({
    price: false,
    checkoutHeadline: false,
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

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: keyof typeof touched, value: any) => {
    return touched[field] && !value;
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/course/create?step=pricing`);
  };

  const handleNext = () => {
    router.push(`/store/${storeId}/course/create?step=course`);
  };

  const discountPercentage = formData.originalPrice && formData.price 
    ? Math.round((1 - parseFloat(formData.price) / parseFloat(formData.originalPrice)) * 100)
    : 0;

  const isValid = formData.price && formData.checkoutHeadline;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Pricing */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <DollarSign className="w-5 h-5" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormFieldWithHelp
              label="Course Price (USD)"
              name="price"
              type="number"
              value={formData.price}
              onChange={(value) => handleInputChange("price", value)}
              placeholder="99.00"
              required
              help={courseFieldHelp.price}
              error={getFieldError("price", formData.price) ? "Price is required" : undefined}
            />

            <div>
              <Label htmlFor="original-price" className="text-foreground text-sm font-medium">Original Price (optional)</Label>
              <Input
                id="original-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                placeholder="149.00"
                className="mt-2 h-12 text-base"
              />
              {discountPercentage > 0 && (
                <p className="text-sm text-primary mt-1 font-medium">
                  {discountPercentage}% discount
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="payment-description" className="text-foreground text-sm font-medium">Payment Description</Label>
            <Input
              id="payment-description"
              value={formData.paymentDescription}
              onChange={(e) => handleInputChange("paymentDescription", e.target.value)}
              placeholder="Complete Course Access"
              className="mt-2 h-12 text-base"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This appears on the payment button
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Page */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="w-5 h-5" />
            Checkout Page
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="checkout-headline" className="text-foreground text-sm font-medium flex items-center gap-1">
              Checkout Headline <span className="text-red-600">*</span>
            </Label>
            <Input
              id="checkout-headline"
              value={formData.checkoutHeadline}
              onChange={(e) => handleInputChange("checkoutHeadline", e.target.value)}
              onBlur={() => handleBlur("checkoutHeadline")}
              placeholder="e.g., Start Learning Today"
              className={`mt-2 h-12 text-base ${
                getFieldError("checkoutHeadline", formData.checkoutHeadline)
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : ""
              }`}
            />
            {getFieldError("checkoutHeadline", formData.checkoutHeadline) && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Checkout headline is required
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="checkout-description" className="text-foreground text-sm font-medium">Checkout Description</Label>
            <Textarea
              id="checkout-description"
              value={formData.checkoutDescription}
              onChange={(e) => handleInputChange("checkoutDescription", e.target.value)}
              placeholder="Describe the value and what students get..."
              rows={4}
              className="mt-2 text-base min-h-[100px] resize-none"
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
                <Label htmlFor="guarantee-text" className="text-foreground text-sm font-medium">Guarantee Text</Label>
                <Input
                  id="guarantee-text"
                  value={formData.guaranteeText}
                  onChange={(e) => handleInputChange("guaranteeText", e.target.value)}
                  placeholder="30-Day Money-Back Guarantee"
                  className="mt-2 h-12 text-base"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-foreground text-sm font-medium">Accept Stripe Payments</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Credit cards, Apple Pay, Google Pay
                </p>
              </div>
              <Switch
                checked={formData.acceptsStripe}
                onCheckedChange={(checked) => handleInputChange("acceptsStripe", checked)}
                className="mt-1"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-foreground text-sm font-medium">Accept PayPal</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  PayPal and PayPal Pay Later
                </p>
              </div>
              <Switch
                checked={formData.acceptsPayPal}
                onCheckedChange={(checked) => handleInputChange("acceptsPayPal", checked)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="pt-6 border-t border-border space-y-4">
        {/* Mobile: Stack buttons vertically */}
        <div className="flex flex-col sm:hidden gap-3">
          <Button 
            onClick={handleNext}
            disabled={!isValid}
            className="gap-2 h-12 order-1"
          >
            Continue to Course Content
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-3 order-2">
            <Button variant="outline" onClick={handleBack} className="gap-2 h-12 flex-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2 h-12 flex-1"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        
        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex justify-between">
          <Button variant="outline" onClick={handleBack} className="gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back to Thumbnail
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2 h-10"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save Course"}
            </Button>
          
            <Button 
              onClick={handleNext}
              disabled={!isValid}
              className="gap-2 h-10"
            >
              Continue to Course Content
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 