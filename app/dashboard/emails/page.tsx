"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Play,
  Pause,
  Trash2,
  Settings,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Send,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export default function EmailCampaignsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    triggerType: "lead_signup" as "lead_signup" | "product_purchase" | "tag_added" | "manual",
  });

  const storeId = user?.id || "";

  const campaigns = useQuery(api.dripCampaigns.getCampaignsByStore, storeId ? { storeId } : "skip");
  const createCampaign = useMutation(api.dripCampaigns.createCampaign);
  const toggleCampaign = useMutation(api.dripCampaigns.toggleCampaign);
  const deleteCampaign = useMutation(api.dripCampaigns.deleteCampaign);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const handleCreate = async () => {
    if (!newCampaign.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    try {
      await createCampaign({
        storeId,
        name: newCampaign.name,
        description: newCampaign.description,
        triggerType: newCampaign.triggerType,
      });

      toast({ title: "Campaign created!" });
      setIsCreateOpen(false);
      setNewCampaign({ name: "", description: "", triggerType: "lead_signup" });
    } catch (error) {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    }
  };

  const handleToggle = async (campaignId: any) => {
    try {
      const result = await toggleCampaign({ campaignId });
      toast({
        title: result.isActive ? "Campaign activated" : "Campaign paused",
      });
    } catch (error) {
      toast({ title: "Failed to toggle campaign", variant: "destructive" });
    }
  };

  const handleDelete = async (campaignId: any) => {
    if (!confirm("Delete this campaign and all its steps?")) return;

    try {
      await deleteCampaign({ campaignId });
      toast({ title: "Campaign deleted" });
    } catch (error) {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "lead_signup":
        return <Users className="h-4 w-4" />;
      case "product_purchase":
        return <CheckCircle2 className="h-4 w-4" />;
      case "tag_added":
        return <Zap className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "lead_signup":
        return "Lead Signup";
      case "product_purchase":
        return "Purchase";
      case "tag_added":
        return "Tag Added";
      case "manual":
        return "Manual";
      default:
        return type;
    }
  };

  const totalEnrolled = campaigns?.reduce((sum, c: any) => sum + (c.totalEnrolled || 0), 0) || 0;
  const totalCompleted = campaigns?.reduce((sum, c: any) => sum + (c.totalCompleted || 0), 0) || 0;
  const activeCampaigns = campaigns?.filter((c: any) => c.isActive).length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-cyan-600" />
            Email Campaigns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automated email sequences to nurture your audience
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Sequence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Email Sequence</DialogTitle>
              <DialogDescription>Set up an automated drip campaign</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Sequence Name</Label>
                <Input
                  placeholder="7-Day Welcome Sequence"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Welcomes new subscribers..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={newCampaign.triggerType}
                  onValueChange={(v: any) => setNewCampaign({ ...newCampaign, triggerType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_signup">When someone joins your list</SelectItem>
                    <SelectItem value="product_purchase">After a purchase</SelectItem>
                    <SelectItem value="tag_added">When tag is added</SelectItem>
                    <SelectItem value="manual">Manual enrollment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Sequence</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-100 p-2 dark:bg-cyan-900">
                <Send className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeCampaigns}</div>
                <div className="text-sm text-muted-foreground">Active Sequences</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalEnrolled}</div>
                <div className="text-sm text-muted-foreground">Total Enrolled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCompleted}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="mb-2 text-xl font-semibold">No email sequences yet</h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Create automated email sequences to nurture leads, onboard customers, and drive sales
              on autopilot.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign: any) => (
            <Card
              key={campaign._id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/dashboard/emails/${campaign._id}?mode=create`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        campaign.isActive
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-slate-100 dark:bg-slate-800"
                      )}
                    >
                      <Mail
                        className={cn(
                          "h-5 w-5",
                          campaign.isActive ? "text-green-600" : "text-slate-400"
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        {campaign.name}
                        <Badge
                          variant={campaign.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {campaign.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getTriggerIcon(campaign.triggerType)}
                        {getTriggerLabel(campaign.triggerType)}
                        {campaign.description && ` • ${campaign.description}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-medium">{campaign.totalEnrolled || 0}</div>
                      <div className="text-xs text-muted-foreground">enrolled</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{campaign.totalCompleted || 0}</div>
                      <div className="text-xs text-muted-foreground">completed</div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={campaign.isActive}
                        onCheckedChange={() => handleToggle(campaign._id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(campaign._id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
