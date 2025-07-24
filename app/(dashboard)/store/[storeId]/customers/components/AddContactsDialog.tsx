"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, User, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AddContactsDialogProps {
  children: React.ReactNode;
}

type CustomerType = "lead" | "paying" | "subscription";

interface ManualFormData {
  name: string;
  email: string;
  type: CustomerType;
  source: string;
}

interface CSVCustomer {
  name: string;
  email: string;
  type?: CustomerType;
  source?: string;
  error?: string;
}

export function AddContactsDialog({ children }: AddContactsDialogProps) {
  const { user } = useUser();
  const params = useParams();
  const storeId = params.storeId as string;
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Manual form state
  const [manualForm, setManualForm] = useState<ManualFormData>({
    name: "",
    email: "",
    type: "lead",
    source: "Manual Entry",
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVCustomer[]>([]);
  const [csvResults, setCsvResults] = useState<{ success: number; errors: number } | null>(null);

  const upsertCustomer = useMutation(api.customers.upsertCustomer);

  // Manual form handlers
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualForm.name.trim() || !manualForm.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both name and email",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id || !storeId) {
      toast({
        title: "Error",
        description: "Missing user or store information",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertCustomer({
        name: manualForm.name.trim(),
        email: manualForm.email.trim(),
        storeId,
        adminUserId: user.id,
        type: manualForm.type,
        source: manualForm.source || "Manual Entry",
      });

      // Reset form and close dialog
      setManualForm({
        name: "",
        email: "",
        type: "lead",
        source: "Manual Entry",
      });
      setOpen(false);
      
      // Show success feedback
      toast({
        title: "Success!",
        description: "Contact added successfully",
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV parsing function
  const parseCSV = (csvText: string): CSVCustomer[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const typeIndex = headers.findIndex(h => h.includes('type'));
    const sourceIndex = headers.findIndex(h => h.includes('source'));

    if (nameIndex === -1 || emailIndex === -1) {
      throw new Error("CSV must contain 'name' and 'email' columns");
    }

    const customers: CSVCustomer[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < Math.max(nameIndex, emailIndex) + 1) continue;
      
      const name = values[nameIndex];
      const email = values[emailIndex];
      const type = typeIndex >= 0 ? values[typeIndex] as CustomerType : "lead";
      const source = sourceIndex >= 0 ? values[sourceIndex] : "CSV Import";
      
      let error = "";
      if (!name || !email) {
        error = "Missing name or email";
      } else if (!email.includes('@')) {
        error = "Invalid email format";
      } else if (type && !["lead", "paying", "subscription"].includes(type)) {
        error = "Invalid customer type (must be: lead, paying, or subscription)";
      }
      
      customers.push({
        name,
        email,
        type: type || "lead",
        source: source || "CSV Import",
        error: error || undefined,
      });
    }
    
    return customers;
  };

  // CSV file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsedData = parseCSV(csvText);
        setCsvData(parsedData);
        setCsvResults(null);
      } catch (error) {
        toast({
          title: "CSV Parse Error",
          description: `Error parsing CSV: ${error}`,
          variant: "destructive",
        });
        setCsvData([]);
      }
    };
    reader.readAsText(file);
  };

  // Bulk CSV import
  const handleCSVImport = async () => {
    if (!user?.id || !storeId || csvData.length === 0) {
      toast({
        title: "Import Error",
        description: "Missing required information for import",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const customer of csvData) {
        if (customer.error) {
          errorCount++;
          continue;
        }

        try {
          await upsertCustomer({
            name: customer.name,
            email: customer.email,
            storeId,
            adminUserId: user.id,
            type: customer.type || "lead",
            source: customer.source || "CSV Import",
          });
          successCount++;
        } catch (error) {
          console.error(`Error importing ${customer.email}:`, error);
          errorCount++;
        }
      }

      setCsvResults({ success: successCount, errors: errorCount });
      
      if (successCount > 0) {
        toast({
          title: "Import Successful!",
          description: `Successfully imported ${successCount} contacts${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
        });
      }
      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Import Failed",
          description: `${errorCount} contacts had errors and were skipped`,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl text-gray-900">
        <DialogHeader className="bg-white border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Plus className="w-5 h-5 text-blue-600" />
            Add Contacts
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="manual" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all">
              <User className="w-4 h-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all">
              <FileSpreadsheet className="w-4 h-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

                     <TabsContent value="manual" className="space-y-4">
             <Card className="bg-white border border-gray-200 shadow-sm">
               <CardHeader className="bg-gray-50 border-b border-gray-200">
                 <CardTitle className="text-lg text-gray-900">Add Individual Contact</CardTitle>
               </CardHeader>
               <CardContent className="bg-white p-6">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-2">
                       <Label htmlFor="name" className="text-gray-900 font-medium">Name</Label>
                       <Input
                         id="name"
                         placeholder="Enter full name"
                         value={manualForm.name}
                         onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                         required
                         className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
                       <Input
                         id="email"
                         type="email"
                         placeholder="Enter email address"
                         value={manualForm.email}
                         onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                         required
                         className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                       />
                     </div>
                  </div>
                  
                                     <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="type" className="text-gray-900 font-medium">Customer Type</Label>
                       <Select value={manualForm.type} onValueChange={(value: CustomerType) => setManualForm(prev => ({ ...prev, type: value }))}>
                         <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                           <SelectValue placeholder="Select type" />
                         </SelectTrigger>
                         <SelectContent className="bg-white border border-gray-200 shadow-lg">
                           <SelectItem value="lead" className="text-gray-900 hover:bg-gray-100">Lead</SelectItem>
                           <SelectItem value="paying" className="text-gray-900 hover:bg-gray-100">Paying Customer</SelectItem>
                           <SelectItem value="subscription" className="text-gray-900 hover:bg-gray-100">Subscriber</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="source" className="text-gray-900 font-medium">Source</Label>
                       <Input
                         id="source"
                         placeholder="e.g., Website, Referral, Event"
                         value={manualForm.source}
                         onChange={(e) => setManualForm(prev => ({ ...prev, source: e.target.value }))}
                         className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                       />
                     </div>
                   </div>

                                     <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                     {isSubmitting ? "Adding Contact..." : "Add Contact"}
                   </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

                     <TabsContent value="csv" className="space-y-4">
             <Card className="bg-white border border-gray-200 shadow-sm">
               <CardHeader className="bg-gray-50 border-b border-gray-200">
                 <CardTitle className="text-lg text-gray-900">Bulk Import via CSV</CardTitle>
                 <div className="space-y-2">
                   <p className="text-sm text-gray-600">
                     Upload a CSV file with columns: name, email, type (optional), source (optional)
                   </p>
                   <a 
                     href="/sample-customers.csv" 
                     download="sample-customers.csv"
                     className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                   >
                     📥 Download sample CSV template
                   </a>
                                  </div>
               </CardHeader>
               <CardContent className="bg-white p-6 space-y-4">
                                 <div className="space-y-2">
                   <Label htmlFor="csv-file" className="text-gray-900 font-medium">Choose CSV File</Label>
                   <div className="flex items-center gap-4">
                     <Input
                       id="csv-file"
                       type="file"
                       accept=".csv"
                       onChange={handleFileUpload}
                       className="flex-1 bg-white border-gray-300 text-gray-900 file:bg-gray-50 file:text-gray-700 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:text-sm file:font-medium hover:file:bg-gray-100"
                     />
                     <Upload className="w-5 h-5 text-gray-400" />
                   </div>
                 </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Preview ({csvData.length} contacts)</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {csvData.filter(c => !c.error).length} Valid
                        </Badge>
                        {csvData.filter(c => c.error).length > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {csvData.filter(c => c.error).length} Errors
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <div className="space-y-2 p-4">
                        {csvData.slice(0, 10).map((customer, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${customer.error ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                              {customer.error ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{customer.type}</Badge>
                              {customer.error && (
                                <p className="text-xs text-red-600 mt-1">{customer.error}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {csvData.length > 10 && (
                          <p className="text-sm text-gray-500 text-center pt-2">
                            And {csvData.length - 10} more...
                          </p>
                        )}
                      </div>
                    </div>

                                         <Button
                       onClick={handleCSVImport}
                       disabled={isSubmitting || csvData.filter(c => !c.error).length === 0}
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {isSubmitting ? "Importing..." : `Import ${csvData.filter(c => !c.error).length} Valid Contacts`}
                     </Button>

                    {csvResults && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Import Results</h4>
                        <div className="flex gap-4 mt-2">
                          <span className="text-green-600">✅ {csvResults.success} successful</span>
                          {csvResults.errors > 0 && (
                            <span className="text-red-600">❌ {csvResults.errors} errors</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 