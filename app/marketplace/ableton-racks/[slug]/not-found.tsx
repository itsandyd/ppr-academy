import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AbletonRackNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md mx-4">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Ableton Rack Not Found</h1>
          <p className="text-muted-foreground">
            The Ableton rack you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/marketplace/ableton-racks">
              <Button variant="default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Ableton Racks
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline">Go to Marketplace</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

