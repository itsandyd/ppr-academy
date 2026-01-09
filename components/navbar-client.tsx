"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  BookOpen,
  Home,
  LayoutDashboard,
  Shield,
  GraduationCap,
  UserCheck,
  PlusCircle,
  ChevronDown,
  Search,
  Users,
  Briefcase,
  Heart,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ModeToggle } from "@/components/mode-toggle";
import { DashboardPreferenceSwitcher } from "@/components/dashboard/dashboard-preference-switcher";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavbarClientProps {
  isAdmin: boolean;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface DropdownSection {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavLink[];
}

// ============================================================================
// Constants & Configuration
// ============================================================================

const BASE_NAV_LINKS: NavLink[] = [{ href: "/", label: "Home", icon: Home }];

const BROWSE_SECTION: DropdownSection = {
  label: "Browse",
  icon: Search,
  items: [
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: Briefcase,
      description: "Browse all content",
    },
    {
      href: "/marketplace/creators",
      label: "Creators",
      icon: Users,
      description: "Discover talented creators",
    },
    { href: "/courses", label: "Courses", icon: BookOpen, description: "Explore all courses" },
    {
      href: "/coaching",
      label: "Find Coaches",
      icon: Users,
      description: "Book 1-on-1 coaching sessions",
    },
  ],
};

const CREATE_SECTION: DropdownSection = {
  label: "Create",
  icon: PlusCircle,
  items: [
    {
      href: "/create-course",
      label: "Create Course",
      icon: BookOpen,
      description: "Build your own course",
    },
    {
      href: "/become-a-coach",
      label: "Become a Coach",
      icon: UserCheck,
      description: "Apply to teach others",
    },
  ],
};

const AUTHENTICATED_LINKS: NavLink[] = [
  { href: "/dashboard?mode=learn", label: "My Learning", icon: BookOpen },
  { href: "/dashboard?mode=create", label: "Creator Studio", icon: LayoutDashboard },
];

const ADMIN_LINKS: NavLink[] = [{ href: "/admin", label: "Admin", icon: Shield }];

const STYLES = {
  nav: "fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm",
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  header: "flex justify-between items-center h-16",
  logo: "flex items-center space-x-3",
  logoIcon: "bg-gradient-to-br from-primary to-primary/60 rounded-lg p-2",
  logoText: "text-xl font-bold text-foreground hidden sm:block",
  desktopNav: "hidden md:flex items-center space-x-1",
  desktopAuth: "hidden md:flex items-center space-x-4",
  mobileButton: "md:hidden flex items-center",
  mobileMenu: "md:hidden bg-background border-b border-border",
  mobileContent: "px-4 pt-2 pb-3 space-y-1",
  mobileAuth: "pt-4 pb-2 border-t border-border",
  linkBase: "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
  linkActive: "bg-accent text-accent-foreground",
  linkInactive: "text-muted-foreground hover:text-foreground hover:bg-muted",
  mobileLinkBase: "block px-3 py-2 rounded-lg text-base font-medium flex items-center gap-3",
  menuToggle: "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
  dropdownTrigger:
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted",
  dropdownContent: "w-64",
  dropdownItem: "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted",
  dropdownIcon: "w-4 h-4 mt-0.5 text-muted-foreground",
  dropdownText: "flex-1",
  dropdownLabel: "font-medium text-foreground",
  dropdownDesc: "text-xs text-muted-foreground mt-0.5",
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

const isActiveLink = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === href;
  return pathname.startsWith(href);
};

const isActiveSectionItem = (pathname: string, section: DropdownSection): boolean => {
  return section.items.some((item) => isActiveLink(pathname, item.href));
};

const buildNavStructure = (isSignedIn: boolean, isAdmin: boolean) => {
  const sections: DropdownSection[] = [];
  const links: NavLink[] = [...BASE_NAV_LINKS];

  // Always show Browse section
  sections.push(BROWSE_SECTION);

  // Show Create section if signed in
  if (isSignedIn) {
    sections.push(CREATE_SECTION);
    links.push(...AUTHENTICATED_LINKS);
  }

  // Add admin links if admin
  if (isAdmin) {
    links.push(...ADMIN_LINKS);
  }

  return { sections, links };
};

// ============================================================================
// Sub Components
// ============================================================================

const Logo = () => (
  <Link href="/" className={STYLES.logo}>
    <div className={STYLES.logoIcon}>
      <GraduationCap className="h-6 w-6 text-primary-foreground" />
    </div>
    <span className={STYLES.logoText}>PPR Academy</span>
  </Link>
);

