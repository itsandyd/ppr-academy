"use client";

import { useState, Suspense } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, FileText, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

function CounterNoticeForm() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimId = searchParams.get("claim") as Id<"reports"> | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitCounterNotice = useMutation((api as any).copyright.submitCounterNotice);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    respondentName: user?.fullName || "",
    respondentEmail: user?.primaryEmailAddress?.emailAddress || "",
    respondentAddress: "",
    explanation: "",
    statementOfGoodFaith: false,
    consentToJurisdiction: false,
    digitalSignature: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!claimId) {
    return (
      <div className="mx-auto max-w-3xl px-8 pt-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Request</AlertTitle>
          <AlertDescription>
            No claim ID provided. Please access this page from a copyright claim notification.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-3xl px-8 pb-24 pt-10">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Counter-Notice Submitted</h2>
            <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
              Your counter-notice has been submitted successfully. We will review it and notify the
              original claimant. You will receive an email update within 10-14 business days.
            </p>
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.respondentName.trim()) {
      newErrors.respondentName = "Full legal name is required";
    }
    if (!formData.respondentEmail.trim()) {
      newErrors.respondentEmail = "Email address is required";
    }
    if (!formData.respondentAddress.trim()) {
      newErrors.respondentAddress = "Physical address is required for DMCA compliance";
    }
    if (!formData.explanation.trim()) {
      newErrors.explanation = "Please explain why you believe the claim is invalid";
    }
    if (formData.explanation.trim().length < 50) {
      newErrors.explanation = "Please provide a more detailed explanation (at least 50 characters)";
    }
    if (!formData.statementOfGoodFaith) {
      newErrors.statementOfGoodFaith = "You must agree to the good faith statement";
    }
    if (!formData.consentToJurisdiction) {
      newErrors.consentToJurisdiction = "You must consent to jurisdiction to proceed";
    }
    if (!formData.digitalSignature.trim()) {
      newErrors.digitalSignature = "Digital signature is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitCounterNotice({
        reportId: claimId,
        respondentName: formData.respondentName.trim(),
        respondentEmail: formData.respondentEmail.trim(),
        respondentAddress: formData.respondentAddress.trim(),
        explanation: formData.explanation.trim(),
        statementOfGoodFaith: formData.statementOfGoodFaith,
        consentToJurisdiction: formData.consentToJurisdiction,
        digitalSignature: formData.digitalSignature.trim(),
      });

      setIsSubmitted(true);
      toast.success("Counter-notice submitted successfully");
    } catch (error) {
      console.error("Failed to submit counter-notice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit counter-notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-8 pb-24 pt-10">
      <div className="mb-6">
        <Button variant="ghost" asChild size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">DMCA Counter-Notice</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Submit a formal counter-notice if you believe the copyright claim against your content is
          invalid
        </p>
      </div>

      <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">Legal Notice</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Filing a false counter-notice is perjury. Only submit a counter-notice if you have a good
          faith belief that the material was removed by mistake or misidentification. Consider
          consulting an attorney before proceeding.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Counter-Notice Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="respondentName">Full Legal Name *</Label>
                <Input
                  id="respondentName"
                  value={formData.respondentName}
                  onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                  placeholder="Your full legal name"
                  className={errors.respondentName ? "border-red-500" : ""}
                />
                {errors.respondentName && (
                  <p className="mt-1 text-sm text-red-500">{errors.respondentName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="respondentEmail">Email Address *</Label>
                <Input
                  id="respondentEmail"
                  type="email"
                  value={formData.respondentEmail}
                  onChange={(e) => setFormData({ ...formData, respondentEmail: e.target.value })}
                  placeholder="your@email.com"
                  className={errors.respondentEmail ? "border-red-500" : ""}
                />
                {errors.respondentEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.respondentEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="respondentAddress">Physical Address *</Label>
                <Textarea
                  id="respondentAddress"
                  value={formData.respondentAddress}
                  onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value })}
                  placeholder="Street address, city, state/province, postal code, country"
                  rows={3}
                  className={errors.respondentAddress ? "border-red-500" : ""}
                />
                {errors.respondentAddress && (
                  <p className="mt-1 text-sm text-red-500">{errors.respondentAddress}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Required under DMCA for service of process
                </p>
              </div>

              <div>
                <Label htmlFor="explanation">Explanation of Why the Claim is Invalid *</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Explain in detail why you believe the content was removed by mistake or misidentification. Include any evidence or documentation that supports your position."
                  rows={6}
                  className={errors.explanation ? "border-red-500" : ""}
                />
                {errors.explanation && (
                  <p className="mt-1 text-sm text-red-500">{errors.explanation}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">Required Legal Statements</h3>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="statementOfGoodFaith"
                  checked={formData.statementOfGoodFaith}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      statementOfGoodFaith: checked as boolean,
                    })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="statementOfGoodFaith"
                    className={`text-sm ${errors.statementOfGoodFaith ? "text-red-500" : ""}`}
                  >
                    I swear, under penalty of perjury, that I have a good faith belief that the
                    material was removed or disabled as a result of a mistake or misidentification
                    of the material to be removed or disabled. *
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentToJurisdiction"
                  checked={formData.consentToJurisdiction}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      consentToJurisdiction: checked as boolean,
                    })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="consentToJurisdiction"
                    className={`text-sm ${errors.consentToJurisdiction ? "text-red-500" : ""}`}
                  >
                    I consent to the jurisdiction of the Federal District Court for the judicial
                    district in which my address is located, or if my address is outside of the
                    United States, for any judicial district in which PPR Academy may be found, and
                    I will accept service of process from the person who provided the DMCA
                    notification or an agent of such person. *
                  </Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <Label htmlFor="digitalSignature">Digital Signature *</Label>
              <p className="mb-2 text-sm text-gray-500">
                Type your full legal name below to digitally sign this counter-notice
              </p>
              <Input
                id="digitalSignature"
                value={formData.digitalSignature}
                onChange={(e) => setFormData({ ...formData, digitalSignature: e.target.value })}
                placeholder="Type your full legal name"
                className={`font-serif italic ${errors.digitalSignature ? "border-red-500" : ""}`}
              />
              {errors.digitalSignature && (
                <p className="mt-1 text-sm text-red-500">{errors.digitalSignature}</p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <p className="mb-2 font-medium">What happens next?</p>
              <ul className="list-inside list-disc space-y-1">
                <li>We will forward your counter-notice to the original claimant</li>
                <li>The claimant has 10-14 business days to file a court action</li>
                <li>If no court action is filed, we will restore your content</li>
                <li>You will receive email updates throughout the process</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Counter-Notice"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CounterNoticePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-8 pt-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-64 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      }
    >
      <CounterNoticeForm />
    </Suspense>
  );
}
