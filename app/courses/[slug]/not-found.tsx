import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function CourseNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Course Not Found</h2>
          <p className="text-slate-600 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/courses" className="flex-1">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 