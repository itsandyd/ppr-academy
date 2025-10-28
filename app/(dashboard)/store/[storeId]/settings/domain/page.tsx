"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DomainSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [domain, setDomain] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Get app URL from env
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'ppr-academy.com';
  const appDomain = appUrl.replace('https://', '').replace('http://', '');
  
  // Feature flag for requiring pro subscription
  const requireProForDomain = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_REQUIRES_PRO === 'true';

  // Fetch store
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  // Mutations
  const connectDomain = useMutation(api.customDomains.connectCustomDomain);
  const removeDomain = useMutation(api.customDomains.removeCustomDomain);

  const handleCopyDNS = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard!");
  };

  const handleConnectDomain = async () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    setIsConnecting(true);
    try {
      const result = await connectDomain({
        storeId: storeId as any,
        domain: domain.trim(),
      });

      if (result.success) {
        toast.success(result.message);
        setDomain("");
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect domain");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Are you sure you want to remove your custom domain?")) return;

    try {
      const result = await removeDomain({ storeId: storeId as any });
      if (result.success) {
        toast.success(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove domain");
    }
  };

  const currentDomain = (store as any)?.customDomain;
  const domainStatus = (store as any)?.domainStatus || "none";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 -ml-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-chart-1/20 to-chart-2/20 rounded-xl">
            <Globe className="w-8 h-8 text-chart-1" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
              Custom Domain
            </h1>
            <p className="text-muted-foreground mt-1">
              Use your own domain for your storefront
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Your Storefront URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default URL */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Default URL (always works)</p>
                <p className="font-mono font-medium">{appDomain}/{store?.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyDNS(`${appUrl}/${store?.slug}`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${appUrl}/${store?.slug}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          {currentDomain ? (
            <div className="p-4 bg-chart-2/10 rounded-lg border border-chart-2/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground">Custom Domain</p>
                    <Badge className={
                      domainStatus === 'active' 
                        ? 'bg-chart-2/10 text-chart-2'
                        : domainStatus === 'verifying'
                        ? 'bg-chart-5/10 text-chart-5'
                        : 'bg-muted text-muted-foreground'
                    }>
                      {domainStatus === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {domainStatus}
                    </Badge>
                  </div>
                  <p className="font-mono font-medium text-lg">{currentDomain}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://${currentDomain}`, '_blank')}
                  disabled={domainStatus !== 'active'}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
              <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No custom domain connected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect Domain */}
      {!currentDomain && (
        <Card className="border-chart-1/20">
          <CardHeader>
            <CardTitle>Connect Your Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="beatsbymike.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
              />
              <p className="text-xs text-muted-foreground">
                Enter your domain without http:// or www
              </p>
            </div>

            {requireProForDomain && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Pro Feature</AlertTitle>
                <AlertDescription>
                  Custom domains require a Pro subscription ($29/month). You'll be prompted to upgrade after connecting your domain.
                </AlertDescription>
              </Alert>
            )}
            
            {!requireProForDomain && (
              <Alert className="bg-chart-1/10 border-chart-1/20">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                <AlertTitle>Free Feature</AlertTitle>
                <AlertDescription>
                  Custom domains are free during beta! Connect your domain at no cost.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleConnectDomain}
              disabled={!domain || isConnecting}
              className="w-full bg-gradient-to-r from-chart-1 to-chart-2"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 mr-2" />
                  Connect Domain
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DNS Instructions (when domain is pending) */}
      {currentDomain && domainStatus !== 'active' && (
        <Card className="border-chart-5/20">
          <CardHeader>
            <CardTitle>DNS Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-chart-5/10 border-chart-5/20">
              <AlertCircle className="h-4 w-4 text-chart-5" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Add these DNS records at your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 grid grid-cols-3 gap-4 text-sm font-semibold border-b">
                <div>Type</div>
                <div>Name</div>
                <div>Value</div>
              </div>
              
              {/* A Record */}
              <div className="p-3 grid grid-cols-3 gap-4 text-sm border-b hover:bg-muted/50">
                <div className="font-mono">A</div>
                <div className="font-mono">@</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">76.76.21.21</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyDNS("76.76.21.21")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* CNAME Record */}
              <div className="p-3 grid grid-cols-3 gap-4 text-sm hover:bg-muted/50">
                <div className="font-mono">CNAME</div>
                <div className="font-mono">www</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">cname.vercel-dns.com</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyDNS("cname.vercel-dns.com")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              After adding these records, verification can take 5-60 minutes. We'll automatically check and activate your domain.
            </p>

            <Button variant="outline" className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking Verification...
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why Use a Custom Domain?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Professional Branding</p>
                <p className="text-sm text-muted-foreground">Your domain, your brand identity</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">SEO Benefits</p>
                <p className="text-sm text-muted-foreground">Build your domain authority</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Trust & Credibility</p>
                <p className="text-sm text-muted-foreground">Professional presence builds trust</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Portability</p>
                <p className="text-sm text-muted-foreground">You own the domain forever</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

