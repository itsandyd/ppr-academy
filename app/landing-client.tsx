"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Play, Star, Clock, Users, GraduationCap, Bot, Download, Smartphone, Award, Music, Headphones, Zap, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  instructor: string;
  role: string;
  duration: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  thumbnail: string;
  instructorImage: string;
  badge: string;
  badgeColor: string;
  level: string;
  students: number;
  slug: string | null;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface Stat {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface LandingClientProps {
  isAuthenticated: boolean;
  featuredCourses: Course[];
  features: Feature[];
  stats: Stat[];
}

function SectionDivider({ colorTop, colorBottom }: { colorTop: string; colorBottom: string }) {
  return (
    <div className="relative h-24 -mt-12">
      <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path 
          fill={`hsl(${colorTop})`} 
          d="M0,224L48,213.3C96,203,192,181,288,165.3C384,149,480,139,576,149.3C672,160,768,192,864,197.3C960,203,1056,181,1152,154.7C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, hsl(${colorTop}), hsl(${colorBottom}))` }} />
    </div>
  );
}

export default function LandingClient({ isAuthenticated, featuredCourses, features, stats }: LandingClientProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted text-foreground overflow-hidden">
        {/* Optimized texture overlay for dark/light mode */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 dark:opacity-15 mix-blend-overlay"></div>
        
        {/* Enhanced background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/5 dark:bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8 shadow-sm dark:shadow-primary/5"
            >
              <Zap className="w-4 h-4 mr-2 text-secondary" />
              <span className="text-sm font-medium text-foreground">500+ Creators • 15,000+ Students</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground"
            >
              Learn from Top Producers
              <br />
              <span className="text-primary font-semibold">
                Build Your Music Career
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed space-y-2 text-foreground"
            >
              <div>• Browse <span className="font-semibold text-primary">500+ creator stores</span> with courses & coaching</div>
              <div>• Subscribe to your <span className="font-semibold text-primary">favorite producers</span> for ongoing content</div>
              <div>• Get <span className="font-semibold text-primary">personalized mentorship</span> from industry pros</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground px-10 py-5 text-xl font-bold shadow-xl hover:shadow-2xl dark:shadow-secondary/20 transition-all duration-300">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <Button size="lg" className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground px-10 py-5 text-xl font-bold shadow-xl hover:shadow-2xl dark:shadow-secondary/20 transition-all duration-300">
                    Join the Platform
                  </Button>
                </SignUpButton>
              )}
              <Link href="#courses" className="text-foreground hover:text-primary transition-colors font-medium underline underline-offset-4 hover:underline-offset-8">
                Browse Creators
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex items-center justify-center space-x-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                <span>Free to browse creators</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                <span>Direct creator subscriptions</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                <span>Creator money-back guarantee</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-4 rounded-2xl bg-background/50 dark:bg-background/20 border border-border/50 hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex justify-center mb-2 text-primary">{stat.icon}</div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Spotlight Section */}
      <section className="py-16 bg-gradient-to-br from-card via-card/90 to-muted relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 dark:opacity-10 mix-blend-overlay"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-primary/10">
              <Users className="w-4 h-4 mr-2" />
              Creator Spotlight
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Meet Top Creators
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover producers who are building successful businesses on our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Creator 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-lg hover:shadow-xl dark:hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                  B
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-foreground">BEATS by Marcus</h3>
                  <p className="text-sm text-muted-foreground">Hip-Hop Producer</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <span className="text-sm text-muted-foreground ml-1">4.9 • 2.3K students</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                  <span className="text-lg font-bold text-primary">$8.5K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subscribers</span>
                  <span className="text-sm font-medium text-foreground">340</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Courses</span>
                  <span className="text-sm font-medium text-foreground">5</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Subscription</span>
                  <span className="text-lg font-bold text-primary">$29/mo</span>
                </div>
                <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300" size="sm">
                  View Store
                </Button>
              </div>
            </motion.div>

            {/* Creator 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-lg hover:shadow-xl dark:hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                  E
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-foreground">ElectraVibes</h3>
                  <p className="text-sm text-muted-foreground">EDM/House Producer</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <span className="text-sm text-muted-foreground ml-1">4.8 • 1.8K students</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                  <span className="text-lg font-bold text-primary">$12.2K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subscribers</span>
                  <span className="text-sm font-medium text-foreground">580</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Courses</span>
                  <span className="text-sm font-medium text-foreground">8</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Subscription</span>
                  <span className="text-lg font-bold text-primary">$39/mo</span>
                </div>
                <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300" size="sm">
                  View Store
                </Button>
              </div>
            </motion.div>

            {/* Creator 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-lg hover:shadow-xl dark:hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                  T
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-foreground">TrapLord Studios</h3>
                  <p className="text-sm text-muted-foreground">Trap/Drill Producer</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <span className="text-sm text-muted-foreground ml-1">4.7 • 3.1K students</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                  <span className="text-lg font-bold text-primary">$15.8K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subscribers</span>
                  <span className="text-sm font-medium text-foreground">720</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Courses</span>
                  <span className="text-sm font-medium text-foreground">12</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Subscription</span>
                  <span className="text-lg font-bold text-primary">$49/mo</span>
                </div>
                <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300" size="sm">
                  View Store
                </Button>
              </div>
            </motion.div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/creators">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl dark:shadow-secondary/20 transition-all duration-300"
              >
                Browse All Creators
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Creator Categories Section */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-primary/10">
              <Music className="w-4 h-4 mr-2" />
              Browse by Genre
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Find Your Sound
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore creators across all genres and find the perfect match for your musical journey
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Hip-Hop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-center hover:scale-105 hover:border-primary/20">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Headphones className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Hip-Hop</h3>
                <p className="text-sm text-muted-foreground mb-2">67 creators</p>
                <div className="text-xs text-primary font-medium">$25-$80/mo</div>
              </div>
            </motion.div>

            {/* EDM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-center hover:scale-105 hover:border-primary/20">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">EDM</h3>
                <p className="text-sm text-muted-foreground mb-2">89 creators</p>
                <div className="text-xs text-primary font-medium">$30-$100/mo</div>
              </div>
            </motion.div>

            {/* Trap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-center hover:scale-105 hover:border-primary/20">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Bot className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Trap</h3>
                <p className="text-sm text-muted-foreground mb-2">54 creators</p>
                <div className="text-xs text-primary font-medium">$20-$60/mo</div>
              </div>
            </motion.div>

            {/* R&B */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-center hover:scale-105 hover:border-primary/20">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Music className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">R&B</h3>
                <p className="text-sm text-muted-foreground mb-2">43 creators</p>
                <div className="text-xs text-primary font-medium">$25-$75/mo</div>
              </div>
            </motion.div>

            {/* Pop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-center hover:scale-105 hover:border-primary/20">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Award className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Pop</h3>
                <p className="text-sm text-muted-foreground mb-2">72 creators</p>
                <div className="text-xs text-primary font-medium">$30-$90/mo</div>
              </div>
            </motion.div>

            {/* Reggaeton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 text-center hover:scale-105 hover:border-primary/20">
                <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <TrendingUp className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Reggaeton</h3>
                <p className="text-sm text-muted-foreground mb-2">38 creators</p>
                <div className="text-xs text-primary font-medium">$20-$65/mo</div>
              </div>
            </motion.div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/creators">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl dark:shadow-primary/20 transition-all duration-300"
              >
                Browse All Genres
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <SectionDivider colorTop="var(--background)" colorBottom="var(--background)" />

      {/* Courses Section */}
      <section className="relative py-24 bg-background border-b border-border" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-primary/10">
                <Music className="w-4 h-4 mr-2" />
                Featured Creators
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Top Creator Stores
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Browse courses, coaching, and subscriptions from producers who've worked with major labels and artists worldwide.
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group cursor-pointer hover:shadow-2xl dark:hover:shadow-primary/10 transition-all duration-300 overflow-hidden bg-card border border-border shadow-sm hover:border-primary/20">
                  <div className="relative">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      {course.badge === "Bestseller" && (
                        <Badge variant="secondary" className="bg-card/95 dark:bg-card/80 backdrop-blur-sm text-foreground shadow-lg">
                          Bestseller
                        </Badge>
                      )}
                      {course.badge === "New" && (
                        <Badge variant="secondary" className="bg-card/95 dark:bg-card/80 backdrop-blur-sm text-foreground shadow-lg">
                          New
                        </Badge>
                      )}
                    </div>
                    <Badge className="absolute bottom-4 left-4 bg-card/95 dark:bg-card/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      {course.level}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img 
                        src={course.instructorImage} 
                        alt={course.instructor}
                        className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-border group-hover:border-primary/20 transition-colors duration-300"
                      />
                      <div>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{course.instructor}</p>
                        <p className="text-sm text-muted-foreground">{course.role}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex text-primary mr-2">
                          {course.reviews > 0 ? (
                            Array.from({ length: course.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground mr-2">
                              New Course
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-primary bg-primary/10 border border-primary/20">
                          {course.duration}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1" />
                        {course.students}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="text-3xl font-bold text-primary">${course.price}</div>
                        <div className="text-lg text-muted-foreground line-through">${course.originalPrice}</div>
                      </div>
                      <Badge className="bg-secondary text-secondary-foreground shadow-sm">
                        Save {Math.round((1 - course.price / course.originalPrice) * 100)}%
                      </Badge>
                    </div>
                    
                    <Link href={course.slug ? `/courses/${course.slug}` : "#"}>
                      <Button 
                        className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg hover:shadow-xl dark:shadow-secondary/20 transition-all duration-300"
                        size="lg"
                      >
                        Enroll Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/courses">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl dark:shadow-secondary/20 transition-all duration-300"
              >
                Browse All Creators
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <SectionDivider colorTop="var(--background)" colorBottom="var(--muted)" />

      {/* Features Section */}
      <section className="relative py-24 bg-muted text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 dark:opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/5 dark:bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-primary/10 border border-primary/20 text-primary shadow-sm dark:shadow-primary/10">
                <Zap className="w-4 h-4 mr-2 text-primary" />
                Platform Features
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Connecting Creators &{" "}
                <span className="text-primary font-semibold">
                  Students
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Our marketplace brings together the best producers to share their knowledge through courses, coaching, and exclusive content.
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group text-center p-6 rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border hover:bg-card hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-primary/10"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                  <div className="text-primary text-2xl">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Success Metrics Section */}
      <section className="py-16 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-primary/10">
              <TrendingUp className="w-4 h-4 mr-2" />
              Creator Success
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Real Creator Earnings
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how our creators are building sustainable income streams on the platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-3xl font-bold text-primary mb-2">$5.2K</div>
              <div className="text-sm text-muted-foreground">Average Monthly Revenue</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-3xl font-bold text-primary mb-2">$45K</div>
              <div className="text-sm text-muted-foreground">Top Creator This Month</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-3xl font-bold text-primary mb-2">90%</div>
              <div className="text-sm text-muted-foreground">Creator Revenue Share</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-3xl font-bold text-primary mb-2">3.2</div>
              <div className="text-sm text-muted-foreground">Avg. Months to $1K</div>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Earning Potential */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary/20">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Earning Potential</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">100 subscribers</span>
                  <span className="text-sm font-medium text-foreground">$2,900/mo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">500 subscribers</span>
                  <span className="text-sm font-medium text-foreground">$14,500/mo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">1,000 subscribers</span>
                  <span className="text-sm font-medium text-primary font-bold">$29,000/mo</span>
                </div>
              </div>
            </motion.div>

            {/* Platform Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-secondary/20">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Platform Benefits</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm text-foreground">Instant payouts</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm text-foreground">Subscriber management</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm text-foreground">Content protection</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm text-foreground">Marketing tools</span>
                </div>
              </div>
            </motion.div>

            {/* Getting Started */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-background/80 dark:bg-background/60 backdrop-blur-sm p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-chart-2/20">
                  <Users className="w-6 h-6 text-chart-2" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Getting Started</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">1</div>
                  <span className="text-sm text-foreground">Create your store</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">2</div>
                  <span className="text-sm text-foreground">Upload your content</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">3</div>
                  <span className="text-sm text-foreground">Start earning</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/become-a-coach">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl dark:shadow-secondary/20 transition-all duration-300"
              >
                Start Your Creator Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Success Stories</h3>
            <p className="text-lg text-muted-foreground">From both creators and students on our platform</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">Mike Chen</h4>
                  <p className="text-sm text-muted-foreground">Creator • Spinnin' Records</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">"Made $15K in my first month selling courses on the platform. Finally have a direct connection with my audience."</p>
            </div>
            
            <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-chart-2 to-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Student • Monstercat Featured</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">"Subscribed to 3 creators and learned more in 2 months than I did in 2 years on YouTube. Worth every penny."</p>
            </div>
            
            <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-1 rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  D
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-foreground">David Kim</h4>
                  <p className="text-sm text-muted-foreground">Creator • Beatport #1 Producer</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">"Built a recurring revenue stream with 200+ subscribers. The platform handles everything so I can focus on creating."</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-primary/10">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-medium">500+ active creators</span>
              <span className="ml-2 text-sm text-muted-foreground">• 15,000+ students learning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Path
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're looking to learn or teach, we've got you covered
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Student Path */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-card/80 dark:bg-card/60 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-lg hover:shadow-xl dark:hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">I want to learn</h3>
                <p className="text-muted-foreground">
                  Discover amazing creators and level up your music production skills
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary mr-3" />
                  <span className="text-foreground">Browse 500+ creator stores</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary mr-3" />
                  <span className="text-foreground">Subscribe to your favorite producers</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary mr-3" />
                  <span className="text-foreground">Get 1-on-1 coaching sessions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary mr-3" />
                  <span className="text-foreground">Access exclusive content</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl dark:shadow-primary/20 transition-all duration-300" size="lg">
                  Start Learning
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Free to browse • Pay per creator
                </p>
              </div>
            </motion.div>

            {/* Creator Path */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-card/80 dark:bg-card/60 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-lg hover:shadow-xl dark:hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-secondary/20">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">I want to teach</h3>
                <p className="text-muted-foreground">
                  Share your knowledge and build a sustainable income stream
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3" />
                  <span className="text-foreground">Create your own branded store</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3" />
                  <span className="text-foreground">Sell courses & subscriptions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3" />
                  <span className="text-foreground">Offer 1-on-1 coaching</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary mr-3" />
                  <span className="text-foreground">Keep 90% of your earnings</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl dark:shadow-secondary/20 transition-all duration-300" size="lg">
                  Become a Creator
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Free to set up • 10% platform fee
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <SectionDivider colorTop="var(--background)" colorBottom="var(--secondary)" />

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 dark:opacity-15 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-secondary-foreground">
                Join the Producer Community
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-secondary-foreground/80 max-w-3xl mx-auto">
                Whether you're looking to learn from the best or share your knowledge, our marketplace connects you with the right people.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl dark:shadow-primary/30 transition-all duration-300">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl dark:shadow-primary/30 transition-all duration-300">
                      Join the Platform
                    </Button>
                  </SignUpButton>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-secondary-foreground/70">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                  <span>25 new creators joined this week</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                  <span>Free for students to browse</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
} 