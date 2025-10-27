"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Zap,
  Mail,
  Clock,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function CreateAutomationPage() {
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
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<string>("new_subscriber");
  const [emails, setEmails] = useState<Array<{
    id: string;
    delay: number;
    subject: string;
    content: string;
  }>>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // Fetch template if template ID provided
  const template = useQuery(
    api.emailTemplates?.getAutomationTemplateById,
    templateId ? { templateId } : "skip"
  );

  // Load template data when template is fetched
  useEffect(() => {
    if (template && !isLoadingTemplate) {
      setIsLoadingTemplate(true);
      setWorkflowName(template.name);
      setDescription(template.description);
      setTriggerType(template.trigger);
      
      // Convert template emails to editable format
      const templateEmails = template.emails.map((email: any, index: number) => ({
        id: `email-${index}`,
        delay: email.delay,
        subject: email.subject,
        content: `${email.purpose}\n\n[Customize this email content based on: ${email.subject}]`,
      }));
      
      setEmails(templateEmails);
      
      toast({
        title: "Template Loaded!",
        description: `Using "${template.name}" template with ${template.emails.length} emails.`,
      });
    }
  }, [template]);

  const createWorkflow = useMutation(api.emailWorkflows?.createWorkflow);

  const addEmail = () => {
    setEmails([
      ...emails,
      {
        id: `email-${Date.now()}`,
        delay: emails.length > 0 ? emails[emails.length - 1].delay + 3 : 0,
        subject: "",
        content: "",
      },
    ]);
  };

  const removeEmail = (id: string) => {
    setEmails(emails.filter((e) => e.id !== id));
  };

  const updateEmail = (id: string, field: string, value: any) => {
    setEmails(
      emails.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    if (emails.length === 0) {
      toast({
        title: "No Emails",
        description: "Please add at least one email to the sequence",
        variant: "destructive",
      });
      return;
    }

    // Validate all emails have subject and content
    const invalidEmails = emails.filter((e) => !e.subject.trim() || !e.content.trim());
    if (invalidEmails.length > 0) {
      toast({
        title: "Incomplete Emails",
        description: "All emails must have a subject and content",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createWorkflow({
        name: workflowName,
        description,
        storeId,
        userId: user?.id || "",
        trigger: {
          type: triggerType as any,
          conditions: {},
        },
        steps: emails.map((email, index) => ({
          id: email.id,
          type: "email" as const,
          delay: email.delay,
          config: {
            subject: email.subject,
            content: email.content,
            fromName: user?.fullName || "",
            fromEmail: user?.primaryEmailAddress?.emailAddress || "",
          },
        })),
      });

      toast({
        title: "Automation Created!",
        description: "Your email automation has been created successfully",
      });

      router.push(`/store/${storeId}/email-campaigns`);
    } catch (error: any) {
      console.error("Failed to create automation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create automation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Email Automation</h1>
          <p className="text-muted-foreground mt-2">
            Build an automated email sequence
          </p>
        </div>
      </div>

      {/* Template Badge */}
      {template && (
        <Card className="border-chart-3/20 bg-chart-3/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-chart-3" />
                <div>
                  <p className="font-medium">Using Template: {template.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {template.emails.length} email sequence • {template.conversionRate} conversion rate
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/store/${storeId}/automations/create`);
                  setWorkflowName("");
                  setDescription("");
                  setEmails([]);
                }}
              >
                Clear Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Automation Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Welcome Series"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this automation do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Event *</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger className="bg-white dark:bg-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="new_subscriber">New Subscriber</SelectItem>
                    <SelectItem value="cart_abandoned">Cart Abandoned</SelectItem>
                    <SelectItem value="product_purchased">Product Purchased</SelectItem>
                    <SelectItem value="course_enrolled">Course Enrolled</SelectItem>
                    <SelectItem value="lead_magnet_downloaded">Lead Magnet Downloaded</SelectItem>
                    <SelectItem value="inactive_30_days">Inactive 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This automation will run when this event occurs
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Sequence */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Sequence ({emails.length} emails)</CardTitle>
                <Button onClick={addEmail} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Email
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {emails.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No emails yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add emails to create your automation sequence
                  </p>
                  <Button onClick={addEmail} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Email
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email, index) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-border bg-card">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-chart-3/10 text-chart-3">
                                Email {index + 1}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Clock className="w-3 h-3" />
                                Day {email.delay}
                              </Badge>
                            </div>
                            {emails.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmail(email.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Delay (days)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={email.delay}
                                onChange={(e) =>
                                  updateEmail(email.id, "delay", parseInt(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Subject Line *</Label>
                            <Input
                              placeholder="e.g., Welcome to our community!"
                              value={email.subject}
                              onChange={(e) =>
                                updateEmail(email.id, "subject", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Email Content *</Label>
                            <Textarea
                              placeholder="Write your email content here..."
                              value={email.content}
                              onChange={(e) =>
                                updateEmail(email.id, "content", e.target.value)
                              }
                              rows={6}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Automation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Workflow Name</div>
                <div className="font-medium">{workflowName || "Untitled Automation"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Trigger</div>
                <div className="font-medium capitalize">
                  {triggerType.replace(/_/g, " ")}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email Sequence</div>
                <div className="font-medium">{emails.length} emails</div>
              </div>

              {emails.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Timeline</div>
                  <div className="space-y-2">
                    {emails.map((email, index) => (
                      <div
                        key={email.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Badge variant="outline" className="text-xs">
                          Day {email.delay}
                        </Badge>
                        <span className="truncate text-muted-foreground">
                          {email.subject || `Email ${index + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {template && (
                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground mb-1">Template Info</div>
                  <Badge className="bg-chart-3/10 text-chart-3 mb-2">
                    {template.category}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Expected conversion: {template.conversionRate}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={isCreating || !workflowName || emails.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Create Automation
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Automation will be created as inactive. Activate it from the list.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          {template && (
            <Card className="bg-chart-1/5 border-chart-1/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Template Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  • Customize each email to match your brand voice
                </p>
                <p className="text-muted-foreground">
                  • Adjust delays based on your audience engagement
                </p>
                <p className="text-muted-foreground">
                  • Test with a small group before full activation
                </p>
                {template.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="mr-1 text-xs">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

