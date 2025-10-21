"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Send, 
  Info,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailSettingsPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const { toast } = useToast();

  // Form state
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Get current email configuration
  const emailConfig = useQuery(
    api.stores?.getEmailConfig,
    storeId ? { storeId: storeId as any } : "skip"
  );
  
  // Get store details for auto-generating email
  const store = useQuery(
    api.stores?.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  const updateEmailConfig = useMutation(api.stores?.updateEmailConfig);
  const testEmailConfig = useAction((api as any).emails.testStoreEmailConfig);

  // Load existing configuration OR auto-generate defaults
  useEffect(() => {
    if (store) {
      // Always suggest the correct format based on current slug
      const suggestedEmail = `${store.slug.toLowerCase()}@mail.pauseplayrepeat.com`;
      const suggestedReplyTo = "support@pauseplayrepeat.com";
      
      if (emailConfig) {
        // Load existing config
        setFromEmail(emailConfig.fromEmail || suggestedEmail);
        setFromName(emailConfig.fromName || store.name);
        setReplyToEmail(emailConfig.replyToEmail || suggestedReplyTo);
      } else {
        // Auto-generate for new stores
        setFromEmail(suggestedEmail);
        setFromName(store.name);
        setReplyToEmail(suggestedReplyTo);
      }
    }
  }, [emailConfig, store]);

  const handleSaveConfig = async () => {
    if (!fromEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a from email address",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateEmailConfig({
        storeId: storeId as any,
        fromEmail,
        fromName: fromName || undefined,
        replyToEmail: replyToEmail || undefined,
      });

      if (result?.success) {
        toast({
          title: "Configuration Saved!",
          description: "Your email sender settings have been saved. Now test your configuration.",
        });
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to save configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save email config:", error);
      toast({
        title: "Error",
        description: "Failed to save email configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConfig = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    if (!emailConfig?.fromEmail) {
      toast({
        title: "Configuration Required",
        description: "Please save your sender configuration first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await testEmailConfig({
        storeId: storeId as any,
        testEmail,
        fromEmail: emailConfig.fromEmail,
        fromName: emailConfig.fromName,
        replyToEmail: emailConfig.replyToEmail,
      });

      if (result?.success) {
        toast({
          title: "Test Successful! ✅",
          description: "Check your email inbox for the test message",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result?.message || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to test email config:", error);
      toast({
        title: "Error",
        description: "Failed to test email configuration",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!emailConfig?.fromEmail) {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          <XCircle className="w-3 h-3 mr-1" />
          Not Configured
        </Badge>
      );
    }

    if (emailConfig.isConfigured) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Configured & Tested
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-orange-600 border-orange-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Needs Testing
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Email Settings</h1>
          {getStatusBadge()}
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Professional Email Setup
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                Your store gets a professional email address: <strong>{store?.slug.toLowerCase()}@mail.pauseplayrepeat.com</strong>
              </p>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>How replies work:</strong> Customer replies go to <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">support@pauseplayrepeat.com</code>, 
                and we'll forward them to you. This keeps your personal email private and lets us filter spam.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sender Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Sender Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">
                From Email Address *
                <Badge variant="success" className="ml-2">Verified</Badge>
              </Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder={`${store?.slug.toLowerCase()}@mail.pauseplayrepeat.com`}
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                ✅ Recommended: <code className="bg-muted px-1 py-0.5 rounded text-xs">{store?.slug.toLowerCase()}@mail.pauseplayrepeat.com</code> (verified subdomain)
              </p>
              {fromEmail && fromEmail !== `${store?.slug.toLowerCase()}@mail.pauseplayrepeat.com` && (
                <p className="text-sm text-yellow-600">
                  ⚠️ You're using a different email. Update to the recommended format above for consistency.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                type="text"
                placeholder="Your Store Name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                The name that appears in your customers' inbox
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="replyToEmail">
              Reply-To Email
              <Badge variant="outline" className="ml-2">Recommended</Badge>
            </Label>
            <Input
              id="replyToEmail"
              type="email"
              placeholder="support@pauseplayrepeat.com"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              💡 We recommend <code className="bg-muted px-1 py-0.5 rounded text-xs">support@pauseplayrepeat.com</code> - we'll forward replies to you
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSaveConfig}
              disabled={isSaving || !fromEmail.trim()}
              className="flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      {emailConfig?.fromEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Test Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Send a test email to verify your configuration is working correctly.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="max-w-md"
              />
            </div>

            <Button 
              onClick={handleTestConfig}
              disabled={isTesting || !testEmail.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isTesting ? "Sending Test..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      {emailConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Configuration</h4>
                <div className="mt-2">{getStatusBadge()}</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Last Tested</h4>
                <p className="text-sm text-gray-600 mt-2">
                  {emailConfig.lastTestedAt 
                    ? new Date(emailConfig.lastTestedAt).toLocaleDateString()
                    : "Never"
                  }
                </p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Emails This Month</h4>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {emailConfig.emailsSentThisMonth || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 