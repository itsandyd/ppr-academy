"use client";

import { FC, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Store, ChevronDown, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

/**
 * Dashboard Preference Switcher
 * 
 * Shows for hybrid users (both student and creator) and allows them to:
 * 1. See their current mode
 * 2. Quickly switch between student and creator dashboards
 * 3. Set their default preference
 */
export const DashboardPreferenceSwitcher: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [preference, setPreference] = useState<'student' | 'creator' | null>(null);

  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Check if user has a store
  const userStore = useQuery(
    api.stores.getUserStore,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Check if user has enrolled courses
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const hasStore = !!userStore;
  const hasEnrollments = enrolledCourses && enrolledCourses.length > 0;
  const isHybrid = hasStore && hasEnrollments;
  
  // Show "Become a Creator" button if user doesn't have a store
  // (regardless of enrollment status)
  const shouldShowBecomeCreatorButton = convexUser && !hasStore;

  // Debug logging
  console.log('Dashboard Switcher Debug:', {
    hasStore,
    hasEnrollments,
    isHybrid,
    shouldShowBecomeCreatorButton,
    enrolledCourses: enrolledCourses?.length,
    userStore: !!userStore,
    convexUser: !!convexUser
  });

  // Load saved preference on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('dashboard-preference');
    if (savedPreference === 'student' || savedPreference === 'creator') {
      setPreference(savedPreference);
    }
  }, []);

  // Determine current mode based on pathname
  const currentMode = pathname?.startsWith('/home') || pathname?.startsWith('/store')
    ? 'creator'
    : pathname?.startsWith('/library')
    ? 'student'
    : null;

  // Show "Become a Creator" button for users without a store
  if (shouldShowBecomeCreatorButton) {
    return (
      <Button 
        variant="default" 
        size="sm"
        className="gap-2"
        onClick={() => router.push('/home')}
      >
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline">Become a Creator</span>
        <span className="sm:hidden">Create</span>
      </Button>
    );
  }

  // Show dropdown only for hybrid users (has both store and enrollments)
  if (!isHybrid) return null;

  const handleSwitch = (mode: 'student' | 'creator', savePreference: boolean = false) => {
    if (savePreference) {
      localStorage.setItem('dashboard-preference', mode);
      setPreference(mode);
    }

    // Navigate to appropriate dashboard
    if (mode === 'student') {
      router.push('/library');
    } else {
      router.push('/home');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white dark:bg-black">
          {currentMode === 'creator' ? (
            <>
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Creator Mode</span>
              <span className="sm:hidden">Creator</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Student Mode</span>
              <span className="sm:hidden">Student</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-black">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <span>Switch Dashboard</span>
            <Badge variant="secondary" className="text-xs">Hybrid</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Student Mode */}
        <DropdownMenuItem
          onClick={() => handleSwitch('student', false)}
          className="cursor-pointer"
        >
          <BookOpen className="w-4 h-4 mr-3" />
          <div className="flex-1">
            <div className="font-medium">Student Library</div>
            <div className="text-xs text-muted-foreground">
              View enrolled courses & progress
            </div>
          </div>
          {currentMode === 'student' && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </DropdownMenuItem>

        {/* Creator Mode */}
        <DropdownMenuItem
          onClick={() => handleSwitch('creator', false)}
          className="cursor-pointer"
        >
          <Store className="w-4 h-4 mr-3" />
          <div className="flex-1">
            <div className="font-medium">Creator Dashboard</div>
            <div className="text-xs text-muted-foreground">
              Manage store & view analytics
            </div>
          </div>
          {currentMode === 'creator' && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Set Default Preference */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Set as default:
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleSwitch('student', true)}
          className="cursor-pointer text-xs"
        >
          <BookOpen className="w-3 h-3 mr-2" />
          Always Student
          {preference === 'student' && (
            <Check className="w-3 h-3 ml-auto text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSwitch('creator', true)}
          className="cursor-pointer text-xs"
        >
          <Store className="w-3 h-3 mr-2" />
          Always Creator
          {preference === 'creator' && (
            <Check className="w-3 h-3 ml-auto text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

