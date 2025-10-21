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
  Mail, 
  Users, 
  ArrowLeft,
  Send,
  Eye,
  Save,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateCampaignPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const { toast } = useToast();

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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
  
  // Auto-populate email fields from store config
  useEffect(() => {
    if (emailConfig) {
      setFromEmail(emailConfig.fromEmail || "");
      setFromName(emailConfig.fromName || "");
      setReplyToEmail(emailConfig.replyToEmail || "");
    }
  }, [emailConfig]);

  const createCampaign = useMutation((api as any).emailCampaigns?.createCampaign);
  const addRecipients = useMutation((api as any).emailCampaigns?.addRecipients);

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
      // Create the campaign
      const campaignId = await createCampaign({
        name: campaignName,
        subject: subject,
        content: content,
        storeId: storeId,
        adminUserId: user?.id || "",
        fromEmail: fromEmail,
        replyToEmail: replyToEmail || undefined,
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
      lead: { color: "bg-green-100 text-green-800", label: "Lead" },
      paying: { color: "bg-blue-100 text-blue-800", label: "Customer" },
      subscription: { color: "bg-purple-100 text-purple-800", label: "Subscriber" },
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/store/${storeId}/email-campaigns`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Email Campaign</h1>
          <p className="text-gray-600 mt-2">Design and send marketing emails to your customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
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
                        <p className="text-xs text-yellow-600">
                          ⚠️ Unverified emails may not deliver. <Link href={`/store/${storeId}/settings/email`} className="text-primary hover:underline">
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
                    <p className="text-sm text-gray-500">
                      💡 Tip: You can use HTML tags for formatting (bold, links, etc.)
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
                      <span className="text-sm text-gray-600">
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
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                      <p className="text-gray-600">
                        You need customers in your database before you can send campaigns.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customers.map((customer: any) => (
                        <div
                          key={customer._id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
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
                            <p className="text-sm text-gray-600">{customer.email}</p>
                            <p className="text-xs text-gray-500">
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
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-600">From: {fromEmail || "your-email@domain.com"}</p>
                  <p className="text-sm text-gray-600">
                    To: {selectedCustomers.length} recipient{selectedCustomers.length !== 1 ? 's' : ''}
                  </p>
                  <p className="font-medium">{subject || "Your email subject..."}</p>
                </div>
                <div className="text-sm">
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="text-gray-500 italic">Your email content will appear here...</p>
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
                <span className="text-gray-600">Recipients:</span>
                <span className="font-medium">{selectedCustomers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leads:</span>
                <span className="font-medium">
                  {customers.filter((c: any) => selectedCustomers.includes(c._id) && c.type === 'lead').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customers:</span>
                <span className="font-medium">
                  {customers.filter((c: any) => selectedCustomers.includes(c._id) && c.type === 'paying').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subscribers:</span>
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
            
            <p className="text-xs text-gray-500 text-center">
              Campaign will be saved as draft. You can send it later from the campaigns list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 