"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Server,
  Zap,
} from "lucide-react";

interface CustomDomainSetupProps {
  storeId: Id<"stores">;
  storeName?: string;
  storeSlug?: string;
  currentDomain?: string;
  domainStatus?: string;
  onDomainConnected?: (domain: string) => void;
}

interface DnsInstruction {
  type: string;
  name: string;
  value: string;
  description: string;
}

export function CustomDomainSetup({
  storeId,
  storeName,
  storeSlug,
  currentDomain,
  domainStatus,
  onDomainConnected,
}: CustomDomainSetupProps) {
  const { toast } = useToast();
  const [domain, setDomain] = useState(currentDomain || "");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDnsInstructions, setShowDnsInstructions] = useState(!!currentDomain);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  const connectDomain = useAction(api.customDomains.connectCustomDomain);
  const verifyDomain = useMutation(api.customDomains.verifyCustomDomain);
  const removeDomain = useAction(api.customDomains.removeCustomDomain);

  // DNS instructions for Vercel
  const dnsInstructions: DnsInstruction[] = [
    {
      type: "A",
      name: "@",
      value: "76.76.21.21",
      description: "Points your root domain to Vercel",
    },
    {
      type: "CNAME",
      name: "www",
      value: "cname.vercel-dns.com",
      description: "Redirects www to your root domain",
    },
  ];

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const validateDomain = (input: string): boolean => {
    const cleaned = input.toLowerCase().replace(/^(https?:\/\/|www\.)/i, "").trim();
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(cleaned);
  };

  const handleConnect = async () => {
    const cleanedDomain = domain.toLowerCase().replace(/^(https?:\/\/|www\.)/i, "").trim();

    if (!cleanedDomain) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    if (!validateDomain(cleanedDomain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., yourdomain.com)",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const result = await connectDomain({
        storeId,
        domain: cleanedDomain,
      });

      if (result.success) {
        setDomain(cleanedDomain);
        setShowDnsInstructions(true);
        toast({
          title: "Domain Connected!",
          description: result.message,
        });
        onDomainConnected?.(cleanedDomain);
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect domain",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationAttempts(prev => prev + 1);

    try {
      const result = await verifyDomain({ storeId });

      if (result.success && result.status === "active") {
        toast({
          title: "Domain Verified!",
          description: "Your custom domain is now active.",
        });
      } else {
        toast({
          title: "Verification Pending",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Please check DNS configuration",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this custom domain?")) {
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeDomain({ storeId });

      if (result.success) {
        setDomain("");
        setShowDnsInstructions(false);
        toast({
          title: "Domain Removed",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove domain",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "verifying":
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Verifying
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pending DNS
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Custom Domain
              </CardTitle>
              <CardDescription>
                Use your own domain for your storefront (e.g., store.yourdomain.com)
              </CardDescription>
            </div>
            {domainStatus && getStatusBadge(domainStatus)}
          </div>
        </CardHeader>
        <CardContent>
          {!showDnsInstructions ? (
            // Domain Input Form
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Your Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    placeholder="store.yourdomain.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting || !domain.trim()}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your domain without http:// or www. (e.g., store.yourdomain.com or yourdomain.com)
                </p>
              </div>

              {/* Current Store URL */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-1">Current Store URL:</p>
                <p className="font-mono text-sm">
                  {process.env.NEXT_PUBLIC_APP_URL || "https://academy.pauseplayrepeat.com"}/{storeSlug || "your-store"}
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium">Professional Branding</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium">Custom URL</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-xs font-medium">SSL Included</p>
                </div>
              </div>
            </div>
          ) : (
            // DNS Instructions & Status
            <div className="space-y-6">
              {/* Connected Domain Info */}
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Domain</p>
                  <p className="font-mono text-lg font-semibold">{domain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${domain}`, "_blank")}
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Visit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status Alert */}
              {domainStatus === "active" ? (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700 dark:text-green-300">Domain Active</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    Your custom domain is configured correctly and serving traffic.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="text-yellow-700 dark:text-yellow-300">DNS Configuration Required</AlertTitle>
                    <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                      Add the following DNS records to your domain registrar to complete setup.
                    </AlertDescription>
                  </Alert>

                  {/* DNS Records */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      DNS Records to Add
                    </h4>
                    {dnsInstructions.map((record, index) => (
                      <div key={index} className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge>{record.type} Record</Badge>
                          <span className="text-xs text-muted-foreground">{record.description}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Name/Host</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 bg-background px-3 py-2 rounded border text-sm font-mono">
                                {record.name}
                              </code>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(record.name, `name-${index}`)}
                              >
                                {copiedField === `name-${index}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Value/Points to</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 bg-background px-3 py-2 rounded border text-sm font-mono">
                                {record.value}
                              </code>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(record.value, `value-${index}`)}
                              >
                                {copiedField === `value-${index}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verify Button */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {verificationAttempts > 0 && (
                        <p>Verification attempts: {verificationAttempts}</p>
                      )}
                      <p>DNS changes can take up to 48 hours to propagate.</p>
                    </div>
                    <Button onClick={handleVerify} disabled={isVerifying}>
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Verify DNS
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-3">Popular Domain Registrars</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "GoDaddy", url: "https://dcc.godaddy.com/manage" },
              { name: "Namecheap", url: "https://ap.www.namecheap.com/domains/list" },
              { name: "Cloudflare", url: "https://dash.cloudflare.com" },
              { name: "Google Domains", url: "https://domains.google" },
            ].map((registrar) => (
              <Button
                key={registrar.name}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => window.open(registrar.url, "_blank")}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                {registrar.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
