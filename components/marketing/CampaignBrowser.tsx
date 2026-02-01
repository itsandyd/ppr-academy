"use client";

import { useState, useMemo } from "react";
import {
  MarketingCampaignTemplate,
  CampaignType,
  campaignCategories,
} from "@/lib/marketing-campaigns/types";
import {
  allMarketingTemplates,
  templatesByType,
  templateCounts,
} from "@/lib/marketing-campaigns/templates";
import { CampaignCard } from "./CampaignCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, Filter, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignBrowserProps {
  onSelectTemplate: (template: MarketingCampaignTemplate) => void;
  selectedTemplateId?: string;
  productTypeFilter?: "sample_pack" | "course" | "preset_pack" | "bundle" | "masterclass";
  showCategoryTabs?: boolean;
  variant?: "grid" | "list";
  maxHeight?: string;
}

export function CampaignBrowser({
  onSelectTemplate,
  selectedTemplateId,
  productTypeFilter,
  showCategoryTabs = true,
  variant: initialVariant = "grid",
  maxHeight = "600px",
}: CampaignBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CampaignType | "all">("all");
  const [variant, setVariant] = useState(initialVariant);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = activeCategory === "all"
      ? allMarketingTemplates
      : templatesByType[activeCategory] || [];

    // Filter by product type if specified
    if (productTypeFilter) {
      templates = templates.filter((t) =>
        t.productTypes.includes(productTypeFilter)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.campaignType.toLowerCase().includes(query)
      );
    }

    return templates;
  }, [activeCategory, productTypeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and view toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={variant === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setVariant("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={variant === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setVariant("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category tabs or filter badges */}
      {showCategoryTabs ? (
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as CampaignType | "all")}
        >
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All ({templateCounts.total})
            </TabsTrigger>
            {campaignCategories.map((category) => (
              <TabsTrigger
                key={category.type}
                value={category.type}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.label} ({templateCounts[category.type]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory("all")}
          >
            All ({templateCounts.total})
          </Badge>
          {campaignCategories.map((category) => (
            <Badge
              key={category.type}
              variant={activeCategory === category.type ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(category.type)}
            >
              {category.label} ({templateCounts[category.type]})
            </Badge>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        {productTypeFilter && (
          <Badge variant="secondary" className="text-xs">
            <Filter className="h-3 w-3 mr-1" />
            {productTypeFilter.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      {/* Template grid/list */}
      <ScrollArea style={{ maxHeight }}>
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        ) : variant === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <CampaignCard
                key={template.id}
                template={template}
                onSelect={onSelectTemplate}
                selected={selectedTemplateId === template.id}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <CampaignCard
                key={template.id}
                template={template}
                onSelect={onSelectTemplate}
                selected={selectedTemplateId === template.id}
                variant="compact"
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
