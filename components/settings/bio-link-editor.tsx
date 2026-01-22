"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  Eye,
  EyeOff,
  Pencil,
  Link as LinkIcon,
  MousePointerClick,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BioLink {
  _id: Id<"linkInBioLinks">;
  storeId: Id<"stores">;
  userId: string;
  title: string;
  url: string;
  description?: string;
  thumbnailUrl?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  clicks: number;
  createdAt: number;
  updatedAt: number;
}

interface SortableLinkItemProps {
  link: BioLink;
  onEdit: (link: BioLink) => void;
  onDelete: (link: BioLink) => void;
  onToggleActive: (link: BioLink) => void;
  onViewAnalytics: (link: BioLink) => void;
}

function SortableLinkItem({
  link,
  onEdit,
  onDelete,
  onToggleActive,
  onViewAnalytics,
}: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-zinc-900",
        isDragging && "shadow-lg ring-2 ring-blue-500",
        !link.isActive && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{link.title}</span>
          {!link.isActive && (
            <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              Hidden
            </span>
          )}
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-blue-500 truncate block max-w-xs"
        >
          {link.url}
        </a>
      </div>

      <div className="flex items-center gap-1 text-sm text-zinc-500">
        <MousePointerClick className="h-4 w-4" />
        <span>{link.clicks}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onViewAnalytics(link)}
          title="View analytics"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleActive(link)}
          title={link.isActive ? "Hide link" : "Show link"}
        >
          {link.isActive ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(link)}
          title="Edit link"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => onDelete(link)}
          title="Delete link"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface LinkAnalyticsModalProps {
  link: BioLink | null;
  isOpen: boolean;
  onClose: () => void;
}

