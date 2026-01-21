"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, RefreshCw, AlertCircle, Settings } from "lucide-react";

interface UserSyncFallbackProps {
  clerkId: string;
}

export function UserSyncFallback({ clerkId }: UserSyncFallbackProps) {
  const handleSyncUser = async () => {
    try {
      const response = await fetch('/api/sync-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh the page to try loading again
        window.location.reload();
      } else {
        console.error('Failed to sync user');
        alert('Failed to sync user. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      alert('Error syncing user. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
      <Card className="max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Setting up your account...</h2>
          <p className="text-slate-600 mb-6">
            We're creating your profile in our database. This usually happens automatically, 
            but sometimes we need to sync it manually.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={handleSyncUser} 
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Account Now
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            If this continues to fail, please contact support with your user ID: 
            <code className="bg-slate-100 px-2 py-1 rounded text-xs">{clerkId}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function UserErrorFallback({ clerkId }: UserSyncFallbackProps) {
  const handleDebugUser = async () => {
    try {
      const response = await fetch('/api/debug-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const debugInfo = await response.json();

      // Show debug info in an alert for now
      const steps = debugInfo.steps?.join('\n') || 'No steps recorded';
      const errors = debugInfo.errors?.join('\n') || 'No errors recorded';
      
      alert('Debug Results:\n\nSteps:\n' + steps + '\n\nErrors:\n' + errors);
      
      // If user was created successfully, reload the page
      if (debugInfo.user) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Debug error:', error);
      alert('Debug failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
      <Card className="max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Account Setup Issue</h2>
          <p className="text-slate-600 mb-6">
            We're having trouble setting up your account. This usually happens due to a temporary connection issue.
          </p>
          <div className="space-y-4">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Button 
              onClick={handleDebugUser}
              variant="outline"
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Debug Issue
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            If this continues to fail, please contact support with your user ID: 
            <code className="bg-slate-100 px-2 py-1 rounded text-xs">{clerkId}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 