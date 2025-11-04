"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Puzzle, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Loader2,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";

type PricingType = "FREE" | "PAID" | "FREEMIUM";

interface PluginFormData {
  name: string;
  slug?: string;
  author?: string;
  description?: string;
  videoScript?: string;
  image?: string;
  videoUrl?: string;
  audioUrl?: string;
  categoryId?: Id<"pluginCategories">;
  pluginTypeId?: Id<"pluginTypes">;
  optInFormUrl?: string;
  price?: number;
  pricingType: PricingType;
  purchaseUrl?: string;
  isPublished: boolean;
}

export default function AdminPluginsPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PluginFormData>({
    name: "",
    slug: "",
    author: "",
    description: "",
    videoScript: "",
    image: "",
    videoUrl: "",
    audioUrl: "",
    optInFormUrl: "",
    price: 0,
    pricingType: "FREE",
    purchaseUrl: "",
    isPublished: false,
  });

  // Fetch data
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const plugins = useQuery(
    api.plugins.getAllPlugins,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const pluginTypes = useQuery(api.plugins.getPluginTypes);
  const pluginCategories = useQuery(api.plugins.getPluginCategories);

  // Mutations
  const createPlugin = useMutation(api.plugins.createPlugin);
  const updatePlugin = useMutation(api.plugins.updatePlugin);
  const deletePlugin = useMutation(api.plugins.deletePlugin);
  const createPluginType = useMutation(api.plugins.createPluginType);
  const createPluginCategory = useMutation(api.plugins.createPluginCategory);

  // Filter plugins
  const filteredPlugins = plugins?.filter((plugin) =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      author: "",
      description: "",
      videoScript: "",
      image: "",
      videoUrl: "",
      audioUrl: "",
      optInFormUrl: "",
      price: 0,
      pricingType: "FREE",
      purchaseUrl: "",
      isPublished: false,
    });
  };

  const handleCreatePlugin = async () => {
    if (!user?.id || !formData.name) {
      toast.error("Please fill in the plugin name");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlugin({
        clerkId: user.id,
        ...formData,
      });
      toast.success("Plugin created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`Failed to create plugin: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlugin = async () => {
    if (!user?.id || !selectedPlugin) return;

    setIsSubmitting(true);
    try {
      await updatePlugin({
        clerkId: user.id,
        pluginId: selectedPlugin._id,
        ...formData,
      });
      toast.success("Plugin updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedPlugin(null);
      resetForm();
    } catch (error: any) {
      toast.error(`Failed to update plugin: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlugin = async (pluginId: Id<"plugins">) => {
    if (!user?.id) return;

    if (!confirm("Are you sure you want to delete this plugin?")) return;

    try {
      await deletePlugin({
        clerkId: user.id,
        pluginId,
      });
      toast.success("Plugin deleted successfully!");
    } catch (error: any) {
      toast.error(`Failed to delete plugin: ${error.message}`);
    }
  };

  const openEditDialog = (plugin: any) => {
    setSelectedPlugin(plugin);
    setFormData({
      name: plugin.name,
      slug: plugin.slug || "",
      author: plugin.author || "",
      description: plugin.description || "",
      videoScript: plugin.videoScript || "",
      image: plugin.image || "",
      videoUrl: plugin.videoUrl || "",
      audioUrl: plugin.audioUrl || "",
      categoryId: plugin.categoryId,
      pluginTypeId: plugin.pluginTypeId,
      optInFormUrl: plugin.optInFormUrl || "",
      price: plugin.price || 0,
      pricingType: plugin.pricingType,
      purchaseUrl: plugin.purchaseUrl || "",
      isPublished: plugin.isPublished || false,
    });
    setIsEditDialogOpen(true);
  };

  const PluginFormFields = () => (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {/* Basic Info */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Plugin Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Serum, FabFilter Pro-Q 3"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL-friendly)</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="e.g., serum, fabfilter-pro-q-3"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author/Manufacturer</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          placeholder="e.g., Xfer Records, FabFilter"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the plugin features and benefits... (HTML supported)"
          rows={6}
          className="bg-background font-mono text-sm"
        />
        {formData.description && (
          <div className="mt-2 p-4 border border-border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Preview:</p>
            <div 
              className="prose dark:prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.description }}
            />
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pluginType">Plugin Type</Label>
          <Select
            value={formData.pluginTypeId}
            onValueChange={(value) =>
              setFormData({ ...formData, pluginTypeId: value as Id<"pluginTypes"> })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {pluginTypes?.map((type) => (
                <SelectItem key={type._id} value={type._id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) =>
              setFormData({ ...formData, categoryId: value as Id<"pluginCategories"> })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {pluginCategories?.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Media */}
      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://example.com/plugin-image.jpg"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input
          id="videoUrl"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audioUrl">Audio Demo URL</Label>
        <Input
          id="audioUrl"
          value={formData.audioUrl}
          onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
          placeholder="https://example.com/audio-demo.mp3"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoScript">Video Script (for AI generation)</Label>
        <Textarea
          id="videoScript"
          value={formData.videoScript}
          onChange={(e) => setFormData({ ...formData, videoScript: e.target.value })}
          placeholder="Script for generating video content..."
          rows={3}
          className="bg-background"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricingType">Pricing Type</Label>
          <Select
            value={formData.pricingType}
            onValueChange={(value) =>
              setFormData({ ...formData, pricingType: value as PricingType })
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="FREEMIUM">Freemium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaseUrl">Purchase URL</Label>
        <Input
          id="purchaseUrl"
          value={formData.purchaseUrl}
          onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
          placeholder="https://manufacturer.com/buy"
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="optInFormUrl">Opt-in Form URL (for free plugins)</Label>
        <Input
          id="optInFormUrl"
          value={formData.optInFormUrl}
          onChange={(e) => setFormData({ ...formData, optInFormUrl: e.target.value })}
          placeholder="https://example.com/opt-in"
          className="bg-background"
        />
      </div>

      {/* Publish Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
        />
        <Label htmlFor="isPublished" className="cursor-pointer">
          Publish to Marketplace
        </Label>
      </div>
    </div>
  );

  // Check admin access
  if (!user || convexUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!convexUser?.admin && !user?.publicMetadata?.admin && !user?.emailAddresses?.[0]?.emailAddress?.includes("@ppr")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access the plugin admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Plugin Directory</h1>
              <p className="text-muted-foreground">
                Manage plugins in the marketplace
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plugin
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{plugins?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Plugins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {plugins?.filter((p) => p.isPublished).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {plugins?.filter((p) => p.pricingType === "FREE").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Free Plugins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {plugins?.filter((p) => p.pricingType === "PAID").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Paid Plugins</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plugins by name, author, or description..."
                className="pl-10 bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Plugins Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlugins?.map((plugin) => (
                  <TableRow key={plugin._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {plugin.image ? (
                          <img
                            src={plugin.image}
                            alt={plugin.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{plugin.name}</div>
                          {plugin.slug && (
                            <div className="text-xs text-muted-foreground">
                              /{plugin.slug}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{plugin.author || "—"}</TableCell>
                    <TableCell>
                      {plugin.typeName ? (
                        <Badge variant="outline">{plugin.typeName}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {plugin.categoryName ? (
                        <Badge variant="secondary">{plugin.categoryName}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            plugin.pricingType === "FREE"
                              ? "default"
                              : plugin.pricingType === "PAID"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {plugin.pricingType}
                        </Badge>
                        {plugin.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            ${plugin.price}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={plugin.isPublished ? "default" : "secondary"}
                      >
                        {plugin.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {plugin.purchaseUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(plugin.purchaseUrl, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(plugin)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlugin(plugin._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredPlugins?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No plugins found. Create your first plugin to get started!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Create New Plugin</DialogTitle>
              <DialogDescription>
                Add a new plugin to the marketplace directory
              </DialogDescription>
            </DialogHeader>
            <PluginFormFields />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePlugin} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Plugin"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Edit Plugin</DialogTitle>
              <DialogDescription>
                Update plugin information
              </DialogDescription>
            </DialogHeader>
            <PluginFormFields />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedPlugin(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditPlugin} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Plugin"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

