"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Shield, Calendar, Award, User, BookOpen, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect } from "react";

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateId = params.certificateId as string;

  const certificate = useQuery(api.certificates.getCertificateById, { certificateId });
  const verifyCertificate = useMutation(api.certificates.verifyCertificate);

  // Log verification on mount
  useEffect(() => {
    if (certificateId) {
      verifyCertificate({
        certificateId,
        verifierUserAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
    }
  }, [certificateId]);

  if (certificate === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying certificate...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!certificate || !certificate.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <Card className="max-w-md w-full border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Certificate Not Valid</CardTitle>
            <CardDescription className="text-center">
              This certificate could not be verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 text-center">
                {!certificate 
                  ? "No certificate found with this ID. It may have been entered incorrectly or does not exist."
                  : "This certificate has been revoked or is no longer valid."
                }
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-4">
                Certificate ID: <code className="bg-muted px-2 py-1 rounded">{certificateId}</code>
              </p>
              <Button asChild variant="outline">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
      <Card className="max-w-2xl w-full border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Certificate Verified</CardTitle>
          <CardDescription className="text-center">
            This is an authentic certificate issued by PausePlayRepeat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Badge */}
          <div className="flex justify-center">
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-base px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Verified Authentic
            </Badge>
          </div>

          {/* Certificate Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Name */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Student</span>
                </div>
                <p className="font-semibold text-lg">{certificate.userName}</p>
              </div>

              {/* Course */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Course</span>
                </div>
                <p className="font-semibold text-lg">{certificate.courseTitle}</p>
              </div>

              {/* Instructor */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Instructor</span>
                </div>
                <p className="font-semibold">{certificate.instructorName}</p>
              </div>

              {/* Completion Date */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="font-semibold">
                  {format(new Date(certificate.completionDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Course Completion</span>
                <span className="text-2xl font-bold text-primary">{certificate.completionPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{certificate.completedChapters} of {certificate.totalChapters} chapters completed</span>
              </div>
            </div>
          </div>

          {/* Certificate ID & Verification Code */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Certificate ID:</span>
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">{certificate.certificateId}</code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Verification Code:</span>
              <code className="bg-muted px-2 py-1 rounded font-mono font-bold">{certificate.verificationCode}</code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Times Verified:</span>
              <span className="font-medium">{certificate.verificationCount + 1}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Browse Courses</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/library">My Library</Link>
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground pt-4 border-t">
            This certificate can be verified at any time using the certificate ID or verification code above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
