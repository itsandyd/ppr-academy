"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CourseSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseSlug = params.slug as string;
  const sessionId = searchParams.get("session_id");
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("No payment session found");
        setIsVerifying(false);
        return;
      }

      try {
        // Call payment verification API
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();

        if (result.success && result.verified) {
          setVerificationResult({
            success: true,
            courseTitle: result.courseTitle || "Your Course",
            customerName: result.customerName || "Student",
            amount: result.amount || 0,
            courseId: result.courseId,
          });
        } else {
          setError(result.message || "Payment verification failed");
        }

        setIsVerifying(false);
      } catch (error) {
        console.error("Payment verification failed:", error);
        setError("Failed to verify payment. Please check your library or contact support.");
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your enrollment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Payment Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href={`/courses/${courseSlug}/checkout`}>
                Try Again
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-2xl">
        <CardContent className="p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            🎉 Enrollment Successful!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Welcome to "{verificationResult?.courseTitle}"! You now have lifetime access to all course content.
          </p>

          {/* What's Next */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-emerald-800 mb-3">What's Next?</h3>
            <ul className="text-sm text-emerald-700 space-y-2">
              <li>• Check your email for course access details</li>
              <li>• Start with Module 1 to begin your learning journey</li>
              <li>• Access your course anytime from your account</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard?mode=learn">
                <GraduationCap className="w-5 h-5 mr-2" />
                Go to My Courses
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="/courses">
                <ArrowRight className="w-5 h-5 mr-2" />
                Browse More Courses
              </Link>
            </Button>
          </div>

          {/* Payment Details */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Payment ID: {sessionId}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
