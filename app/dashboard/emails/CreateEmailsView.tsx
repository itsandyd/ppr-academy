'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Plus,
  Users,
  Send,
  Tag,
  Workflow,
  Search,
  Upload,
  UserPlus,
  RefreshCw,
  Megaphone,
  Loader2,
  BarChart3,
  MoreVertical,
  Trash2,
  Eye,
  TrendingUp,
  MousePointerClick,
  AlertTriangle,
  CheckCircle2,
  Power,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';

interface CreateEmailsViewProps {
  convexUser: any;
}

export function CreateEmailsView({ convexUser }: CreateEmailsViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const storeId = user?.id ?? '';

  const [activeTab, setActiveTab] = useState('broadcast');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [selectedBroadcastContacts, setSelectedBroadcastContacts] = useState<Set<string>>(new Set());
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Dialog state
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [newContact, setNewContact] = useState({ email: '', firstName: '', lastName: '' });
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6', description: '' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const contactStats = useQuery(api.emailContacts.getContactStats, storeId ? { storeId } : 'skip');
  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : 'skip');
  const workflows = useQuery(api.emailWorkflows.listWorkflows, storeId ? { storeId } : 'skip');
  const contactsResult = useQuery(
    api.emailContacts.listContacts,
    storeId ? { storeId, limit: 50 } : 'skip'
  );

  // Mutations
  const createContact = useMutation(api.emailContacts.createContact);
  const deleteContact = useMutation(api.emailContacts.deleteContact);
  const createTag = useMutation(api.emailTags.createTag);
  const deleteTag = useMutation(api.emailTags.deleteTag);
  const sendBroadcastEmail = useAction(api.emails.sendBroadcastEmail);

  // Handlers
  const handleCreateContact = async () => {
    if (!newContact.email.trim()) {
      toast({ title: 'Email required', variant: 'destructive' });
      return;
    }
    try {
      await createContact({
        storeId,
        userId: user?.id || '',
        email: newContact.email,
        firstName: newContact.firstName || undefined,
        lastName: newContact.lastName || undefined,
        source: 'manual',
      });
      toast({ title: 'Contact added!' });
      setIsCreateContactOpen(false);
      setNewContact({ email: '', firstName: '', lastName: '' });
    } catch (error: any) {
      toast({ title: 'Failed to add contact', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({ title: 'Tag name required', variant: 'destructive' });
      return;
    }
    try {
      await createTag({
        storeId,
        name: newTag.name,
        color: newTag.color,
        description: newTag.description || undefined,
      });
      toast({ title: 'Tag created!' });
      setIsCreateTagOpen(false);
      setNewTag({ name: '', color: '#3b82f6', description: '' });
    } catch (error: any) {
      toast({ title: 'Failed to create tag', description: error.message, variant: 'destructive' });
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim()) {
      toast({ title: 'Subject line required', variant: 'destructive' });
      return;
    }
    if (!broadcastContent.trim()) {
      toast({ title: 'Email content required', variant: 'destructive' });
      return;
    }
    if (selectedBroadcastContacts.size === 0) {
      toast({ title: 'Select at least one recipient', variant: 'destructive' });
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const result = await sendBroadcastEmail({
        storeId,
        subject: broadcastSubject,
        htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">${broadcastContent.replace(/\n/g, '<br>')}<br><br><p style="color: #6b7280; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;"><a href="{{unsubscribeLink}}" style="color: #6b7280;">Unsubscribe</a></p></div>`,
        contactIds: Array.from(selectedBroadcastContacts) as any[],
      });

      if (result.success) {
        toast({ title: 'Broadcast sent!', description: result.message });
        setBroadcastSubject('');
        setBroadcastContent('');
        setSelectedBroadcastContacts(new Set());
      } else {
        toast({ title: 'Failed to send', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Failed to send broadcast', description: error.message, variant: 'destructive' });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const contacts = contactsResult?.contacts || [];
  const totalContacts = contactStats?.total || 0;
  const subscribedContacts = contactStats?.subscribed || 0;
  const totalTags = tags?.length || 0;
  const activeWorkflows = workflows?.filter((w: any) => w.isActive).length || 0;

  return (
    <div className="space-y-6">
      {/* Header - matches products layout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground">
            Manage contacts, send broadcasts, and create automations
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500">
          <Link href="/dashboard/emails/workflows?mode=create">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Link>
        </Button>
      </div>

      {/* Quick Stats - matches products layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{totalContacts.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscribed</p>
                <p className="text-2xl font-bold">{subscribedContacts.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tags</p>
                <p className="text-2xl font-bold">{totalTags}</p>
              </div>
              <Tag className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{activeWorkflows}</p>
              </div>
              <Workflow className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - matches products style */}
      <TooltipProvider>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/50">
            <TabsTrigger value="broadcast" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    <span className="hidden md:inline">Broadcast</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Send one-time emails</TooltipContent>
              </Tooltip>
            </TabsTrigger>

            <TabsTrigger value="contacts" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden md:inline">Contacts</span>
                    <Badge variant="secondary" className="ml-1 hidden md:inline-flex">{totalContacts}</Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Manage your contacts</TooltipContent>
              </Tooltip>
            </TabsTrigger>

            <TabsTrigger value="tags" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span className="hidden md:inline">Tags</span>
                    <Badge variant="secondary" className="ml-1 hidden md:inline-flex">{totalTags}</Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Organize contacts with tags</TooltipContent>
              </Tooltip>
            </TabsTrigger>

            <TabsTrigger value="workflows" className="flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    <span className="hidden md:inline">Workflows</span>
                    <Badge variant="secondary" className="ml-1 hidden md:inline-flex">{workflows?.length || 0}</Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Automated email sequences</TooltipContent>
              </Tooltip>
            </TabsTrigger>
          </TabsList>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="space-y-4 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compose Email */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Send className="h-5 w-5 text-cyan-500" />
                      Compose Email
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Send a one-time email to your subscribers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="Hey {{firstName}}, check this out..."
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Email Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your message here..."
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">
                      <span className="font-medium">{selectedBroadcastContacts.size}</span> recipients selected
                    </span>
                    <Button
                      onClick={handleSendBroadcast}
                      disabled={isSendingBroadcast || selectedBroadcastContacts.size === 0}
                    >
                      {isSendingBroadcast ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Broadcast
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Select Recipients */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Select Recipients</h2>
                      <p className="text-sm text-muted-foreground">
                        Choose who receives this email
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedBroadcastContacts.size === contacts.length) {
                          setSelectedBroadcastContacts(new Set());
                        } else {
                          setSelectedBroadcastContacts(new Set(contacts.map((c: any) => c._id)));
                        }
                      }}
                    >
                      {selectedBroadcastContacts.size === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {contacts.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No contacts yet</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setIsCreateContactOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Contact
                        </Button>
                      </div>
                    ) : (
                      contacts.map((contact: any) => (
                        <div
                          key={contact._id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            const newSelected = new Set(selectedBroadcastContacts);
                            if (newSelected.has(contact._id)) {
                              newSelected.delete(contact._id);
                            } else {
                              newSelected.add(contact._id);
                            }
                            setSelectedBroadcastContacts(newSelected);
                          }}
                        >
                          <Checkbox checked={selectedBroadcastContacts.has(contact._id)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {contact.firstName || contact.email}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {contact.email}
                            </p>
                          </div>
                          {contact.status === 'subscribed' && (
                            <Badge variant="outline" className="text-green-600">Subscribed</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreateContactOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>

            {contacts.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Contacts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first contact to start building your email list
                </p>
                <Button onClick={() => setIsCreateContactOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact: any) => (
                  <ContactCard
                    key={contact._id}
                    contact={contact}
                    onDelete={async () => {
                      try {
                        await deleteContact({ userId: user?.id || '', contactId: contact._id });
                        toast({ title: 'Contact deleted' });
                      } catch (error: any) {
                        toast({ title: 'Failed to delete', variant: 'destructive' });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Organize your contacts with tags</p>
              <Button onClick={() => setIsCreateTagOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tag
              </Button>
            </div>

            {!tags || tags.length === 0 ? (
              <Card className="p-12 text-center">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tags Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create tags to organize and segment your contacts
                </p>
                <Button onClick={() => setIsCreateTagOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tag
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag: any) => (
                  <TagCard
                    key={tag._id}
                    tag={tag}
                    onDelete={async () => {
                      try {
                        await deleteTag({ tagId: tag._id });
                        toast({ title: 'Tag deleted' });
                      } catch (error: any) {
                        toast({ title: 'Failed to delete', variant: 'destructive' });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Automated email sequences</p>
              <Button asChild>
                <Link href="/dashboard/emails/workflows?mode=create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            </div>

            {!workflows || workflows.length === 0 ? (
              <Card className="p-12 text-center">
                <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Workflows Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create automated email sequences to engage your audience
                </p>
                <Button asChild>
                  <Link href="/dashboard/emails/workflows?mode=create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.map((workflow: any) => (
                  <WorkflowCard key={workflow._id} workflow={workflow} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </TooltipProvider>

      {/* Create Contact Dialog */}
      <Dialog open={isCreateContactOpen} onOpenChange={setIsCreateContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add a new contact to your email list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateContactOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContact}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>Create a new tag to organize contacts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Tag Name *</Label>
              <Input
                id="tagName"
                placeholder="e.g., VIP, Newsletter, Course Students"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagColor">Color</Label>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${newTag.color === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTag({ ...newTag, color })}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagDescription">Description</Label>
              <Input
                id="tagDescription"
                placeholder="Optional description"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTagOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag}>Create Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contact Card Component
function ContactCard({ contact, onDelete }: { contact: any; onDelete: () => void }) {
  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {contact.firstName ? `${contact.firstName} ${contact.lastName || ''}` : contact.email}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={contact.status === 'subscribed' ? 'default' : 'secondary'}>
            {contact.status || 'subscribed'}
          </Badge>
          {contact.tags?.length > 0 && (
            <Badge variant="outline">{contact.tags.length} tags</Badge>
          )}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>{contact.emailsSent || 0} emails sent</span>
          <span>{contact.emailsOpened || 0} opened</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Tag Card Component
function TagCard({ tag, onDelete }: { tag: any; onDelete: () => void }) {
  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color || '#3b82f6' }}
            />
            <h3 className="font-semibold">{tag.name}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tag.description && (
          <p className="text-sm text-muted-foreground mb-3">{tag.description}</p>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{tag.contactCount || 0} contacts</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Card Component
function WorkflowCard({ workflow }: { workflow: any }) {
  const router = useRouter();

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push(`/dashboard/emails/workflows?mode=create&id=${workflow._id}`)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold">{workflow.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {workflow.description || 'No description'}
            </p>
          </div>
          <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
            {workflow.isActive ? 'Active' : 'Paused'}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{workflow.steps?.length || 0} steps</span>
          <span>{workflow.enrolledCount || 0} enrolled</span>
        </div>
      </CardContent>
    </Card>
  );
}
