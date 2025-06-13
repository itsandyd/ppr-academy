import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import CoachingClient from "./coaching-client";
import { getCoaches } from "@/app/actions/coaching-actions";

export const metadata = {
  title: "Find Your Perfect Music Production Coach | PPR Academy",
  description: "Connect with expert producers for personalized mentorship, skill development, and career guidance",
};

export default async function CoachingPage() {
  const { userId } = await auth();
  const coaches = await getCoaches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20">
      <Suspense fallback={<CoachingPageSkeleton />}>
        <CoachingClient coaches={coaches} isAuthenticated={!!userId} />
      </Suspense>
    </div>
  );
}

function CoachingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
} 