"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InstagramCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const handleOAuthCallback = useAction(api.integrations.instagram.handleOAuthCallback);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams?.get("code");
      const error = searchParams?.get("error");
      const errorDescription = searchParams?.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || error);
        console.error("Instagram OAuth error:", error, errorDescription);
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("No authorization code received from Instagram");
        return;
      }

      try {
        console.log("🔄 Processing Instagram OAuth callback...");
        
        // Exchange code for access token
        await handleOAuthCallback({ code });
        
        setStatus("success");
        console.log("✅ Instagram connected successfully!");
        
        // Redirect after 2 seconds
        setTimeout(() => {
          // TODO: Get actual storeId from user context
          router.push("/dashboard/social?success=instagram");
        }, 2000);
      } catch (error: any) {
        console.error("❌ OAuth callback error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to connect Instagram account");
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-6 text-purple-600 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Connecting Instagram...</h2>
                <p className="text-muted-foreground">
                  Please wait while we complete the connection
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Successfully Connected!</h2>
                <p className="text-muted-foreground mb-4">
                  Your Instagram account is now connected. Redirecting...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
                <p className="text-muted-foreground mb-6">
                  {errorMessage || "An error occurred while connecting your Instagram account"}
                </p>
                <Button onClick={() => router.push("/dashboard/social")}>
                  Back to Social Media
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

