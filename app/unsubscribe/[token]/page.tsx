"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type UnsubscribeStatus = "loading" | "verifying" | "confirmed" | "success" | "error" | "invalid";

export default function UnsubscribePage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");
  const [email, setEmail] = useState<string>("");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [scope, setScope] = useState<"creator" | "all" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Step 1: Verify the token via GET
  useEffect(() => {
    async function verifyToken() {
      try {
        const response = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setEmail(data.email || "");
          setStoreId(data.storeId || null);

          if (data.storeId) {
            // v2 token with creator scope — show choice
            setStatus("verifying");
          } else {
            // v1 legacy token — process immediately as global
            processUnsubscribe("all");
          }
        } else {
          setStatus("invalid");
          setErrorMessage("This unsubscribe link is invalid or has expired.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    }

    if (token) {
      verifyToken();
    } else {
      setStatus("invalid");
      setErrorMessage("No unsubscribe token provided.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Step 2: Process the unsubscribe
  async function processUnsubscribe(chosenScope: "creator" | "all") {
    setStatus("loading");
    setScope(chosenScope);

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, scope: chosenScope }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setEmail(data.email || email);
        setScope(data.scope || chosenScope);
      } else if (data.error === "invalid_token") {
        setStatus("invalid");
        setErrorMessage("This unsubscribe link is invalid or has expired.");
      } else {
        setStatus("error");
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-blue-500" />}
            {status === "verifying" && <Mail className="h-12 w-12 text-blue-500" />}
            {(status === "success" || status === "confirmed") && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {(status === "error" || status === "invalid") && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Processing..."}
            {status === "verifying" && "Unsubscribe"}
            {status === "success" && "Unsubscribed"}
            {status === "error" && "Error"}
            {status === "invalid" && "Invalid Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <p className="text-muted-foreground">Please wait while we process your request...</p>
          )}

          {/* Per-creator choice screen */}
          {status === "verifying" && (
            <>
              <p className="text-muted-foreground">
                Choose how you&apos;d like to unsubscribe:
              </p>
              {email && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 text-sm text-muted-foreground dark:bg-slate-800">
                  <Mail className="h-4 w-4" />
                  <span>{email}</span>
                </div>
              )}
              <div className="space-y-3 pt-2">
                <Button
                  className="w-full"
                  onClick={() => processUnsubscribe("creator")}
                >
                  Unsubscribe from this creator only
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => processUnsubscribe("all")}
                >
                  Unsubscribe from all PausePlayRepeat emails
                </Button>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <p className="text-muted-foreground">
                {scope === "creator"
                  ? "You have been unsubscribed from this creator\u2019s mailing list."
                  : "You have been unsubscribed from all marketing emails."}
              </p>
              {email && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 text-sm text-muted-foreground dark:bg-slate-800">
                  <Mail className="h-4 w-4" />
                  <span>{email}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {scope === "creator"
                  ? "You may still receive emails from other creators on PausePlayRepeat, as well as important transactional emails (purchase confirmations, etc.)."
                  : "You will no longer receive marketing emails from PausePlayRepeat. Important transactional emails (purchase confirmations, etc.) may still be sent."}
              </p>

              {/* If they only unsubscribed from one creator, offer global option */}
              {scope === "creator" && storeId && (
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => processUnsubscribe("all")}
                  >
                    Unsubscribe from all emails instead
                  </Button>
                </div>
              )}
            </>
          )}

          {(status === "error" || status === "invalid") && (
            <>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Go to Homepage
              </Button>
            </>
          )}

          {status === "success" && (
            <div className="border-t pt-4">
              <p className="mb-3 text-sm text-muted-foreground">Changed your mind?</p>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Visit PausePlayRepeat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
