"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ReportModal } from "./report-modal";

interface ReportButtonProps {
  contentId: string;
  contentType: "sample" | "product" | "course";
  contentTitle: string;
  creatorName?: string;
  storeId?: string;
  variant?: "icon" | "text" | "menu-item";
}

export function ReportButton({
  contentId,
  contentType,
  contentTitle,
  creatorName,
  storeId,
  variant = "icon",
}: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState<"general" | "copyright">("general");

  const handleReport = (type: "general" | "copyright") => {
    setReportType(type);
    setShowModal(true);
  };

  if (variant === "menu-item") {
    return (
      <>
        <DropdownMenuItem onClick={() => handleReport("general")}>
          <Flag className="mr-2 h-4 w-4" />
          Report Content
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleReport("copyright")} className="text-red-600">
          <Flag className="mr-2 h-4 w-4" />
          Report Copyright Issue
        </DropdownMenuItem>

        <ReportModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          contentId={contentId}
          contentType={contentType}
          contentTitle={contentTitle}
          creatorName={creatorName}
          storeId={storeId}
          isCopyrightReport={reportType === "copyright"}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "icon" ? (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Flag className="h-4 w-4" />
              <span className="sr-only">Report</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white dark:bg-black">
          <DropdownMenuItem onClick={() => handleReport("general")}>
            Report Inappropriate Content
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleReport("general")}>Report Spam</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleReport("copyright")}
            className="text-red-600 focus:text-red-600"
          >
            Report Copyright Infringement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        contentId={contentId}
        contentType={contentType}
        contentTitle={contentTitle}
        creatorName={creatorName}
        storeId={storeId}
        isCopyrightReport={reportType === "copyright"}
      />
    </>
  );
}
