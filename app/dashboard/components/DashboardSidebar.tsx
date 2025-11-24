'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  Download,
  Award,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Settings,
  Music,
  Plus,
  Sparkles,
  Target,
  Zap,
  Instagram,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ModeToggle } from './ModeToggle';
import { ModeToggle as ThemeToggle } from '@/components/mode-toggle';

type DashboardMode = 'learn' | 'create';

interface DashboardSidebarProps {
  mode: DashboardMode;
  onModeChange?: (mode: DashboardMode) => void;
}

const learnLinks = [
  { href: '/dashboard?mode=learn', label: 'Dashboard', icon: Home, color: 'text-purple-500' },
  { href: '/dashboard/courses?mode=learn', label: 'My Courses', icon: BookOpen, color: 'text-blue-500' },
  { href: '/dashboard/products?mode=learn', label: 'My Products', icon: Package, color: 'text-green-500' },
  { href: '/dashboard/downloads?mode=learn', label: 'Downloads', icon: Download, color: 'text-orange-500' },
  { href: '/dashboard/certificates?mode=learn', label: 'Certificates', icon: Award, color: 'text-yellow-500' },
];

const createLinks = [
  { href: '/dashboard?mode=create', label: 'Dashboard', icon: Home, color: 'text-purple-500' },
  { href: '/dashboard/products?mode=create', label: 'My Products', icon: Package, color: 'text-blue-500' },
  { href: '/dashboard/courses?mode=create', label: 'My Courses', icon: BookOpen, color: 'text-green-500' },
  { href: '/dashboard/social?mode=create', label: 'Social Media', icon: Instagram, color: 'text-pink-500' },
  { href: '/dashboard/create', label: 'Create New', icon: Plus, color: 'text-indigo-500', highlight: true },
  { href: '/dashboard/analytics?mode=create', label: 'Analytics', icon: BarChart3, color: 'text-orange-500' },
];

export function DashboardSidebar({ mode, onModeChange }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const links = mode === 'learn' ? learnLinks : createLinks;
  const savePreference = useMutation(api.users.setDashboardPreference);

  const handleModeChange = async (newMode: DashboardMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      // Fallback: navigate directly
      router.push(`/dashboard?mode=${newMode}`);
    }
    
    // Save preference in background
    if (user?.id) {
      try {
        await savePreference({
          clerkId: user.id,
          preference: newMode,
        });
      } catch (error) {
        console.error('Failed to save preference:', error);
      }
    }
  };

  // Get user stats for sidebar widgets
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    mode === 'learn' && convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  return (
    <Sidebar className="border-r border-border">
      {/* Header */}
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg">PPR Academy</span>
            <p className="text-xs text-muted-foreground">
              {mode === 'learn' ? 'Learning Hub' : 'Creator Studio'}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-3">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {links.map((link) => {
                const isActive = 
                  pathname === link.href.split('?')[0] || 
                  (link.href.includes('/dashboard?mode=') && pathname === '/dashboard');
                
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link 
                        href={link.href}
                        className={cn(
                          'group relative',
                          link.highlight && !isActive && 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20'
                        )}
                      >
                        <link.icon className={cn('w-5 h-5', isActive ? '' : link.color)} />
                        <span className="font-medium">{link.label}</span>
                        {link.highlight && !isActive && (
                          <Sparkles className="w-3 h-3 ml-auto text-purple-500" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Learn mode: Progress widget */}
        {mode === 'learn' && userStats && (
          <SidebarGroup className="mt-6">
            <Card className="bg-gradient-to-br from-chart-1/10 to-chart-4/10 border-chart-1/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-chart-1" />
                    <span className="text-sm font-semibold">Your Progress</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Courses Completed</span>
                      <span className="font-medium">
                        {userStats.coursesCompleted}/{userStats.coursesEnrolled}
                      </span>
                    </div>
                    <Progress 
                      value={userStats.coursesEnrolled > 0 ? (userStats.coursesCompleted / userStats.coursesEnrolled) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="text-center flex-1">
                      <p className="text-xl font-bold text-chart-1">{userStats.totalHoursLearned}</p>
                      <p className="text-xs text-muted-foreground">Hours</p>
                    </div>
                    <div className="text-center flex-1 border-l border-border/50">
                      <p className="text-xl font-bold text-chart-4">{userStats.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroup>
        )}

        {/* Create mode: Quick create widget */}
        {mode === 'create' && (
          <SidebarGroup className="mt-6">
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold">Quick Create</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      asChild 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-xs h-8"
                    >
                      <Link href="/dashboard/create/pack?type=sample-pack">
                        <Music className="w-3 h-3 mr-2" />
                        Sample Pack
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-xs h-8"
                    >
                      <Link href="/dashboard/create/course?category=course">
                        <BookOpen className="w-3 h-3 mr-2" />
                        Course
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-xs h-8"
                    >
                      <Link href="/dashboard/create">
                        <Package className="w-3 h-3 mr-2" />
                        More Options
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SidebarGroup>
        )}

        {/* Tips section */}
        <SidebarGroup className="mt-auto mb-4">
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-semibold">Pro Tip</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mode === 'learn' 
                    ? 'Complete courses to earn XP and unlock achievements!'
                    : 'Free products with download gates help build your email list.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-3 space-y-3">
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>
        
        {/* User Menu & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-white dark:bg-zinc-900",
                  userButtonPopoverActionButton: "hover:bg-muted",
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === 'learn' ? 'Learning' : 'Creating'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

