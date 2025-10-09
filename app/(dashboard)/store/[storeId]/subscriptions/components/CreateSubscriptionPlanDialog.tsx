"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface CreateSubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: Id<"stores">;
  creatorId: string;
  existingPlan?: any;
}

export function CreateSubscriptionPlanDialog({
  open,
  onOpenChange,
  storeId,
  creatorId,
  existingPlan,
}: CreateSubscriptionPlanDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState(1);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);
  const [hasAllCourses, setHasAllCourses] = useState(true);
  const [hasAllProducts, setHasAllProducts] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<Id<"courses">[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Id<"digitalProducts">[]>([]);
  const [trialDays, setTrialDays] = useState("");
  const [loading, setLoading] = useState(false);

  const courses = useQuery(api.courses.getCoursesByStore, { storeId });
  const products = useQuery(api.digitalProducts.getProductsByStore, { storeId });

  const createPlan = useMutation(api.subscriptions.createSubscriptionPlan);
  const updatePlan = useMutation(api.subscriptions.updateSubscriptionPlan);

  // Load existing plan data if editing
  useEffect(() => {
    if (existingPlan) {
      setName(existingPlan.name || "");
      setDescription(existingPlan.description || "");
      setTier(existingPlan.tier || 1);
      setMonthlyPrice((existingPlan.monthlyPrice / 100).toString());
      setYearlyPrice((existingPlan.yearlyPrice / 100).toString());
      setFeatures(existingPlan.features || [""]);
      setHasAllCourses(existingPlan.hasAllCourses || false);
      setHasAllProducts(existingPlan.hasAllProducts || false);
      setSelectedCourses(existingPlan.courseAccess || []);
      setSelectedProducts(existingPlan.digitalProductAccess || []);
      setTrialDays(existingPlan.trialDays?.toString() || "");
    } else {
      // Reset form
      setName("");
      setDescription("");
      setTier(1);
      setMonthlyPrice("");
      setYearlyPrice("");
      setFeatures([""]);
      setHasAllCourses(true);
      setHasAllProducts(true);
      setSelectedCourses([]);
      setSelectedProducts([]);
      setTrialDays("");
    }
  }, [existingPlan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const monthlyPriceCents = Math.round(parseFloat(monthlyPrice) * 100);
      const yearlyPriceCents = Math.round(parseFloat(yearlyPrice) * 100);

      // Filter out empty features
      const validFeatures = features.filter((f) => f.trim() !== "");

      if (existingPlan) {
        await updatePlan({
          planId: existingPlan._id,
          name,
          description,
          monthlyPrice: monthlyPriceCents,
          yearlyPrice: yearlyPriceCents,
          features: validFeatures,
          hasAllCourses,
          hasAllProducts,
          courseAccess: hasAllCourses ? [] : selectedCourses,
          digitalProductAccess: hasAllProducts ? [] : selectedProducts,
          trialDays: trialDays ? parseInt(trialDays) : undefined,
        });
        toast.success("Plan updated successfully!");
      } else {
        await createPlan({
          storeId,
          creatorId,
          name,
          description,
          tier,
          monthlyPrice: monthlyPriceCents,
          yearlyPrice: yearlyPriceCents,
          currency: "usd",
          features: validFeatures,
          hasAllCourses,
          hasAllProducts,
          courseAccess: hasAllCourses ? [] : selectedCourses,
          digitalProductAccess: hasAllProducts ? [] : selectedProducts,
          trialDays: trialDays ? parseInt(trialDays) : undefined,
        });
        toast.success("Plan created successfully!");
      }

      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const calculateSavings = () => {
    if (!monthlyPrice || !yearlyPrice) return 0;
    const monthly = parseFloat(monthlyPrice) * 12;
    const yearly = parseFloat(yearlyPrice);
    if (monthly === 0) return 0;
    return Math.round(((monthly - yearly) / monthly) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
        <DialogHeader>
          <DialogTitle>
            {existingPlan ? "Edit" : "Create"} Subscription Plan
          </DialogTitle>
          <DialogDescription>
            Set up a subscription tier for your content. Subscribers get access to courses and products you choose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Plan Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., All Access Pass"
                required
                className={!name ? "border-red-500" : ""}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this plan includes..."
                rows={3}
              />
            </div>

            {!existingPlan && (
              <div>
                <Label htmlFor="tier">Tier Level</Label>
                <Input
                  id="tier"
                  type="number"
                  min="1"
                  value={tier}
                  onChange={(e) => setTier(parseInt(e.target.value))}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher tiers can access lower tier content
                </p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-medium">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyPrice">Monthly Price ($) <span className="text-red-500">*</span></Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="29.99"
                  required
                  className={!monthlyPrice ? "border-red-500" : ""}
                />
              </div>
              <div>
                <Label htmlFor="yearlyPrice">Yearly Price ($) <span className="text-red-500">*</span></Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                  placeholder="290.00"
                  required
                  className={!yearlyPrice ? "border-red-500" : ""}
                />
                {calculateSavings() > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Saves {calculateSavings()}% vs monthly
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="trialDays">Free Trial (days)</Label>
              <Input
                id="trialDays"
                type="number"
                min="0"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Offer a free trial period
              </p>
            </div>
          </div>

          {/* Content Access */}
          <div className="space-y-4">
            <h3 className="font-medium">Content Access</h3>
            
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allCourses">All Courses</Label>
                  <p className="text-xs text-muted-foreground">
                    Grant access to all current and future courses
                  </p>
                </div>
                <Switch
                  id="allCourses"
                  checked={hasAllCourses}
                  onCheckedChange={setHasAllCourses}
                />
              </div>

              {!hasAllCourses && courses && courses.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Courses</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`course-${course._id}`}
                          checked={selectedCourses.includes(course._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCourses([...selectedCourses, course._id]);
                            } else {
                              setSelectedCourses(selectedCourses.filter(id => id !== course._id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`course-${course._id}`}
                          className="text-sm cursor-pointer"
                        >
                          {course.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allProducts">All Digital Products</Label>
                  <p className="text-xs text-muted-foreground">
                    Grant access to all current and future products
                  </p>
                </div>
                <Switch
                  id="allProducts"
                  checked={hasAllProducts}
                  onCheckedChange={setHasAllProducts}
                />
              </div>

              {!hasAllProducts && products && products.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Products</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product._id}`}
                          checked={selectedProducts.includes(product._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts([...selectedProducts, product._id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product._id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`product-${product._id}`}
                          className="text-sm cursor-pointer"
                        >
                          {product.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Features</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="w-3 h-3 mr-1" />
                Add Feature
              </Button>
            </div>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="e.g., Priority support"
                  />
                  {features.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : existingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

