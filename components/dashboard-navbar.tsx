"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { 
  Play, 
  Music, 
  Headphones, 
  Menu, 
  Home, 
  Plus,
  X,
  Zap
} from "lucide-react";

interface DashboardNavbarProps {
  user: {
    name: string;
    instructor: boolean;
    admin: boolean;
  };
}

export default function DashboardNavbar({ user }: DashboardNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`bg-white/95 backdrop-blur-md border-b border-slate-200/50 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrollY > 50 ? 'shadow-lg shadow-slate-200/50' : 'shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple-600 to-secondary rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Play className="text-white text-sm" />
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  PausePlayRepeat
                </span>
                <div className="text-xs text-slate-500 font-medium -mt-1">Academy</div>
              </div>
            </Link>
            <div className="hidden lg:flex space-x-8">
              <Link href="/dashboard" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1 group">
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Dashboard</span>
              </Link>
              <Link href="/courses" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1 group">
                <Music className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Browse Courses</span>
              </Link>
              <Link href="/coaching" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1 group">
                <Headphones className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>Coaching</span>
              </Link>
              {user.instructor && (
                <Link href="/create-course" className="text-slate-700 hover:text-primary transition-all duration-300 font-medium hover:scale-105 flex items-center space-x-1 group">
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Create Course</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              {/* User Status Badge */}
              <div className="inline-flex items-center space-x-2 bg-primary/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-primary/20">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {user.instructor ? "Instructor" : "Student"}
                  {user.admin && " • Admin"}
                </span>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">Welcome back!</p>
                </div>
                <div className="transform hover:scale-105 transition-transform duration-300">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-slate-100 transition-colors duration-300 hover:scale-105 transform"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Enhanced Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md animate-in slide-in-from-top duration-300">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-12 h-12"
                    }
                  }}
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <div className="inline-flex items-center space-x-1 bg-primary/10 rounded-full px-2 py-0.5 mt-1">
                    <Zap className="w-2.5 h-2.5 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {user.instructor ? "Instructor" : "Student"}
                      {user.admin && " • Admin"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-3 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-base">Dashboard</span>
                </Link>
                <Link 
                  href="/courses" 
                  className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-3 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Music className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-base">Browse Courses</span>
                </Link>
                <Link 
                  href="/coaching" 
                  className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-3 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-base">Coaching</span>
                </Link>
                {user.instructor && (
                  <Link 
                    href="/create-course" 
                    className="block text-slate-700 hover:text-primary transition-colors font-medium py-3 px-3 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-base">Create Course</span>
                  </Link>
                )}
              </div>
              
              {/* Mobile Quick Actions */}
              <div className="pt-4 border-t border-slate-200">
                <Link href="/" className="block w-full">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Back to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 