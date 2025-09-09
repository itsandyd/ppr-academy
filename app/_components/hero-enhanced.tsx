"use client";

import { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Zap, CheckCircle, Star, Users, TrendingUp, Award } from "lucide-react";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroProps {}

export const HeroEnhanced: FC<HeroProps> = () => {
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { icon: Users, label: "Active Students", value: "15,000+" },
    { icon: Star, label: "Course Rating", value: "4.9/5" },
    { icon: Award, label: "Certificates", value: "12,000+" },
    { icon: TrendingUp, label: "Success Rate", value: "94%" },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A3E] to-[#2D2D5F] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left Column - Content */}
          <motion.div 
            className="text-white space-y-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8 }}
          >
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white hover:bg-white/20 transition-all">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                <span className="font-medium">500+ Creators • 15,000+ Students</span>
              </Badge>
            </motion.div>
            
            {/* Main Headline */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Master Music
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Production
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-2xl">
                Learn from industry professionals, build your skills with hands-on projects, 
                and launch your music career with confidence.
              </p>
            </motion.div>

            {/* Feature Points */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {[
                "Access 500+ creator stores with exclusive courses",
                "Get personalized mentorship from industry pros",
                "Build a portfolio with real-world projects",
                "Join a community of 15,000+ music producers"
              ].map((point, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/90">{point}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              {isSignedIn ? (
                <Link href="/home">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                  >
                    Start Learning Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignUpButton>
              )}
              
              <Link href="/courses">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex flex-wrap items-center gap-6 pt-4 text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Free to browse</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>30-day guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Elements */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {/* Main Dashboard Mockup */}
            <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Producer Dashboard</h3>
                      <p className="text-sm text-white/70">Your learning progress</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Active
                  </Badge>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  {[
                    { name: "Beat Making Fundamentals", progress: 85 },
                    { name: "Advanced Mixing", progress: 60 },
                    { name: "Music Theory", progress: 40 },
                  ].map((course, index) => (
                    <motion.div 
                      key={course.name}
                      className="space-y-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
                      transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-white/90">{course.name}</span>
                        <span className="text-white/70">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: isVisible ? `${course.progress}%` : 0 }}
                          transition={{ duration: 1, delay: 1.5 + index * 0.2 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.slice(0, 4).map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                      transition={{ duration: 0.6, delay: 1.8 + index * 0.1 }}
                    >
                      <stat.icon className="w-6 h-6 text-purple-400 mb-2" />
                      <div className="text-sm text-white/70">{stat.label}</div>
                      <div className="text-lg font-bold text-white">{stat.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 shadow-xl"
              animate={{ 
                y: isVisible ? [0, -10, 0] : 0,
                rotate: isVisible ? [0, 5, 0] : 0 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2 
              }}
            >
              <Award className="w-6 h-6 text-white" />
            </motion.div>

            <motion.div 
              className="absolute -bottom-4 -left-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 shadow-xl"
              animate={{ 
                y: isVisible ? [0, 10, 0] : 0,
                rotate: isVisible ? [0, -5, 0] : 0 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2.5 
              }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </motion.div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl -z-10 scale-110"></div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M0 120L1440 0V120H0Z" 
            fill="currentColor" 
            className="text-white" 
          />
        </svg>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
