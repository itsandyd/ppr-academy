import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";

interface FinalCTAProps {}

export const FinalCTA: FC<FinalCTAProps> = () => {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-[#6356FF] to-[#5273FF] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
      
      <div className="mx-auto w-full max-w-[1140px] px-6 relative z-10">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Transform your music
              <span className="block">journey today</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Join 15,000+ students and 500+ creators who are already building successful music careers through our platform. 
              Start learning from industry professionals today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <Button 
                variant="default" 
                size="lg" 
                className="w-full sm:w-auto rounded-xl bg-white text-[#6356FF] hover:bg-white/90 font-bold px-12 py-6 text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                Join the Platform
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </SignUpButton>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-white/60 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Free to browse creators</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Direct creator subscriptions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Money-back guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Start learning instantly</span>
            </div>
          </div>

          {/* Social Proof Numbers */}
          <div className="border-t border-white/20 pt-8 mt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-white/60">Active Creators</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">15,000+</div>
                <div className="text-sm text-white/60">Students Learning</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">4.9/5</div>
                <div className="text-sm text-white/60">User Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">$5.2K</div>
                <div className="text-sm text-white/60">Avg Creator Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
    </section>
  );
}; 