import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import BecomeCoachForm from "./become-coach-form";

export const metadata = {
  title: "Become a Coach | PausePlayRepeat",
  description: "Join our community of expert music production coaches and help students achieve their goals",
};

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function BecomeCoachPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in?redirect=/become-a-coach");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Become a Music Production Coach
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Share your expertise, inspire the next generation of producers, and build your coaching business with PausePlayRepeat.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Earn While Teaching</h3>
            <p className="text-slate-600">Set your own rates and build a sustainable coaching income.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Shape the Future</h3>
            <p className="text-slate-600">Help aspiring producers develop their skills and achieve their dreams.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌟</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Build Your Brand</h3>
            <p className="text-slate-600">Establish yourself as an expert and grow your professional network.</p>
          </div>
        </div>

        {/* Application Form */}
        <BecomeCoachForm />
      </div>
    </div>
  );
} 