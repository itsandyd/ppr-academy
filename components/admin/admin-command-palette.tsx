"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Search, 
  Users, 
  BookOpen, 
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Mail,
  Shield,
  Activity,
  Sparkles,
  Crown,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminCommandPaletteProps {
  className?: string;
}

export function AdminCommandPalette({ className }: AdminCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  const adminActions = [
    // Navigation
    {
      group: "Navigation",
      items: [
        { icon: BarChart3, label: "Dashboard", action: () => router.push("/admin") },
        { icon: Users, label: "Manage Users", action: () => router.push("/admin/users") },
        { icon: BookOpen, label: "Manage Courses", action: () => router.push("/admin/courses") },
        { icon: Package, label: "Manage Products", action: () => router.push("/admin/products") },
        { icon: DollarSign, label: "Revenue Dashboard", action: () => router.push("/admin/revenue") },
        { icon: BarChart3, label: "Analytics", action: () => router.push("/admin/analytics") },
        { icon: Shield, label: "Content Moderation", action: () => router.push("/admin/moderation") },
        { icon: Mail, label: "Email Marketing", action: () => router.push("/admin/emails") },
      ]
    },
    // Quick Actions
    {
      group: "Quick Actions",
      items: [
        { icon: Users, label: "Find User by Email...", action: () => console.log("Search users") },
        { icon: BookOpen, label: "Find Course by Title...", action: () => console.log("Search courses") },
        { icon: Package, label: "Find Product by Name...", action: () => console.log("Search products") },
        { icon: Crown, label: "Promote User to Creator", action: () => console.log("Promote user") },
        { icon: Zap, label: "Send Platform Announcement", action: () => router.push("/admin/emails?action=broadcast") },
      ]
    },
    // System
    {
      group: "System",
      items: [
        { icon: Settings, label: "Platform Settings", action: () => router.push("/admin/settings") },
        { icon: Activity, label: "Activity Logs", action: () => router.push("/admin/activity") },
        { icon: Sparkles, label: "AI Tools", action: () => router.push("/admin/ai") },
      ]
    }
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors border border-input"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Quick search...</span>
        <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘K</span>
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {adminActions.map((group, groupIndex) => (
            <div key={group.group}>
              <CommandGroup heading={group.group}>
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={`${groupIndex}-${itemIndex}`}
                      onSelect={() => handleSelect(item.action)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {groupIndex < adminActions.length - 1 && <CommandSeparator />}
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

