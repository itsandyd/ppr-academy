"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "./StripePaymentForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  Clock, 
  BookOpen, 
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Shield,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface Course {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  skillLevel?: string;
  storeId: string;
  userId: string;
  modules?: Array<{
    title: string;
    lessons: Array<{ title: string; }>;
  }>;
}

interface Store {
  _id: string;
  name: string;
  slug: string;
}

interface Creator {
  name?: string;
  imageUrl?: string;
}

interface User {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses: Array<{
    emailAddress: string;
  }>;
}

interface CourseCheckoutProps {
  course: Course;
  store: Store;
  creator: Creator | null;
  user: User | null;
}

export function CourseCheckout({ course, store, creator, user }: CourseCheckoutProps) {
  const router = useRouter();
  const createCourseEnrollment = useMutation(api.library.createCourseEnrollment);
  
  // Check if user already has access to this course
  const hasAccess = useQuery(
    api.library.hasUserPurchasedCourse,
    user?.id ? { userId: user.id, courseId: course._id as any } : "skip"
  );
  
  // Auto-populate form with user data
  const [customerData, setCustomerData] = useState({
    name: user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "",
    email: user?.emailAddresses?.[0]?.emailAddress || "",
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate course stats
  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0;
  const estimatedHours = Math.round(totalLessons * 0.75);

  const creatorName = creator?.name || "Course Creator";
  const creatorInitials = creatorName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleEnrollment = async () => {
    if (!customerData.name.trim() || !customerData.email.trim()) {
      setPaymentError("Please fill in all required fields");
      return;
    }

    // Clear any previous errors
    setPaymentError(null);
    setIsProcessing(true);

    try {
      if (course.price && course.price > 0) {
        // Paid course - redirect to Stripe Checkout
        const response = await fetch("/api/courses/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course._id,
            courseSlug: course.slug || course._id,
            customerEmail: customerData.email,
            customerName: customerData.name,
            coursePrice: course.price,
            courseTitle: course.title,
            userId: user?.id, // Include user ID for library access
            stripePriceId: (course as any).stripePriceId, // Use stored Stripe price ID
            // TODO: Add creator's Stripe Connect account ID
            // creatorStripeAccountId: creator?.stripeConnectAccountId,
          }),
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
          // Redirect to Stripe's hosted checkout page
          window.location.href = data.checkoutUrl;
        } else {
          setPaymentError(data.error || "Failed to create checkout session");
        }
      } else {
        // Free course - direct enrollment
        console.log("Free course enrollment:", {
          courseId: course._id,
          customerData,
          userId: user?.id,
        });
        
        if (!user?.id) {
          setPaymentError("User authentication required for enrollment");
          return;
        }
        
        // Create free enrollment in Convex
        const purchaseId = await createCourseEnrollment({
          userId: user.id,
          courseId: course._id as any,
          amount: 0,
          currency: "USD",
          paymentMethod: "free",
          transactionId: `free_${Date.now()}_${user.id}`,
        });
        
        console.log("Free enrollment created:", purchaseId);
        setPaymentSuccess(true);
        
        // Redirect to library with success message
        router.push(`/library?enrollment=success&course=${encodeURIComponent(course.title)}`);
      }
      
    } catch (error) {
      console.error("Enrollment error:", error);
      setPaymentError("Failed to process enrollment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // If user already has access, show access granted page
  if (hasAccess === true) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-6">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">You Already Have Access!</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              You've already purchased "{course.title}". You can access it anytime from your library.
            </p>
            <div className="space-y-4">
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg">
                <Link href="/library">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Go to My Library
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12">
                <Link href={`/courses/${course.slug}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course Page
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/courses/${course.slug}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </Button>
            </Link>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Complete Your Enrollment</h1>
              <p className="text-muted-foreground">Secure checkout powered by Stripe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Full Name *
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={customerData.email}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll send your course access details to this email
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            {course.price && course.price > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Secure Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                    <CreditCard className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-emerald-800 mb-2">Stripe Checkout</h3>
                    <p className="text-emerald-700 text-sm mb-4">
                      You'll be redirected to Stripe's secure checkout page to complete your purchase
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-emerald-600">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>SSL Encrypted</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Stripe Powered</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-6 text-center">
                  <GraduationCap className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-emerald-800 mb-2">Free Course</h3>
                  <p className="text-emerald-700 text-sm">
                    This course is completely free. Just enter your details above to get instant access.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {paymentError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-700 text-sm">{paymentError}</p>
                </CardContent>
              </Card>
            )}

            {/* Enroll Button */}
            <Button
              onClick={handleEnrollment}
              disabled={isProcessing || !customerData.name.trim() || !customerData.email.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : course.price && course.price > 0 ? (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Complete Purchase - ${course.price}
                </>
              ) : (
                <>
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Enroll for Free
                </>
              )}
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Preview */}
                <div className="space-y-4">
                  <div className="w-full h-48 bg-emerald-100 rounded-lg overflow-hidden">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>
                  </div>
                </div>

                {/* Course Details */}
                <div className="space-y-3 pt-4 border-t border-emerald-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Modules</span>
                    <span className="font-medium">{totalModules}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium">{totalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span className="font-medium">~{estimatedHours} hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Access</span>
                    <span className="font-medium text-emerald-600">Lifetime</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-emerald-800">Course Price</span>
                    <span className="text-2xl font-bold text-emerald-800">
                      {course.price && course.price > 0 ? `$${course.price}` : "FREE"}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600">
                    {course.price && course.price > 0 ? "One-time payment • Lifetime access" : "No payment required • Instant access"}
                  </p>
                </div>

                {/* What's Included */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">What's Included:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{totalModules} comprehensive modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{totalLessons} detailed lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Self-paced learning</span>
                    </div>
                    {course.price && course.price > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>30-day money-back guarantee</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="text-center pt-4 border-t border-emerald-200">
                  <div className="flex items-center justify-center gap-4 text-xs text-emerald-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Instant access</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Powered by PausePlayRepeat Academy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
