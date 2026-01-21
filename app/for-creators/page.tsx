"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Footer } from "../_components/footer";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import {
  Music,
  Sliders,
  Piano,
  Zap,
  Layout,
  Music2,
  FolderOpen,
  Video,
  Mic2,
  FileText,
  Users,
  Heart,
  ArrowRight,
  CheckCircle,
  Mail,
  Instagram,
  Youtube,
  DollarSign,
  Sparkles,
  BarChart3,
  Globe,
  Lock,
  Gift,
  TrendingUp,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Product type data organized by category
const productCategories = [
  {
    category: "Sounds & Tools",
    description: "Sell the sounds and tools you create",
    gradient: "from-purple-500 to-pink-500",
    items: [
      {
        name: "Sample Packs",
        icon: Music,
        description: "Drums, loops, one-shots, and textures",
        forWho: "Producers with unique sounds",
        example: "Lo-fi drum kit with 200+ samples",
      },
      {
        name: "Preset Packs",
        icon: Sliders,
        description: "Synth presets for Serum, Vital, Massive, etc.",
        forWho: "Sound designers",
        example: "50 future bass presets for Serum",
      },
      {
        name: "MIDI Packs",
        icon: Piano,
        description: "Chord progressions, melodies, and patterns",
        forWho: "Producers who write great progressions",
        example: "Neo-soul chord pack with 100 progressions",
      },
      {
        name: "Effect Chains",
        icon: Zap,
        description: "Signal chains for vocals, drums, mix bus",
        forWho: "Mix engineers with go-to chains",
        example: "Vocal chain rack for Ableton",
      },
      {
        name: "Mixing Templates",
        icon: Layout,
        description: "Pre-configured DAW sessions",
        forWho: "Engineers with proven workflows",
        example: "Hip-hop mixing template for Pro Tools",
      },
    ],
  },
  {
    category: "Music",
    description: "License your music and share your process",
    gradient: "from-blue-500 to-cyan-500",
    items: [
      {
        name: "Beat Leases",
        icon: Music2,
        description: "License instrumentals to artists",
        forWho: "Beat makers and producers",
        example: "Trap beat with MP3, WAV, and trackout options",
      },
      {
        name: "Project Files",
        icon: FolderOpen,
        description: "Full DAW sessions for learning",
        forWho: "Producers who teach by example",
        example: "Full Ableton project breakdown",
      },
    ],
  },
  {
    category: "Education",
    description: "Teach what you know and get paid",
    gradient: "from-green-500 to-emerald-500",
    items: [
      {
        name: "Courses",
        icon: Video,
        description: "Structured video lessons with modules",
        forWho: "Producers who can teach",
        example: "Complete mixing course with 20 lessons",
      },
      {
        name: "Coaching Sessions",
        icon: Mic2,
        description: "1-on-1 calls and feedback sessions",
        forWho: "Experienced producers and engineers",
        example: "60-minute mix feedback session",
      },
      {
        name: "PDFs & Cheat Sheets",
        icon: FileText,
        description: "Quick reference guides and ebooks",
        forWho: "Anyone with knowledge to share",
        example: "EQ frequency cheat sheet",
      },
    ],
  },
  {
    category: "Community",
    description: "Build and monetize your audience",
    gradient: "from-orange-500 to-red-500",
    items: [
      {
        name: "Community Access",
        icon: Users,
        description: "Paid Discord or private community",
        forWho: "Producers with engaged audiences",
        example: "Monthly Discord membership",
      },
      {
        name: "Tip Jar",
        icon: Heart,
        description: "Let fans support you directly",
        forWho: "Anyone with supporters",
        example: "Pay-what-you-want support",
      },
    ],
  },
];

const valueProps = [
  {
    icon: DollarSign,
    title: "Keep 90% of Sales",
    description: "Industry-leading payout. Gumroad takes 10% + fees. We take less.",
  },
  {
    icon: Globe,
    title: "All-in-One Platform",
    description: "Products, courses, coaching, email, analytics. One dashboard.",
  },
  {
    icon: Sparkles,
    title: "AI Content Assistant",
    description: "Generate descriptions, tags, and thumbnails in seconds.",
  },
  {
    icon: BarChart3,
    title: "Built-in Analytics",
    description: "Track views, sales, and conversions. Know what's working.",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description: "Collect emails and send campaigns. No Mailchimp needed.",
  },
  {
    icon: Star,
    title: "Beautiful Storefronts",
    description: "Professional pages that match your brand. No coding required.",
  },
];

const problemTools = [
  { name: "Gumroad", purpose: "Products" },
  { name: "Teachable", purpose: "Courses" },
  { name: "Calendly", purpose: "Booking" },
  { name: "Mailchimp", purpose: "Email" },
  { name: "Linktree", purpose: "Links" },
];

