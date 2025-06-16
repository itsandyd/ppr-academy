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
  Briefcase
} from "lucide-react";

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

const BASE_NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: Home },
];

const BROWSE_SECTION: DropdownSection = {
  label: "Browse",
  icon: Search,
  items: [
    { href: "/courses", label: "Courses", icon: BookOpen, description: "Explore all courses" },
    { href: "/coaching", label: "Find Coaches", icon: Users, description: "Book 1-on-1 coaching sessions" },
  ],
};

const CREATE_SECTION: DropdownSection = {
  label: "Create",
  icon: PlusCircle,
  items: [
    { href: "/create-course", label: "Create Course", icon: BookOpen, description: "Build your own course" },
    { href: "/become-a-coach", label: "Become a Coach", icon: UserCheck, description: "Apply to teach others" },
  ],
};

const AUTHENTICATED_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "Admin", icon: Shield },
];

const STYLES = {
  nav: "fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm",
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  header: "flex justify-between items-center h-16",
  logo: "flex items-center space-x-3",
  logoIcon: "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-2",
  logoText: "text-xl font-bold text-dark hidden sm:block",
  desktopNav: "hidden md:flex items-center space-x-1",
  desktopAuth: "hidden md:flex items-center space-x-4",
  mobileButton: "md:hidden flex items-center",
  mobileMenu: "md:hidden bg-white border-b border-slate-200",
  mobileContent: "px-4 pt-2 pb-3 space-y-1",
  mobileAuth: "pt-4 pb-2 border-t border-slate-200",
  linkBase: "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
  linkActive: "bg-slate-100 text-primary",
  linkInactive: "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
  mobileLinkBase: "block px-3 py-2 rounded-lg text-base font-medium flex items-center gap-3",
  menuToggle: "p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  dropdownTrigger: "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50",
  dropdownContent: "w-64",
  dropdownItem: "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-slate-50",
  dropdownIcon: "w-4 h-4 mt-0.5 text-slate-500",
  dropdownText: "flex-1",
  dropdownLabel: "font-medium text-slate-900",
  dropdownDesc: "text-xs text-slate-500 mt-0.5",
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

const isActiveLink = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === href;
  return pathname.startsWith(href);
};

const isActiveSectionItem = (pathname: string, section: DropdownSection): boolean => {
  return section.items.some(item => isActiveLink(pathname, item.href));
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
      <GraduationCap className="w-6 h-6 text-white" />
    </div>
    <span className={STYLES.logoText}>
      PPR Academy
    </span>
  </Link>
);

const DropdownSection = ({ 
  section, 
  isActive 
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
          <Icon className="w-4 h-4" />
          {section.label}
          <ChevronDown className="w-4 h-4" />
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
  isMobile = false 
}: { 
  link: NavLink; 
  isActive: boolean; 
  isMobile?: boolean;
}) => {
  const Icon = link.icon;
  const baseStyle = isMobile ? STYLES.mobileLinkBase : STYLES.linkBase;
  const activeStyle = isActive ? STYLES.linkActive : STYLES.linkInactive;
  
  return (
    <Link
      href={link.href}
      className={`${baseStyle} ${activeStyle}`}
    >
      <Icon className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
      {link.label}
    </Link>
  );
};

const DesktopNavigation = ({ 
  sections,
  navLinks, 
  pathname 
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
    {navLinks.filter(link => link.href !== "/").map((link) => (
      <NavLinkItem
        key={link.href}
        link={link}
        isActive={isActiveLink(pathname, link.href)}
      />
    ))}
  </div>
);

const AuthButtons = ({ isSignedIn, hasClerk }: { isSignedIn: boolean; hasClerk: boolean }) => (
  <div className={STYLES.desktopAuth}>
    {!hasClerk ? (
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
        <Button size="sm">
          Get Started
        </Button>
      </div>
    ) : isSignedIn ? (
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-10 h-10"
          }
        }}
      />
    ) : (
      <>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">
            Get Started
          </Button>
        </SignUpButton>
      </>
    )}
  </div>
);

const MobileMenuToggle = ({ 
  isMenuOpen, 
  setIsMenuOpen 
}: { 
  isMenuOpen: boolean; 
  setIsMenuOpen: (open: boolean) => void;
}) => (
  <div className={STYLES.mobileButton}>
    <button
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className={STYLES.menuToggle}
    >
      {isMenuOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Menu className="w-6 h-6" />
      )}
    </button>
  </div>
);

const MobileNavigation = ({ 
  sections,
  navLinks, 
  pathname, 
  onLinkClick 
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
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {section.label}
        </div>
        {section.items.map((item) => (
          <div key={item.href} onClick={onLinkClick}>
            <NavLinkItem
              link={item}
              isActive={isActiveLink(pathname, item.href)}
              isMobile
            />
          </div>
        ))}
      </div>
    ))}
    
    {/* Regular Mobile Links */}
    {navLinks.filter(link => link.href !== "/").map((link) => (
      <div key={link.href} onClick={onLinkClick}>
        <NavLinkItem
          link={link}
          isActive={isActiveLink(pathname, link.href)}
          isMobile
        />
      </div>
    ))}
  </div>
);

const MobileAuthSection = ({ 
  isSignedIn, 
  user,
  hasClerk
}: { 
  isSignedIn: boolean; 
  user: any;
  hasClerk: boolean;
}) => (
  <div className={STYLES.mobileAuth}>
    {!hasClerk ? (
      <div className="space-y-2 px-3">
        <Button variant="outline" className="w-full">
          Sign In
        </Button>
        <Button className="w-full">
          Get Started
        </Button>
      </div>
    ) : isSignedIn ? (
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <p className="font-medium text-slate-900">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
            </p>
            <p className="text-xs text-slate-500">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
        </div>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
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
          <Button className="w-full">
            Get Started
          </Button>
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
  let user = null;
  let isSignedIn = false;
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (hasClerk) {
    try {
      const clerkData = useUser();
      user = clerkData.user;
      isSignedIn = clerkData.isSignedIn || false;
    } catch (error) {
      // Clerk not available during build - use defaults
      user = null;
      isSignedIn = false;
    }
  }
  
  // Derived values (with safe defaults)
  const userIsSignedIn = isSignedIn ?? false;
  const { sections, links: navLinks } = buildNavStructure(userIsSignedIn, isAdmin);
  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <nav className={STYLES.nav}>
      <div className={STYLES.container}>
        <div className={STYLES.header}>
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <DesktopNavigation 
            sections={sections}
            navLinks={navLinks} 
            pathname={pathname} 
          />

          {/* Desktop Auth */}
          <AuthButtons isSignedIn={userIsSignedIn} hasClerk={hasClerk} />

          {/* Mobile Menu Toggle */}
          <MobileMenuToggle 
            isMenuOpen={isMenuOpen} 
            setIsMenuOpen={setIsMenuOpen} 
          />
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
          <MobileAuthSection 
            isSignedIn={userIsSignedIn} 
            user={user}
            hasClerk={hasClerk}
          />
        </div>
      )}
    </nav>
  );
} 