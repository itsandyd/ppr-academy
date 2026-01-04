"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Prevent static generation for this page
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Users,
  ArrowLeft,
  Send,
  Eye,
  Save,
  User,
  Package,
  Sparkles,
  Loader2,
  Search,
  Plus,
  Tags,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "convex/react";
import { WysiwygEditor, WysiwygEditorRef } from "@/components/ui/wysiwyg-editor";

export default function CreateCampaignPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const { toast } = useToast();

  // Get template ID from URL if present
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  const templateId = searchParams?.get("template");

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isAddingAllCustomers, setIsAddingAllCustomers] = useState(false);

  // Product attachment & AI options
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [emailStyle, setEmailStyle] = useState<string>("casual-producer");
  const [copyLength, setCopyLength] = useState<string>("medium");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"all" | "any">("any");
  const [isAddingFromTags, setIsAddingFromTags] = useState(false);

  // Ref for Tiptap editor
  const editorRef = useRef<WysiwygEditorRef>(null);

  // Personalization token insertion helpers
  const insertToken = (token: string, targetField: "subject" | "content") => {
    if (targetField === "subject") {
      setSubject((prev) => prev + token);
    } else {
      // Use the editor ref to insert into Tiptap
      if (editorRef.current) {
        editorRef.current.insertText(token);
      }
    }
    toast({
      title: "Token inserted",
      description: `Added ${token} to ${targetField === "subject" ? "subject line" : "email content"}`,
    });
  };

  const personalizationTokens = [
    { label: "First Name", value: "{{firstName}}", description: "Contact's first name" },
    { label: "Full Name", value: "{{name}}", description: "Contact's full name" },
    { label: "Email", value: "{{email}}", description: "Contact's email address" },
    { label: "Music Alias", value: "{{musicAlias}}", description: "Artist/producer name" },
    { label: "DAW", value: "{{daw}}", description: "Digital Audio Workstation" },
    { label: "Student Level", value: "{{studentLevel}}", description: "Skill level" },
    { label: "City", value: "{{city}}", description: "City location" },
    { label: "State", value: "{{state}}", description: "State location" },
    { label: "Country", value: "{{country}}", description: "Country location" },
  ];

  // Fetch initial customers (first 100) for recipient selection
  const initialCustomers = useQuery(
    api.customers?.getCustomersForStore,
    storeId ? { storeId } : "skip"
  );

  // Fetch search results when user is actively searching
  const searchResults = useQuery(
    api.customers?.searchCustomersForStore,
    recipientSearch.length >= 2 ? { storeId, searchTerm: recipientSearch } : "skip"
  );

  // Get total count for display
  const customerCount = useQuery(api.customers?.getCustomerCount, storeId ? { storeId } : "skip");

  // Use search results when searching, otherwise show initial customers
  const customers = recipientSearch.length >= 2 ? searchResults || [] : initialCustomers || [];
  const totalCustomers = customerCount?.total || 0;
  const isSearching = recipientSearch.length >= 2 && searchResults === undefined;

  // Fetch store's email configuration
  const emailConfig = useQuery(
    api.stores?.getEmailConfig,
    storeId ? { storeId: storeId as any } : "skip"
  );

  // Fetch template if template ID provided
  const template = useQuery(
    api.emailTemplates?.getCampaignTemplateById,
    templateId ? { templateId } : "skip"
  );

  // Fetch products for attachment
  const courses = useQuery(api.courses?.getCoursesByStore, storeId ? { storeId } : "skip") || [];

  const products =
    useQuery(api.digitalProducts?.getProductsByStore, storeId ? { storeId } : "skip") || [];

  const samplePacks =
    useQuery(api.samplePacks?.getPacksByStore, storeId ? { storeId } : "skip") || [];

  // Combine all products
  const allProducts = [
    ...courses.map((c: any) => ({ ...c, productType: "course", displayName: c.title })),
    ...products.map((p: any) => ({ ...p, productType: "digital-product", displayName: p.title })),
    ...samplePacks.map((sp: any) => ({ ...sp, productType: "sample-pack", displayName: sp.name })),
  ];

  const selectedProduct = allProducts.find((p: any) => p._id === selectedProductId);

  // Auto-populate email fields from store config
  useEffect(() => {
    if (emailConfig) {
      setFromEmail(emailConfig.fromEmail || "");
      setFromName(emailConfig.fromName || "");
      setReplyToEmail(emailConfig.replyToEmail || "");
    }
  }, [emailConfig]);

  // Load template data when template is fetched
  useEffect(() => {
    if (template && !isLoadingTemplate) {
      setIsLoadingTemplate(true);
      setCampaignName(template.name);
      setSubject(template.subject);
      setPreviewText(template.previewText || "");
      setContent(template.body);

      toast({
        title: "Template Loaded!",
        description: `Using "${template.name}" template. Customize the content below.`,
      });
    }
  }, [template]);

  const createCampaign = useMutation((api as any).emailCampaigns?.createCampaign);
  const addRecipients = useMutation((api as any).emailCampaigns?.addRecipients);
  const addAllCustomersAsRecipients = useMutation(
    (api as any).emailCampaigns?.addAllCustomersAsRecipients
  );
  const addRecipientsFromTags = useMutation((api as any).emailCampaigns?.addRecipientsFromTags);
  const generateCopy = useAction(api.emailCopyGenerator?.generateEmailCopy);

  const segments = useQuery((api as any).emailContactSync?.getSegmentsByTag, { storeId });
  const tagPreview = useQuery(
    (api as any).emailCampaigns?.getTagPreview,
    selectedTagIds.length > 0
      ? {
          storeId,
          targetTagIds: selectedTagIds,
          targetTagMode: tagMode,
          excludeTagIds: excludeTagIds.length > 0 ? excludeTagIds : undefined,
        }
      : "skip"
  );

  // Generate email copy from product + template
  const handleGenerateCopy = async () => {
    if (!selectedProduct) {
      toast({
        title: "Missing Information",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    // Define tone based on style selection
    const toneMap: Record<string, string> = {
      "casual-producer":
        "casual and authentic like a music producer talking to another producer. Use producer slang, be real, no corporate BS",
      "direct-response":
        "direct response marketing style - problem-agitate-solution framework, scarcity, urgency, strong CTAs, benefit-focused",
      storytelling:
        "storytelling style - personal anecdotes, journey narrative, emotional connection, relatable struggles",
      educational:
        "educational and helpful - teach first, sell second, value-focused, tips and insights",
      hype: "enthusiastic and energetic - build excitement, use FOMO, create buzz, celebration energy",
    };

    const selectedTone = toneMap[emailStyle] || toneMap["casual-producer"];

    setIsGeneratingCopy(true);
    try {
      const baseTemplate = template
        ? template.body
        : `Write a compelling email about {{productName}}.\n\nInclude benefits, features, and a clear call to action.`;
      const baseSubject = template ? template.subject : `New: {{productName}}`;

      const result = await generateCopy({
        templateBody: baseTemplate,
        templateSubject: baseSubject,
        productInfo: {
          name: selectedProduct.displayName,
          type: selectedProduct.productType,
          description: selectedProduct.description,
          price: selectedProduct.price,
          creditPrice: selectedProduct.creditPrice,
          features: selectedProduct.tags || selectedProduct.categories,
          sampleCount: selectedProduct.totalSamples,
          genres: selectedProduct.genres,
          duration: selectedProduct.duration,
          moduleCount: (selectedProduct as any).moduleCount,
        },
        creatorName: fromName || user?.fullName || "Creator",
        tone: selectedTone,
      });

      setSubject(result.subject);
      setContent(result.body);
      setPreviewText(result.previewText);

      toast({
        title: "✨ Email Copy Generated!",
        description:
          "AI has customized the template with your product info. Review and edit as needed.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate copy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Handler to add ALL customers from the store as recipients
  const handleAddAllCustomers = async () => {
    if (
      !confirm(
        `Add ALL ${totalCustomers.toLocaleString()} customers as recipients? This may take a moment.`
      )
    ) {
      return;
    }

    // Need basic campaign info first
    if (!campaignName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a campaign name first",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !content.trim() || !fromEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in subject, content, and from email before adding all recipients",
        variant: "destructive",
      });
      return;
    }

    setIsAddingAllCustomers(true);
    try {
      // Create campaign first
      const newCampaignId = await createCampaign({
        name: campaignName,
        subject,
        content,
        previewText,
        fromEmail,
        replyToEmail,
        storeId,
        adminUserId: user?.id || "",
      });

      toast({
        title: "Adding all customers...",
        description: `Processing ${totalCustomers.toLocaleString()} customers. This will take a few moments.`,
      });

      // Add customers in batches by calling mutation repeatedly
      // Uses cursor-based pagination for safe handling of large datasets
      let hasMore = true;
      let totalAdded = 0;
      let batchCount = 0;
      let cursor: string | undefined = undefined;

      while (hasMore) {
        const result: { totalCount: number; hasMore: boolean; nextCursor?: string } =
          await addAllCustomersAsRecipients({
            campaignId: newCampaignId,
            storeId,
            batchSize: 100,
            cursor,
            currentTotalCount: totalAdded,
          });

        totalAdded = result.totalCount;
        hasMore = result.hasMore;
        cursor = result.nextCursor;
        batchCount++;

        // Show progress
        if (hasMore && batchCount % 10 === 0) {
          toast({
            title: "Processing...",
            description: `Added ${totalAdded.toLocaleString()} of ~${totalCustomers.toLocaleString()} recipients (batch ${batchCount})`,
          });
        }
      }

      toast({
        title: "Success!",
        description: `Added all ${totalAdded.toLocaleString()} recipients to your campaign`,
      });

      // Navigate to the campaign
      router.push(`/store/${storeId}/email-campaigns/${newCampaignId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add all customers",
        variant: "destructive",
      });
    } finally {
      setIsAddingAllCustomers(false);
    }
  };

  const handleAddFromTags = async () => {
    if (selectedTagIds.length === 0) {
      toast({
        title: "No segments selected",
        description: "Please select at least one segment",
        variant: "destructive",
      });
      return;
    }
    if (!campaignName.trim() || !subject.trim() || !content.trim() || !fromEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in campaign details first",
        variant: "destructive",
      });
      return;
    }

    setIsAddingFromTags(true);
    try {
      const newCampaignId = await createCampaign({
        name: campaignName,
        subject,
        content,
        previewText,
        fromEmail,
        replyToEmail,
        storeId,
        adminUserId: user?.id || "",
      });

      const result = await addRecipientsFromTags({
        campaignId: newCampaignId,
        storeId,
        targetTagIds: selectedTagIds,
        targetTagMode: tagMode,
        excludeTagIds: excludeTagIds.length > 0 ? excludeTagIds : undefined,
      });

      toast({
        title: "Campaign Created!",
        description: `Added ${result.addedCount} recipients from selected segments`,
      });
      router.push(`/store/${storeId}/email-campaigns`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsAddingFromTags(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter an email subject",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter email content",
        variant: "destructive",
      });
      return;
    }

    if (!fromEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a from email address",
        variant: "destructive",
      });
      return;
    }

    if (selectedCustomers.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Extract tags from template if available
      const tags = template?.tags || [];

      // Create the campaign
      const campaignId = await createCampaign({
        name: campaignName,
        subject: subject,
        content: content,
        previewText: previewText || undefined,
        storeId: storeId,
        adminUserId: user?.id || "",
        fromEmail: fromEmail,
        replyToEmail: replyToEmail || undefined,
        tags: tags.length > 0 ? tags : undefined,
        templateId: templateId || undefined,
      });

      // Add recipients
      await addRecipients({
        campaignId,
        customerIds: selectedCustomers,
      });

      toast({
        title: "Campaign Created!",
        description: "Your email campaign has been created successfully",
      });

      router.push(`/store/${storeId}/email-campaigns`);
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c: any) => c._id));
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  const getCustomerBadge = (customer: any) => {
    const typeConfig = {
      lead: { color: "bg-chart-2/10 text-chart-2", label: "Lead" },
      paying: { color: "bg-chart-1/10 text-chart-1", label: "Customer" },
      subscription: { color: "bg-chart-3/10 text-chart-3", label: "Subscriber" },
    };

    const config = typeConfig[customer.type as keyof typeof typeConfig] || typeConfig.lead;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 pb-24 pt-10">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/store/${storeId}/email-campaigns`)}
          className="-ml-3 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-chart-1/20 to-chart-2/20 p-3">
            <Mail className="h-8 w-8 text-chart-1" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-4xl font-bold text-transparent">
              Create Email Campaign
            </h1>
            <p className="mt-1 text-muted-foreground">
              Design and send marketing emails to your customers
            </p>
          </div>
        </div>
      </div>

      {/* Template Badge */}
      {template && (
        <Card className="border-chart-1/20 bg-chart-1/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-chart-1" />
                <div>
                  <p className="font-medium">Using Template: {template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/store/${storeId}/email-campaigns/create`);
                  setCampaignName("");
                  setSubject("");
                  setContent("");
                  setPreviewText("");
                }}
              >
                Clear Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-black">
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="recipients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients ({selectedCustomers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              {/* AI Email Generator */}
              <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-chart-2/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-chart-1" />
                    AI Email Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="product">Select Product to Promote</Label>
                      <Select
                        value={selectedProductId || "none"}
                        onValueChange={(v) => setSelectedProductId(v === "none" ? undefined : v)}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue placeholder="Choose a product..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="none">No product (write from scratch)</SelectItem>
                          {allProducts.length > 0 && (
                            <>
                              <SelectItem disabled value="divider-courses">
                                <span className="text-xs font-semibold">COURSES</span>
                              </SelectItem>
                              {allProducts
                                .filter((p: any) => p.productType === "course")
                                .map((p: any) => (
                                  <SelectItem key={p._id} value={p._id}>
                                    {p.displayName}
                                  </SelectItem>
                                ))}
                              <SelectItem disabled value="divider-packs">
                                <span className="text-xs font-semibold">SAMPLE PACKS</span>
                              </SelectItem>
                              {allProducts
                                .filter((p: any) => p.productType === "sample-pack")
                                .map((p: any) => (
                                  <SelectItem key={p._id} value={p._id}>
                                    {p.displayName}
                                  </SelectItem>
                                ))}
                              <SelectItem disabled value="divider-products">
                                <span className="text-xs font-semibold">PRODUCTS</span>
                              </SelectItem>
                              {allProducts
                                .filter((p: any) => p.productType === "digital-product")
                                .map((p: any) => (
                                  <SelectItem key={p._id} value={p._id}>
                                    {p.displayName}
                                  </SelectItem>
                                ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Email Style */}
                    <div className="space-y-2">
                      <Label htmlFor="style">Email Style</Label>
                      <Select value={emailStyle} onValueChange={setEmailStyle}>
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="casual-producer">
                            <div>
                              <div className="font-medium">Casual Producer</div>
                              <div className="text-xs text-muted-foreground">
                                Authentic, real talk
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="direct-response">
                            <div>
                              <div className="font-medium">Direct Response 🎯</div>
                              <div className="text-xs text-muted-foreground">
                                Urgency, scarcity, strong CTAs
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="storytelling">
                            <div>
                              <div className="font-medium">Storytelling</div>
                              <div className="text-xs text-muted-foreground">
                                Personal journey, relatable
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="educational">
                            <div>
                              <div className="font-medium">Educational</div>
                              <div className="text-xs text-muted-foreground">
                                Value-first, teach then sell
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="hype">
                            <div>
                              <div className="font-medium">Hype & Energy 🔥</div>
                              <div className="text-xs text-muted-foreground">
                                Excitement, FOMO, buzz
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <div className="flex items-start gap-3">
                        <Package className="mt-0.5 h-5 w-5 text-chart-1" />
                        <div className="flex-1">
                          <div className="font-medium">{selectedProduct.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedProduct.productType.replace(/-/g, " ")}
                            {selectedProduct.creditPrice &&
                              ` • ${selectedProduct.creditPrice} credits`}
                          </div>
                          {selectedProduct.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {selectedProduct.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateCopy}
                    disabled={isGeneratingCopy || !selectedProduct}
                    className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                    size="lg"
                  >
                    {isGeneratingCopy ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating {emailStyle.replace(/-/g, " ")} Email...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Email with AI
                      </>
                    )}
                  </Button>
                  {!template && (
                    <p className="text-center text-xs text-muted-foreground">
                      💡 Tip: Select a template first for better results, or AI will create from
                      scratch
                    </p>
                  )}
                  {template && (
                    <p className="text-center text-xs text-muted-foreground">
                      AI will customize the "{template.name}" template with your product info
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Newsletter - March 2024"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        placeholder="Your Store Name"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                      />
                      {!emailConfig?.isConfigured && (
                        <p className="text-xs text-muted-foreground">
                          💡{" "}
                          <Link
                            href={`/store/${storeId}/settings/email`}
                            className="text-primary hover:underline"
                          >
                            Configure your email settings
                          </Link>{" "}
                          to auto-fill this
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail" className="flex items-center">
                        From Email
                        {emailConfig?.isConfigured && (
                          <Badge className="ml-2 border-chart-2/20 bg-chart-2/10 text-xs text-chart-2">
                            Verified
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        placeholder="noreply@yourdomain.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        readOnly={emailConfig?.isConfigured}
                        className={emailConfig?.isConfigured ? "cursor-not-allowed bg-muted" : ""}
                      />
                      {!emailConfig?.isConfigured && (
                        <p className="text-xs text-chart-5">
                          ⚠️ Unverified emails may not deliver.{" "}
                          <Link
                            href={`/store/${storeId}/settings/email`}
                            className="text-chart-1 hover:underline"
                          >
                            Configure now
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="replyToEmail">Reply-to Email (Optional)</Label>
                    <Input
                      id="replyToEmail"
                      type="email"
                      placeholder="support@yourdomain.com"
                      value={replyToEmail}
                      onChange={(e) => setReplyToEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Email Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="subject">Subject Line</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Plus className="mr-1 h-3 w-3" />
                            Insert Field
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-black">
                          <DropdownMenuLabel>Personalization Fields</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {personalizationTokens.map((token) => (
                            <DropdownMenuItem
                              key={token.value}
                              onClick={() => insertToken(token.value, "subject")}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{token.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {token.description}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Input
                      id="subject"
                      placeholder="e.g., Hey {{firstName}}, check out this new course!"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Click "Insert Field" above to add personalization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previewText">Preview Text (Optional)</Label>
                    <Input
                      id="previewText"
                      placeholder="This appears in the inbox preview..."
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Email Content</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Plus className="mr-1 h-3 w-3" />
                            Insert Field
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-black">
                          <DropdownMenuLabel>Personalization Fields</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {personalizationTokens.map((token) => (
                            <DropdownMenuItem
                              key={token.value}
                              onClick={() => insertToken(token.value, "content")}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{token.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {token.description}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <WysiwygEditor
                      ref={editorRef}
                      content={content}
                      onChange={setContent}
                      placeholder="Write your email content here... You can use formatting, add links, lists, and more."
                      className="min-h-[400px]"
                    />
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="flex-1">
                        💡 Tip: Use the toolbar to format or click "Insert Field" to personalize
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Select Recipients</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {selectedCustomers.length} selected • {totalCustomers.toLocaleString()}{" "}
                        total contacts
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 rounded-lg border border-chart-1/20 bg-gradient-to-r from-chart-1/10 to-chart-2/10 p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Send to everyone?</p>
                      <p className="text-xs text-muted-foreground">
                        Add all {totalCustomers.toLocaleString()} customers as recipients
                      </p>
                    </div>
                    <Button
                      onClick={handleAddAllCustomers}
                      disabled={isAddingAllCustomers || totalCustomers === 0}
                      className="bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                    >
                      {isAddingAllCustomers ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-4 w-4" />
                          Add All
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Segment Targeting */}
                  <div className="rounded-lg border border-chart-2/20 bg-gradient-to-r from-chart-2/5 to-chart-3/5 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Tags className="h-5 w-5 text-chart-2" />
                      <h3 className="font-medium">Target by Segment</h3>
                    </div>
                    {segments && segments.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Match:</span>
                          <Button
                            variant={tagMode === "any" ? "default" : "outline"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setTagMode("any")}
                          >
                            ANY tag
                          </Button>
                          <Button
                            variant={tagMode === "all" ? "default" : "outline"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setTagMode("all")}
                          >
                            ALL tags
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {segments.map((seg: any) => (
                            <label
                              key={seg.tagId}
                              className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors ${
                                selectedTagIds.includes(seg.tagId)
                                  ? "border-chart-2 bg-chart-2/10"
                                  : "border-border hover:bg-muted/50"
                              }`}
                            >
                              <Checkbox
                                checked={selectedTagIds.includes(seg.tagId)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTagIds([...selectedTagIds, seg.tagId]);
                                  } else {
                                    setSelectedTagIds(
                                      selectedTagIds.filter((id) => id !== seg.tagId)
                                    );
                                  }
                                }}
                              />
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="flex-1 truncate text-sm">{seg.displayName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {seg.contactCount}
                              </Badge>
                            </label>
                          ))}
                        </div>
                        {tagPreview && selectedTagIds.length > 0 && (
                          <div className="rounded-md bg-muted/50 p-2 text-sm">
                            <p className="font-medium">
                              {tagPreview.matchingCustomers} recipients match
                            </p>
                            {tagPreview.sampleEmails.length > 0 && (
                              <p className="truncate text-xs text-muted-foreground">
                                e.g. {tagPreview.sampleEmails.slice(0, 3).join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                        <Button
                          onClick={handleAddFromTags}
                          disabled={isAddingFromTags || selectedTagIds.length === 0}
                          className="w-full bg-gradient-to-r from-chart-2 to-chart-3 hover:from-chart-2/90 hover:to-chart-3/90"
                        >
                          {isAddingFromTags ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Filter className="mr-2 h-4 w-4" />
                              Add from Segments
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No segments available. Segments are created automatically as contacts
                        interact with your content.
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or select specific recipients
                      </span>
                    </div>
                  </div>

                  {/* Search Box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    <Input
                      placeholder={`Search by name or email...`}
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      className="pl-10"
                    />
                    {recipientSearch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRecipientSearch("")}
                        className="absolute right-1 top-1/2 h-7 -translate-y-1/2 transform px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Loading State */}
                  {isSearching && (
                    <div className="py-12 text-center">
                      <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-chart-1" />
                      <h3 className="mb-2 text-lg font-semibold">Searching...</h3>
                      <p className="text-muted-foreground">
                        Looking through {totalCustomers.toLocaleString()} contacts for "
                        {recipientSearch}"
                      </p>
                    </div>
                  )}

                  {/* Recipients List */}
                  {!isSearching && customers.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">No contacts found</h3>
                      <p className="text-muted-foreground">
                        {recipientSearch
                          ? `No customers match "${recipientSearch}"`
                          : "No customers in your store yet"}
                      </p>
                    </div>
                  ) : !isSearching && customers.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {recipientSearch
                            ? `Found ${customers.length} matching contact${customers.length !== 1 ? "s" : ""}`
                            : `Showing ${customers.length} recent contact${customers.length !== 1 ? "s" : ""}`}
                        </p>
                        <div className="flex gap-2">
                          {customers.length === 200 && (
                            <Badge variant="outline" className="text-xs">
                              Top 200 results
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" onClick={handleSelectAllCustomers}>
                            {selectedCustomers.length === customers.length &&
                            selectedCustomers.length > 0
                              ? "Deselect All"
                              : `Select All ${customers.length}`}
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {customers.map((customer: any) => (
                          <div
                            key={customer._id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedCustomers.includes(customer._id)}
                              onCheckedChange={() => toggleCustomerSelection(customer._id)}
                            />
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-medium">{customer.name}</span>
                                {getCustomerBadge(customer)}
                              </div>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.source} • Joined{" "}
                                {new Date(customer._creationTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="border-b border-border pb-2">
                  <p className="text-sm text-muted-foreground">
                    From: {fromEmail || "your-email@domain.com"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To: {selectedCustomers.length} recipient
                    {selectedCustomers.length !== 1 ? "s" : ""}
                  </p>
                  <p className="font-medium">{subject || "Your email subject..."}</p>
                </div>
                <div className="text-sm">
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="italic text-muted-foreground">
                      Your email content will appear here...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipients:</span>
                <span className="font-medium">{selectedCustomers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leads:</span>
                <span className="font-medium">
                  {
                    customers.filter(
                      (c: any) => selectedCustomers.includes(c._id) && c.type === "lead"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customers:</span>
                <span className="font-medium">
                  {
                    customers.filter(
                      (c: any) => selectedCustomers.includes(c._id) && c.type === "paying"
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribers:</span>
                <span className="font-medium">
                  {
                    customers.filter(
                      (c: any) => selectedCustomers.includes(c._id) && c.type === "subscription"
                    ).length
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCreateCampaign}
              disabled={
                isCreating ||
                !campaignName ||
                !subject ||
                !content ||
                !fromEmail ||
                selectedCustomers.length === 0
              }
              className="flex w-full items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isCreating ? "Creating Campaign..." : "Create Campaign"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Campaign will be saved as draft. You can send it later from the campaigns list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
