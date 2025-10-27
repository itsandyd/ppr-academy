"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Mail,
  Star,
  TrendingUp,
  ArrowLeft,
  Eye,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CampaignTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | undefined>();

  // Queries
  const templates = useQuery(api.emailTemplates.getCampaignTemplates, {
    category: selectedCategory as any,
    funnelStage: selectedFunnelStage as any,
  }) || [];

  const categories = useQuery(api.emailTemplates.getTemplateCategories, {
    type: "campaign",
  }) || [];

  const funnelStages = useQuery(api.emailTemplates.getFunnelStages, {
    type: "campaign",
  }) || [];

  // Helper to get friendly stage label
  const getStageFriendlyName = (stage: string) => {
    const stageMap: Record<string, string> = {
      "TOFU": "Attract New Audience",
      "MOFU": "Build Interest",
      "BOFU": "Drive Sales",
      "POST-PURCHASE": "After Purchase",
      "RE-ENGAGEMENT": "Win Back Inactive",
      "FULL-FUNNEL": "Complete Journey",
      "NURTURE": "Stay Connected",
    };
    return stageMap[stage] || stage;
  };

  // Filter templates by search
  const filteredTemplates = templates.filter((template: any) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUseTemplate = (templateId: string) => {
    router.push(`/store/${storeId}/email-campaigns/create?template=${templateId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Campaign Templates</h1>
          <p className="text-muted-foreground mt-1">
            Choose a proven template to get started faster
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={selectedFunnelStage || "all"}
          onValueChange={(v) => setSelectedFunnelStage(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[240px] bg-white dark:bg-black">
            <SelectValue placeholder="Filter by Goal" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-black">
            <SelectItem value="all">All Goals</SelectItem>
            {funnelStages.map((stage: any) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label} ({stage.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedCategory || "all"}
          onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[200px] bg-white dark:bg-black">
            <SelectValue placeholder="All Product Types" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-black">
            <SelectItem value="all">All Product Types</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label} ({cat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template: any, index: number) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div className="flex gap-2 flex-wrap">
                    {template.funnelStage && (
                      <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs">
                        {getStageFriendlyName(template.funnelStage)}
                      </Badge>
                    )}
                    <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-xs">
                      {template.category.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  </div>
                  {template.popular && (
                    <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Popular
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                {/* Subject Line Preview */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Subject Line</div>
                  <div className="text-sm font-medium line-clamp-1">{template.subject}</div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {template.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Use Case</div>
                    <div className="text-sm font-medium line-clamp-2">
                      {template.useCase}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Open Rate</div>
                    <div className="text-sm font-bold text-chart-1">
                      {template.estimatedOpenRate}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Preview modal (future enhancement)
                      alert(`Preview: ${template.body.substring(0, 200)}...`);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template.id)}
                    className="bg-chart-1 hover:bg-chart-1/90"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? `No templates match "${searchTerm}". Try different keywords.`
              : "No templates available in this category."}
          </p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm("")}>Clear Search</Button>
          )}
        </Card>
      )}
    </div>
  );
}

