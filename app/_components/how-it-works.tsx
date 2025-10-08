"use client";

import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Play, Store, Upload, DollarSign, CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface HowItWorksProps {}

export const HowItWorks: FC<HowItWorksProps> = () => {
  const studentSteps = [
    {
      icon: Search,
      title: "Discover",
      description: "Browse our extensive marketplace of courses and digital products from top creators.",
    },
    {
      icon: ShoppingCart,
      title: "Purchase",
      description: "Buy courses, sample packs, or presets with secure checkout and instant access.",
    },
    {
      icon: Play,
      title: "Learn & Create",
      description: "Access your content in your library and start mastering new skills immediately.",
    },
  ];

  const creatorSteps = [
    {
      icon: Store,
      title: "Create Your Store",
      description: "Set up your professional storefront in minutes with custom branding.",
    },
    {
      icon: Upload,
      title: "Upload Content",
      description: "Add your courses, sample packs, presets, or other digital products easily.",
    },
    {
      icon: DollarSign,
      title: "Earn Revenue",
      description: "Get paid directly when students purchase your content. Keep 90% of sales.",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How PPR Academy Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're here to learn or to teach, we've made it simple to get started
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Students */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900/50">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">For Students</h3>
                    <p className="text-sm text-muted-foreground">Start learning today</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {studentSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-black rounded-lg flex items-center justify-center shadow-sm">
                        <step.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">
                          {index + 1}. {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href="/courses">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25">
                    Browse Courses
                    <CheckCircle className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* For Creators */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900/50">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">For Creators</h3>
                    <p className="text-sm text-muted-foreground">Launch your business</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {creatorSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-black rounded-lg flex items-center justify-center shadow-sm">
                        <step.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">
                          {index + 1}. {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href="/sign-up?intent=creator">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25">
                    Start Creating Free
                    <CheckCircle className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Trust Strip */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-sm text-muted-foreground">
            Join thousands of producers already learning and earning on PPR Academy
          </p>
        </motion.div>
      </div>
    </section>
  );
};

