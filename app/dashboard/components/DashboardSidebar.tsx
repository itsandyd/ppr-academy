'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

type DashboardMode = 'learn' | 'create';

interface DashboardSidebarProps {
  mode: DashboardMode;
}

const learnLinks = [
  { href: '/dashboard?mode=learn', label: 'Dashboard', icon: Home },
  { href: '/library/courses?mode=learn', label: 'My Courses', icon: BookOpen },
  { href: '/library/downloads?mode=learn', label: 'Downloads', icon: Download },
  { href: '/library/certificates?mode=learn', label: 'Certificates', icon: Award },
  { href: '/library/progress?mode=learn', label: 'Progress', icon: TrendingUp },
];

const createLinks = [
  { href: '/dashboard?mode=create', label: 'Dashboard', icon: Home },
  { href: '/store/products?mode=create', label: 'My Products', icon: Package },
  { href: '/store/courses?mode=create', label: 'My Courses', icon: BookOpen },
  { href: '/store/samples?mode=create', label: 'Samples', icon: Music },
  { href: '/store/customers?mode=create', label: 'Customers', icon: Users },
  { href: '/store/analytics?mode=create', label: 'Analytics', icon: BarChart3 },
];

export function DashboardSidebar({ mode }: DashboardSidebarProps) {
  const pathname = usePathname();
  const links = mode === 'learn' ? learnLinks : createLinks;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">PPR Academy</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {mode === 'learn' ? 'Learning' : 'Creator Studio'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                const isActive = 
                  pathname === link.href.split('?')[0] || 
                  (link.href.includes('/dashboard?mode=') && pathname === '/dashboard');
                
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={link.href}>
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

