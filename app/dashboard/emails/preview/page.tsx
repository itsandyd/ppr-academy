"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Send,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  FileText,
  ShieldCheck,
  Eye,
  Loader2,
  Info,
  XCircle,
} from "lucide-react";
import { prebuiltEmailTemplates } from "../workflows/templates/email-templates";

type DeviceSize = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES = {
  desktop: { width: "100%", maxWidth: "800px", label: "Desktop" },
  tablet: { width: "768px", maxWidth: "768px", label: "Tablet" },
  mobile: { width: "375px", maxWidth: "375px", label: "Mobile" },
};

export default function EmailPreviewPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [subject, setSubject] = useState("Welcome to our community!");
  const [body, setBody] = useState(`<p>Hey {{firstName}},</p>

<p>Welcome! We're excited to have you here.</p>

<p>Here's what you can expect from us:</p>
<ul>
  <li>Weekly tips and tutorials</li>
  <li>Exclusive content and offers</li>
  <li>Early access to new releases</li>
</ul>

<p>Hit reply if you have any questions!</p>

<p>Best,<br>{{creatorName}}</p>

<p style="font-size: 12px; color: #666; margin-top: 24px;">
  <a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Update preferences</a>
</p>`);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [activeTab, setActiveTab] = useState("preview");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [testEmailAddress, setTestEmailAddress] = useState(user?.emailAddresses?.[0]?.emailAddress || "");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const storeId = user?.id ?? "";

  // Preview data for template variables
  const previewData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    storeName: "Your Store",
    creatorName: "The Creator",
    unsubscribeUrl: "https://example.com/unsubscribe",
    preferencesUrl: "https://example.com/preferences",
  };

  // Queries
  const spamAnalysis = useQuery(api.emailPreview.analyzeSpamScore, { subject, body });
  const linkValidation = useQuery(api.emailPreview.validateLinks, { body });
  const readability = useQuery(api.emailPreview.analyzeReadability, { body });
  const fullAnalysis = useQuery(api.emailPreview.getFullAnalysis, { subject, body });
  const previewedContent = useQuery(api.emailPreview.previewWithData, { subject, body, previewData });

  const recordTestEmail = useMutation(api.emailPreview.recordTestEmail);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = prebuiltEmailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  // Handle test email send
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !user?.id) return;

    setIsSendingTest(true);
    try {
      // Record the test email
      await recordTestEmail({
        storeId,
        userId: user.id,
        subject,
        recipient: testEmailAddress,
        templateId: selectedTemplate || undefined,
      });

      toast({
        title: "Test Email Queued",
        description: `A test email would be sent to ${testEmailAddress}. (Actual sending requires email service integration)`,
      });

      setShowTestDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record test email",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Render preview content with replaced variables
  const renderPreview = () => {
    if (!previewedContent) return body;
    return previewedContent.body;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (score >= 40) return "bg-orange-100 dark:bg-orange-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/emails")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold md:text-2xl">Email Preview & Testing</h1>
                <p className="text-sm text-muted-foreground">
                  Preview, analyze, and test your emails before sending
                </p>
              </div>
            </div>
            <Button onClick={() => setShowTestDialog(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Send Test
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Content</CardTitle>
                <CardDescription>
                  Edit your email or select a template to start
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selector */}
                <div className="space-y-2">
                  <Label>Start from template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {prebuiltEmailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Line */}
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject line..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {subject.length}/60 characters
                    {subject.length > 60 && (
                      <span className="text-orange-600"> (may be truncated)</span>
                    )}
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <Label>Email Body (HTML)</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter email body..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Analysis Cards */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="spam" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Spam
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links
                </TabsTrigger>
                <TabsTrigger value="readability" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Readability
                </TabsTrigger>
              </TabsList>

              <TabsContent value="spam" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {spamAnalysis ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Spam Score</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(100 - spamAnalysis.score)}`}>
                              {100 - spamAnalysis.score}
                            </span>
                            <Badge
                              variant="outline"
                              className={getScoreBg(100 - spamAnalysis.score)}
                            >
                              {spamAnalysis.rating}
                            </Badge>
                          </div>
                        </div>

                        {spamAnalysis.issues.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Issues Found:</p>
                            {spamAnalysis.issues.map((issue: { text: string; category: string; severity: "low" | "medium" | "high" }, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-lg border p-2"
                              >
                                {issue.severity === "high" ? (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                )}
                                <div>
                                  <p className="text-sm">{issue.text}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Category: {issue.category}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>No spam issues detected!</span>
                          </div>
                        )}

                        {spamAnalysis.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Recommendations:</p>
                            {spamAnalysis.recommendations.map((rec: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20"
                              >
                                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                <p className="text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {linkValidation ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Links Found</span>
                          <Badge variant="outline">
                            {linkValidation.summary.total} links
                          </Badge>
                        </div>

                        {linkValidation.summary.hasIssues ? (
                          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-900/20">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">
                              {linkValidation.summary.invalid} invalid link(s) found
                            </span>
                          </div>
                        ) : linkValidation.summary.total > 0 ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>All links are valid!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Info className="h-5 w-5" />
                            <span>No links found in email</span>
                          </div>
                        )}

                        {linkValidation.links.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Link Details:</p>
                            {linkValidation.links.map((link: { url: string; valid: boolean; issue?: string }, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-lg border p-2"
                              >
                                {link.valid ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-mono">
                                    {link.url.length > 50
                                      ? link.url.substring(0, 50) + "..."
                                      : link.url}
                                  </p>
                                  {link.issue && (
                                    <p className="text-xs text-muted-foreground">
                                      {link.issue}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="readability" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {readability ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Readability Score</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${getScoreColor(readability.score)}`}>
                              {readability.score}
                            </span>
                            <Badge variant="outline" className={getScoreBg(readability.score)}>
                              {readability.level}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {readability.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Word Count</p>
                            <p className="text-lg font-semibold">
                              {readability.stats.wordCount}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Sentences</p>
                            <p className="text-lg font-semibold">
                              {readability.stats.sentenceCount}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Avg Words/Sentence</p>
                            <p className="text-lg font-semibold">
                              {readability.stats.avgWordsPerSentence}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Read Time</p>
                            <p className="text-lg font-semibold">
                              ~{readability.stats.estimatedReadTime} min
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            {/* Overall Score */}
            {fullAnalysis && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Overall Email Score</p>
                      <p className="text-xs text-muted-foreground">
                        Based on spam, compliance, and content quality
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-bold ${getScoreColor(fullAnalysis.overallScore)}`}>
                        {fullAnalysis.overallScore}
                      </span>
                      <Badge variant="outline" className={getScoreBg(fullAnalysis.overallScore)}>
                        {fullAnalysis.overallRating}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Device Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    Preview
                  </CardTitle>
                  <div className="flex items-center gap-1 rounded-lg border p-1">
                    <Button
                      variant={deviceSize === "desktop" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDeviceSize("desktop")}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={deviceSize === "tablet" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDeviceSize("tablet")}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={deviceSize === "mobile" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDeviceSize("mobile")}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div
                    className="rounded-lg border bg-white shadow-sm transition-all duration-300"
                    style={{
                      width: DEVICE_SIZES[deviceSize].width,
                      maxWidth: DEVICE_SIZES[deviceSize].maxWidth,
                    }}
                  >
                    {/* Email Header */}
                    <div className="border-b p-3">
                      <p className="text-xs text-muted-foreground">Subject:</p>
                      <p className="font-medium">
                        {previewedContent?.subject || subject}
                      </p>
                    </div>

                    {/* Email Body */}
                    <div
                      className="prose prose-sm max-w-none p-4"
                      style={{
                        fontSize: deviceSize === "mobile" ? "14px" : "16px",
                      }}
                      dangerouslySetInnerHTML={{ __html: renderPreview() }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Viewing as {DEVICE_SIZES[deviceSize].label} ({DEVICE_SIZES[deviceSize].maxWidth})
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {fullAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`rounded-full p-2 ${fullAnalysis.compliance.hasUnsubscribe ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                        {fullAnalysis.compliance.hasUnsubscribe ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unsubscribe</p>
                        <p className="text-sm font-medium">
                          {fullAnalysis.compliance.hasUnsubscribe ? "Present" : "Missing"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`rounded-full p-2 ${fullAnalysis.content.hasPersonalization ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                        {fullAnalysis.content.hasPersonalization ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Personalization</p>
                        <p className="text-sm font-medium">
                          {fullAnalysis.content.hasPersonalization ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                        <LinkIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Links</p>
                        <p className="text-sm font-medium">{fullAnalysis.content.linkCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Words</p>
                        <p className="text-sm font-medium">{fullAnalysis.content.wordCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test version of this email to preview it in your inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Send to email address</Label>
              <Input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground">
                Subject: {previewedContent?.subject || subject}
              </p>
            </div>

            {fullAnalysis && fullAnalysis.overallScore < 60 && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-600">Warning</p>
                  <p className="text-sm text-yellow-600/80">
                    Your email has a low score ({fullAnalysis.overallScore}). Consider
                    addressing the issues before sending.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !testEmailAddress}
              className="gap-2"
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
