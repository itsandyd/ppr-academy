"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Phone,
  Tag,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ContactsPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed" | "bounced" | "complained">("all");
  const [selectedContact, setSelectedContact] = useState<Id<"customers"> | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New contact form
  const [newContact, setNewContact] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    tags: "",
    whySignedUp: "",
    studentLevel: "",
    goals: "",
    daw: "",
    typeOfMusic: "",
  });

  // Get user's stores
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const userStores = useQuery(
    api.stores.getUserStores,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );

  const storeId = userStores?.[0]?._id;

  // Fetch contacts (using customers table)
  const contacts = useQuery(
    api.customers.getCustomersForStore,
    storeId ? { storeId } : "skip"
  );

  // Fetch contact stats (using customer stats)
  const stats = useQuery(
    api.customers.getCustomerStats,
    clerkUser?.id ? { adminUserId: clerkUser.id } : "skip"
  );

  // Transform customer stats to match expected format
  const contactStats = stats ? {
    total: stats.totalCustomers,
    active: stats.payingCustomers + stats.leads,
    unsubscribed: 0, // Can add this field to customer stats later
    avgScore: 0, // Can calculate from totalSpent
    topTags: [], // Can add tags to customers later
  } : null;

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((contact: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.email.toLowerCase().includes(search)
    );
  });

  const handleCreateContact = async () => {
    toast({
      title: "Feature coming soon",
      description: "Adding fans directly will be available soon. For now, fans are automatically added when they make a purchase.",
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteContact = async (contactId: Id<"customers">) => {
    toast({
      title: "Cannot delete",
      description: "Fans cannot be deleted as they are linked to purchase records. You can manage them from the Customers page.",
      variant: "destructive",
    });
  };

  if (!convexUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Please sign in</h3>
            <p className="text-muted-foreground text-center">
              You need to be signed in to access contacts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Fan Management
                </h1>
              </div>
              <p className="text-muted-foreground">
                Manage your fans, track engagement, and grow your audience
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                    <UserPlus className="h-4 w-4" />
                    Add Fan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white dark:bg-black">
                  <DialogHeader>
                    <DialogTitle>Add New Fan</DialogTitle>
                    <DialogDescription>
                      Add a fan to your audience database
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={newContact.firstName}
                        onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={newContact.lastName}
                        onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        value={newContact.tags}
                        onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                        placeholder="student, hip-hop, pro-tools"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Student Level</Label>
                      <Select
                        value={newContact.studentLevel}
                        onValueChange={(v) => setNewContact({ ...newContact, studentLevel: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>DAW</Label>
                      <Input
                        value={newContact.daw}
                        onChange={(e) => setNewContact({ ...newContact, daw: e.target.value })}
                        placeholder="e.g., Ableton, FL Studio, Pro Tools"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Type of Music</Label>
                      <Input
                        value={newContact.typeOfMusic}
                        onChange={(e) => setNewContact({ ...newContact, typeOfMusic: e.target.value })}
                        placeholder="e.g., Hip-Hop, EDM, Pop"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Goals</Label>
                      <Textarea
                        value={newContact.goals}
                        onChange={(e) => setNewContact({ ...newContact, goals: e.target.value })}
                        placeholder="What are their music production goals?"
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateContact}>
                      Add Fan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {contactStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fans</p>
                    <p className="text-3xl font-bold">{contactStats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-3xl font-bold text-green-600">{contactStats.active}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribers</p>
                    <p className="text-3xl font-bold text-orange-600">{stats?.subscriptionCustomers || 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complained">Complained</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fans ({filteredContacts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts?.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contact.status === "active" ? "default" : "secondary"}
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          contact.type === "lead"
                            ? "bg-green-50 text-green-700"
                            : contact.type === "paying"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }
                      >
                        {contact.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${contact.totalSpent?.toFixed(2) || "0.00"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {contact.enrolledCourses?.length || 0} course(s)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedContact(contact._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredContacts?.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No fans found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fans are automatically added when they make a purchase
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simplified Contact Details Dialog - Just show basic info from customers */}
        <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="max-w-2xl bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Fan Details</DialogTitle>
              <DialogDescription>
                View fan information
              </DialogDescription>
            </DialogHeader>

            {selectedContact && filteredContacts && (
              <div className="space-y-4">
                {(() => {
                  const contact = filteredContacts.find((c: any) => c._id === selectedContact);
                  if (!contact) return <p>Fan not found</p>;
                  
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="font-medium">{contact.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-medium">{contact.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">{contact.type}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <p className="font-medium capitalize">{contact.status}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Spent</Label>
                        <p className="font-medium">${contact.totalSpent?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Source</Label>
                        <p className="font-medium">{contact.source || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Enrolled Courses</Label>
                        <p className="font-medium">{contact.enrolledCourses?.length || 0} course(s)</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedContact(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
