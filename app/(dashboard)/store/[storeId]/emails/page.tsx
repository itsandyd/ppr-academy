"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import {
  Mail,
  Send,
  Activity,
  TrendingUp,
  XCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function StoreEmailsPage() {
  const params = useParams();
  const storeId = params.storeId as Id<"stores">;
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch data
  const connection = useQuery(api.emailQueries.getStoreConnection, { storeId });
  const analytics = connection
    ? useQuery(api.emailQueries.getEmailAnalytics, {
        connectionId: connection._id,
        days: 30,
      })
    : undefined;
  const campaigns = connection
    ? useQuery(api.emailQueries.getCampaigns, { connectionId: connection._id })
    : undefined;
  const templates = connection
    ? useQuery(api.emailQueries.getTemplates, { connectionId: connection._id })
    : undefined;
  const automations = connection
    ? useQuery(api.emailQueries.getAutomations, { connectionId: connection._id })
    : undefined;

  // Mutations
  const connectResend = useMutation(api.emailQueries.connectStoreResend);

  // Form state
  const [formData, setFormData] = useState({
    resendApiKey: "",
    fromEmail: "",
    fromName: "",
    replyToEmail: "",
  });

  const handleConnect = async () => {
    if (!user || !formData.resendApiKey || !formData.fromEmail || !formData.fromName) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsConnecting(true);
    try {
      await connectResend({
        storeId,
        ...formData,
        userId: user.id,
      });
      toast.success("Email settings configured!");
    } catch (error) {
      toast.error("Failed to configure email settings");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground">
          Manage your email campaigns, templates, and automation for this store
        </p>
      </div>

      {!connection ? (
        /* Setup Card */
        <Card>
          <CardHeader>
            <CardTitle>Configure Email Settings</CardTitle>
            <CardDescription>
              Connect Resend to start sending email campaigns to your students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Resend API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="re_..."
                value={formData.resendApiKey}
                onChange={(e) =>
                  setFormData({ ...formData, resendApiKey: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  resend.com/api-keys
                </a>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="hello@yourdomain.com"
                  value={formData.fromEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, fromEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name *</Label>
                <Input
                  id="fromName"
                  placeholder="Your Store Name"
                  value={formData.fromName}
                  onChange={(e) =>
                    setFormData({ ...formData, fromName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="support@yourdomain.com"
                value={formData.replyToEmail}
                onChange={(e) =>
                  setFormData({ ...formData, replyToEmail: e.target.value })
                }
              />
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isConnecting ? "Configuring..." : "Configure Email"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Main Dashboard */
        <>
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">
                      {analytics?.totalSent.toLocaleString() || 0}
                    </p>
                  </div>
                  <Send className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics?.openRate || 0}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics?.clickRate || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics?.bounceRate || 0}%
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="campaigns">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Email Campaigns</h2>
                  <p className="text-sm text-muted-foreground">
                    Send one-time broadcasts to your audience
                  </p>
                </div>
                <Button>
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>

              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {campaign.name}
                              </h3>
                              <Badge
                                variant={
                                  campaign.status === "sent"
                                    ? "default"
                                    : campaign.status === "sending"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Subject: {campaign.subject}
                            </p>

                            {campaign.status === "sent" && (
                              <div className="grid grid-cols-5 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Recipients
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {campaign.recipientCount || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Sent
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {campaign.sentCount || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Delivered
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {campaign.deliveredCount || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Opened
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {campaign.openedCount || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Clicked
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {campaign.clickedCount || 0}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">
                      No campaigns yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Create your first email campaign to engage with your students
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Email Templates</h2>
                  <p className="text-sm text-muted-foreground">
                    Create reusable email templates
                  </p>
                </div>
                <Button>
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge
                            variant={template.isActive ? "default" : "secondary"}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {template.subject}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.type}
                          </Badge>
                          {template.variables && template.variables.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {template.variables.length} variables
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">
                      No templates yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Create reusable templates for faster campaign creation
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Automations Tab */}
            <TabsContent value="automations" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Email Automations</h2>
                  <p className="text-sm text-muted-foreground">
                    Trigger-based emails sent automatically
                  </p>
                </div>
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  New Automation
                </Button>
              </div>

              {automations && automations.length > 0 ? (
                <div className="space-y-4">
                  {automations.map((automation) => (
                    <Card key={automation._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {automation.name}
                              </h3>
                              <Badge
                                variant={automation.isActive ? "default" : "secondary"}
                              >
                                {automation.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              {automation.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {automation.triggerType.replace("_", " ")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                • {automation.triggeredCount || 0} triggered
                                • {automation.sentCount || 0} sent
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">
                      No automations yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Set up automated emails for enrollments, completions, and more
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>
                    Your current email settings for this store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">From Email</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.fromEmail}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">From Name</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.fromName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Reply-To</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.replyToEmail || "Not set"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={connection.isActive ? "default" : "destructive"}>
                        {connection.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      Update Email Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

