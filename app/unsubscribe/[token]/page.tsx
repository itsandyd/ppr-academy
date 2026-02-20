"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type UnsubscribeStatus = "loading" | "success" | "error" | "invalid";

export default function UnsubscribePage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");
  const [email, setEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function processUnsubscribe() {
      try {
        const response = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setEmail(data.email || "");
        } else if (data.error === "invalid_token") {
          setStatus("invalid");
          setErrorMessage("This unsubscribe link is invalid or has expired.");
        } else {
          setStatus("error");
          setErrorMessage(data.message || "Something went wrong. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    }

    if (token) {
      processUnsubscribe();
    } else {
      setStatus("invalid");
      setErrorMessage("No unsubscribe token provided.");
    }
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-blue-500" />}
            {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
            {(status === "error" || status === "invalid") && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Processing..."}
            {status === "success" && "Unsubscribed"}
            {status === "error" && "Error"}
            {status === "invalid" && "Invalid Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <p className="text-muted-foreground">Please wait while we process your request...</p>
          )}

          {status === "success" && (
            <>
              <p className="text-muted-foreground">
                You have been successfully unsubscribed from our mailing list.
              </p>
              {email && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 text-sm text-muted-foreground dark:bg-slate-800">
                  <Mail className="h-4 w-4" />
                  <span>{email}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                You will no longer receive marketing emails from PausePlayRepeat. Important
                transactional emails (purchase confirmations, etc.) may still be sent.
              </p>
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
