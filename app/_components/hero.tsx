"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap, CheckCircle, BookOpen, Store } from "lucide-react";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

interface HeroProps {}

export const Hero: FC<HeroProps> = () => {
  const { isSignedIn } = useAuth();
  
  return (
    <section className="relative bg-gradient-to-b from-chart-1 to-chart-2 overflow-hidden">
      <div className="mx-auto w-full max-w-[1140px] px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-primary-foreground space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm mb-8">
              <Zap className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">500+ Creators • 15,000+ Students</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Learn from Top Producers
                <span className="block">Build Your Music Career</span>
              </h1>
              
              <div className="text-xl text-primary-foreground/80 leading-relaxed max-w-lg space-y-2">
                <div>• Browse <span className="font-semibold text-primary-foreground">500+ creator stores</span> with courses & coaching</div>
                <div>• Subscribe to your <span className="font-semibold text-primary-foreground">favorite producers</span> for ongoing content</div>
                <div>• Get <span className="font-semibold text-primary-foreground">personalized mentorship</span> from industry pros</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isSignedIn ? (
                <>
                  <Link href="/library">
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="rounded-xl bg-background text-chart-1 hover:bg-background/90 font-semibold shadow-lg shadow-black/5"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Student Library
                    </Button>
                  </Link>
                  <Link href="/home">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="rounded-xl text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
                    >
                      <Store className="mr-2 h-4 w-4" />
                      Creator Studio
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <SignUpButton mode="modal">
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="rounded-xl bg-background text-chart-1 hover:bg-background/90 font-semibold shadow-lg shadow-black/5"
                    >
                      Join the Platform
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignUpButton>
                  <Link href="/courses">
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="rounded-xl text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Browse Creators
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm text-primary-foreground/60">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Free to browse creators</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Direct creator subscriptions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Creator money-back guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column - Phone Mockups */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main Phone */}
              <div className="mx-auto w-64 h-[500px] bg-black rounded-[2.5rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                  {/* todo: Replace with actual app screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    Producer Dashboard
                  </div>
                </div>
              </div>
              
              {/* Secondary Phone */}
              <div className="absolute -right-8 top-16 w-48 h-96 bg-black rounded-[2rem] p-2 shadow-xl opacity-80">
                <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden">
                  {/* todo: Replace with actual beat store screenshot */}
                  <div className="aspect-[3/5] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    Beat Store
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl transform scale-150"></div>
          </div>
        </div>
      </div>

      {/* Diagonal Bottom SVG */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L1440 0V120H0Z" fill="currentColor" className="text-background" />
        </svg>
      </div>
    </section>
  );
}; 