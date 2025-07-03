"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/footer";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Play, Star, Clock, Users, GraduationCap, Mic, Bot, Download, Smartphone, IdCard, Menu, X, ArrowRight, CheckCircle, TrendingUp, Award, Music, Headphones, Zap } from "lucide-react";

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const featuredCourses = [
    {
      id: 1,
      title: "Complete Hip-Hop Production Masterclass",
      instructor: "Mike Chen",
      role: "Grammy-nominated Producer",
      duration: "8h 32m",
      rating: 5,
      reviews: 247,
      price: 89,
      originalPrice: 129,
      thumbnail: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      badge: "Bestseller",
      badgeColor: "bg-gradient-to-r from-orange-500 to-red-500",
      level: "Beginner to Advanced",
      students: 3247
    },
    {
      id: 2,
      title: "Advanced Synthesis & Sound Design",
      instructor: "Sarah Martinez",
      role: "Electronic Music Pioneer",
      duration: "12h 15m",
      rating: 5,
      reviews: 189,
      price: 129,
      originalPrice: 179,
      thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      instructorImage: "https://images.unsplash.com/photo-1494790108755-2616b332c85c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      badge: "New",
      badgeColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      level: "Intermediate",
      students: 1892
    },
    {
      id: 3,
      title: "Professional Mixing & Mastering",
      instructor: "David Rodriguez",
      role: "Award-winning Engineer",
      duration: "6h 45m",
      rating: 5,
      reviews: 356,
      price: 99,
      originalPrice: 149,
      thumbnail: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      instructorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      badge: "Popular",
      badgeColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
      level: "Advanced",
      students: 4156
    }
  ];

  const features = [
    {
      icon: <GraduationCap className="text-white text-2xl" />,
      title: "Expert Instructors",
      description: "Learn from Grammy-winning producers and industry professionals who've worked with top artists worldwide.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Bot className="text-white text-2xl" />,
      title: "AI Study Assistant",
      description: "Get personalized help with our advanced AI chatbot that knows all course content and provides instant answers.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Users className="text-white text-2xl" />,
      title: "1-on-1 Coaching",
      description: "Book personalized coaching sessions with experienced producers for direct feedback on your tracks.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Download className="text-white text-2xl" />,
      title: "Premium Sample Packs",
      description: "Access exclusive sample libraries, project files, and stems from every course to practice with professionally.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Smartphone className="text-white text-2xl" />,
      title: "Learn Anywhere",
      description: "Access your courses on any device with offline downloads and our mobile-optimized video player.",
      color: "from-teal-500 to-blue-500"
    },
    {
      icon: <Award className="text-white text-2xl" />,
      title: "Verified Certificates",
      description: "Earn industry-recognized certificates upon course completion to showcase your skills to potential collaborators.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { label: "Active Students", value: "15,000+", icon: <Users className="text-primary" /> },
    { label: "Expert Instructors", value: "50+", icon: <GraduationCap className="text-primary" /> },
    { label: "Course Hours", value: "500+", icon: <Clock className="text-primary" /> },
    { label: "Success Rate", value: "94%", icon: <TrendingUp className="text-primary" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className={`bg-white/95 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'shadow-lg shadow-slate-200/50' : 'shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple-600 to-secondary rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <Play className="text-white text-sm" />
                </div>
                <div>
                  <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    PausePlayRepeat
                  </span>
                  <div className="text-xs text-slate-500 font-medium -mt-1">Academy</div>
                </div>
              </div>
              <div className="hidden lg:flex space-x-8">
                <a href="#courses" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1">
                  <Music className="w-4 h-4" />
                  <span>Browse Courses</span>
                </a>
                <a href="#coaches" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1">
                  <Headphones className="w-4 h-4" />
                  <span>Find Coaches</span>
                </a>
                <a href="#create" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Teach</span>
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-6 py-2 hidden sm:block shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-6 py-2 hidden sm:block shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Sign In
                  </Button>
                </SignInButton>
              )}
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-slate-100 transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md animate-in slide-in-from-top duration-300">
              <div className="px-4 py-6 space-y-4">
                <a href="#courses" className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2">
                  <Music className="w-4 h-4" />
                  <span>Browse Courses</span>
                </a>
                <a href="#coaches" className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2">
                  <Headphones className="w-4 h-4" />
                  <span>Find Coaches</span>
                </a>
                <a href="#create" className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Teach</span>
                </a>
                <div className="pt-4 border-t border-slate-200">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full py-3 shadow-lg">
                        Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <SignInButton mode="modal">
                      <Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full py-3 shadow-lg">
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
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900/90 to-indigo-900/80 text-white py-20 md:py-28 lg:py-36 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-slate-900/50"></div>
          <img 
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
            alt="Music production studio setup" 
            className="w-full h-full object-cover opacity-20"
          />
          {/* Animated particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl">
            <div className="animate-in fade-in slide-in-from-bottom duration-1000">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium text-white/90">🎵 Transform Your Musical Journey</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                Master Music Production with{" "}
                <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent animate-pulse">
                  Expert Guidance
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-100/90 mb-10 leading-relaxed max-w-4xl">
                Learn from <span className="text-yellow-300 font-semibold">Grammy-winning producers</span>, access 
                <span className="text-orange-300 font-semibold"> premium sample packs</span>, and get 
                <span className="text-purple-300 font-semibold"> personalized coaching</span> to take your beats to the next level.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-indigo-600/90 text-white px-10 py-5 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <Button size="lg" className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-indigo-600/90 text-white px-10 py-5 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20">
                      Start Learning Today
                      <Play className="w-5 h-5 ml-2" />
                    </Button>
                  </SignUpButton>
                )}
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-white/30 text-white bg-white/5 hover:bg-white hover:text-slate-900 px-10 py-5 text-xl font-bold shadow-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                >
                  Explore Courses
                  <Music className="w-5 h-5 ml-2" />
                </Button>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">{stat.icon}</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced floating elements */}
        <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-2xl animate-pulse hidden lg:block"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full blur-xl animate-bounce hidden lg:block"></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-lg animate-pulse hidden lg:block"></div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-gradient-to-br from-white via-slate-50 to-purple-50/30" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Featured Content</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
              Premium Courses
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Hand-picked courses from our top instructors to help you level up your production skills and achieve professional results
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <Card key={course.id} className="group cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white border-0 shadow-lg hover:shadow-purple-500/25 animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="relative overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="absolute top-4 left-4">
                    <span className={`${course.badgeColor} text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg`}>
                      {course.badge}
                    </span>
                  </div>
                  
                  <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.duration}
                    </div>
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {course.students.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-full text-sm font-medium">
                      {course.level}
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={course.instructorImage} 
                      alt={course.instructor} 
                      className="w-12 h-12 rounded-full object-cover mr-3 ring-2 ring-primary/20"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{course.instructor}</p>
                      <p className="text-sm text-primary font-medium">{course.role}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex items-center mr-3">
                      {[...Array(course.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500 mr-2">({course.reviews} reviews)</span>
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-3xl font-bold text-slate-900">${course.price}</div>
                      <div className="text-lg text-slate-400 line-through">${course.originalPrice}</div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                      Save ${course.originalPrice - course.price}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/courses">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 py-4 text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-300">
                View All Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900/95 to-indigo-900/90 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/20">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white/90">Why Choose Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools and resources designed to accelerate your journey from beginner to professional music producer
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary via-purple-600 to-indigo-600 relative overflow-hidden" id="create">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-lg animate-ping"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
            <Play className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white/90">Start Your Journey</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Create Your{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Masterpiece?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join <span className="font-bold text-yellow-300">15,000+</span> producers who have transformed their skills with our 
            expert-led courses and personalized coaching. Your musical journey starts here.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100 px-10 py-5 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SignUpButton>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white/30 text-white bg-white/5 hover:bg-white hover:text-slate-900 px-10 py-5 text-xl font-bold backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
            >
              Browse All Courses
              <Music className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-white/80">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>Lifetime access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>Certificate included</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
