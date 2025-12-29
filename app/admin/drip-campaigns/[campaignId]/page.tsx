"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Mail,
  Plus,
  Trash2,
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  GripVertical,
  Send,
  Save,
} from "lucide-react";

export default function CampaignEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const campaignId = params.campaignId as Id<"dripCampaigns">;

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [newStep, setNewStep] = useState({
    subject: "",
    htmlContent: "",
    delayMinutes: 0,
    delayUnit: "minutes" as "minutes" | "hours" | "days",
  });

  const campaign = useQuery(api.dripCampaigns.getCampaign, { campaignId });
  const addStep = useMutation(api.dripCampaigns.addStep);
  const updateStep = useMutation(api.dripCampaigns.updateStep);
  const deleteStep = useMutation(api.dripCampaigns.deleteStep);
  const toggleCampaign = useMutation(api.dripCampaigns.toggleCampaign);

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
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  const handleAddStep = async () => {
    if (!newStep.subject.trim() || !newStep.htmlContent.trim()) {
      toast({ title: "Subject and content required", variant: "destructive" });
      return;
    }

    const nextStepNumber = campaign?.steps?.length ? campaign.steps.length + 1 : 1;
    const delayMinutes = getDelayInMinutes(newStep.delayMinutes, newStep.delayUnit);

    try {
      await addStep({
        campaignId,
        stepNumber: nextStepNumber,
        delayMinutes,
        subject: newStep.subject,
        htmlContent: newStep.htmlContent,
      });

      toast({ title: "Step added!" });
      setIsAddStepOpen(false);
      setNewStep({ subject: "", htmlContent: "", delayMinutes: 0, delayUnit: "minutes" });
    } catch (error) {
      toast({ title: "Failed to add step", variant: "destructive" });
    }
  };

  const handleDeleteStep = async (stepId: Id<"dripCampaignSteps">) => {
    if (!confirm("Delete this step?")) return;

    try {
      await deleteStep({ stepId });
      toast({ title: "Step deleted" });
    } catch (error) {
      toast({ title: "Failed to delete step", variant: "destructive" });
    }
  };

  const handleToggle = async () => {
    try {
      const result = await toggleCampaign({ campaignId });
      toast({
        title: result.isActive ? "Campaign activated" : "Campaign paused",
      });
    } catch (error) {
      toast({ title: "Failed to toggle campaign", variant: "destructive" });
    }
  };

  if (!campaign) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6">
        <Link href="/admin/drip-campaigns">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold">
              {campaign.name}
              <Badge variant={campaign.isActive ? "default" : "secondary"}>
                {campaign.isActive ? "Active" : "Paused"}
              </Badge>
            </h1>
            {campaign.description && (
              <p className="mt-1 text-muted-foreground">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {campaign.isActive ? "Active" : "Paused"}
              </span>
              <Switch checked={campaign.isActive} onCheckedChange={handleToggle} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{campaign.totalEnrolled || 0}</div>
                <div className="text-sm text-muted-foreground">Enrolled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{campaign.totalCompleted || 0}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{campaign.steps?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Email Steps</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Email Steps</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Email Sequence</h2>
            <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Email Step</DialogTitle>
                  <DialogDescription>Create a new email in your sequence</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newStep.delayMinutes}
                        onChange={(e) =>
                          setNewStep({ ...newStep, delayMinutes: parseInt(e.target.value) || 0 })
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
                      placeholder="Welcome to PPR Academy, {{firstName}}!"
                      value={newStep.subject}
                      onChange={(e) => setNewStep({ ...newStep, subject: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{firstName}}"}, {"{{name}}"}, {"{{email}}"} for personalization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Content (HTML)</Label>
                    <Textarea
                      placeholder="<p>Hey {{firstName}},</p><p>Welcome to PPR Academy...</p>"
                      className="min-h-[200px] font-mono text-sm"
                      value={newStep.htmlContent}
                      onChange={(e) => setNewStep({ ...newStep, htmlContent: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStep}>Add Step</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!campaign.steps || campaign.steps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 font-semibold">No steps yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add your first email to start building your sequence
                </p>
                <Button onClick={() => setIsAddStepOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Step
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaign.steps.map((step: any, index: number) => (
                <Card key={step._id} className="relative">
                  {index > 0 && (
                    <div className="absolute -top-4 left-8 flex items-center gap-2 bg-background px-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Wait {formatDelay(step.delayMinutes)}
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          {step.stepNumber}
                        </div>
                        <div>
                          <CardTitle className="text-base">{step.subject}</CardTitle>
                          <CardDescription>
                            {index === 0
                              ? "Sent immediately"
                              : `Sent after ${formatDelay(step.delayMinutes)}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Send className="h-3 w-3" />
                          {step.sentCount || 0} sent
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStep(step._id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-32 overflow-hidden rounded-lg bg-slate-50 p-4 text-sm">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: step.htmlContent.substring(0, 300) + "...",
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Enrollments</CardTitle>
              <CardDescription>Contacts currently going through this sequence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>{campaign.activeEnrollments || 0} active enrollments</p>
                <p className="text-sm">{campaign.completedEnrollments || 0} completed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
