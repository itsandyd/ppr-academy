"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileStack, Download } from "lucide-react";

interface CourseCheatSheetsProps {
  courseId: Id<"courses">;
}

export function CourseCheatSheets({ courseId }: CourseCheatSheetsProps) {
  const pack = useQuery(api.cheatSheetPacks.getPacksForEnrolledCourse, {
    courseId,
  });

  if (!pack || pack.sheets.length === 0) return null;

  const handleDownloadAll = () => {
    for (const sheet of pack.sheets) {
      if (sheet.pdfUrl) {
        window.open(sheet.pdfUrl, "_blank");
      }
    }
  };

  return (
    <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileStack className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-lg">Cheat Sheet Pack</CardTitle>
            <Badge
              variant="secondary"
              className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
            >
              {pack.sheets.length} sheets
            </Badge>
          </div>
          {pack.sheets.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {pack.sheets.map((sheet: any) => (
            <div
              key={sheet._id}
              className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                  <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-medium truncate">
                  {sheet.moduleTitle}
                </span>
              </div>
              {sheet.pdfUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  <a
                    href={sheet.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <FileDown className="w-3 h-3 mr-1" />
                    PDF
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
