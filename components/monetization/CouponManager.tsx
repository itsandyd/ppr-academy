"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Copy, Eye, EyeOff } from "lucide-react";

interface CouponManagerProps {
  storeId: Id<"stores">;
  creatorId: string;
}

export function CouponManager({ storeId, creatorId }: CouponManagerProps) {
  const coupons = useQuery(api.coupons.getCouponsByStore, { storeId, includeInactive: true });
  const createCoupon = useMutation(api.coupons.createCoupon);
  const deactivateCoupon = useMutation(api.coupons.deactivateCoupon);
  const { toast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed_amount",
    discountValue: "",
    applicableTo: "all" as "all" | "courses" | "products" | "subscriptions",
    maxUses: "",
    validUntil: "",
  });

  const handleCreate = async () => {
    if (!formData.code || !formData.discountValue) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = Date.now();
      const validUntil = formData.validUntil
        ? new Date(formData.validUntil).getTime()
        : undefined;

      await createCoupon({
        code: formData.code,
        storeId,
        creatorId,
        discountType: formData.discountType,
        discountValue: parseInt(formData.discountValue) * (formData.discountType === "fixed_amount" ? 100 : 1),
        currency: formData.discountType === "fixed_amount" ? "USD" : undefined,
        applicableTo: formData.applicableTo,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        validFrom: now,
        validUntil,
      });

      toast({
        title: "Coupon created!",
        description: `Code ${formData.code} is now active`,
        className: "bg-white dark:bg-black",
      });

      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        applicableTo: "all",
        maxUses: "",
        validUntil: "",
      });
      setShowCreateForm(false);
    } catch (error: any) {
      toast({
        title: "Failed to create coupon",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (couponId: Id<"coupons">) => {
    try {
      await deactivateCoupon({ couponId });
      toast({
        title: "Coupon deactivated",
        className: "bg-white dark:bg-black",
      });
    } catch (error: any) {
      toast({
        title: "Failed to deactivate",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Code ${code} copied to clipboard`,
      className: "bg-white dark:bg-black",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Coupon Management</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Coupon"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Coupon</CardTitle>
            <CardDescription>Set up a discount code for your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: any) => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">
                  {formData.discountType === "percentage" ? "Percentage" : "Amount (USD)"} *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={formData.discountType === "percentage" ? "20" : "10"}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="applicableTo">Applies To</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value: any) => setFormData({ ...formData, applicableTo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="courses">Courses Only</SelectItem>
                  <SelectItem value="products">Products Only</SelectItem>
                  <SelectItem value="subscriptions">Subscriptions Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Unlimited"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleCreate} className="w-full">
              Create Coupon
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons && coupons.length > 0 ? (
          coupons.map((coupon) => (
            <Card key={coupon._id} className={!coupon.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <code className="text-lg font-mono">{coupon.code}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% off`
                    : `$${(coupon.discountValue / 100).toFixed(2)} off`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span>{coupon.currentUses}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="flex items-center gap-1">
                      {coupon.isActive ? (
                        <>
                          <Eye className="w-4 h-4 text-green-500" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-gray-400" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  {coupon.isActive && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleDeactivate(coupon._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No coupons created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}