export default function ForCreatorsPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <MarketplaceNavbar />

      {/* Background elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 blur-[100px] animate-float-slow will-change-transform"
          style={{ transform: "translateZ(0)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-500/15 to-cyan-500/10 blur-[80px] animate-float-reverse will-change-transform"
          style={{ transform: "translateZ(0)" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Section 1: Hero */}
      <section className="relative z-10 overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            className="mb-6 inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            For Music Creators
          </motion.div>

          <motion.h1
            className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="block text-foreground">You make music.</span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Why not make money from it?
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Turn your beats, presets, courses, and knowledge into income.
            One platform for everything you create. Keep 90% of every sale.
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/sign-up?intent=creator">
              <Button
                size="lg"
                className="group h-14 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 text-lg font-semibold shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30"
              >
                Start Selling Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-xl border-2 px-8 text-lg font-semibold"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See How It Works
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {["No credit card required", "Free to start", "90% revenue share"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 2: The Problem */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              You're probably juggling{" "}
              <span className="text-red-400">5 different tools</span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
              A platform for products. Another for courses. A third for booking.
              Plus email marketing. And a link-in-bio page to tie it all together.
            </p>
          </motion.div>

          <motion.div
            className="mb-12 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {problemTools.map((tool, i) => (
              <motion.div
                key={tool.name}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <span className="font-medium">{tool.name}</span>
                <span className="text-muted-foreground">for {tool.purpose}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-2 text-2xl font-bold">
              What if you could do it all in one place?
            </h3>
            <p className="text-muted-foreground">
              One storefront. One dashboard. One platform that actually understands music creators.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Product Type Journey */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything you can sell on{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PPR Academy
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              12 product types. Endless possibilities. Build your entire income stack in one place.
            </p>
          </motion.div>

          <div className="space-y-16">
            {productCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="mb-8 flex items-center gap-4">
                  <div
                    className={`h-1 w-12 rounded-full bg-gradient-to-r ${category.gradient}`}
                  />
                  <div>
                    <h3 className="text-xl font-bold">{category.category}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: itemIndex * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg">
                        <CardContent className="p-6">
                          <div
                            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.gradient}`}
                          >
                            <item.icon className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="mb-2 text-lg font-semibold">{item.name}</h4>
                          <p className="mb-3 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-purple-400">For:</span>
                              <span className="text-muted-foreground">{item.forWho}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-purple-400">Example:</span>
                              <span className="text-muted-foreground">{item.example}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Follow Gate Feature */}
      <section className="relative z-10 overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
              <Gift className="mr-2 h-4 w-4" />
              Exclusive Feature
            </div>

            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Turn free downloads into{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                real followers
              </span>
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
              Our Follow Gate feature lets you require email signup and social follows
              before users can download your free content. No other platform does this.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mb-8 text-center">
              <h3 className="mb-2 text-xl font-semibold">How Follow Gate Works</h3>
              <p className="text-sm text-muted-foreground">
                You set the requirements. Users complete them. Everyone wins.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Create Free Product",
                  description: "Upload a sample pack, preset, or any product",
                  icon: Gift,
                },
                {
                  step: "2",
                  title: "Set Requirements",
                  description: "Choose: email, Instagram, YouTube, TikTok, Spotify",
                  icon: Lock,
                },
                {
                  step: "3",
                  title: "User Completes",
                  description: "They follow you and enter their email",
                  icon: CheckCircle,
                },
                {
                  step: "4",
                  title: "You Both Win",
                  description: "They get the download. You get a real follower.",
                  icon: TrendingUp,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mb-1 text-xs font-medium text-green-400">Step {item.step}</div>
                  <h4 className="mb-1 font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="text-sm text-muted-foreground">Supported platforms:</div>
              {[
                { icon: Mail, label: "Email" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "YouTube" },
              ].map((platform) => (
                <div
                  key={platform.label}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-sm"
                >
                  <platform.icon className="h-4 w-4" />
                  <span>{platform.label}</span>
                </div>
              ))}
              <span className="text-sm text-muted-foreground">+ TikTok, Spotify</span>
            </motion.div>
          </motion.div>

          <motion.p
            className="mt-8 text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            Stop giving away free content for nothing.
            <span className="font-medium text-foreground"> Build your audience while you share.</span>
          </motion.p>
        </div>
      </section>

      {/* Section 5: Value Props */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Why creators choose{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PPR Academy
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Built by music creators, for music creators. Everything you need, nothing you don't.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {valueProps.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <prop.icon className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="mb-2 font-semibold">{prop.title}</h3>
                    <p className="text-sm text-muted-foreground">{prop.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Social Proof Placeholder */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Creators already earning on PPR Academy
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Join music producers who are building their brands and income streams.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Be the first",
                type: "Sample Pack Creator",
                quote: "Your success story could be here. Start creating today.",
              },
              {
                name: "Join early",
                type: "Course Creator",
                quote: "Early creators get featured and build audiences faster.",
              },
              {
                name: "Start now",
                type: "Coach & Mentor",
                quote: "The best time to start was yesterday. The second best is now.",
              },
            ].map((creator, i) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-dashed border-border/50 bg-card/30">
                  <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Users className="h-8 w-8 text-purple-400/50" />
                    </div>
                    <h4 className="mb-1 font-semibold text-muted-foreground">{creator.name}</h4>
                    <p className="mb-3 text-xs text-muted-foreground/70">{creator.type}</p>
                    <p className="text-sm italic text-muted-foreground">"{creator.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Final CTA */}
      <section className="relative z-10 overflow-hidden py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-90" />

        <div
          className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl"
          style={{ transform: "translateZ(0)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl"
          style={{ transform: "translateZ(0)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Ready to turn your skills
              <br />
              into income?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-xl text-white/80">
              Create your store in 10 minutes. Publish your first product in 20.
              Start earning today.
            </p>

            <Link href="/sign-up?intent=creator">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="h-16 rounded-2xl bg-white px-12 text-xl font-bold text-gray-900 shadow-2xl shadow-black/30 transition-all hover:bg-gray-100"
                >
                  Start Selling Free
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </motion.div>
            </Link>

            <motion.div
              className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-white/70"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              {[
                "No credit card required",
                "90% revenue share",
                "Cancel anytime",
                "Free to start",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-white/80" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