function LinkAnalyticsModal({ link, isOpen, onClose }: LinkAnalyticsModalProps) {
  const analytics = useQuery(
    api.linkInBio.getLinkAnalytics,
    link ? { linkId: link._id, days: 30 } : "skip"
  );

  if (!link) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Analytics for "{link.title}"</DialogTitle>
          <DialogDescription>Last 30 days performance</DialogDescription>
        </DialogHeader>

        {!analytics ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-3xl font-bold">{analytics.totalClicks}</div>
              <div className="text-sm text-zinc-500">Total Clicks</div>
            </div>

            {analytics.clicksBySource.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Traffic Sources</h4>
                <div className="space-y-2">
                  {analytics.clicksBySource.slice(0, 5).map((item) => (
                    <div
                      key={item.source}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">{item.source}</span>
                      <span className="text-zinc-500">{item.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.clicksByDevice.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Devices</h4>
                <div className="flex gap-4">
                  {analytics.clicksByDevice.map((item) => (
                    <div
                      key={item.device}
                      className="flex-1 text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                    >
                      <div className="text-lg font-semibold">{item.clicks}</div>
                      <div className="text-xs text-zinc-500 capitalize">
                        {item.device}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.clicksByCountry.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Top Countries</h4>
                <div className="space-y-2">
                  {analytics.clicksByCountry.slice(0, 5).map((item) => (
                    <div
                      key={item.country}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{item.country}</span>
                      <span className="text-zinc-500">{item.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BioLinkEditorProps {
  storeId: Id<"stores">;
  userId: string;
}

export function BioLinkEditor({ storeId, userId }: BioLinkEditorProps) {
  const links = useQuery(api.linkInBio.getStoreLinks, { storeId });
  const storeAnalytics = useQuery(api.linkInBio.getStoreLinksAnalytics, {
    storeId,
    days: 30,
  });

  const createLink = useMutation(api.linkInBio.createLink);
  const updateLink = useMutation(api.linkInBio.updateLink);
  const deleteLink = useMutation(api.linkInBio.deleteLink);
  const reorderLinks = useMutation(api.linkInBio.reorderLinks);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<BioLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<BioLink | null>(null);
  const [analyticsLink, setAnalyticsLink] = useState<BioLink | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && links) {
      const oldIndex = links.findIndex((link) => link._id === active.id);
      const newIndex = links.findIndex((link) => link._id === over.id);

      const newOrder = arrayMove(links, oldIndex, newIndex);
      const linkIds = newOrder.map((link) => link._id);

      try {
        await reorderLinks({ storeId, linkIds });
        toast.success("Links reordered");
      } catch {
        toast.error("Failed to reorder links");
      }
    }
  };

  const handleAddLink = async () => {
    if (!formData.title || !formData.url) {
      toast.error("Please fill in title and URL");
      return;
    }

    setIsSaving(true);
    try {
      await createLink({
        storeId,
        userId,
        title: formData.title,
        url: formData.url,
        description: formData.description || undefined,
      });
      toast.success("Link added");
      setIsAddDialogOpen(false);
      setFormData({ title: "", url: "", description: "" });
    } catch {
      toast.error("Failed to add link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink || !formData.title || !formData.url) {
      toast.error("Please fill in title and URL");
      return;
    }

    setIsSaving(true);
    try {
      await updateLink({
        linkId: editingLink._id,
        title: formData.title,
        url: formData.url,
        description: formData.description || undefined,
      });
      toast.success("Link updated");
      setEditingLink(null);
      setFormData({ title: "", url: "", description: "" });
    } catch {
      toast.error("Failed to update link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (link: BioLink) => {
    try {
      await updateLink({
        linkId: link._id,
        isActive: !link.isActive,
      });
      toast.success(link.isActive ? "Link hidden" : "Link visible");
    } catch {
      toast.error("Failed to update link");
    }
  };

  const handleDeleteLink = async () => {
    if (!deletingLink) return;

    try {
      await deleteLink({ linkId: deletingLink._id });
      toast.success("Link deleted");
      setDeletingLink(null);
    } catch {
      toast.error("Failed to delete link");
    }
  };

  const openEditDialog = (link: BioLink) => {
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || "",
    });
    setEditingLink(link);
  };

  const openAddDialog = () => {
    setFormData({ title: "", url: "", description: "" });
    setIsAddDialogOpen(true);
  };

  if (!links) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {storeAnalytics && storeAnalytics.totalClicks > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Link Performance</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold">{storeAnalytics.totalClicks}</div>
                <div className="text-xs text-zinc-500">Total Clicks</div>
              </div>
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="text-2xl font-bold">{links.length}</div>
                <div className="text-xs text-zinc-500">Active Links</div>
              </div>
              {storeAnalytics.topSources[0] && (
                <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-2xl font-bold capitalize truncate">
                    {storeAnalytics.topSources[0].source}
                  </div>
                  <div className="text-xs text-zinc-500">Top Source</div>
                </div>
              )}
              {storeAnalytics.linkPerformance[0] && (
                <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-2xl font-bold truncate">
                    {storeAnalytics.linkPerformance[0].title}
                  </div>
                  <div className="text-xs text-zinc-500">Top Link</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Bio Links
              </CardTitle>
              <CardDescription>
                Drag to reorder. Links appear on your public profile.
              </CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <h3 className="mt-4 text-lg font-medium">No links yet</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Add your first link to start building your bio page.
              </p>
              <Button onClick={openAddDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Link
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map((l) => l._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {links.map((link) => (
                    <SortableLinkItem
                      key={link._id}
                      link={link}
                      onEdit={openEditDialog}
                      onDelete={setDeletingLink}
                      onToggleActive={handleToggleActive}
                      onViewAnalytics={setAnalyticsLink}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Add Link Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>
              Add a new link to your bio page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-title">Title</Label>
              <Input
                id="add-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="My Website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-url">URL</Label>
              <Input
                id="add-url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description (optional)</Label>
              <Input
                id="add-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="A short description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog
        open={!!editingLink}
        onOpenChange={(open) => !open && setEditingLink(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update your link details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="My Website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="A short description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLink(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLink} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingLink}
        onOpenChange={(open) => !open && setDeletingLink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLink?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Analytics Modal */}
      <LinkAnalyticsModal
        link={analyticsLink}
        isOpen={!!analyticsLink}
        onClose={() => setAnalyticsLink(null)}
      />
    </div>
  );
}
