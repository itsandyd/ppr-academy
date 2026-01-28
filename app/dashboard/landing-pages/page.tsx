"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  Layout,
  Plus,
  Globe,
  Eye,
  EyeOff,
  BarChart3,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Copy,
  Trash2,
  Pencil,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

interface LandingPage {
  _id: Id<"landingPages">;
  title: string;
  slug: string;
  isPublished: boolean;
  views?: number;
  conversions?: number;
  createdAt: number;
}

export default function LandingPagesPage() {
  const { user, isLoaded } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDescription, setNewPageDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Get user's store
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get landing pages for the store
  const landingPages = useQuery(
    api.landingPages.getLandingPages,
    store?._id ? { storeId: store._id } : "skip"
  ) as LandingPage[] | undefined;

  const createLandingPage = useMutation(api.landingPages.createLandingPage);
  const togglePublish = useMutation(api.landingPages.togglePublish);
  const deletePage = useMutation(api.landingPages.deletePage);

  const handleCreatePage = async () => {
    if (!store?._id || !user?.id || !newPageTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsCreating(true);
    try {
      // Generate slug from title
      const slug = newPageTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const pageId = await createLandingPage({
        storeId: store._id,
        userId: user.id,
        title: newPageTitle.trim(),
        slug: slug || `page-${Date.now()}`,
      });

      toast.success("Landing page created!");
      setIsCreateOpen(false);
      setNewPageTitle("");
      setNewPageDescription("");

      // Navigate to editor
      window.location.href = `/dashboard/landing-pages/${pageId}/edit`;
    } catch (error) {
      toast.error("Failed to create landing page");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePublish = async (pageId: Id<"landingPages">) => {
    try {
      const result = await togglePublish({ pageId });
      toast.success(result.isPublished ? "Page published!" : "Page unpublished");
    } catch (error) {
      toast.error("Failed to update publish status");
    }
  };

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/${store?.slug}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleDelete = async (pageId: Id<"landingPages">) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await deletePage({ pageId });
      toast.success("Page deleted");
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  // Loading state
  if (!isLoaded || store === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No store yet
  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="mt-1 text-muted-foreground">
            Create custom landing pages for your products
          </p>
        </div>
        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Layout className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-muted-foreground">
                Set up your store to create landing pages
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats calculation
  const stats = {
    total: landingPages?.length || 0,
    published: landingPages?.filter(p => p.isPublished).length || 0,
    totalViews: landingPages?.reduce((sum, p) => sum + (p.views || 0), 0) || 0,
    totalConversions: landingPages?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="mt-1 text-muted-foreground">
            Create high-converting landing pages for your products
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Landing Page
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-zinc-500">
              {stats.published} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-zinc-500">
              Across all pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
            <p className="text-xs text-zinc-500">
              {stats.totalViews > 0
                ? `${((stats.totalConversions / stats.totalViews) * 100).toFixed(1)}% rate`
                : "No views yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-zinc-500">
              {stats.total - stats.published} drafts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Landing Pages</CardTitle>
          <CardDescription>
            Create and manage your custom landing pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {landingPages && landingPages.length > 0 ? (
            <div className="space-y-4">
              {landingPages.map((page) => (
                <div
                  key={page._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Layout className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{page.title}</span>
                        <Badge variant={page.isPublished ? "default" : "secondary"}>
                          {page.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {page.views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {page.conversions || 0} conversions
                        </span>
                        <span>
                          Created {format(page.createdAt, "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/landing-pages/${page._id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    {page.isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/${store.slug}/p/${page.slug}`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyUrl(page.slug)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTogglePublish(page._id)}
                        >
                          {page.isPublished ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(page._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <Layout className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                  No landing pages yet
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Create your first landing page to start driving conversions
                </p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Landing Page
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-purple-500" />
            Landing Page Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <span className="text-sm font-bold text-purple-600">1</span>
              </div>
              <h4 className="font-medium">Drag & Drop Blocks</h4>
              <p className="text-sm text-zinc-500">
                Add hero sections, features, testimonials, pricing, and more
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <span className="text-sm font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-medium">A/B Testing</h4>
              <p className="text-sm text-zinc-500">
                Create variants and test different headlines and designs
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-medium">Track Conversions</h4>
              <p className="text-sm text-zinc-500">
                See views, clicks, and conversions in real-time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Landing Page</DialogTitle>
            <DialogDescription>
              Create a new landing page for your products or campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="Summer Sale 2024"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Internal description for this page..."
                value={newPageDescription}
                onChange={(e) => setNewPageDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Page
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
