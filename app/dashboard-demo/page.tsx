import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function DashboardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F6FF] to-white flex items-center justify-center p-8">
      <Card className="max-w-2xl p-8 text-center">
        <h1 className="text-4xl font-bold text-[#0F0F0F] mb-4">
          Stan Dashboard Recreation
        </h1>
        <p className="text-lg text-[#51536A] mb-8">
          Experience the Stan dashboard Home screen recreation built with Next.js 14, 
          TypeScript, Tailwind CSS, and shadcn/ui components.
        </p>
        
        <div className="space-y-4">
          <Link href="/home">
            <Button 
              size="lg" 
              className="w-full bg-[#6356FF] hover:bg-[#5a4beb] text-white rounded-xl font-semibold"
            >
              View Dashboard Home
            </Button>
          </Link>
          
          <div className="text-sm text-[#51536A] space-y-2">
            <p><strong>Features implemented:</strong></p>
            <ul className="text-left space-y-1">
              <li>• 240px fixed sidebar with navigation</li>
              <li>• Progress tracker with 3 steps</li>
              <li>• Two-column layout with challenge content</li>
              <li>• Hero card with badge and avatar strip</li>
              <li>• Exact color palette and typography</li>
              <li>• Responsive design patterns</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 