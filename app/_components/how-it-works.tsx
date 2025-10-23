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
            <Card className="p-8 bg-gradient-to-br from-chart-1/5 to-chart-3/5 border-chart-1/20">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-primary-foreground" />
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
                      <div className="flex-shrink-0 w-10 h-10 bg-background rounded-lg flex items-center justify-center shadow-sm">
                        <step.icon className="w-5 h-5 text-chart-1" />
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
                  <Button className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 text-primary-foreground shadow-lg shadow-chart-1/25">
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
            <Card className="p-8 bg-gradient-to-br from-chart-3/5 to-chart-5/5 border-chart-3/20">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-chart-3 to-chart-4 rounded-xl flex items-center justify-center shadow-lg">
                    <Store className="w-6 h-6 text-primary-foreground" />
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
                      <div className="flex-shrink-0 w-10 h-10 bg-background rounded-lg flex items-center justify-center shadow-sm">
                        <step.icon className="w-5 h-5 text-chart-3" />
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
                  <Button className="w-full bg-gradient-to-r from-chart-3 to-chart-4 hover:opacity-90 text-primary-foreground shadow-lg shadow-chart-3/25">
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

