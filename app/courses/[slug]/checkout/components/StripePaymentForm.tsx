"use client";

import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, Shield } from "lucide-react";

interface StripePaymentFormProps {
  course: {
    _id: string;
    title: string;
    price?: number;
  };
  customerData: {
    name: string;
    email: string;
  };
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export function StripePaymentForm({ 
  course, 
  customerData, 
  onPaymentSuccess, 
  onPaymentError 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements || !course.price || course.price <= 0) {
      return;
    }

    if (!customerData.name.trim() || !customerData.email.trim()) {
      onPaymentError("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create payment intent on your server
      const response = await fetch("/api/courses/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          customerEmail: customerData.email,
          customerName: customerData.name,
          coursePrice: course.price,
          courseTitle: course.title,
          // TODO: Add creator's Stripe Connect account ID
          // creatorStripeAccountId: "acct_...",
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        onPaymentError(error);
        return;
      }

      // 2. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onPaymentError("Payment form not loaded");
        return;
      }

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerData.name,
            email: customerData.email,
          },
        },
      });

      if (stripeError) {
        onPaymentError(stripeError.message || "Payment failed");
      } else {
        // 3. Handle successful payment
        onPaymentSuccess();
      }

    } catch (error) {
      console.error("Payment error:", error);
      onPaymentError("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Payment Form */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Payment Information
          </label>
          <div className="border border-border rounded-lg p-4 bg-background">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your payment information is secure and encrypted
          </p>
        </div>

        {/* Test Card Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Test Payment
          </h4>
          <p className="text-sm text-blue-700 mb-2">Use this test card for development:</p>
          <div className="font-mono text-sm text-blue-800">
            <div>Card: 4242 4242 4242 4242</div>
            <div>Expiry: Any future date</div>
            <div>CVC: Any 3 digits</div>
          </div>
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={!stripe || isProcessing || !course.price || course.price <= 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${course.price} Now
            </>
          )}
        </Button>

        {/* Security Indicators */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>Stripe Powered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
