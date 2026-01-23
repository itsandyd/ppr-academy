"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CreditCard,
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  Percent,
  RefreshCw,
  Key,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Banknote,
  Receipt,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Check if Stripe keys are configured via environment variables
const stripeConfig = {
  hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  hasSecretKey: true, // We can't check server-side env vars from client, assume configured
  hasWebhookSecret: true, // We can't check server-side env vars from client, assume configured
  isTestMode: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") ?? true,
};

export default function BillingSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Platform Fees
    platformFeePercent: "10",
    platformFeeFixed: "0.30",
    // Payout Settings
    payoutSchedule: "weekly",
    payoutMinimum: "50",
    payoutCurrency: "USD",
    // Tax Settings
    collectTax: true,
    taxProvider: "stripe",
    defaultTaxRate: "0",
    // Currencies
    defaultCurrency: "USD",
    supportedCurrencies: ["USD", "EUR", "GBP"],
    // Features
    enableSubscriptions: true,
    enableOneTimePurchases: true,
    enablePaymentPlans: false,
    trialDays: "7",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Billing settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing Settings</h1>
            <p className="text-muted-foreground">Stripe configuration and payment settings</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Mode Alert */}
      {stripeConfig.isTestMode ? (
        <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Mode Active</AlertTitle>
          <AlertDescription>
            Stripe is currently in test mode. No real charges will be made.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-100">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Live Mode Active</AlertTitle>
          <AlertDescription>
            Stripe is in live mode. Real charges will be made.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stripe API Keys Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Stripe Configuration
            </CardTitle>
            <CardDescription>API keys are configured via environment variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Publishable Key</span>
                  <code className="text-xs text-muted-foreground">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
                </div>
                {stripeConfig.hasPublishableKey ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Missing
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Secret Key</span>
                  <code className="text-xs text-muted-foreground">STRIPE_SECRET_KEY</code>
                </div>
                <Badge variant="secondary">
                  <Key className="mr-1 h-3 w-3" />
                  Server-side only
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Webhook Secret</span>
                  <code className="text-xs text-muted-foreground">STRIPE_WEBHOOK_SECRET</code>
                </div>
                <Badge variant="secondary">
                  <Key className="mr-1 h-3 w-3" />
                  Server-side only
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Mode: {stripeConfig.isTestMode ? "Test" : "Live"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stripeConfig.isTestMode
                  ? "Using test API keys. No real charges will be made."
                  : "Using live API keys. Real charges will be processed."}
              </p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Keys in Stripe Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Platform Fees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Platform Fees
            </CardTitle>
            <CardDescription>Configure your platform commission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformFeePercent">Percentage Fee (%)</Label>
                <div className="relative">
                  <Input
                    id="platformFeePercent"
                    type="number"
                    step="0.1"
                    value={settings.platformFeePercent}
                    onChange={(e) =>
                      setSettings({ ...settings, platformFeePercent: e.target.value })
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformFeeFixed">Fixed Fee ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="platformFeeFixed"
                    type="number"
                    step="0.01"
                    value={settings.platformFeeFixed}
                    onChange={(e) =>
                      setSettings({ ...settings, platformFeeFixed: e.target.value })
                    }
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Fee Calculation Example</p>
              <p className="mt-1 text-sm text-muted-foreground">
                For a $100 sale: ${settings.platformFeePercent}% + ${settings.platformFeeFixed} ={" "}
                <span className="font-medium text-foreground">
                  ${(100 * parseFloat(settings.platformFeePercent) / 100 + parseFloat(settings.platformFeeFixed)).toFixed(2)}
                </span>{" "}
                platform fee
              </p>
              <p className="text-sm text-muted-foreground">
                Creator receives:{" "}
                <span className="font-medium text-green-600">
                  ${(100 - (100 * parseFloat(settings.platformFeePercent) / 100 + parseFloat(settings.platformFeeFixed))).toFixed(2)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Creator Payouts
            </CardTitle>
            <CardDescription>Configure payout schedule and thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payoutSchedule">Payout Schedule</Label>
              <Select
                value={settings.payoutSchedule}
                onValueChange={(value) => setSettings({ ...settings, payoutSchedule: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payoutMinimum">Minimum Payout ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="payoutMinimum"
                    type="number"
                    value={settings.payoutMinimum}
                    onChange={(e) =>
                      setSettings({ ...settings, payoutMinimum: e.target.value })
                    }
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payoutCurrency">Payout Currency</Label>
                <Select
                  value={settings.payoutCurrency}
                  onValueChange={(value) => setSettings({ ...settings, payoutCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Tax Settings
            </CardTitle>
            <CardDescription>Configure tax collection and reporting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Collect Tax</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically calculate and collect tax
                </p>
              </div>
              <Switch
                checked={settings.collectTax}
                onCheckedChange={(checked) => setSettings({ ...settings, collectTax: checked })}
              />
            </div>
            {settings.collectTax && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="taxProvider">Tax Provider</Label>
                  <Select
                    value={settings.taxProvider}
                    onValueChange={(value) => setSettings({ ...settings, taxProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe Tax</SelectItem>
                      <SelectItem value="taxjar">TaxJar</SelectItem>
                      <SelectItem value="avalara">Avalara</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {settings.taxProvider === "manual" && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="defaultTaxRate"
                      type="number"
                      step="0.01"
                      value={settings.defaultTaxRate}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultTaxRate: e.target.value })
                      }
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Features */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Features
            </CardTitle>
            <CardDescription>Enable or disable payment options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Subscriptions</p>
                    <p className="text-sm text-muted-foreground">Recurring payments</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enableSubscriptions}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableSubscriptions: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">One-Time</p>
                    <p className="text-sm text-muted-foreground">Single purchases</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enableOneTimePurchases}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableOneTimePurchases: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Payment Plans</p>
                    <p className="text-sm text-muted-foreground">Split payments</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enablePaymentPlans}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enablePaymentPlans: checked })
                  }
                />
              </div>
            </div>
            {settings.enableSubscriptions && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="trialDays">Default Trial Period (days)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={settings.trialDays}
                  onChange={(e) => setSettings({ ...settings, trialDays: e.target.value })}
                  className="max-w-[200px]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supported Currencies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Settings
            </CardTitle>
            <CardDescription>Configure supported currencies for payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                value={settings.defaultCurrency}
                onValueChange={(value) => setSettings({ ...settings, defaultCurrency: value })}
              >
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supported Currencies</Label>
              <div className="flex flex-wrap gap-2">
                {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"].map((currency) => (
                  <Badge
                    key={currency}
                    variant={
                      settings.supportedCurrencies.includes(currency) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      const newCurrencies = settings.supportedCurrencies.includes(currency)
                        ? settings.supportedCurrencies.filter((c) => c !== currency)
                        : [...settings.supportedCurrencies, currency];
                      setSettings({ ...settings, supportedCurrencies: newCurrencies });
                    }}
                  >
                    {currency}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Click to toggle currency support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