const DropdownSection = ({
  section,
  isActive,
}: {
  section: DropdownSection;
  isActive: boolean;
}) => {
  const Icon = section.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`${STYLES.dropdownTrigger} ${
            isActive ? STYLES.linkActive : STYLES.linkInactive
          }`}
        >
          <Icon className="h-4 w-4" />
          {section.label}
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={STYLES.dropdownContent} align="start">
        {section.items.map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className={STYLES.dropdownItem}>
                <ItemIcon className={STYLES.dropdownIcon} />
                <div className={STYLES.dropdownText}>
                  <div className={STYLES.dropdownLabel}>{item.label}</div>
                  {item.description && (
                    <div className={STYLES.dropdownDesc}>{item.description}</div>
                  )}
                </div>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NavLinkItem = ({
  link,
  isActive,
  isMobile = false,
}: {
  link: NavLink;
  isActive: boolean;
  isMobile?: boolean;
}) => {
  const Icon = link.icon;
  const baseStyle = isMobile ? STYLES.mobileLinkBase : STYLES.linkBase;
  const activeStyle = isActive ? STYLES.linkActive : STYLES.linkInactive;

  return (
    <Link href={link.href} className={`${baseStyle} ${activeStyle}`}>
      <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      {link.label}
    </Link>
  );
};

const DesktopNavigation = ({
  sections,
  navLinks,
  pathname,
}: {
  sections: DropdownSection[];
  navLinks: NavLink[];
  pathname: string;
}) => (
  <div className={STYLES.desktopNav}>
    {/* Dropdown Sections */}
    {sections.map((section) => (
      <DropdownSection
        key={section.label}
        section={section}
        isActive={isActiveSectionItem(pathname, section)}
      />
    ))}

    {/* Regular Links */}
    {navLinks
      .filter((link) => link.href !== "/")
      .map((link) => (
        <NavLinkItem key={link.href} link={link} isActive={isActiveLink(pathname, link.href)} />
      ))}
  </div>
);

const AuthButtons = ({
  isSignedIn,
  hasClerk,
  wishlistCount,
}: {
  isSignedIn: boolean;
  hasClerk: boolean;
  wishlistCount: number;
}) => (
  <div className={STYLES.desktopAuth}>
    <ModeToggle />
    {!hasClerk ? (
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
        <Button size="sm">Get Started</Button>
      </div>
    ) : isSignedIn ? (
      <>
        <Link
          href="/dashboard?tab=favorites"
          className="relative rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <Heart className="h-5 w-5 text-muted-foreground transition-colors hover:text-pink-500" />
          {wishlistCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-medium text-white">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>
        <DashboardPreferenceSwitcher />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </>
    ) : (
      <>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">Get Started</Button>
        </SignUpButton>
      </>
    )}
  </div>
);

const MobileMenuToggle = ({
  isMenuOpen,
  setIsMenuOpen,
}: {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}) => (
  <div className={STYLES.mobileButton}>
    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={STYLES.menuToggle}>
      {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  </div>
);

const MobileNavigation = ({
  sections,
  navLinks,
  pathname,
  onLinkClick,
}: {
  sections: DropdownSection[];
  navLinks: NavLink[];
  pathname: string;
  onLinkClick: () => void;
}) => (
  <div className={STYLES.mobileContent}>
    {/* Mobile Dropdown Sections */}
    {sections.map((section) => (
      <div key={section.label} className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {section.label}
        </div>
        {section.items.map((item) => (
          <div key={item.href} onClick={onLinkClick}>
            <NavLinkItem link={item} isActive={isActiveLink(pathname, item.href)} isMobile />
          </div>
        ))}
      </div>
    ))}

    {/* Regular Mobile Links */}
    {navLinks
      .filter((link) => link.href !== "/")
      .map((link) => (
        <div key={link.href} onClick={onLinkClick}>
          <NavLinkItem link={link} isActive={isActiveLink(pathname, link.href)} isMobile />
        </div>
      ))}
  </div>
);

const MobileAuthSection = ({
  isSignedIn,
  user,
  hasClerk,
}: {
  isSignedIn: boolean;
  user: any;
  hasClerk: boolean;
}) => (
  <div className={STYLES.mobileAuth}>
    <div className="flex justify-center gap-3 px-3 pb-3">
      <ModeToggle />
      {/* Dashboard Switcher for hybrid users (mobile) */}
      {isSignedIn && <DashboardPreferenceSwitcher />}
    </div>
    {!hasClerk ? (
      <div className="space-y-2 px-3">
        <Button variant="outline" className="w-full">
          Sign In
        </Button>
        <Button className="w-full">Get Started</Button>
      </div>
    ) : isSignedIn ? (
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
        </div>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    ) : (
      <div className="space-y-2 px-3">
        <SignInButton mode="modal">
          <Button variant="outline" className="w-full">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button className="w-full">Get Started</Button>
        </SignUpButton>
      </div>
    )}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export default function NavbarClient({ isAdmin }: NavbarClientProps) {
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hooks
  const pathname = usePathname();

  // Safe Clerk hook usage
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkData = useUser();
  const user = hasClerk ? clerkData.user : null;
  const isSignedIn = hasClerk ? (clerkData.isSignedIn || false) : false;

  const userIsSignedIn = isSignedIn ?? false;

  const wishlistCount = useQuery(api.wishlists.getWishlistCount, userIsSignedIn ? {} : "skip") ?? 0;
  const { sections, links: navLinks } = buildNavStructure(userIsSignedIn, isAdmin);
  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <nav className={STYLES.nav}>
      <div className={STYLES.container}>
        <div className={STYLES.header}>
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <DesktopNavigation sections={sections} navLinks={navLinks} pathname={pathname} />

          {/* Desktop Auth */}
          <AuthButtons
            isSignedIn={userIsSignedIn}
            hasClerk={hasClerk}
            wishlistCount={wishlistCount}
          />

          {/* Mobile Menu Toggle */}
          <MobileMenuToggle isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={STYLES.mobileMenu}>
          <MobileNavigation
            sections={sections}
            navLinks={navLinks}
            pathname={pathname}
            onLinkClick={closeMobileMenu}
          />
          <MobileAuthSection isSignedIn={userIsSignedIn} user={user} hasClerk={hasClerk} />
        </div>
      )}
    </nav>
  );
}
