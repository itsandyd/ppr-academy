"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check } from "lucide-react";

interface StepsProps {
  current: number;
}

function Steps({ current }: StepsProps) {
  const steps = [
    { label: "Set up store", number: 1 },
    { label: "Add products", number: 2 },
    { label: "Go live", number: 3 },
  ];

  return (
    <div className="flex items-center justify-center max-w-md mx-auto">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step.number <= current
                  ? "bg-[#6356FF] text-white"
                  : "border-2 border-[#6356FF] text-[#6356FF] bg-white"
              }`}
            >
              {step.number <= current ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs text-[#51536A] mt-2 text-center">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-16 h-0.5 bg-[#E3E5EC] mx-4 mt-[-1rem]" />
          )}
        </div>
      ))}
    </div>
  );
}

function ChallengeCopy() {
  return (
    <div className="max-w-lg">
      <h2 className="text-3xl font-extrabold text-[#0F0F0F] uppercase mb-6">
        JOIN THE CHALLENGE ///
      </h2>
      <p className="text-base text-[#51536A] leading-relaxed mb-6 max-w-prose">
        Take part in our 30-day creator challenge and build your online business 
        from scratch. Get daily tasks, expert guidance, and join a community of 
        ambitious creators just like you.
      </p>
      <Button 
        size="lg" 
        className="bg-black text-white rounded-xl mt-6 px-8 py-3 font-semibold hover:scale-105 transition-transform"
      >
        Let's Go!
      </Button>
    </div>
  );
}

function ChallengeCard() {
  const avatarUrls = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b639?w=32&h=32&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=32&h=32&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=32&h=32&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=32&h=32&fit=crop&crop=face",
  ];

  return (
    <Card className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-lg max-w-md">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400">
        {/* TODO: Replace with actual grayscale image */}
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">📸</div>
            <div className="text-sm text-muted-foreground">Challenge Image</div>
          </div>
        </div>
      </div>

      {/* 30 DAYS Badge */}
      <div className="absolute top-4 right-4 transform rotate-[-2deg]">
        <Badge 
          variant="secondary" 
          className="bg-[#5273FF] text-white px-3 py-1 text-sm font-bold"
        >
          30 DAYS
        </Badge>
      </div>

      {/* Avatar Strip */}
      <div className="absolute bottom-4 left-4 flex -space-x-2">
        {avatarUrls.map((url, index) => (
          <Avatar key={index} className="w-8 h-8 border-2 border-white">
            <AvatarImage src={url} alt={`Participant ${index + 1}`} />
            <AvatarFallback className="text-xs">
              {String.fromCharCode(65 + index)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardHome() {
  const userName = "Alex"; // Dummy data

  return (
    <section className="flex flex-col gap-8 py-10 md:py-16">
      <h1 className="text-4xl font-bold text-[#0F0F0F]">
        Welcome {userName}, you're in
        <span className="inline-block ml-2">🎉</span>
      </h1>

      {/* Progress tracker */}
      <Steps current={1} />

      <div className="flex flex-col lg:flex-row gap-16 mt-8">
        <ChallengeCopy />   {/* left column */}
        <ChallengeCard />   {/* right column */}
      </div>
    </section>
  );
} 