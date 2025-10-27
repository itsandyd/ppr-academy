"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';
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
  Mail, 
  Users, 
  ArrowLeft,
  Send,
  Eye,
  Save,
  User,
  Package,
  Sparkles,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "convex/react";

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
  const templateId = searchParams?.get('template');

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
  
  // Product attachment
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  // Fetch customers for recipient selection
  const customers = useQuery(
    api.customers?.getCustomersForStore,
    storeId ? { storeId } : "skip"
  ) || [];
  
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
  const courses = useQuery(
    api.courses?.getCoursesByStore,
    storeId ? { storeId } : "skip"
  ) || [];

  const products = useQuery(
    api.digitalProducts?.getProductsByStore,
    storeId ? { storeId } : "skip"
  ) || [];

  const samplePacks = useQuery(
    api.samplePacks?.getPacksByStore,
    storeId ? { storeId } : "skip"
  ) || [];

  // Combine all products
  const allProducts = [
    ...courses.map((c: any) => ({ ...c, productType: 'course', displayName: c.title })),
    ...products.map((p: any) => ({ ...p, productType: 'digital-product', displayName: p.title })),
    ...samplePacks.map((sp: any) => ({ ...sp, productType: 'sample-pack', displayName: sp.name })),
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
  const generateCopy = useAction(api.emailCopyGenerator?.generateEmailCopy);

  // Generate email copy from product + template
  const handleGenerateCopy = async () => {
    if (!selectedProduct || !template) {
      toast({
        title: "Missing Information",
        description: "Please select a product and template first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCopy(true);
    try {
      const result = await generateCopy({
        templateBody: template.body,
        templateSubject: template.subject,
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
        tone: "casual",
      });

      setSubject(result.subject);
      setContent(result.body);
      setPreviewText(result.previewText);

      toast({
        title: "✨ Email Copy Generated!",
        description: "AI has customized the template with your product info. Review and edit as needed.",
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
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const getCustomerBadge = (customer: any) => {
    const typeConfig = {
      lead: { color: "bg-chart-2/10 text-chart-2", label: "Lead" },
      paying: { color: "bg-chart-1/10 text-chart-1", label: "Customer" },
      subscription: { color: "bg-chart-3/10 text-chart-3", label: "Subscriber" },
    };

    const config = typeConfig[customer.type as keyof typeof typeConfig] || typeConfig.lead;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/store/${storeId}/email-campaigns`)}
          className="flex items-center gap-2 -ml-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-chart-1/20 to-chart-2/20 rounded-xl">
            <Mail className="w-8 h-8 text-chart-1" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
              Create Email Campaign
            </h1>
            <p className="text-muted-foreground mt-1">Design and send marketing emails to your customers</p>
          </div>
        </div>
      </div>

      {/* Template Badge */}
      {template && (
        <Card className="border-chart-1/20 bg-chart-1/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-chart-1" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-black">
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="recipients" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Recipients ({selectedCustomers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              {/* Product Attachment (AI Copy Generation) */}
              {template && (
                <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-chart-2/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-chart-1" />
                      AI Email Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          <SelectItem value="none">No product (manual writing)</SelectItem>
                          {allProducts.length > 0 && (
                            <>
                              <SelectItem disabled value="divider-courses">
                                <span className="font-semibold text-xs">COURSES</span>
                              </SelectItem>
                              {allProducts.filter((p: any) => p.productType === 'course').map((p: any) => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.displayName}
                                </SelectItem>
                              ))}
                              <SelectItem disabled value="divider-packs">
                                <span className="font-semibold text-xs">SAMPLE PACKS</span>
                              </SelectItem>
                              {allProducts.filter((p: any) => p.productType === 'sample-pack').map((p: any) => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.displayName}
                                </SelectItem>
                              ))}
                              <SelectItem disabled value="divider-products">
                                <span className="font-semibold text-xs">PRODUCTS</span>
                              </SelectItem>
                              {allProducts.filter((p: any) => p.productType === 'digital-product').map((p: any) => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.displayName}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-chart-1 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium">{selectedProduct.displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedProduct.productType.replace(/-/g, ' ')}
                              {selectedProduct.creditPrice && ` • ${selectedProduct.creditPrice} credits`}
                            </div>
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
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating Email...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Email with AI
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      AI will replace all template variables with your product information
                    </p>
                  </CardContent>
                </Card>
              )}

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
                          💡 <Link href={`/store/${storeId}/settings/email`} className="text-primary hover:underline">
                            Configure your email settings
                          </Link> to auto-fill this
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">
                        From Email
                        {emailConfig?.isConfigured && (
                          <Badge variant="success" className="ml-2 text-xs">Verified</Badge>
                        )}
                      </Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        placeholder="noreply@yourdomain.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        readOnly={emailConfig?.isConfigured}
                        className={emailConfig?.isConfigured ? "bg-muted cursor-not-allowed" : ""}
                      />
                      {!emailConfig?.isConfigured && (
                        <p className="text-xs text-chart-5">
                          ⚠️ Unverified emails may not deliver. <Link href={`/store/${storeId}/settings/email`} className="text-chart-1 hover:underline">
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
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="📢 Exciting news from our store!"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                    {template && (
                      <p className="text-xs text-muted-foreground">
                        💡 Replace variables like {'{{productName}}'} with actual values
                      </p>
                    )}
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
                    <Label htmlFor="content">Email Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your email content here... You can use HTML for formatting."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[300px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      💡 Tip: {template ? "Replace {{variables}} with your actual content" : "You can use HTML tags for formatting (bold, links, etc.)"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Select Recipients</CardTitle>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {selectedCustomers.length} of {customers.length} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllCustomers}
                      >
                        {selectedCustomers.length === customers.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {customers.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                      <p className="text-muted-foreground">
                        You need customers in your database before you can send campaigns.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customers.map((customer: any) => (
                        <div
                          key={customer._id}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedCustomers.includes(customer._id)}
                            onCheckedChange={() => toggleCustomerSelection(customer._id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{customer.name}</span>
                              {getCustomerBadge(customer)}
                            </div>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.source} • Joined {new Date(customer._creationTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                <Eye className="w-5 h-5" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
                <div className="border-b border-border pb-2">
                  <p className="text-sm text-muted-foreground">From: {fromEmail || "your-email@domain.com"}</p>
                  <p className="text-sm text-muted-foreground">
                    To: {selectedCustomers.length} recipient{selectedCustomers.length !== 1 ? 's' : ''}
                  </p>
                  <p className="font-medium">{subject || "Your email subject..."}</p>
                </div>
                <div className="text-sm">
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="text-muted-foreground italic">Your email content will appear here...</p>
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
                  {customers.filter((c: any) => selectedCustomers.includes(c._id) && c.type === 'lead').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customers:</span>
                <span className="font-medium">
                  {customers.filter((c: any) => selectedCustomers.includes(c._id) && c.type === 'paying').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribers:</span>
                <span className="font-medium">
                  {customers.filter((c: any) => selectedCustomers.includes(c._id) && c.type === 'subscription').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCreateCampaign}
              disabled={isCreating || !campaignName || !subject || !content || !fromEmail || selectedCustomers.length === 0}
              className="w-full flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isCreating ? "Creating Campaign..." : "Create Campaign"}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Campaign will be saved as draft. You can send it later from the campaigns list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 