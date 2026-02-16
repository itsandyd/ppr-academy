import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserFromClerk } from "@/lib/convex-data";
import CoachApplicationForm from "@/components/coach-application-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function CoachApplicationPage() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    redirect("/");
  }

  const user = await getUserFromClerk(clerkId);
  
  if (!user) {
    redirect("/dashboard");
  }

  // Check if user already has created courses (is already a coach)
  // This would be better with a proper coach status field
  // For now, we'll let them apply regardless

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/become-a-coach">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Coach Info
          </Button>
        </Link>

        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-dark mb-6">
              Coach Application
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Tell us about your experience and why you'd be a great coach for the PPR Academy community.
            </p>

            <CoachApplicationForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 