"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingCampaignTemplate } from "@/lib/marketing-campaigns/types";
import { CampaignBrowser } from "@/components/marketing/CampaignBrowser";
import { CampaignPreview } from "@/components/marketing/CampaignPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Eye, Megaphone } from "lucide-react";
import Link from "next/link";

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingCampaignTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSelectTemplate = (template: MarketingCampaignTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      // Navigate to campaign creation with template ID
      router.push(`/dashboard/marketing/campaigns/new?template=${selectedTemplate.id}`);
    }
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/marketing">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Campaign Templates
            </h1>
            <p className="text-muted-foreground">
              Browse and preview ready-to-use campaign templates
            </p>
          </div>
        </div>
      </div>

      {/* Template Browser */}
      <CampaignBrowser
        onSelectTemplate={handleSelectTemplate}
        selectedTemplateId={selectedTemplate?.id}
        showCategoryTabs={true}
        maxHeight="calc(100vh - 250px)"
      />

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedTemplate && (
              <CampaignPreview
                template={selectedTemplate}
                variableValues={{}}
                compact={true}
              />
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleUseTemplate}>
              Use This Template
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
