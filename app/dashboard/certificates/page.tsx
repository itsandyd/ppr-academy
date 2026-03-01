"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Loader2, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default function CertificatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "learn" | "create" | null;
  const { user, isLoaded: isUserLoaded } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);

  useEffect(() => {
    if (!mode || mode !== "learn") {
      router.push("/dashboard/certificates?mode=learn");
    }
  }, [mode, router]);

  const convexUser = useQuery(api.users.getUserFromClerk, effectiveUserId ? { clerkId: effectiveUserId } : "skip");

  const userCertificates = useQuery(
    api.certificates.getUserCertificates,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const isLoading =
    !isUserLoaded || (user && convexUser === undefined) || userCertificates === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Certificates</h1>
            <p className="text-muted-foreground">
              {userCertificates && userCertificates.length > 0
                ? `${userCertificates.length} certificate${userCertificates.length !== 1 ? "s" : ""} earned`
                : "Complete courses to earn certificates"}
            </p>
          </div>
        </div>
        <Link href="/dashboard?mode=learn">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {userCertificates && userCertificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {userCertificates.map((certificate: any) => (
            <CertificateCard key={certificate._id} certificate={certificate} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="Earn your first certificate"
          description="Complete courses to earn shareable certificates that prove your skills. Add them to your profile and stand out."
          action={{ label: "Browse Courses", href: "/dashboard/courses?mode=learn" }}
        />
      )}
    </div>
  );
}
