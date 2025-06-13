"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/footer";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Play, Star, Clock, Users, GraduationCap, Mic, Bot, Download, Smartphone, IdCard, Menu, X } from "lucide-react";

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const featuredCourses = [
    {
      id: 1,
      title: "Complete Hip-Hop Production Masterclass",
      instructor: "Mike Chen",
      role: "Hip-Hop Producer",
      duration: "8h 32m",
      rating: 5,
      reviews: 247,
      price: 89,
      thumbnail: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      badge: "Bestseller",
      badgeColor: "bg-primary"
    },
    {
      id: 2,
      title: "Advanced Synthesis & Sound Design",
      instructor: "Sarah Martinez",
      role: "Electronic Producer",
      duration: "12h 15m",
      rating: 5,
      reviews: 189,
      price: 129,
      thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      instructorImage: "https://images.unsplash.com/photo-1494790108755-2616b332c85c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      badge: "New",
      badgeColor: "bg-secondary"
    },
    {
      id: 3,
      title: "Professional Mixing & Mastering",
      instructor: "David Rodriguez",
      role: "Mixing Engineer",
      duration: "6h 45m",
      rating: 5,
      reviews: 356,
      price: 99,
      thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      instructorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      badge: "Popular",
      badgeColor: "bg-accent"
    }
  ];

  const features = [
    {
      icon: <GraduationCap className="text-white text-2xl" />,
      title: "Expert Instructors",
      description: "Learn from Grammy-winning producers and industry professionals who've worked with top artists."
    },
    {
      icon: <Bot className="text-white text-2xl" />,
      title: "AI Study Assistant",
      description: "Get personalized help with our AI chatbot that knows all course content and can answer your questions instantly."
    },
    {
      icon: <Users className="text-white text-2xl" />,
      title: "1-on-1 Coaching",
      description: "Book personalized coaching sessions with experienced producers for direct feedback on your tracks."
    },
    {
      icon: <Download className="text-white text-2xl" />,
      title: "Premium Sample Packs",
      description: "Access exclusive sample libraries, project files, and stems from every course to practice with."
    },
    {
      icon: <Smartphone className="text-white text-2xl" />,
      title: "Learn Anywhere",
      description: "Access your courses on any device with offline downloads and mobile-optimized video player."
    },
    {
      icon: <IdCard className="text-white text-2xl" />,
      title: "Certificates",
      description: "Earn verified certificates upon course completion to showcase your skills to potential collaborators."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Play className="text-white text-sm" />
                </div>
                <span className="text-lg lg:text-xl font-bold text-slate-900">PausePlayRepeat Academy</span>
              </div>
              <div className="hidden lg:flex space-x-6">
                <a href="#courses" className="text-slate-700 hover:text-primary transition-colors font-medium">Browse Courses</a>
                <a href="#coaches" className="text-slate-700 hover:text-primary transition-colors font-medium">Find Coaches</a>
                <a href="#create" className="text-slate-700 hover:text-primary transition-colors font-medium">Teach</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="btn-primary px-6 py-2 hidden sm:block">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button className="btn-primary px-6 py-2 hidden sm:block">
                    Sign In
                  </Button>
                </SignInButton>
              )}
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md">
              <div className="px-4 py-6 space-y-4">
                <a href="#courses" className="block text-slate-700 hover:text-primary transition-colors font-medium py-2">Browse Courses</a>
                <a href="#coaches" className="block text-slate-700 hover:text-primary transition-colors font-medium py-2">Find Coaches</a>
                <a href="#create" className="block text-slate-700 hover:text-primary transition-colors font-medium py-2">Teach</a>
                <div className="pt-4 border-t border-slate-200">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button className="btn-primary w-full py-3">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <SignInButton mode="modal">
                      <Button className="btn-primary w-full py-3">
                        Sign In
                      </Button>
                    </SignInButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900/80 to-indigo-900/70 text-white py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
            alt="Music production studio setup" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-lg">
              Master Music Production with{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Expert Guidance</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-100 mb-8 leading-relaxed drop-shadow-md max-w-3xl">
              Learn from industry professionals, access premium sample packs, and get personalized coaching to take your beats to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold shadow-xl">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold shadow-xl">
                    Start Learning Today
                  </Button>
                </SignUpButton>
              )}
              <Button 
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-8 py-4 text-lg font-semibold shadow-xl backdrop-blur-sm transition-all duration-300"
              >
                Explore Courses
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl hidden lg:block"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-lg hidden lg:block"></div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-white" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Featured Courses</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hand-picked courses from our top instructors to help you level up your production skills
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="group cursor-pointer transform hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`${course.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                      {course.badge}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.duration}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <img 
                      src={course.instructorImage} 
                      alt={course.instructor} 
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{course.instructor}</p>
                      <p className="text-sm text-slate-500">{course.role}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        {[...Array(course.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">({course.reviews})</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">${course.price}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose PausePlayRepeat?</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Everything you need to become a professional music producer
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary" id="create">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of producers who have transformed their skills with our expert-led courses and personalized coaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Get Started Now
              </Button>
            </SignUpButton>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
            >
              Browse All Courses
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
