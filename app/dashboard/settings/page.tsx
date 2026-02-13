"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Bell, Shield, CreditCard, Palette, Save, Loader2, Globe, ArrowRight, Mail, ExternalLink, Crown } from "lucide-react";
import Link from "next/link";
import { PprProBadge } from "@/components/ppr-pro-upsell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const profile = useQuery(api.users.getMyProfile);
  const updateProfile = useMutation(api.users.updateMyProfile);
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );
  const pprProSubscription = useQuery(
    api.pprPro.getSubscription,
    user?.id ? { userId: user.id } : "skip"
  );

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name || undefined,
        bio: formData.bio || undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-5">
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="domains" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Domains</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="space-y-6">
            {/* Public Profile Card - Link to /store/profile */}
            {store && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Public Profile</h4>
                      <p className="text-sm text-muted-foreground">
                        Edit your storefront appearance, bio, and social links
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/dashboard/profile">
                      Edit Profile
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your private account details (not shown publicly)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user?.fullName || formData.name || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={user?.primaryEmailAddress?.emailAddress || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Managed by your authentication provider
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Internal Notes</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Private notes about yourself..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is for your records only and not displayed publicly
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>Configure custom domains for your storefront and email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Storefront Domain</h4>
                      <p className="text-xs text-muted-foreground">Use your own domain for your store</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect a custom domain like store.yourdomain.com to your storefront.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/dashboard/settings/domains">
                      Configure
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-lg border p-4 hover:border-green-300 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Email Domain</h4>
                      <p className="text-xs text-muted-foreground">Send from your own domain</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configure SPF, DKIM, and DMARC for better email deliverability.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/dashboard/settings/domains?tab=email">
                      Configure
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold">Domain Health Dashboard</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Monitor SPF, DKIM, and DMARC status, track reputation scores, and ensure optimal deliverability.
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/settings/domains?tab=health">
                    View Health Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates about your courses</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive tips and product updates</p>
                  </div>
                  <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                </div>
              </CardContent>
            </Card>

            {/* Integrations Link */}
            <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Slack & Discord Integrations</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect your team chat for workflow notifications
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href="/dashboard/settings/integrations">
                    Configure
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-6">
            {/* PPR Pro Membership Section */}
            <Card className={pprProSubscription?.status === "active" || pprProSubscription?.status === "trialing" ? "border-primary/30" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle>PPR Pro Membership</CardTitle>
                  {(pprProSubscription?.status === "active" || pprProSubscription?.status === "trialing") && (
                    <PprProBadge />
                  )}
                </div>
                <CardDescription>
                  {pprProSubscription?.status === "active" || pprProSubscription?.status === "trialing"
                    ? "Your unlimited course access membership"
                    : "Get unlimited access to all courses"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pprProSubscription?.status === "active" || pprProSubscription?.status === "trialing" ? (
                  <>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-semibold text-lg">
                          PPR Pro {pprProSubscription?.plan === "yearly" ? "Yearly" : "Monthly"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pprProSubscription?.status === "trialing" ? (
                            <span className="text-blue-600">Trial period</span>
                          ) : pprProSubscription?.cancelAtPeriodEnd ? (
                            <span className="text-amber-600">Cancelling at end of period</span>
                          ) : (
                            <span className="text-green-600">Active</span>
                          )}
                          {pprProSubscription?.currentPeriodEnd && (
                            <span className="ml-2">
                              &middot; Next billing:{" "}
                              {new Date(pprProSubscription.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/ppr-pro/billing-portal", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                stripeCustomerId: pprProSubscription?.stripeCustomerId,
                              }),
                            });
                            const data = await response.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              toast.error(data.error || "Failed to open billing portal");
                            }
                          } catch {
                            toast.error("Failed to open billing portal");
                          }
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </Button>
                    </div>
                  </>
                ) : pprProSubscription?.status === "past_due" ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                    <p className="font-semibold text-red-700 dark:text-red-400">Payment Past Due</p>
                    <p className="text-sm text-red-600 dark:text-red-400/80">
                      Your PPR Pro payment failed. Please update your payment method to continue access.
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/ppr-pro/billing-portal", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              stripeCustomerId: pprProSubscription?.stripeCustomerId,
                            }),
                          });
                          const data = await response.json();
                          if (data.url) {
                            window.location.href = data.url;
                          } else {
                            toast.error("Failed to open billing portal");
                          }
                        } catch {
                          toast.error("Failed to open billing portal");
                        }
                      }}
                    >
                      Update Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">Not subscribed</p>
                      <p className="text-sm text-muted-foreground">
                        Get unlimited access to all courses for $12/month
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/pricing">
                        Upgrade to Pro
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Plan (Creator) */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your subscription and plan details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg capitalize">
                        {store?.plan || "Free"} Plan
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {store?.subscriptionStatus === "active" ? (
                          <span className="text-green-600">Active subscription</span>
                        ) : store?.subscriptionStatus === "trialing" ? (
                          <span className="text-blue-600">Trial period</span>
                        ) : store?.plan === "early_access" ? (
                          <span className="text-purple-600">Early Access (Lifetime)</span>
                        ) : (
                          <span>Free tier</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/pricing">
                      {store?.plan === "free" || !store?.plan ? "Upgrade" : "Change Plan"}
                    </Link>
                  </Button>
                </div>

                {/* Plan Features Preview */}
                {store?.plan && store.plan !== "free" && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <h4 className="font-medium mb-2">Plan Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {store.plan === "starter" && (
                        <>
                          <li>10,000 email sends/month</li>
                          <li>5 courses</li>
                          <li>Basic analytics</li>
                        </>
                      )}
                      {store.plan === "creator" && (
                        <>
                          <li>50,000 email sends/month</li>
                          <li>Unlimited courses</li>
                          <li>Advanced analytics</li>
                          <li>Custom domain</li>
                        </>
                      )}
                      {store.plan === "creator_pro" && (
                        <>
                          <li>200,000 email sends/month</li>
                          <li>Unlimited everything</li>
                          <li>Priority support</li>
                          <li>White-label options</li>
                        </>
                      )}
                      {store.plan === "early_access" && (
                        <>
                          <li>Unlimited email sends</li>
                          <li>Unlimited courses</li>
                          <li>All features included</li>
                          <li>Early Access benefits</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Portal */}
            {store?.stripeCustomerId && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Billing</CardTitle>
                  <CardDescription>
                    Update payment methods, view invoices, and manage your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/creator-plans/billing-portal", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ stripeCustomerId: store.stripeCustomerId }),
                        });
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          toast.error(data.error || "Failed to open billing portal");
                        }
                      } catch (error) {
                        toast.error("Failed to open billing portal");
                      }
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Billing Portal
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Securely manage your subscription through Stripe's billing portal
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>Track your resource usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Email Sends</span>
                      <span className="text-muted-foreground">
                        {store?.emailConfig?.emailsSentThisMonth || 0} / {
                          store?.plan === "early_access" ? "Unlimited" :
                          store?.plan === "creator_pro" ? "200,000" :
                          store?.plan === "creator" ? "50,000" :
                          store?.plan === "starter" ? "10,000" : "1,000"
                        }
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((store?.emailConfig?.emailsSentThisMonth || 0) / (
                              store?.plan === "creator_pro" ? 200000 :
                              store?.plan === "creator" ? 50000 :
                              store?.plan === "starter" ? 10000 : 1000
                            )) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the theme toggle in the sidebar to switch between light and dark mode.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
