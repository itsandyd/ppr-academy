"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, Loader2, Mail, Users, Calendar, CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const dynamic = 'force-dynamic';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const storeId = params.storeId as string;
  const campaignId = params.campaignId as string;
  const [isSending, setIsSending] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const campaign = useQuery(
    api.emailCampaigns?.getCampaign,
    campaignId ? { campaignId: campaignId as any } : "skip"
  );

  const recipients = useQuery(
    api.emailCampaigns?.getCampaignRecipients,
    campaignId ? { campaignId: campaignId as any } : "skip"
  );

  const sendCampaign = useAction((api as any).emails?.sendCampaign);
  const createCampaign = useMutation((api as any).emailCampaigns?.createCampaign);
  const addRecipients = useMutation((api as any).emailCampaigns?.addRecipients);

  const handleSend = async () => {
    if (!campaign) return;

    if (!confirm("Are you sure you want to send this campaign? This action cannot be undone.")) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendCampaign({ campaignId: campaign._id });
      if (result.success) {
        toast({
          title: "Campaign sent!",
          description: result.message,
        });
        router.push(`/store/${storeId}/email-campaigns`);
      } else {
        toast({
          title: "Failed to send",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (!campaign || !recipients) return;

    if (!confirm(`Create a new draft campaign with the same content and ${recipients.length} recipients?`)) {
      return;
    }

    setIsResending(true);
    try {
      // Create a duplicate campaign
      const newCampaignId = await createCampaign({
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        content: campaign.content,
        previewText: campaign.previewText,
        fromEmail: campaign.fromEmail,
        replyToEmail: campaign.replyToEmail,
        storeId: campaign.storeId,
        adminUserId: campaign.adminUserId, // Include the adminUserId
      });

      // Add the same recipients
      if (recipients.length > 0) {
        const customerIds = recipients.map((r: any) => r.customerId).filter(Boolean);
        if (customerIds.length > 0) {
          await addRecipients({
            campaignId: newCampaignId,
            customerIds,
          });
        }
      }

      toast({
        title: "Campaign duplicated!",
        description: `Created a new draft campaign with ${recipients.length} recipients.`,
      });

      // Navigate to the new campaign
      router.push(`/store/${storeId}/email-campaigns/${newCampaignId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate campaign",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
      scheduled: { color: "bg-chart-1/10 text-chart-1", label: "Scheduled" },
      sending: { color: "bg-chart-5/10 text-chart-5", label: "Sending" },
      sent: { color: "bg-chart-2/10 text-chart-2", label: "Sent" },
      failed: { color: "bg-destructive/10 text-destructive", label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (campaign === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (campaign === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The campaign you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild variant="outline">
              <Link href={`/store/${storeId}/email-campaigns`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSend = campaign.status === "draft" && (recipients?.length || 0) > 0;
  const canResend = campaign.status === "sent" || campaign.status === "failed";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/store/${storeId}/email-campaigns`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <div className="flex items-center gap-2">
            {getStatusBadge(campaign.status)}
            {campaign.sentAt && (
              <span className="text-sm text-muted-foreground">
                Sent {new Date(campaign.sentAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canResend && (
            <Button onClick={handleResend} disabled={isResending} variant="outline">
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Duplicating...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Resend Campaign
                </>
              )}
            </Button>
          )}

          {canSend && (
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Recipients</div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.recipientCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Delivered</div>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.deliveredCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Opened</div>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.openedCount || 0}</div>
            {campaign.deliveredCount && campaign.deliveredCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((campaign.openedCount || 0) / campaign.deliveredCount * 100)}% rate
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Clicked</div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.clickedCount || 0}</div>
            {campaign.openedCount && campaign.openedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((campaign.clickedCount || 0) / campaign.openedCount * 100)}% rate
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Details */}
      <Card>
        <CardHeader>
          <CardTitle>Email Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Subject</label>
            <p className="text-lg">{campaign.subject}</p>
          </div>

          {campaign.previewText && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Preview Text</label>
              <p className="text-sm">{campaign.previewText}</p>
            </div>
          )}

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">From</label>
            <p className="text-sm">{campaign.fromEmail}</p>
          </div>

          {campaign.replyToEmail && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reply To</label>
              <p className="text-sm">{campaign.replyToEmail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/30"
            dangerouslySetInnerHTML={{ __html: campaign.content }}
          />
        </CardContent>
      </Card>

      {/* Recipients */}
      {recipients && recipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipients ({recipients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recipients.map((recipient: any) => (
                <div
                  key={recipient._id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{recipient.customerName}</p>
                    <p className="text-sm text-muted-foreground">{recipient.customerEmail}</p>
                  </div>
                  {recipient.status !== "queued" && (
                    <Badge variant="outline" className="text-xs">
                      {recipient.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

