"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface StoreUrlDisplayProps {
  slug: string;
  showCopyButton?: boolean;
  showVisitButton?: boolean;
  variant?: "default" | "compact" | "card";
  className?: string;
}

export function StoreUrlDisplay({
  slug,
  showCopyButton = true,
  showVisitButton = false,
  variant = "default",
  className = "",
}: StoreUrlDisplayProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://academy.pauseplayrepeat.com";
  const displayDomain = baseUrl.replace(/^https?:\/\//, "");
  const fullUrl = `${baseUrl}/${slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Store URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const visitStore = () => {
    window.open(fullUrl, "_blank");
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-mono text-sm text-muted-foreground">
          {displayDomain}/{slug}
        </span>
        {showCopyButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={copyUrl}
            className="h-7 w-7 p-0"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        )}
        {showVisitButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={visitStore}
            className="h-7 w-7 p-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`bg-white dark:bg-black border border-border rounded-lg p-4 ${className}`}>
        <p className="text-sm text-muted-foreground mb-2">Your Store URL:</p>
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-foreground break-all flex-1">
            {displayDomain}/{slug}
          </p>
          {showCopyButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={copyUrl}
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          )}
          {showVisitButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={visitStore}
              className="flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Visit
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center flex-1 border border-border rounded-lg overflow-hidden">
        <span className="text-sm text-muted-foreground bg-muted px-4 py-3 border-r whitespace-nowrap">
          {displayDomain}/
        </span>
        <span className="font-mono text-sm px-4 py-3 flex-1">
          {slug}
        </span>
      </div>
      
      {showCopyButton && (
        <Button
          size="sm"
          variant="outline"
          onClick={copyUrl}
          className="flex-shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      )}
      
      {showVisitButton && (
        <Button
          size="sm"
          variant="outline"
          onClick={visitStore}
          className="flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Visit
        </Button>
      )}
    </div>
  );
}

