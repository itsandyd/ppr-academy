"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { SignUpButton } from "@clerk/nextjs";

interface StickyNavProps {}

export const StickyNav: FC<StickyNavProps> = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#6356FF]">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="flex h-16 items-center justify-between text-white">
          {/* Logo */}
          <div className="flex items-center space-x-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#6356FF] to-[#5273FF]">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Music Academy</span>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8 text-white">
            <a href="#creators" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Creators
            </a>
            <a href="#courses" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Courses
            </a>
            <a href="#coaching" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Coaching
            </a>
            <a href="#success" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Success Stories
            </a>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full p-0 text-white hover:bg-white/10"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* CTA Button */}
            <SignUpButton mode="modal">
              <Button variant="default" size="lg" className="rounded-xl bg-white text-[#6356FF] hover:bg-white/90 font-semibold">
                Join the Platform
              </Button>
            </SignUpButton>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full p-0 text-white hover:bg-white/10"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9 rounded-full p-0 text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-[#6356FF]">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#creators" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                Creators
              </a>
              <a href="#courses" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                Courses
              </a>
              <a href="#coaching" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                Coaching
              </a>
              <a href="#success" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                Success Stories
              </a>
              <div className="px-3 py-2">
                <SignUpButton mode="modal">
                  <Button variant="default" size="sm" className="w-full rounded-xl bg-white text-[#6356FF] hover:bg-white/90 font-semibold">
                    Join the Platform
                  </Button>
                </SignUpButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}; 