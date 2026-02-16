"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  BarChart3,
} from "lucide-react";

export default function DripCampaignsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    triggerType: "lead_signup" as "lead_signup" | "product_purchase" | "tag_added" | "manual",
  });

  const storeId = user?.id || "admin";

  const campaigns = useQuery(api.dripCampaigns.getAllDripCampaigns);
  const createCampaign = useMutation(api.dripCampaigns.createCampaign);
  const toggleCampaign = useMutation(api.dripCampaigns.toggleCampaign);
  const deleteCampaign = useMutation(api.dripCampaigns.deleteCampaign);

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

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Mail className="h-8 w-8 text-blue-600" />
            Drip Campaigns
          </h1>
          <p className="mt-1 text-muted-foreground">
            Automated email sequences that nurture your leads
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Drip Campaign</DialogTitle>
              <DialogDescription>Set up an automated email sequence</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="7-Day Welcome Sequence"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Welcomes new subscribers and introduces our products"
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
                    <SelectItem value="lead_signup">Lead Signup</SelectItem>
                    <SelectItem value="product_purchase">Product Purchase</SelectItem>
                    <SelectItem value="tag_added">Tag Added</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-xl font-semibold">No campaigns yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first drip campaign to start nurturing leads automatically
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign: any) => (
            <Card key={campaign._id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={campaign.isActive ? "default" : "secondary"}>
                      {campaign.isActive ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {getTriggerIcon(campaign.triggerType)}
                      {getTriggerLabel(campaign.triggerType)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={campaign.isActive}
                      onCheckedChange={() => handleToggle(campaign._id)}
                    />
                    <Link href={`/admin/drip-campaigns/${campaign._id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Settings className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(campaign._id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {campaign.description && <CardDescription>{campaign.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{campaign.totalEnrolled || 0}</span>
                    <span className="text-muted-foreground">enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{campaign.totalCompleted || 0}</span>
                    <span className="text-muted-foreground">completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-muted-foreground">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
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
