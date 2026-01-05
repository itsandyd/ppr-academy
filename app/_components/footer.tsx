"use client";

import { FC } from "react";
import { Music, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
                  <Music className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">PausePlayRepeat</span>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                Where music creators sell courses, samples, presets, and services. Where students
                learn from real producers.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => showComingSoon("Twitter/X")}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Twitter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => showComingSoon("Instagram")}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Instagram className="h-5 w-5" />
                </button>
                <button
                  onClick={() => showComingSoon("YouTube")}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Youtube className="h-5 w-5" />
                </button>
                <button
                  onClick={() => showComingSoon("LinkedIn")}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Linkedin className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Explore */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Explore</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/marketplace"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Courses
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace/samples"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Samples & Packs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace/ableton-racks"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Presets & Racks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/marketplace/creators"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Creators
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Creators */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">For Creators</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/home"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Creator Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-up?intent=creator"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Start Selling
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => showComingSoon("Creator Resources")}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Creator Resources
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showComingSoon("Affiliate Program")}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Affiliate Program
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Support</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => showComingSoon("Help Center")}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showComingSoon("Contact Support")}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showComingSoon("Feature Requests")}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Feature Requests
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => showComingSoon("Status Page")}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    Status
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t py-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex flex-wrap justify-center space-x-6 md:justify-start">
              <button
                onClick={() => showComingSoon("Privacy Policy")}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => showComingSoon("Terms of Service")}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Terms of Service
              </button>
              <button
                onClick={() => showComingSoon("Cookie Policy")}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Cookie Policy
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 PausePlayRepeat. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
