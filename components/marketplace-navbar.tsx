"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Music,
  BookOpen,
  Users,
  Video,
  Store,
  Menu,
  Sliders,
  Disc3,
  FileText,
  Headphones,
} from "lucide-react";
import { SignUpButton, useAuth } from "@clerk/nextjs";

export function MarketplaceNavbar() {
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">PausePlayRepeat</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/marketplace/courses"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Courses
            </Link>
            <Link
              href="/marketplace/samples"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Samples
            </Link>
            <Link
              href="/marketplace/ableton-racks"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Presets
            </Link>
            <Link
              href="/marketplace/beats"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Beats
            </Link>
            <Link
              href="/marketplace/coaching"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Coaching
            </Link>
            <Link
              href="/marketplace/creators"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Creators
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {isSignedIn ? (
              <>
                <Link href="/dashboard?mode=learn">
                  <Button variant="ghost" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Learning
                  </Button>
                </Link>
                <Link href="/dashboard?mode=create">
                  <Button size="sm" className="bg-gradient-to-r from-chart-1 to-chart-2">
                    Creator Studio
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-gradient-to-r from-chart-1 to-chart-2">
                    Get Started
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white dark:bg-black">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-chart-1" />
                  Menu
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                <p className="px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Browse
                </p>
                <Link href="/marketplace/courses" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="mr-3 h-4 w-4" />
                    Courses
                  </Button>
                </Link>
                <Link href="/marketplace/samples" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Music className="mr-3 h-4 w-4" />
                    Samples & Packs
                  </Button>
                </Link>
                <Link href="/marketplace/ableton-racks" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Sliders className="mr-3 h-4 w-4" />
                    Presets & Racks
                  </Button>
                </Link>
                <Link href="/marketplace/beats" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Disc3 className="mr-3 h-4 w-4" />
                    Beats
                  </Button>
                </Link>
                <Link href="/marketplace/coaching" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Headphones className="mr-3 h-4 w-4" />
                    Coaching
                  </Button>
                </Link>
                <Link href="/marketplace/guides" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="mr-3 h-4 w-4" />
                    Guides & eBooks
                  </Button>
                </Link>
                <Link href="/marketplace/creators" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-3 h-4 w-4" />
                    Creators
                  </Button>
                </Link>

                <div className="my-4 border-t border-border"></div>

                {/* Auth Actions */}
                {isSignedIn ? (
                  <>
                    <Link href="/dashboard?mode=learn" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <BookOpen className="mr-3 h-4 w-4" />
                        My Learning
                      </Button>
                    </Link>
                    <Link href="/dashboard?mode=create" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-chart-1 to-chart-2">
                        <Store className="mr-2 h-4 w-4" />
                        Creator Studio
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <SignUpButton mode="modal">
                      <Button className="w-full bg-gradient-to-r from-chart-1 to-chart-2">
                        Get Started Free
                      </Button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
