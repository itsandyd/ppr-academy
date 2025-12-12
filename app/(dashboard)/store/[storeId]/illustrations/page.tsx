"use client";

import { ScriptIllustrationGenerator } from "@/components/script-illustration-generator";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";

/**
 * Standalone page for the Script-to-Illustration Generator
 * Accessible at /store/[storeId]/illustrations
 */
export default function IllustrationsPage() {
  const { user } = useAuth();
  const params = useParams();
  const storeId = params?.storeId as string;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to generate illustrations</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Illustration Generator</h1>
        <p className="text-muted-foreground">
          Transform your scripts and course content into beautiful, AI-generated illustrations with semantic search capabilities.
        </p>
      </div>

      <ScriptIllustrationGenerator
        userId={user.id}
        storeId={storeId}
        sourceType="custom"
      />
    </div>
  );
}
