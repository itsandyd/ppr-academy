"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, FileText, AlertTriangle, Mail } from "lucide-react";
import { CopyrightClaimForm } from "./copyright-claim-form";

export function DMCAContent() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">DMCA Policy</h1>
        <p className="text-lg text-muted-foreground">
          PPR Academy respects the intellectual property rights of others and expects our users to
          do the same. This page explains our policy for handling copyright infringement claims
          under the Digital Millennium Copyright Act (DMCA).
        </p>
      </div>

      <Tabs defaultValue="policy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="submit">Submit Claim</TabsTrigger>
          <TabsTrigger value="counter">Counter-Notice</TabsTrigger>
        </TabsList>

        <TabsContent value="policy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Designated DMCA Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                To file a copyright infringement notification, you must send a written communication
                to our designated agent:
              </p>
              <div className="space-y-1 rounded-lg bg-muted p-4">
                <p className="font-semibold">PPR Academy DMCA Agent</p>
                <p>Email: dmca@ppr-academy.com</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Repeat Infringer Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>PPR Academy maintains a strict policy against repeat copyright infringers.</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    1
                  </div>
                  <div>
                    <p className="font-medium">First Strike</p>
                    <p className="text-sm text-muted-foreground">Content removed, warning issued</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Second Strike</p>
                    <p className="text-sm text-muted-foreground">
                      Content removed, account restricted
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Third Strike</p>
                    <p className="text-sm text-muted-foreground">Account permanently suspended</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                DMCA Notice Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">A valid DMCA takedown notice must include:</p>
              <ol className="list-inside list-decimal space-y-2 text-sm">
                <li>
                  A physical or electronic signature of the copyright owner or authorized agent
                </li>
                <li>Identification of the copyrighted work claimed to be infringed</li>
                <li>
                  Identification of the material that is claimed to be infringing, with sufficient
                  detail to locate it
                </li>
                <li>Your contact information (address, phone number, email)</li>
                <li>
                  A statement that you have a good faith belief that the use is not authorized
                </li>
                <li>
                  A statement, under penalty of perjury, that the information is accurate and you
                  are authorized to act on behalf of the copyright owner
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Copyright Infringement Claim</CardTitle>
              <CardDescription>
                Use this form to report content that infringes on your copyright. Please provide
                accurate information - false claims may result in legal liability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CopyrightClaimForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counter">
          <Card>
            <CardHeader>
              <CardTitle>Counter-Notification Process</CardTitle>
              <CardDescription>
                If you believe your content was wrongly removed, you may file a counter-notice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Filing a counter-notice is a legal process. By submitting a counter-notice, you
                  consent to the jurisdiction of federal court and agree to accept service of
                  process from the party who filed the original DMCA notice.
                </AlertDescription>
              </Alert>

              <p>
                If your content was removed due to a DMCA claim and you believe it was removed in
                error, you will receive an email with instructions for filing a counter-notice.
              </p>

              <p className="text-sm text-muted-foreground">
                Counter-notices must be sent to: <strong>dmca@ppr-academy.com</strong>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
