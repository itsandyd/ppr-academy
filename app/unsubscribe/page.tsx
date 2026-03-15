"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type UnsubscribeStatus = "loading" | "verifying" | "success" | "error" | "invalid";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const list = searchParams.get("list");
  const token = searchParams.get("token");

  const [status, setStatus] = useState<UnsubscribeStatus>("loading");
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [listLabel, setListLabel] = useState<string>("");
  const [scope, setScope] = useState<"list" | "all" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function verifyToken() {
      if (!email || !list || !token) {
        setStatus("invalid");
        setErrorMessage("This unsubscribe link is missing required parameters.");
        return;
      }

      try {
        const params = new URLSearchParams({ email, list, token });
        const response = await fetch(`/api/unsubscribe?${params.toString()}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setMaskedEmail(data.email || "");
          setListLabel(data.listLabel || list);
          setStatus("verifying");
        } else {
          setStatus("invalid");
          setErrorMessage("This unsubscribe link is invalid or has expired.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    }

    verifyToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, list, token]);

  async function processUnsubscribe(chosenScope: "list" | "all") {
    if (!email || !list || !token) return;

    setStatus("loading");
    setScope(chosenScope);

    try {
      const params = new URLSearchParams({ email, list, token });
      const response = await fetch(`/api/unsubscribe?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: chosenScope === "all" ? "all" : "list" }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMaskedEmail(data.email || maskedEmail);
        setScope(data.scope === "all" ? "all" : "list");
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
            {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
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

          {status === "verifying" && (
            <>
              <p className="text-muted-foreground">
                Unsubscribe from {listLabel}?
              </p>
              {maskedEmail && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 text-sm text-muted-foreground dark:bg-slate-800">
                  <Mail className="h-4 w-4" />
                  <span>{maskedEmail}</span>
                </div>
              )}
              <div className="space-y-3 pt-2">
                <Button
                  className="w-full"
                  onClick={() => processUnsubscribe("list")}
                >
                  Unsubscribe from {listLabel}
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
                {scope === "all"
                  ? "You have been unsubscribed from all marketing emails."
                  : `You have been unsubscribed from ${listLabel}.`}
              </p>
              {maskedEmail && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 text-sm text-muted-foreground dark:bg-slate-800">
                  <Mail className="h-4 w-4" />
                  <span>{maskedEmail}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {scope === "all"
                  ? "You will no longer receive marketing emails from PausePlayRepeat. Important transactional emails (purchase confirmations, etc.) may still be sent."
                  : "You may still receive other emails from PausePlayRepeat, as well as important transactional emails (purchase confirmations, etc.)."}
              </p>

              {scope === "list" && (
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

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
