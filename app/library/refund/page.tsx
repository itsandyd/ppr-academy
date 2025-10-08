"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RefundRequestPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedPurchase, setSelectedPurchase] = useState("");
  const [reason, setReason] = useState("");

  // For demo - would need actual purchase queries
  const requestRefund = useMutation(api.monetizationUtils.requestRefund);
  const userRefunds = useQuery(
    api.monetizationUtils.getUserRefunds,
    user ? { userId: user.id } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedPurchase || !reason) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would need actual purchase data
      await requestRefund({
        orderId: selectedPurchase,
        userId: user.id,
        storeId: "placeholder" as any, // Would come from purchase
        creatorId: "placeholder",
        itemType: "course",
        itemId: "placeholder",
        originalAmount: 5000,
        refundAmount: 5000,
        reason,
        revokeAccess: true,
      });

      toast({
        title: "Refund requested",
        description: "Your request has been submitted and will be reviewed within 2-3 business days",
        className: "bg-white dark:bg-black",
      });

      setSelectedPurchase("");
      setReason("");
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <p className="text-muted-foreground">You need to be signed in to request a refund</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/library">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💸 Request a Refund</h1>
        <p className="text-muted-foreground">
          We offer a 30-day money-back guarantee on all purchases
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Refund Request Form</CardTitle>
              <CardDescription>
                Please provide details about your refund request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="purchase">Select Purchase *</Label>
                  <Select value={selectedPurchase} onValueChange={setSelectedPurchase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a purchase" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="demo1">Demo Course - $99.00</SelectItem>
                      <SelectItem value="demo2">Demo Bundle - $199.00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Reason for Refund *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please explain why you're requesting a refund..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps us improve our products and services
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Important Information
                      </p>
                      <ul className="text-yellow-800 dark:text-yellow-200 space-y-1">
                        <li>• Access will be revoked once refund is processed</li>
                        <li>• Refunds typically process within 5-7 business days</li>
                        <li>• Refund eligibility: within 30 days of purchase</li>
                        <li>• Certificate progress will be lost</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit Refund Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Previous Refund Requests */}
          {userRefunds && userRefunds.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Previous Requests</CardTitle>
                <CardDescription>Your refund request history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userRefunds.map((refund) => (
                    <div
                      key={refund._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Order #{refund.orderId.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          Requested {new Date(refund.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(refund.refundAmount / 100).toFixed(2)}</p>
                        <p className={`text-sm ${
                          refund.status === "processed" ? "text-green-600" :
                          refund.status === "denied" ? "text-red-600" :
                          refund.status === "approved" ? "text-blue-600" :
                          "text-yellow-600"
                        }`}>
                          {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>30-day money-back guarantee</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>No questions asked</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>Full refund to original payment method</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>Fast processing (2-3 business days)</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact support before requesting a refund - we're here to help!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">When will I get my money back?</p>
                <p className="text-muted-foreground">
                  Refunds process within 5-7 business days after approval
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Can I repurchase later?</p>
                <p className="text-muted-foreground">
                  Yes, you can purchase again at any time
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">What about partial refunds?</p>
                <p className="text-muted-foreground">
                  Contact support to discuss partial refund options
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


