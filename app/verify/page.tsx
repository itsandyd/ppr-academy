"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, Loader2 } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) return;

    setIsSearching(true);
    
    // Format the code (remove spaces, convert to uppercase)
    const formattedCode = verificationCode.trim().toUpperCase().replace(/\s/g, '');
    
    // Redirect to verification page
    router.push(`/verify/${formattedCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Verify Certificate</CardTitle>
          <CardDescription className="text-center">
            Enter a certificate ID or verification code to verify its authenticity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verification-code" className="text-sm font-medium mb-2 block">
                Certificate ID or Verification Code
              </label>
              <Input
                id="verification-code"
                placeholder="e.g., ABC-123-XYZ or CERT-..."
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isSearching}
                className="text-center font-mono text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                The verification code can be found on the certificate
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={!verificationCode.trim() || isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Verify Certificate
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">How to verify:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Locate the verification code on the certificate</li>
              <li>Enter the code in the field above</li>
              <li>Click "Verify Certificate" to check authenticity</li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              All certificates issued by PPR Academy can be verified instantly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
