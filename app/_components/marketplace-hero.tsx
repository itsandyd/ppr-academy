"use client";

import { FC, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Users, BookOpen, Package } from "lucide-react";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";

interface MarketplaceHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  totalCourses: number;
  totalProducts: number;
  totalCreators: number;
}

export const MarketplaceHero: FC<MarketplaceHeroProps> = ({
  searchTerm,
  onSearchChange,
  activeTab,
  onTabChange,
  totalCourses,
  totalProducts,
  totalCreators,
}) => {
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[70vh] bg-gradient-to-br from-chart-1 via-background to-chart-3 overflow-hidden"> 
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-chart-1/20 dark:bg-chart-1/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-chart-4/20 dark:bg-chart-4/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-chart-3/20 dark:bg-chart-3/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {(totalCreators > 0 || (totalCourses + totalProducts) > 0) && (
              <Badge className="inline-flex items-center px-4 py-2 bg-card/80 backdrop-blur-sm border border-border text-card-foreground hover:bg-card/90 transition-all shadow-sm">
                <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                <span className="font-medium">
                  {totalCreators > 0 && `${totalCreators} Creator${totalCreators !== 1 ? 's' : ''}`}
                  {(totalCreators > 0 && (totalCourses + totalProducts) > 0) && ' • '}
                  {(totalCourses + totalProducts) > 0 && `${totalCourses + totalProducts} Resource${(totalCourses + totalProducts) !== 1 ? 's' : ''}`}
                </span>
              </Badge>
            )}
          </motion.div>

          {/* Main Headline */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-[#1e293b] via-[#6b7280] to-[#1e293b] dark:from-[#e2e8f0] dark:via-[#9ca3af] dark:to-[#e2e8f0] bg-clip-text text-transparent">
                Learn Production.
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#6366f1] to-[#4338ca] dark:from-[#99d8f5] dark:to-[#b166ff] bg-clip-text text-transparent">
                Sell Your Sound.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Discover expert courses, premium sample packs, and digital tools—or start your own creator store.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
              <Input
                placeholder="Search courses, sample packs, presets..."
                className="w-full pl-14 pr-4 py-6 rounded-2xl bg-card/95 backdrop-blur-sm border-0 shadow-2xl text-lg focus-visible:ring-2 focus-visible:ring-ring transition-all text-card-foreground"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => onSearchChange("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </motion.div>

          {/* Quick Stats - Only show if we have meaningful data */}
          {(totalCourses > 0 || totalProducts > 0 || totalCreators > 0) && (
            <motion.div
              className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {totalCourses > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-sm rounded-full border border-border shadow-sm">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-card-foreground">{totalCourses} Course{totalCourses !== 1 ? 's' : ''}</span>
                </div>
              )}
              {totalProducts > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-sm rounded-full border border-border shadow-sm">
                  <Package className="w-4 h-4 text-chart-4" />
                  <span className="text-card-foreground">{totalProducts} Product{totalProducts !== 1 ? 's' : ''}</span>
                </div>
              )}
              {totalCreators > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-sm rounded-full border border-border shadow-sm">
                  <Users className="w-4 h-4 text-chart-5" />
                  <span className="text-card-foreground">{totalCreators} Creator{totalCreators !== 1 ? 's' : ''}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Start for Free
                </Button>
              </SignUpButton>
            )}

            <Link href="/sign-up?intent=creator">
              <Button
                variant="outline"
                size="lg"
                className="border-border text-foreground hover:bg-muted bg-card/60 backdrop-blur-sm px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm"
              >
                <Users className="mr-2 h-5 w-5" />
                Become a Creator
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  );
};

