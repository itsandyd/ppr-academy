'use client';

import { FC } from 'react'
import { Music, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface FooterProps {}

export const Footer: FC<FooterProps> = () => {
  const { toast } = useToast();

  const showComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon! 🚀",
      description: `${feature} will be available in a future update.`,
      className: "bg-white dark:bg-black",
    });
  };

  return (
    <footer className="bg-background border-t">
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Music className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Music Academy</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                The ultimate platform connecting music producers with students through courses, coaching, and exclusive content.
              </p>
              <div className="flex space-x-4">
                <button onClick={() => showComingSoon('Twitter/X')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </button>
                <button onClick={() => showComingSoon('Instagram')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </button>
                <button onClick={() => showComingSoon('YouTube')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Youtube className="h-5 w-5" />
                </button>
                <button onClick={() => showComingSoon('LinkedIn')} className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => showComingSoon('Features')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/store" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button onClick={() => showComingSoon('Analytics')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Analytics
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => showComingSoon('Help Center')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={() => showComingSoon('Blog')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => showComingSoon('Community')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Community
                  </button>
                </li>
                <li>
                  <button onClick={() => showComingSoon('API Documentation')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    API Docs
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => showComingSoon('About Us')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    About
                  </button>
                </li>
                <li>
                  <button onClick={() => showComingSoon('Careers')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </button>
                </li>
                <li>
                  <button onClick={() => showComingSoon('Press')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Press
                  </button>
                </li>
                <li>
                  <button onClick={() => showComingSoon('Contact')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start space-x-6">
              <button onClick={() => showComingSoon('Privacy Policy')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => showComingSoon('Terms of Service')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </button>
              <button onClick={() => showComingSoon('Cookie Policy')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Music Academy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 