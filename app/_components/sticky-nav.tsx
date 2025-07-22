"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Music, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface StickyNavProps {}

export const StickyNav: FC<StickyNavProps> = () => {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#6356FF]">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="flex h-16 items-center justify-between text-white">
          {/* Logo */}
          <div className="flex items-center space-x-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#6356FF] to-[#5273FF]">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Music Academy</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 text-white">
            <a href="#creators" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Creators
            </a>
            <a href="#courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </a>
            <a href="#coaching" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Coaching
            </a>
            <a href="#success" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Success Stories
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* CTA Button */}
            <Button variant="default" size="lg" className="rounded-xl bg-gradient-to-b from-[#6356FF] to-[#5273FF] hover:from-[#5a4beb] hover:to-[#4a68eb]">
              Join the Platform
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}; 