"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  GraduationCap,
  Package,
  Loader2,
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isCounting, setIsCounting] = useState(false);

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

  // Fetch contacts (unified customers + users view - limited to 100 most recent)
  const contacts = useQuery(
    api.customers.getFansForStore,
    storeId ? { storeId } : "skip"
  );

  // Fetch total count (optimized for large datasets)
  const countData = useQuery(
    api.customers.getCustomerCount,
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

  // Import action
  const importFansBatch = useMutation(api.importFans.importFansBatch);
  const triggerFanCount = useAction(api.fanCountAggregation.triggerCountForStore);

  // Filter contacts based on search
  const filteredContacts = contacts?.filter((contact: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.email.toLowerCase().includes(search)
    );
  });

  const handleImportCSV = async () => {
    if (!csvFile || !storeId || !convexUser) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      // Parse CSV
      const allFans = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const fan: any = {};

          headers.forEach((header, index) => {
            const value = values[index];
            if (!value) return;

            // Map CSV columns to customer fields
            switch (header.toLowerCase()) {
              case 'email':
                fan.email = value;
                break;
              case 'first name':
                fan.firstName = value;
                break;
              case 'last name':
                fan.lastName = value;
                break;
              case 'phone':
              case 'phone number':
                fan.phone = value;
                break;
              case 'tags':
                fan.tags = value.split(';').map((t: string) => t.trim());
                break;
              case 'score':
              case '*score 7':
                fan.score = parseInt(value) || 0;
                break;
              case 'daw':
              case '*daw':
                fan.daw = value;
                break;
              case 'type of music':
              case '*type of music':
                fan.typeOfMusic = value;
                break;
              case 'goals':
              case '*goals':
                fan.goals = value;
                break;
              case 'music alias':
              case '*music alias':
                fan.musicAlias = value;
                break;
              case 'student level':
              case '*student level':
                fan.studentLevel = value;
                break;
              case 'how long have you been producing for':
              case '*how long have you been producing for':
                fan.howLongProducing = value;
                break;
              case 'why did you sign up':
              case '*why did you sign up':
                fan.whySignedUp = value;
                break;
              case 'genre specialty':
              case '*genre specialty':
                fan.genreSpecialty = value;
                break;
              case 'opens email':
              case '*opens email':
                fan.opensEmail = value.toLowerCase() === 'true' || value === '1';
                break;
              case 'clicks links':
              case '*clicks links':
                fan.clicksLinks = value.toLowerCase() === 'true' || value === '1';
                break;
              case 'last open date':
              case '*last open date':
                fan.lastOpenDate = new Date(value).getTime();
                break;
              case 'city':
              case '*city':
                fan.city = value;
                break;
              case 'state':
              case '*state':
                fan.state = value;
                break;
              case 'state code':
              case '*state code':
                fan.stateCode = value;
                break;
              case 'zip code':
              case '*zip code':
                fan.zipCode = value;
                break;
              case 'country':
              case '*country':
                fan.country = value;
                break;
              case 'country code':
              case '*country code':
                fan.countryCode = value;
                break;
              case 'id':
                fan.activeCampaignId = value;
                break;
            }
          });

          return fan;
        })
        .filter((fan: any) => fan.email); // Only include rows with email

      // Process in batches of 500
      const BATCH_SIZE = 500;
      const batches = [];
      for (let i = 0; i < allFans.length; i += BATCH_SIZE) {
        batches.push(allFans.slice(i, i + BATCH_SIZE));
      }

      setImportProgress({ current: 0, total: allFans.length });

      let totalImported = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      const allErrors: Array<{ email: string; error: string }> = [];

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        const result = await importFansBatch({
          storeId,
          adminUserId: convexUser.clerkId,
          fans: batch,
        });

        totalImported += result.imported;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        allErrors.push(...result.errors);

        // Update progress
        setImportProgress({
          current: Math.min((i + 1) * BATCH_SIZE, allFans.length),
          total: allFans.length,
        });
      }

      setImportResults({
        success: totalImported + totalUpdated,
        failed: allErrors.length,
        errors: allErrors.map(e => `${e.email}: ${e.error}`),
      });

      toast({
        title: "Import complete!",
        description: `Imported ${totalImported} new fans, updated ${totalUpdated} existing fans${allErrors.length > 0 ? ` (${allErrors.length} errors)` : ''}`,
      });

      setCsvFile(null);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateContact = async () => {
    toast({
      title: "Feature coming soon",
      description: "Adding fans directly will be available soon. For now, fans are automatically added when they make a purchase.",
    });
    setIsAddDialogOpen(false);
  };

  const handleCountFans = async () => {
    if (!storeId) return;

    setIsCounting(true);
    try {
      const result = await triggerFanCount({ storeId });
      
      if (result.success) {
        toast({
          title: "Count complete!",
          description: result.message,
        });
      } else {
        toast({
          title: "Count failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Count failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCounting(false);
    }
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
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white dark:bg-black">
                  <DialogHeader>
                    <DialogTitle>Import Fans from CSV</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file with your ActiveCampaign contacts or fan data
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {csvFile ? csvFile.name : "Choose a CSV file"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to browse or drag and drop
                        </p>
                      </label>
                    </div>

                    {/* CSV Format Guide */}
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-sm">CSV Format</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Your CSV should have these column headers:
                      </p>
                      <code className="text-xs bg-white dark:bg-black p-2 rounded block overflow-x-auto">
                        Email,First Name,Last Name,Phone,Tags,Score,DAW,Type of Music,Goals,Music Alias,Student Level,City,State,Country
                      </code>
                    </div>

                    {/* Import Progress */}
                    {isImporting && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Importing... {importProgress.current} / {importProgress.total}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${(importProgress.current / importProgress.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Import Results */}
                    {importResults && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{importResults.success} fans imported successfully</span>
                        </div>
                        {importResults.failed > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>{importResults.failed} errors</span>
                          </div>
                        )}
                        {importResults.errors.length > 0 && (
                          <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                            {importResults.errors.slice(0, 5).map((error, i) => (
                              <p key={i}>{error}</p>
                            ))}
                            {importResults.errors.length > 5 && (
                              <p>... and {importResults.errors.length - 5} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setCsvFile(null);
                        setImportResults(null);
                      }}
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportCSV}
                      disabled={!csvFile || isImporting}
                      className="gap-2"
                    >
                      {isImporting ? "Importing..." : "Import Fans"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Total Fans</p>
                    <p className="text-3xl font-bold">
                      {countData?.exact 
                        ? countData.total.toLocaleString()
                        : countData && countData.total >= 1000 
                        ? '1,000+' 
                        : contactStats?.total || 0}
                    </p>
                    {countData?.exact && countData.lastUpdated && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(countData.lastUpdated).toLocaleTimeString()}
                      </p>
                    )}
                    {!countData?.exact && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCountFans}
                        disabled={isCounting}
                        className="mt-2 h-7 text-xs"
                      >
                        {isCounting ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Counting...
                          </>
                        ) : (
                          "Get Exact Count"
                        )}
                      </Button>
                    )}
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

        {/* Fans List - Card Layout Like Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fans ({filteredContacts?.length || 0}{
                    countData?.exact
                      ? ` of ${countData.total.toLocaleString()}`
                      : countData && countData.total >= 1000 
                      ? '+ of 1000+' 
                      : countData && countData.total > 100 
                      ? ` of ${countData.total.toLocaleString()}` 
                      : ''
                  })
                </CardTitle>
                {countData && !countData.exact && countData.total >= 1000 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing up to 5,000 most recent fans (exact count pending)
                  </p>
                )}
                {countData?.exact && countData.total > 5000 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing 5,000 most recent of {countData.total.toLocaleString()} total fans
                  </p>
                )}
                {countData && countData.total > 100 && countData.total <= 5000 && !countData.exact && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing most recent fans
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredContacts?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No fans found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fans are automatically added when they make a purchase
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContacts?.map((contact: any) => (
                  <Card key={contact._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          {contact.imageUrl && <AvatarImage src={contact.imageUrl} alt={contact.name} />}
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {contact.name
                              .split(" ")
                              .map((n: string) => n.charAt(0))
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{contact.name}</h3>
                            <Badge
                              variant="outline"
                              className={
                                contact.type === "lead"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : contact.type === "paying"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : contact.type === "subscription"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200" // user type
                              }
                            >
                              {contact.type === "lead" 
                                ? "Lead" 
                                : contact.type === "paying" 
                                ? "Customer" 
                                : contact.type === "subscription"
                                ? "Subscriber"
                                : "Registered User"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                          <p className="text-xs text-gray-500">
                            {contact.source || "Unknown source"} • {new Date(contact._creationTime).toLocaleDateString()}
                          </p>

                          {/* Show Producer Profile (DAW, Genre, Level) */}
                          {(contact.daw || contact.typeOfMusic || contact.studentLevel) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {contact.daw && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                  🎹 {contact.daw}
                                </Badge>
                              )}
                              {contact.typeOfMusic && (
                                <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-xs">
                                  🎵 {contact.typeOfMusic}
                                </Badge>
                              )}
                              {contact.studentLevel && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                                  📊 {contact.studentLevel}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Show Tags */}
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {contact.tags.slice(0, 5).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {contact.tags.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{contact.tags.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Show Enrolled Courses & Products */}
                          {(contact.enrolledCourses?.length > 0 || contact.purchasedProducts?.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {contact.enrolledCourses?.map((course: any, index: number) => (
                                <Badge
                                  key={`${course.courseId}-${index}`}
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                >
                                  <GraduationCap className="w-3 h-3 mr-1" />
                                  {course.courseTitle}
                                  {course.progress > 0 && ` (${course.progress}%)`}
                                </Badge>
                              ))}
                              {contact.purchasedProducts?.map((product: any, index: number) => (
                                <Badge
                                  key={`${product.productId}-${index}`}
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  {product.productTitle}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">${contact.totalSpent?.toFixed(2) || "0.00"}</p>
                          <p className="text-xs text-gray-500">
                            {contact.enrolledCourses?.length || 0} course{contact.enrolledCourses?.length !== 1 ? 's' : ''}
                          </p>
                          {/* Show Engagement Score */}
                          {contact.score !== undefined && contact.score > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-purple-600 font-medium">
                                Score: {contact.score}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Badge
                            variant={contact.status === "active" ? "default" : "secondary"}
                            className={contact.status === "active" ? "bg-green-100 text-green-800" : ""}
                          >
                            {contact.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedContact(contact._id)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
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
