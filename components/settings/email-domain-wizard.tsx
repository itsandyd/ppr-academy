"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StepProgressIndicator } from "@/components/ui/step-progress-indicator";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Loader2,
  Shield,
  Server,
  Globe,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface EmailDomainWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  verified: boolean;
}

export function EmailDomainWizard({ onComplete, onCancel }: EmailDomainWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    mx: boolean;
  }>({
    spf: false,
    dkim: false,
    dmarc: false,
    mx: false,
  });

  // DNS records that need to be configured
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  const steps = [
    { id: "intro", title: "Introduction", icon: Mail },
    { id: "domain", title: "Your Domain", icon: Globe },
    { id: "dns", title: "DNS Records", icon: Server },
    { id: "verify", title: "Verification", icon: Shield },
    { id: "complete", title: "Complete", icon: CheckCircle },
  ];

  const generateDnsRecords = (domain: string): DnsRecord[] => {
    const baseDomain = domain.replace(/^mail\./i, "");
    return [
      {
        type: "TXT",
        name: `mail.${baseDomain}`,
        value: "v=spf1 include:amazonses.com include:_spf.resend.com ~all",
        verified: false,
      },
      {
        type: "TXT",
        name: `resend._domainkey.${baseDomain}`,
        value: "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...",
        verified: false,
      },
      {
        type: "CNAME",
        name: `resend._domainkey.${baseDomain}`,
        value: `${baseDomain}.dkim.resend.dev`,
        verified: false,
      },
      {
        type: "TXT",
        name: `_dmarc.${baseDomain}`,
        value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@pauseplayrepeat.com",
        verified: false,
      },
      {
        type: "MX",
        name: `mail.${baseDomain}`,
        value: "feedback-smtp.us-east-1.amazonses.com (Priority: 10)",
        verified: false,
      },
    ];
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: "DNS record copied to clipboard",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDomainSubmit = () => {
    if (!domainName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    const cleanDomain = domainName.toLowerCase().replace(/^(https?:\/\/|www\.)/i, "");

    if (!domainRegex.test(cleanDomain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., yourdomain.com)",
        variant: "destructive",
      });
      return;
    }

    setDomainName(cleanDomain);
    setDnsRecords(generateDnsRecords(cleanDomain));
    setCurrentStep(2);
  };

  const handleVerify = async () => {
    setIsLoading(true);

    // Simulate verification check (in production this would call the Resend API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo, randomly verify some records
    const newStatus = {
      spf: Math.random() > 0.3,
      dkim: Math.random() > 0.4,
      dmarc: Math.random() > 0.3,
      mx: Math.random() > 0.5,
    };

    setVerificationStatus(newStatus);

    // Update DNS records status
    setDnsRecords(prev => prev.map((record, idx) => ({
      ...record,
      verified: idx === 0 ? newStatus.spf :
                idx === 1 || idx === 2 ? newStatus.dkim :
                idx === 3 ? newStatus.dmarc : newStatus.mx,
    })));

    setIsLoading(false);

    const allVerified = Object.values(newStatus).every(v => v);
    if (allVerified) {
      toast({
        title: "All Records Verified!",
        description: "Your email domain is now fully configured.",
      });
      setCurrentStep(4);
    } else {
      toast({
        title: "Verification Incomplete",
        description: "Some DNS records are not yet propagated. This can take up to 48 hours.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Set Up Your Custom Email Domain
                </CardTitle>
                <CardDescription>
                  Send emails from your own domain to build trust and improve deliverability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 text-center">
                    <Shield className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                    <h3 className="font-semibold">Better Deliverability</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Authenticated emails reach inbox, not spam
                    </p>
                  </div>
                  <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 text-center">
                    <Sparkles className="mx-auto mb-2 h-8 w-8 text-green-600" />
                    <h3 className="font-semibold">Professional Brand</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Send from you@yourdomain.com
                    </p>
                  </div>
                  <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 text-center">
                    <Server className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                    <h3 className="font-semibold">Full Control</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Track and manage your email reputation
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    What You'll Need
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                    <li>• Access to your domain's DNS settings</li>
                    <li>• 15-30 minutes to complete setup</li>
                    <li>• DNS changes can take up to 48 hours to propagate</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel} className="flex-1">
                      Cancel
                    </Button>
                  )}
                  <Button onClick={() => setCurrentStep(1)} className="flex-1">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="domain"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Enter Your Domain
                </CardTitle>
                <CardDescription>
                  What domain would you like to send emails from?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="domain">Your Domain</Label>
                  <Input
                    id="domain"
                    placeholder="yourdomain.com"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    className="h-12 text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your root domain (e.g., yourdomain.com). We'll set up mail.yourdomain.com for sending.
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="text-sm font-semibold mb-2">Example Email Address:</h4>
                  <p className="font-mono text-sm">
                    hello@{domainName || "yourdomain.com"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleDomainSubmit} className="flex-1">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="dns"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configure DNS Records
                </CardTitle>
                <CardDescription>
                  Add these records to your domain's DNS settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> Open your domain registrar's DNS settings in a new tab. Common registrars:
                    <span className="text-blue-600"> GoDaddy, Namecheap, Cloudflare, Google Domains</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {dnsRecords.map((record, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={record.verified ? "default" : "secondary"}>
                            {record.type}
                          </Badge>
                          {record.verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <Badge variant="outline">
                          {index === 0 ? "SPF" : index === 1 || index === 2 ? "DKIM" : index === 3 ? "DMARC" : "MX"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Host/Name</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
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
                          <Label className="text-xs text-muted-foreground">Value</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto break-all">
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

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="flex-1">
                    I've Added the Records
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verify DNS Records
                </CardTitle>
                <CardDescription>
                  We'll check if your DNS records are properly configured
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "SPF", key: "spf", desc: "Sender Policy Framework" },
                    { name: "DKIM", key: "dkim", desc: "DomainKeys Identified Mail" },
                    { name: "DMARC", key: "dmarc", desc: "Domain-based Message Authentication" },
                    { name: "MX", key: "mx", desc: "Mail Exchange Record" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`rounded-lg border p-4 ${
                        verificationStatus[item.key as keyof typeof verificationStatus]
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-muted bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{item.name}</span>
                        {verificationStatus[item.key as keyof typeof verificationStatus] ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    DNS changes can take up to 48 hours to propagate worldwide. If verification fails,
                    wait a few hours and try again.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Records
                  </Button>
                  <Button onClick={handleVerify} disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verify Records
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <CheckCircle className="h-12 w-12 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-2">Domain Verified!</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Your custom email domain is now configured and ready to use.
                </p>

                <div className="rounded-lg bg-white dark:bg-black border p-6 max-w-md mx-auto mb-8">
                  <p className="text-sm text-muted-foreground mb-2">You can now send emails from:</p>
                  <p className="font-mono text-lg font-semibold">
                    *@{domainName}
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => window.open("/dashboard/emails", "_self")}>
                    Go to Email Campaigns
                  </Button>
                  <Button onClick={onComplete}>
                    Done
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Progress Indicator */}
      {currentStep < 4 && (
        <div className="pb-8 border-b border-border">
          <StepProgressIndicator
            steps={steps}
            currentStep={steps[currentStep].id}
            completedSteps={steps.slice(0, currentStep).map(s => s.id)}
          />
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}
