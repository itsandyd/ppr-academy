"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Megaphone,
  PlusCircle,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  ArrowLeft,
  Mail,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { campaignCategories } from "@/lib/marketing-campaigns/types";
import { TikTokIcon } from "@/components/marketing/CampaignCard";

const statusColors: Record<string, string> = {
  draft: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
};

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Id<"marketingCampaigns"> | null>(null);

  const campaigns = useQuery(api.marketingCampaigns.listAdminCampaigns, {
    status: statusFilter !== "all" ? statusFilter as "draft" | "scheduled" | "active" | "completed" | "paused" : undefined,
    campaignType: typeFilter !== "all" ? typeFilter as "product_launch" | "welcome_onboarding" | "flash_sale" | "reengagement" | "course_milestone" | "seasonal_holiday" : undefined,
  });

  const deleteCampaign = useMutation(api.marketingCampaigns.deleteCampaign);
  const duplicateCampaign = useMutation(api.marketingCampaigns.duplicateCampaign);

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    try {
      await deleteCampaign({ campaignId: campaignToDelete });
      toast.success("Campaign deleted");
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch {
      toast.error("Failed to delete campaign");
    }
  };

  const handleDuplicate = async (campaignId: Id<"marketingCampaigns">) => {
    try {
      const newId = await duplicateCampaign({ campaignId });
      toast.success("Campaign duplicated");
      router.push(`/admin/marketing/campaigns/${newId}`);
    } catch {
      toast.error("Failed to duplicate campaign");
    }
  };

  // Filter campaigns by search query
  const filteredCampaigns = campaigns?.filter((campaign) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(query) ||
      campaign.description?.toLowerCase().includes(query)
    );
  });

  if (!campaigns) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/marketing">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Admin Campaigns
            </h1>
            <p className="text-muted-foreground">
              Platform-wide marketing campaigns
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/marketing/campaigns/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Campaign Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {campaignCategories.map((cat) => (
                    <SelectItem key={cat.type} value={cat.type}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {!filteredCampaigns || filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No campaigns match your filters"
                : "No admin campaigns yet. Create your first campaign to get started."}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Button asChild>
                <Link href="/admin/marketing/campaigns/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Campaign
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => {
            const category = campaignCategories.find(
              (c) => c.type === campaign.campaignType
            );

            // Get enabled platforms
            const enabledPlatforms = [
              campaign.emailContent && "email",
              campaign.instagramContent && "instagram",
              campaign.twitterContent && "twitter",
              campaign.facebookContent && "facebook",
              campaign.linkedinContent && "linkedin",
              campaign.tiktokContent && "tiktok",
            ].filter(Boolean) as string[];

            return (
              <Card
                key={campaign._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <Megaphone
                          className="h-6 w-6"
                          style={{ color: category?.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {category?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created{" "}
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Platform indicators */}
                      <div className="hidden md:flex items-center gap-1">
                        {enabledPlatforms.slice(0, 4).map((platform) => {
                          const icons: Record<string, React.ElementType> = {
                            email: Mail,
                            instagram: Instagram,
                            twitter: Twitter,
                            facebook: Facebook,
                            linkedin: Linkedin,
                            tiktok: TikTokIcon,
                          };
                          const Icon = icons[platform];
                          return (
                            <div
                              key={platform}
                              className="h-6 w-6 rounded bg-muted flex items-center justify-center"
                              title={platform}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                          );
                        })}
                        {enabledPlatforms.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{enabledPlatforms.length - 4}
                          </Badge>
                        )}
                      </div>

                      {/* Status badge */}
                      <Badge className={statusColors[campaign.status]}>
                        {campaign.status}
                      </Badge>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/marketing/campaigns/${campaign._id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/marketing/campaigns/${campaign._id}?edit=true`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(campaign._id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setCampaignToDelete(campaign._id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
