import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import CoachingClient from "./coaching-client";
import { getCoaches } from "@/app/actions/coaching-actions";

export const metadata = {
  title: "Find Music Production Coaches | PPR Academy",
  description: "Connect with expert music production coaches for personalized mentorship and skill development.",
};

export default async function CoachingPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const coaches = await getCoaches();

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <CoachingClient coaches={coaches} isAuthenticated={!!userId} />
    </div>
  );
} 