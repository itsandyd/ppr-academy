"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Trash2, ArrowLeft, Clock, Users, CheckCircle2, Send } from "lucide-react";

export default function CampaignEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const { toast } = useToast();
  const campaignId = params.campaignId as Id<"dripCampaigns">;

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStep, setNewStep] = useState({
    subject: "",
    htmlContent: "",
    delayValue: 0,
    delayUnit: "minutes" as "minutes" | "hours" | "days",
  });

  const campaign = useQuery(api.dripCampaigns.getCampaign, { campaignId });
  const addStep = useMutation(api.dripCampaigns.addStep);
  const deleteStep = useMutation(api.dripCampaigns.deleteStep);
  const toggleCampaign = useMutation(api.dripCampaigns.toggleCampaign);

  if (mode !== "create") {
    router.push(`/dashboard/emails/${campaignId}?mode=create`);
    return null;
  }

  const getDelayInMinutes = (value: number, unit: string) => {
    switch (unit) {
      case "hours":
        return value * 60;
      case "days":
        return value * 60 * 24;
      default:
        return value;
    }
  };

  const formatDelay = (minutes: number) => {
    if (minutes === 0) return "Immediately";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days}d`;
  };

  const handleAddStep = async () => {
    if (!newStep.subject.trim() || !newStep.htmlContent.trim()) {
      toast({ title: "Subject and content required", variant: "destructive" });
      return;
    }

    const nextStepNumber = campaign?.steps?.length ? campaign.steps.length + 1 : 1;
    const delayMinutes = getDelayInMinutes(newStep.delayValue, newStep.delayUnit);

    try {
      await addStep({
        campaignId,
        stepNumber: nextStepNumber,
        delayMinutes,
        subject: newStep.subject,
        htmlContent: newStep.htmlContent,
      });

      toast({ title: "Email added!" });
      setIsAddStepOpen(false);
      setNewStep({ subject: "", htmlContent: "", delayValue: 0, delayUnit: "minutes" });
    } catch (error) {
      toast({ title: "Failed to add email", variant: "destructive" });
    }
  };

  const handleDeleteStep = async (stepId: Id<"dripCampaignSteps">) => {
    if (!confirm("Delete this email?")) return;

    try {
      await deleteStep({ stepId });
      toast({ title: "Email deleted" });
    } catch (error) {
      toast({ title: "Failed to delete email", variant: "destructive" });
    }
  };

  const handleToggle = async () => {
    try {
      const result = await toggleCampaign({ campaignId });
      toast({
        title: result.isActive ? "Sequence activated!" : "Sequence paused",
      });
    } catch (error) {
      toast({ title: "Failed to toggle sequence", variant: "destructive" });
    }
  };

  if (!campaign) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <Link href="/dashboard/emails?mode=create">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sequences
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl md:text-2xl font-bold">
              {campaign.name}
              <Badge variant={campaign.isActive ? "default" : "secondary"}>
                {campaign.isActive ? "Active" : "Paused"}
              </Badge>
            </h1>
            {campaign.description && (
              <p className="mt-1 text-sm text-muted-foreground">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {campaign.isActive ? "Active" : "Paused"}
            </span>
            <Switch checked={campaign.isActive} onCheckedChange={handleToggle} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{campaign.totalEnrolled || 0}</div>
              <div className="text-xs text-muted-foreground">Enrolled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{campaign.totalCompleted || 0}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Mail className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">{campaign.steps?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Emails</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email Sequence</h2>
        <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Email to Sequence</DialogTitle>
              <DialogDescription>Create a new email step in your sequence</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Send after</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newStep.delayValue}
                    onChange={(e) =>
                      setNewStep({ ...newStep, delayValue: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={newStep.delayUnit}
                    onValueChange={(v: any) => setNewStep({ ...newStep, delayUnit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  placeholder="Welcome to the community, {{firstName}}!"
                  value={newStep.subject}
                  onChange={(e) => setNewStep({ ...newStep, subject: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {"{{firstName}}"}, {"{{name}}"}, {"{{email}}"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Content (HTML)</Label>
                <Textarea
                  placeholder="<p>Hey {{firstName}},</p><p>Thanks for joining...</p>"
                  className="min-h-[200px] font-mono text-sm"
                  value={newStep.htmlContent}
                  onChange={(e) => setNewStep({ ...newStep, htmlContent: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {"{{unsubscribeLink}}"} is automatically added to the footer
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStep}>Add Email</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!campaign.steps || campaign.steps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 font-semibold">No emails yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Add your first email to start building your sequence
            </p>
            <Button onClick={() => setIsAddStepOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaign.steps.map((step: any, index: number) => (
            <div key={step._id} className="relative">
              {index > 0 && (
                <div className="absolute -top-3 left-6 z-10">
                  <Badge variant="outline" className="gap-1 bg-background text-xs">
                    <Clock className="h-3 w-3" />
                    {formatDelay(step.delayMinutes)}
                  </Badge>
                </div>
              )}
              <Card className={index > 0 ? "mt-1" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-600 dark:bg-cyan-900">
                        {step.stepNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{step.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {index === 0
                            ? "Sent immediately"
                            : `After ${formatDelay(step.delayMinutes)}`}
                          {step.sentCount > 0 && ` • ${step.sentCount} sent`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStep(step._id)}
                      className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
