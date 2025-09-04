"use client";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { 
  BookOpen, 
  Download, 
  Video, 
  Package, 
  TrendingUp, 
  Clock,
  Home,
  User
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

export function LibrarySidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const menuItems = [
    {
      title: "Overview",
      url: "/library",
      icon: Home,
    },
    {
      title: "Courses",
      url: "/library/courses",
      icon: BookOpen,
    },
    {
      title: "Downloads",
      url: "/library/downloads", 
      icon: Download,
    },
    {
      title: "Coaching",
      url: "/library/coaching",
      icon: Video,
    },
    {
      title: "Bundles",
      url: "/library/bundles",
      icon: Package,
    },
    {
      title: "Progress",
      url: "/library/progress",
      icon: TrendingUp,
    },
    {
      title: "Recent",
      url: "/library/recent",
      icon: Clock,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Library</h2>
            <p className="text-sm text-muted-foreground">Your content hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={pathname === item.url}
                    className="w-full"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.fullName || user.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground">Library Access</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}