"use client";

import { ScriptIllustrationGenerator } from "@/components/script-illustration-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface IllustrationTabProps {
  userId: string;
  storeId?: string;
  courseId?: string;
  lessonId?: string;
  lessonContent?: string;
  lessonTitle?: string;
}

/**
 * Tab component for course creation workflow
 * Allows instructors to generate illustrations for their lessons
 */
export function IllustrationTab({
  userId,
  storeId,
  courseId,
  lessonId,
  lessonContent,
  lessonTitle,
}: IllustrationTabProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Generate AI illustrations for your lesson content. Each sentence will get its own custom
          illustration using FAL AI, and all images will be searchable using semantic search.
        </AlertDescription>
      </Alert>

      <ScriptIllustrationGenerator
        userId={userId}
        storeId={storeId}
        sourceType={lessonId ? "lesson" : "course"}
        sourceId={lessonId || courseId}
        initialScript={lessonContent || ""}
      />

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">1. Script Analysis</strong>
            <p>Your lesson content is split into individual sentences.</p>
          </div>
          <div>
            <strong className="text-foreground">2. Prompt Generation</strong>
            <p>AI generates a detailed illustration prompt for each sentence.</p>
          </div>
          <div>
            <strong className="text-foreground">3. Image Generation</strong>
            <p>FAL AI creates custom illustrations based on the prompts.</p>
          </div>
          <div>
            <strong className="text-foreground">4. Embedding Creation</strong>
            <p>Each image gets a semantic embedding for searchability.</p>
          </div>
          <div>
            <strong className="text-foreground">5. Search & Reuse</strong>
            <p>Find and reuse illustrations across your courses using semantic search.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

