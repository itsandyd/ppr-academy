"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Save,
  Loader2,
  Globe,
  Copy,
  ExternalLink,
  BarChart3,
  Layout,
  Type,
  Image,
  Video,
  Star,
  MessageSquare,
  DollarSign,
  HelpCircle,
  MousePointer,
  Timer,
  Users,
  ShoppingBag,
  Code,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageEditorProps {
  pageId: Id<"landingPages">;
  storeSlug?: string;
}

// Block type icons
const BLOCK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hero: Layout,
  features: Star,
  testimonials: MessageSquare,
  pricing: DollarSign,
  cta: MousePointer,
  faq: HelpCircle,
  video: Video,
  image: Image,
  text: Type,
  countdown: Timer,
  social_proof: Users,
  product_showcase: ShoppingBag,
  custom_html: Code,
};

const BLOCK_NAMES: Record<string, string> = {
  hero: "Hero Section",
  features: "Features",
  testimonials: "Testimonials",
  pricing: "Pricing",
  cta: "Call to Action",
  faq: "FAQ",
  video: "Video",
  image: "Image",
  text: "Text Block",
  countdown: "Countdown Timer",
  social_proof: "Social Proof",
  product_showcase: "Product Showcase",
  custom_html: "Custom HTML",
};

export function LandingPageEditor({ pageId, storeSlug }: LandingPageEditorProps) {
  const page = useQuery(api.landingPages.getLandingPage, { pageId });
  const updatePage = useMutation(api.landingPages.updateLandingPage);
  const addBlock = useMutation(api.landingPages.addBlock);
  const updateBlock = useMutation(api.landingPages.updateBlock);
  const removeBlock = useMutation(api.landingPages.removeBlock);
  const reorderBlocks = useMutation(api.landingPages.reorderBlocks);
  const togglePublish = useMutation(api.landingPages.togglePublish);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"blocks" | "settings" | "seo">("blocks");

  const selectedBlock = page?.blocks.find((b: any) => b.id === selectedBlockId);

  const handleAddBlock = async (type: string) => {
    if (!page) return;
    const position = page.blocks.length;

    try {
      const result = await addBlock({
        pageId,
        type: type as any,
        position,
      });
      setSelectedBlockId(result.blockId);
      toast.success(`Added ${BLOCK_NAMES[type]} block`);
    } catch (error) {
      toast.error("Failed to add block");
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    try {
      await removeBlock({ pageId, blockId });
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null);
      }
      toast.success("Block removed");
    } catch (error) {
      toast.error("Failed to remove block");
    }
  };

  const handleBlockVisibilityToggle = async (blockId: string, isVisible: boolean) => {
    const block = page?.blocks.find((b: any) => b.id === blockId);
    if (!block) return;

    try {
      await updateBlock({
        pageId,
        blockId,
        settings: block.settings,
        isVisible,
      });
    } catch (error) {
      toast.error("Failed to update block visibility");
    }
  };

  const handleMoveBlock = async (blockId: string, direction: "up" | "down") => {
    if (!page) return;

    const currentIndex = page.blocks.findIndex((b: any) => b.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= page.blocks.length) return;

    const newOrder = [...page.blocks];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    try {
      await reorderBlocks({
        pageId,
        blockIds: newOrder.map((b) => b.id),
      });
    } catch (error) {
      toast.error("Failed to reorder blocks");
    }
  };

  const handleBlockSettingsChange = async (settings: any) => {
    if (!selectedBlockId || !selectedBlock) return;

    try {
      await updateBlock({
        pageId,
        blockId: selectedBlockId,
        settings,
        isVisible: selectedBlock.isVisible,
      });
    } catch (error) {
      toast.error("Failed to update block");
    }
  };

  const handlePublishToggle = async () => {
    try {
      const result = await togglePublish({ pageId });
      toast.success(result.isPublished ? "Page published!" : "Page unpublished");
    } catch (error) {
      toast.error("Failed to update publish status");
    }
  };

  const handleSavePageSettings = async (data: {
    title?: string;
    slug?: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
  }) => {
    setIsSaving(true);
    try {
      await updatePage({
        pageId,
        ...data,
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!page) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pageUrl = storeSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL}/${storeSlug}/p/${page.slug}`
    : `#`;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{page.title}</h1>
          <Badge variant={page.isPublished ? "default" : "secondary"}>
            {page.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pageUrl, "_blank")}
            disabled={!page.isPublished}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(pageUrl);
              toast.success("URL copied to clipboard");
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy URL
          </Button>
          <Button
            variant={page.isPublished ? "outline" : "default"}
            size="sm"
            onClick={handlePublishToggle}
          >
            <Globe className="mr-2 h-4 w-4" />
            {page.isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Block List */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r bg-muted/30">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="blocks" className="flex-1">
                Blocks
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="m-0">
              <div className="p-4">
                {/* Add Block Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {Object.entries(BLOCK_NAMES).map(([type, name]) => {
                      const Icon = BLOCK_ICONS[type];
                      return (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => handleAddBlock(type)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {name}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Block List */}
                <div className="mt-4 space-y-2">
                  {page.blocks.map((block: any, index: number) => {
                    const Icon = BLOCK_ICONS[block.type] || Layout;
                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg border bg-background p-3 transition-colors",
                          selectedBlockId === block.id && "border-primary ring-1 ring-primary",
                          !block.isVisible && "opacity-50"
                        )}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">
                          {BLOCK_NAMES[block.type]}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(block.id, "up");
                            }}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(block.id, "down");
                            }}
                            disabled={index === page.blocks.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockVisibilityToggle(block.id, !block.isVisible);
                            }}
                          >
                            {block.isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBlock(block.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {page.blocks.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed p-8 text-center">
                      <Layout className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No blocks yet. Add your first block to get started.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-4">
              <PageSettingsForm
                page={page}
                onSave={handleSavePageSettings}
                isSaving={isSaving}
              />
            </TabsContent>

            <TabsContent value="seo" className="m-0 p-4">
              <SEOSettingsForm
                page={page}
                onSave={handleSavePageSettings}
                isSaving={isSaving}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Block Editor */}
        <div className="flex-1 overflow-y-auto bg-muted/50 p-8">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onSettingsChange={handleBlockSettingsChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Select a block to edit</p>
                <p className="text-sm text-muted-foreground">
                  Click on a block from the list to customize it
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Analytics (when no block selected) */}
        {!selectedBlock && page.isPublished && (
          <div className="w-72 flex-shrink-0 overflow-y-auto border-l bg-background p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <BarChart3 className="h-4 w-4" />
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{page.views || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{page.conversions || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {(page.conversionRate || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Block Editor Component
function BlockEditor({
  block,
  onSettingsChange,
}: {
  block: { id: string; type: string; settings: any };
  onSettingsChange: (settings: any) => void;
}) {
  const [localSettings, setLocalSettings] = useState(block.settings);

  const handleChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    toast.success("Block updated");
  };

  const Icon = BLOCK_ICONS[block.type] || Layout;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {BLOCK_NAMES[block.type]} Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Render different settings based on block type */}
        {block.type === "hero" && (
          <HeroBlockSettings settings={localSettings} onChange={handleChange} />
        )}
        {block.type === "features" && (
          <FeaturesBlockSettings settings={localSettings} onChange={handleChange} />
        )}
        {block.type === "cta" && (
          <CTABlockSettings settings={localSettings} onChange={handleChange} />
        )}
        {block.type === "text" && (
          <TextBlockSettings settings={localSettings} onChange={handleChange} />
        )}
        {block.type === "testimonials" && (
          <TestimonialsBlockSettings settings={localSettings} onChange={handleChange} />
        )}
        {/* Add more block type editors as needed */}

        <Separator />
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hero Block Settings
function HeroBlockSettings({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          value={settings.headline || ""}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="Your main headline"
        />
      </div>
      <div className="space-y-2">
        <Label>Subheadline</Label>
        <Textarea
          value={settings.subheadline || ""}
          onChange={(e) => onChange("subheadline", e.target.value)}
          placeholder="Supporting text"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>CTA Button Text</Label>
        <Input
          value={settings.ctaText || ""}
          onChange={(e) => onChange("ctaText", e.target.value)}
          placeholder="Get Started"
        />
      </div>
      <div className="space-y-2">
        <Label>CTA Button URL</Label>
        <Input
          value={settings.ctaUrl || ""}
          onChange={(e) => onChange("ctaUrl", e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>Background Color</Label>
        <Input
          type="color"
          value={settings.backgroundColor || "#4F46E5"}
          onChange={(e) => onChange("backgroundColor", e.target.value)}
          className="h-10 w-20"
        />
      </div>
    </div>
  );
}

// Features Block Settings
function FeaturesBlockSettings({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  const features = settings.features || [];

  const addFeature = () => {
    onChange("features", [
      ...features,
      { icon: "star", title: "New Feature", description: "Description" },
    ]);
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange("features", newFeatures);
  };

  const removeFeature = (index: number) => {
    onChange("features", features.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Section Headline</Label>
        <Input
          value={settings.headline || ""}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="Key Features"
        />
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Features</Label>
          <Button variant="outline" size="sm" onClick={addFeature}>
            <Plus className="mr-2 h-4 w-4" />
            Add Feature
          </Button>
        </div>
        {features.map((feature: any, index: number) => (
          <div key={index} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Feature {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFeature(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={feature.title}
              onChange={(e) => updateFeature(index, "title", e.target.value)}
              placeholder="Feature title"
            />
            <Textarea
              value={feature.description}
              onChange={(e) => updateFeature(index, "description", e.target.value)}
              placeholder="Feature description"
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// CTA Block Settings
function CTABlockSettings({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          value={settings.headline || ""}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="Ready to Get Started?"
        />
      </div>
      <div className="space-y-2">
        <Label>Subheadline</Label>
        <Textarea
          value={settings.subheadline || ""}
          onChange={(e) => onChange("subheadline", e.target.value)}
          placeholder="Join thousands of satisfied customers"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={settings.ctaText || ""}
          onChange={(e) => onChange("ctaText", e.target.value)}
          placeholder="Start Now"
        />
      </div>
      <div className="space-y-2">
        <Label>Button URL</Label>
        <Input
          value={settings.ctaUrl || ""}
          onChange={(e) => onChange("ctaUrl", e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

// Text Block Settings
function TextBlockSettings({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={settings.content || ""}
          onChange={(e) => onChange("content", e.target.value)}
          placeholder="Add your content here..."
          rows={8}
        />
      </div>
      <div className="space-y-2">
        <Label>Text Alignment</Label>
        <div className="flex gap-2">
          {["left", "center", "right"].map((align) => (
            <Button
              key={align}
              variant={settings.alignment === align ? "default" : "outline"}
              size="sm"
              onClick={() => onChange("alignment", align)}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Testimonials Block Settings
function TestimonialsBlockSettings({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  const testimonials = settings.testimonials || [];

  const addTestimonial = () => {
    onChange("testimonials", [
      ...testimonials,
      { name: "Customer Name", role: "Role", text: "Testimonial text", avatar: "" },
    ]);
  };

  const updateTestimonial = (index: number, field: string, value: string) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    onChange("testimonials", newTestimonials);
  };

  const removeTestimonial = (index: number) => {
    onChange("testimonials", testimonials.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Section Headline</Label>
        <Input
          value={settings.headline || ""}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="What People Say"
        />
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Testimonials</Label>
          <Button variant="outline" size="sm" onClick={addTestimonial}>
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
        {testimonials.map((testimonial: any, index: number) => (
          <div key={index} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Testimonial {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeTestimonial(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={testimonial.name}
              onChange={(e) => updateTestimonial(index, "name", e.target.value)}
              placeholder="Customer name"
            />
            <Input
              value={testimonial.role}
              onChange={(e) => updateTestimonial(index, "role", e.target.value)}
              placeholder="Role/title"
            />
            <Textarea
              value={testimonial.text}
              onChange={(e) => updateTestimonial(index, "text", e.target.value)}
              placeholder="Testimonial text"
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Page Settings Form
function PageSettingsForm({
  page,
  onSave,
  isSaving,
}: {
  page: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [description, setDescription] = useState(page.description || "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Page Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Landing Page"
        />
      </div>
      <div className="space-y-2">
        <Label>URL Slug</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          placeholder="my-landing-page"
        />
        <p className="text-xs text-muted-foreground">
          yourstore.com/p/{slug}
        </p>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Internal description for this page"
          rows={3}
        />
      </div>
      <Button
        onClick={() => onSave({ title, slug, description })}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}

// SEO Settings Form
function SEOSettingsForm({
  page,
  onSave,
  isSaving,
}: {
  page: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [metaTitle, setMetaTitle] = useState(page.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(page.metaDescription || "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Meta Title</Label>
        <Input
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="Page title for search engines"
        />
        <p className="text-xs text-muted-foreground">
          {metaTitle.length}/60 characters
        </p>
      </div>
      <div className="space-y-2">
        <Label>Meta Description</Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="Description for search engines"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {metaDescription.length}/160 characters
        </p>
      </div>
      <Button
        onClick={() => onSave({ metaTitle, metaDescription })}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save SEO Settings
          </>
        )}
      </Button>
    </div>
  );
}
