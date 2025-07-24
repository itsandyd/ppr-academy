"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download, Mail, Calendar, TrendingUp, Users, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function LeadsPage() {
  const { user } = useUser();
  const params = useParams();
  const storeId = params.storeId as string;

  // TODO: Replace with actual API calls once Convex API is regenerated
  // const leads = useQuery(
  //   api.leadSubmissions.getLeadsForAdmin,
  //   user?.id ? { adminUserId: user.id } : "skip"
  // );

  // const leadStats = useQuery(
  //   api.leadSubmissions.getLeadStats,
  //   user?.id ? { adminUserId: user.id } : "skip"
  // );

  // Mock data for demonstration
  const leads = [
    {
      _id: "1",
      _creationTime: Date.now() - 86400000, // 1 day ago
      name: "John Doe",
      email: "john@example.com",
      productTitle: "Free 32 Page EQ Cheat Sheet",
      hasDownloaded: true,
      downloadCount: 3,
      lastDownloadAt: Date.now() - 3600000, // 1 hour ago
      source: "storefront",
    },
    {
      _id: "2",
      _creationTime: Date.now() - 172800000, // 2 days ago
      name: "Jane Smith",
      email: "jane@example.com",
      productTitle: "Marketing Playbook",
      hasDownloaded: false,
      downloadCount: 0,
      source: "storefront",
    },
  ];

  const leadStats = {
    totalLeads: 25,
    totalDownloads: 45,
    uniqueDownloaders: 18,
    conversionRate: 72,
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view your leads.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
        <p className="text-gray-600">Track and manage your lead magnet subscribers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{leadStats.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold">{leadStats.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Downloaders</p>
                <p className="text-2xl font-bold">{leadStats.uniqueDownloaders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{leadStats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Leads ({leads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
              <p className="text-gray-600 mb-6">
                Once people start opting into your lead magnets, they'll appear here.
              </p>
              <Button asChild>
                <a href={`/store/${storeId}/products/lead-magnet`}>
                  Create Lead Magnet
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card key={lead._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {lead.name
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{lead.name}</h3>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                        <p className="text-xs text-gray-500">
                          {lead.productTitle} • {formatDistanceToNow(new Date(lead._creationTime))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {lead.downloadCount} download{lead.downloadCount !== 1 ? 's' : ''}
                        </p>
                        {lead.lastDownloadAt && (
                          <p className="text-xs text-gray-500">
                            Last: {formatDistanceToNow(new Date(lead.lastDownloadAt))} ago
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={lead.hasDownloaded ? "default" : "secondary"}
                        className={lead.hasDownloaded ? "bg-green-100 text-green-800" : ""}
                      >
                        {lead.hasDownloaded ? "Downloaded" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 