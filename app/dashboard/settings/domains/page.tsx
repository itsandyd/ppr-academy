"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Mail,
  Shield,
  ArrowLeft,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailDomainWizard } from "@/components/settings/email-domain-wizard";
import { DomainHealthDashboard } from "@/components/settings/domain-health-dashboard";
import { CustomDomainSetup } from "@/components/settings/custom-domain-setup";

export default function DomainsSettingsPage() {
  const { user } = useUser();
  const [showEmailWizard, setShowEmailWizard] = useState(false);

  // Get user's store
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get real domain health stats
  const healthStats = useQuery(api.emailHealthMonitoring.getDomainHealthStats);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Domain Settings</h1>
          <p className="text-muted-foreground">
            Manage your custom domains for storefront and email
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storefront Domain</p>
              <p className="font-semibold">
                {(store as any)?.customDomain || "Not configured"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Domain</p>
              <p className="font-semibold">
                {healthStats === undefined ? (
                  <Loader2 className="h-4 w-4 animate-spin inline" />
                ) : (
                  healthStats.domain
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain Health</p>
              {healthStats === undefined ? (
                <Loader2 className="h-4 w-4 animate-spin mt-1" />
              ) : (
                <Badge
                  className={`mt-1 ${
                    healthStats.reputationStatus === "excellent"
                      ? "bg-green-500"
                      : healthStats.reputationStatus === "good"
                      ? "bg-blue-500"
                      : healthStats.reputationStatus === "fair"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                >
                  {healthStats.reputationStatus.charAt(0).toUpperCase() +
                    healthStats.reputationStatus.slice(1)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="storefront" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="storefront" className="gap-2">
            <Globe className="h-4 w-4" />
            Storefront Domain
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Domain
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Shield className="h-4 w-4" />
            Domain Health
          </TabsTrigger>
        </TabsList>

        {/* Storefront Domain Tab */}
        <TabsContent value="storefront">
          {store?._id ? (
            <CustomDomainSetup
              storeId={store._id}
              storeName={store.name}
              storeSlug={store.slug}
              currentDomain={(store as any)?.customDomain}
              domainStatus={(store as any)?.domainStatus}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Store Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create a store first to set up a custom domain.
                </p>
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Email Domain Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Email Domain</CardTitle>
                  <CardDescription>
                    Send emails from your own domain for better deliverability
                  </CardDescription>
                </div>
                <Button onClick={() => setShowEmailWizard(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Email Domain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Current Email Domain */}
              <div className="rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Sending Domain</p>
                    <p className="text-xl font-mono font-semibold mt-1">
                      {healthStats === undefined ? (
                        <Loader2 className="h-5 w-5 animate-spin inline" />
                      ) : (
                        healthStats.domain
                      )}
                    </p>
                    {healthStats === undefined ? (
                      <Loader2 className="h-4 w-4 animate-spin mt-2" />
                    ) : (
                      <Badge
                        className={`mt-2 ${
                          healthStats.status === "active"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {healthStats.status === "active"
                          ? "Active - Shared Domain"
                          : "Pending Verification"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Emails send as</p>
                    <p className="font-mono text-sm mt-1">
                      {store?.name || "Your Store"} &lt;hello@{healthStats?.domain || "..."}&gt;
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits of Custom Domain */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                  <h4 className="font-semibold">Professional Branding</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send from you@yourdomain.com
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Shield className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                  <h4 className="font-semibold">Better Deliverability</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your own domain reputation
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Mail className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-semibold">Full Control</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Own your email infrastructure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Health Tab */}
        <TabsContent value="health">
          <DomainHealthDashboard storeId={store?._id as string} />
        </TabsContent>
      </Tabs>

      {/* Email Domain Wizard Dialog */}
      <Dialog open={showEmailWizard} onOpenChange={setShowEmailWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Set Up Custom Email Domain</DialogTitle>
            <DialogDescription>
              Configure your own domain for sending emails
            </DialogDescription>
          </DialogHeader>
          <EmailDomainWizard
            onComplete={() => setShowEmailWizard(false)}
            onCancel={() => setShowEmailWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
