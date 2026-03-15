"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
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
  CheckCircle,
  Gift,
  Lock,
  TrendingUp,
  DollarSign,
  Globe,
  Sparkles,
  BarChart3,
  Mail,
  Instagram,
  Youtube,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "../_components/footer";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import {
  ScreenshotShowcase,
  SectionVisualBreak,
} from "@/components/creators/screenshot-showcase";

// Product type data organized by category
const productCategories = [
  {
    category: "Sounds & Tools",
    description: "Sell the sounds and tools you create",
    gradient: "from-purple-500 to-pink-500",
    items: [
      { name: "Sample Packs", icon: Music, description: "Drums, loops, one-shots, and textures" },
      { name: "Preset Packs", icon: Sliders, description: "Synth presets for Serum, Vital, Massive, etc." },
      { name: "MIDI Packs", icon: Piano, description: "Chord progressions, melodies, and patterns" },
      { name: "Effect Chains", icon: Zap, description: "Signal chains for vocals, drums, mix bus" },
      { name: "Mixing Templates", icon: Layout, description: "Pre-configured DAW sessions" },
    ],
  },
  {
    category: "Music",
    description: "License your music and share your process",
    gradient: "from-blue-500 to-cyan-500",
    items: [
      { name: "Beat Leases", icon: Music2, description: "License instrumentals to artists" },
      { name: "Project Files", icon: FolderOpen, description: "Full DAW sessions for learning" },
    ],
  },
  {
    category: "Education",
    description: "Teach what you know and get paid",
    gradient: "from-green-500 to-emerald-500",
    items: [
      { name: "Courses", icon: Video, description: "Structured video lessons with modules" },
      { name: "Coaching Sessions", icon: Mic2, description: "1-on-1 calls and feedback sessions" },
      { name: "PDFs & Cheat Sheets", icon: FileText, description: "Quick reference guides and ebooks" },
    ],
  },
  {
    category: "Community",
    description: "Build and monetize your audience",
    gradient: "from-orange-500 to-red-500",
    items: [
      { name: "Community Access", icon: Users, description: "Paid Discord or private community" },
      { name: "Tip Jar", icon: Heart, description: "Let fans support you directly" },
    ],
  },
];

const valueProps = [
  { icon: DollarSign, title: "Keep 90% of Sales", description: "Industry-leading payout. Gumroad takes 10% + fees. We take less." },
  { icon: Globe, title: "All-in-One Platform", description: "Products, courses, coaching, email, analytics. One dashboard." },
  { icon: Sparkles, title: "AI Content Assistant", description: "Generate descriptions, tags, and thumbnails in seconds." },
  { icon: BarChart3, title: "Built-in Analytics", description: "Track views, sales, and conversions. Know what's working." },
  { icon: Mail, title: "Email Marketing", description: "Collect emails and send campaigns. No Mailchimp needed." },
  { icon: Star, title: "Beautiful Storefronts", description: "Professional pages that match your brand. No coding required." },
];

export default function CreatorsLetterPage() {
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show floating CTA after scrolling past ~600px (first section)
      setShowFloatingCta(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceNavbar />

      {/* The Letter */}
      <article className="relative z-10 px-5 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-[680px]">
          {/* Opening hook — bold, italic, large */}
          <p className="mb-12 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            I gave away free music production content for years. It built me
            100,000 followers. And when I finally figured out how to sell to
            them, the system I needed to do it was a nightmare.
          </p>

          {/* --- Section 1: The Backstory --- */}
          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>Let me tell you what nobody talks about in the producer world.</p>

            <p>
              I spent years making tutorials, breakdowns, tips, tricks — the
              whole thing. Instagram, YouTube, TikTok. I explained reverb types,
              saturation, compression, mixing techniques. I gave it all away.
              Every single piece of knowledge I had, I handed to strangers on the
              internet for free.
            </p>

            <p>
              And it worked. 100,000 people followed me. 50,000 people gave me
              their email address. I became &ldquo;the guy&rdquo; that producers
              went to when they wanted to understand how something actually
              works, not just which knob to turn, but <em>why</em>.
            </p>

            <p>
              Eventually I started selling. Courses, presets, sample packs. And
              people bought them. The audience was there. The demand was real. I
              had built something.
            </p>

            <p>
              But here&apos;s the part nobody tells you about selling as a music
              producer.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              The selling wasn&apos;t the hard part. The system behind it was.
            </p>

            <p>
              I needed email sequences to keep people engaged. I needed a
              storefront to display products. I needed a course platform to host
              content. I needed payment processing. I needed download delivery. I
              needed social media content to keep bringing people in. And none of
              it talked to each other.
            </p>

            <p>So I did something stupid. I decided to build my own platform.</p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          {/* --- Section 2: Building the platform --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            I spent over a year building something that nobody asked for.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              While other producers were pumping out beat tutorials and
              collecting Patreon subscribers, I was buried in code. Database
              tables. Stripe integrations. Webhook handlers. Authentication
              flows. Dashboard designs.
            </p>

            <p>
              I&apos;m not even an engineer. I&apos;m a music producer who
              taught himself to build software because he was too stubborn to use
              someone else&apos;s platform.
            </p>

            <p>Why?</p>

            <p>
              Because I was living the nightmare that every producer who sells
              stuff lives.
            </p>

            <p>
              Kajabi to host my courses — $600 a month for a platform designed
              for life coaches. Active Campaign to manage emails because
              Kajabi&apos;s email tools weren&apos;t good enough. Shopify for
              merchandise and digital downloads, except Shopify isn&apos;t made
              for digital downloads — it&apos;s made for shipping physical
              products. A bunch of Shopify plugins to handle things Shopify
              couldn&apos;t do natively. Discord for community. Google Drive for
              documents. Zapier to duct-tape it all together so when someone
              bought on Shopify it triggered an email in Active Campaign which
              unlocked a course in Kajabi. Stripe and PayPal for billing.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Seven platforms. Hundreds of dollars a month. All held together by
              automations that broke every time one platform updated their API.
            </p>

            <p>
              And here&apos;s the worst part — every single one of those
              platforms was built for &ldquo;everyone.&rdquo; Kajabi was built
              for life coaches. Shopify was built for e-commerce stores shipping
              t-shirts. Active Campaign was built for marketers. None of them
              understood that I&apos;m a music producer who sells courses,
              presets, sample packs, and beats. None of them had licensing tiers.
              None of them had a storefront designed for what we actually sell.
            </p>

            {/* Screenshot: Dashboard — one login, everything in one place */}
            <ScreenshotShowcase
              alt="PausePlayRepeat creator dashboard — stats, products, and tools in one place"
              caption="One dashboard. Every product type, every metric, every tool. No more toggling between seven logins."
              url="pauseplayrepeat.com/dashboard"
              src="/screenshots/dashboard.png"
              
            />

            <p>
              But not just for me. That&apos;s the part I need you to
              understand.
            </p>

            <p>
              The whole time I was juggling seven platforms and building my
              audience, I kept meeting producers who were doing the same thing I
              was. Making incredible stuff — beats, presets, sample packs,
              courses — and either giving it away for free or struggling to sell
              it because they didn&apos;t have the audience or the tech stack or
              the $600 a month for Kajabi.
            </p>

            <p>
              I always had this ambition of helping other people do exactly what
              I was doing. Not just teaching mixing techniques, but actually
              giving producers a place to build something for themselves. Because
              honestly? This whole thing is better when it&apos;s not just me. I
              think there&apos;s something really powerful about having other
              producers around you winning, lifting each other up, sending buyers
              to each other&apos;s work. One person selling courses is a
              business. A community of producers all selling and supporting each
              other? That&apos;s a movement.
            </p>

            <p>
              But first, we needed the platform. We needed the system. Something
              built from the ground up for exactly this.
            </p>

            <p>So that&apos;s what I spent the last year building.</p>
          </div>

          {/* --- Divider --- */}
          <SectionVisualBreak />

          {/* --- Section 3: What PPR is --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            Here&apos;s what PausePlayRepeat actually is.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              It&apos;s a marketplace built from the ground up for music
              producers.
            </p>

            <p>
              Not course creators. Not coaches. Not Shopify dropshippers.{" "}
              <span className="font-medium text-foreground">
                Music producers.
              </span>
            </p>

            <p>
              You can sell beats with licensing tiers — free downloads for lead
              gen, basic licenses, premium licenses, exclusives that auto-remove
              from your store. You can sell sample packs, preset packs, MIDI
              kits, project files, mixing templates. And not the way every other
              platform does it — where you upload a zip file and hope someone
              pays $20 for a pack full of sounds they&apos;ll never use. On
              PausePlayRepeat, buyers can preview every single sample before they
              download. They hear exactly what they&apos;re getting. And they can
              download individual sounds instead of being forced to buy the whole
              pack.
            </p>

            <p>
              Think about that from your buyer&apos;s perspective. On Splice,
              they can preview and pick individual sounds — that&apos;s why
              producers love it. On Cymatics, Gumroad, Patreon? Here&apos;s a
              $20 zip file, good luck. You might use 3 sounds out of 200.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Your customers don&apos;t want 200 mediocre samples. They want the
              5 perfect ones.
            </p>

            <p>
              And when they can actually hear your work before they buy, the good
              stuff sells itself. That&apos;s better for buyers AND better for
              creators who actually make quality sounds.
            </p>

            {/* Screenshot: Sample pack browser with individual previews */}
            <ScreenshotShowcase
              alt="Sample pack browser with individual audio previews and waveform players"
              caption="Buyers preview every single sample before downloading. The good sounds sell themselves."
              url="pauseplayrepeat.com/marketplace/samples"
              src="/screenshots/sample_preview.png"
            />

            <p>
              You can sell courses — real text-based courses with modules and
              chapters, not some guy screen recording his DAW for 3 hours. You
              can offer mixing and mastering services. Coaching sessions.
              Bundles. Memberships.
            </p>

            <p>Everything. One storefront. One place.</p>

            {/* Product categories grid — merged from /for-creators */}
            <div className="relative mx-auto my-16 w-[calc(100%+2rem)] max-w-[900px] -translate-x-4 sm:my-20 sm:w-[calc(100%+6rem)] sm:-translate-x-12 lg:w-[900px] lg:-translate-x-[110px]">
              <h3 className="mb-8 text-center text-xl font-semibold text-foreground sm:text-2xl">
                Everything you can sell on PausePlayRepeat
              </h3>
              <div className="space-y-8">
                {productCategories.map((category) => (
                  <div key={category.category}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${category.gradient}`} />
                      <div>
                        <span className="text-sm font-semibold text-foreground">{category.category}</span>
                        <span className="ml-2 text-sm text-muted-foreground">— {category.description}</span>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {category.items.map((item) => (
                        <Card key={item.name} className="border-border/30 bg-card/30">
                          <CardContent className="flex items-start gap-3 p-4">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${category.gradient}`}>
                              <item.icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshot: Creator storefront */}
            <ScreenshotShowcase
              alt="A creator storefront on PausePlayRepeat — dark hero banner, product grid, and stats sidebar"
              caption="Your storefront. Your brand. Courses, beats, presets, samples — all in one place your fans actually want to browse."
              url="pauseplayrepeat.com/your-name"
              src="/screenshots/storefront.png"
            />

            <p>
              Your storefront lives at{" "}
              <span className="font-medium text-purple-400">
                pauseplayrepeat.com/your-name
              </span>
              . You&apos;re featured in the creator directory. When someone buys
              from you, the money goes to your Stripe account. I take 10%.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              That&apos;s it.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          {/* --- Section 4: The honest part --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            But here&apos;s the honest part. The part that most founders
            wouldn&apos;t tell you.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p className="text-lg font-medium text-foreground sm:text-xl">
              The platform is early.
            </p>

            <p>
              I&apos;m not going to lie to you and say we have thousands of
              producers browsing the marketplace every day. We don&apos;t. Not
              yet.
            </p>

            <p>What we have is this:</p>

            <p>
              100,000 followers across social media. 50,000 email subscribers. A
              growing audience of producers who already trust PausePlayRepeat as
              the place where they learn.
            </p>

            <p>
              And right now, I am actively, aggressively, every single day
              driving that audience to this platform.
            </p>

            <p>
              I send emails to 50,000 producers promoting courses and products. I
              post content that sends people to the marketplace. I run
              automations that send direct links to products when people comment
              on posts. And I&apos;m just getting started.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              The audience is there. They&apos;re willing to pay. They just need
              something worth buying.
            </p>
          </div>

          {/* --- Divider --- */}
          <SectionVisualBreak />

          {/* --- Section 5: This is where you come in --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            This is where you come in.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              I don&apos;t need more features. I don&apos;t need more code. I
              don&apos;t need another database table or another Stripe
              integration.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              I need creators.
            </p>

            <p>
              I need producers who make beats and want to sell them. Producers
              who&apos;ve built presets they&apos;re sitting on. Producers who
              have sample packs collecting dust on their hard drive. Producers
              who know enough about mixing or sound design or music theory to
              teach it.
            </p>

            <p>
              I need people who make stuff and want to sell it to an audience
              that already exists.
            </p>

            <p>
              Let me just walk you through how this actually works compared to
              what&apos;s out there:
            </p>

            <p>
              If you put your products on Gumroad right now, you get a checkout
              page. That&apos;s it. Now you have to go build an entire audience
              from scratch to drive anyone to it. And that takes years. I know
              because I literally did it.
            </p>

            <p>
              If you put your products on PausePlayRepeat, you get a storefront,
              you show up in the creator directory, and you&apos;re in front of
              100,000 producers that I already spent years building. People who
              are already looking for beats, presets, courses — they can just
              find you.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              I don&apos;t know, maybe I&apos;m biased. But the math seems
              pretty clear to me.
            </p>

            <p>
              And if you&apos;re reading this thinking &ldquo;sounds great, but
              I don&apos;t have time to learn another platform&rdquo; — you
              don&apos;t have to. I will set up your store for you. We hop on a
              call, you tell me what you sell, and I get your products listed,
              your storefront configured, your email sequences built. You walk
              away with a live store. I actually built a feature into the
              platform that lets me manage your store from my end — that&apos;s
              how serious I am about making this easy for you.
            </p>

          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          {/* --- Section 6: What if you don't have an audience --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            But what if you don&apos;t have an audience?
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              This is the part nobody talks about. Every platform in the world
              will let you list a product. None of them help you actually get
              people to see it.
            </p>

            <p>
              You can put your preset pack on Gumroad. Cool. Now what? You need
              an audience. You need content. You need to post consistently across
              Instagram, TikTok, YouTube. You need to figure out what to say, how
              to say it, and when to post it. And you need to do this every
              single day while also making music.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              That&apos;s why most creators fail. Not because their products are
              bad. Because they&apos;re invisible.
            </p>

            <p>
              PausePlayRepeat doesn&apos;t just give you a storefront. It gives
              you the tools to build an audience.
            </p>

            <p>
              So I built this AI content tool into the platform. You feed it
              your product — your course, your sample pack, whatever — and it
              generates social media scripts, captions, image prompts for
              TikTok, Instagram, YouTube. Basically it takes the stuff you
              already made and turns it into content that drives people back to
              your store. You don&apos;t have to sit there for two hours every
              day trying to figure out what to post.
            </p>

            <p>
              There&apos;s a content library and calendar to keep it all
              organized. The scripts are already written. You just post them.
            </p>

            <p>
              And the part that I think is actually the most important — you
              only have to do this once. Like, you create 90 days of content,
              set up your email sequences, and it just keeps running. Every new
              subscriber gets nurtured automatically. Your content library
              stays stocked. It doesn&apos;t stop working when you stop
              posting.
            </p>

            <p>
              Most creators burn out because they think they need to come up
              with something new every single day. You don&apos;t. You need 90
              good pieces of content and a system that keeps going while you
              actually make music.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              That&apos;s not being lazy. That&apos;s just being smart about
              your time so you can focus on making music.
            </p>

            {/* Screenshot: AI content engine / email workflow builder */}
            <ScreenshotShowcase
              alt="AI-powered content engine generating social media scripts and email sequences"
              caption="The AI content engine turns your products into 90 days of ready-to-post content — scripts, captions, and email sequences on autopilot."
              url="pauseplayrepeat.com/dashboard/emails/workflows"
              src="/screenshots/email-engine.png"
            />
          </div>

          {/* --- Follow Gate Feature (merged from /for-creators) --- */}
          <div className="my-16 rounded-xl border border-green-500/20 bg-green-500/5 p-6 sm:p-8">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-400">
              <Gift className="h-4 w-4" />
              Exclusive Feature
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
              Turn free downloads into real followers
            </h3>
            <p className="mb-8 text-base text-muted-foreground">
              Our Follow Gate feature lets you require email signup and social follows
              before users can download your free content. No other platform does this.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", title: "Create Free Product", description: "Upload a sample pack, preset, or any product", icon: Gift },
                { step: "2", title: "Set Requirements", description: "Choose: email, Instagram, YouTube, TikTok, Spotify", icon: Lock },
                { step: "3", title: "User Completes", description: "They follow you and enter their email", icon: CheckCircle },
                { step: "4", title: "You Both Win", description: "They get the download. You get a real follower.", icon: TrendingUp },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <item.icon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="mb-1 text-xs font-medium text-green-400">Step {item.step}</div>
                  <h4 className="mb-1 text-sm font-semibold text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span>Supported:</span>
              {[
                { icon: Mail, label: "Email" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "YouTube" },
              ].map((platform) => (
                <span key={platform.label} className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-background/50 px-2.5 py-1 text-xs">
                  <platform.icon className="h-3 w-3" />
                  {platform.label}
                </span>
              ))}
              <span className="text-xs">+ TikTok, Spotify</span>
            </div>
          </div>

          {/* --- Divider --- */}
          <SectionVisualBreak />

          {/* --- Section: How I actually built this --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            Here&apos;s how I actually built this.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              I didn&apos;t start with 100,000 followers. I started with zero.
              No connections in the industry. No marketing degree. No budget.
              Just a DAW and an internet connection.
            </p>

            <p>Here&apos;s what I did:</p>

            <p>
              I gave away everything I knew for free. Every mixing technique,
              every reverb trick, every compression setting I&apos;d figured out
              through years of trial and error. I posted it on Instagram,
              YouTube, TikTok. Every single day.
            </p>

            <p>
              That turned into followers. Followers turned into an email list.
              The email list turned into trust. And trust turned into sales.
            </p>

            <p>
              It took years. And honestly? Most of it was inefficient. I was
              figuring it out as I went. Making content with no strategy,
              posting at random times, not collecting emails for way too long.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              That&apos;s exactly why I built the tools inside this platform the
              way I did.
            </p>

            <p>
              The content engine exists because I spent two years manually
              coming up with posts every day and burning out. The email
              sequences exist because I lost thousands of potential sales before
              I set up automation. The social scheduling exists because I wasted
              hours every week copying and pasting the same content across
              platforms.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Every feature on PausePlayRepeat is a problem I personally ran
              into and solved the hard way.
            </p>

            {/* Screenshot: Product creation wizard */}
            <ScreenshotShowcase
              alt="Product creation wizard — simple step-by-step flow to list a course, beat pack, or preset"
              caption="List a product in minutes, not hours. Every creation flow was designed by a producer who hated the alternatives."
              url="pauseplayrepeat.com/dashboard/create"
              src="/screenshots/product-wizard.png"
            />

            <p>You don&apos;t have to figure it out the hard way.</p>

            <p>
              When you sign up as a creator, you&apos;re not just getting a
              storefront. You&apos;re getting the system I wish I had when I
              started. And if you need help — with your content strategy, your
              product pricing, your email sequences — you can literally just DM
              me. I&apos;ll tell you what I&apos;d do. Because I&apos;ve already
              done it.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          {/* --- Section: It doesn't matter where you're starting from --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            It doesn&apos;t matter where you&apos;re starting from.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              I talk to producers every single day. And I&apos;ve realized
              there are basically three types of people reading this page right
              now. Let me talk to each of you directly.
            </p>

            {/* --- Sub-section 1: I have products but no way to sell them --- */}
            <p className="text-lg font-medium text-foreground sm:text-xl">
              &ldquo;I have products but no way to sell them.&rdquo;
            </p>

            <p>
              You&apos;ve got beats, presets, sample packs — maybe even a
              course idea you keep talking about but never start. The stuff is
              there. You know it&apos;s good. But nobody sees it because you
              don&apos;t have a storefront or a system for getting it in front
              of people.
            </p>

            <p>
              Sign up, get a storefront in 30 seconds, list your products.
              You&apos;re immediately in the marketplace where 100,000
              producers can find your work. You don&apos;t have to build an
              audience from scratch — mine is already here and already buying.
            </p>

            <p>
              You already have the products. All the other stuff — storefront,
              email sequences, content tools — that&apos;s already built and
              waiting for you. And if you don&apos;t want to set any of it up
              yourself, honestly you don&apos;t have to. Just DM me,
              we&apos;ll hop on a call, and I&apos;ll get your store live for
              you.
            </p>

            {/* --- Sub-section 2: Already selling on other platforms --- */}
            <p className="text-lg font-medium text-foreground sm:text-xl">
              &ldquo;I&apos;m already selling on Patreon / Gumroad /
              BeatStars.&rdquo;
            </p>

            <p>
              Your setup probably looks like this: Patreon for memberships,
              Mailchimp for emails, Buffer for scheduling, ManyChat for DM
              automation, Linktree for your bio link. Five, six, seven tools
              duct-taped together.
            </p>

            <p>
              So let&apos;s just add it up real quick. Patreon takes 8-12%.
              Then you&apos;re probably paying $30-50 a month for Mailchimp,
              $25 for Buffer or Later, $15-45 for ManyChat, another $5-10 for
              Linktree. That&apos;s $75-130 a month in tools, and none of them
              talk to each other. On PPR it&apos;s 10% and everything&apos;s
              built in. I&apos;m not saying those other tools are bad — I used
              most of them myself. I&apos;m just saying you probably
              don&apos;t need five separate subscriptions to do what one
              platform should handle.
            </p>

            <p>
              And honestly, you don&apos;t even have to leave your current
              setup. Just list your stuff here too. One more place people can
              find you. If it ends up replacing $100+ a month in tool
              subscriptions and you want to move everything over, great. If
              not, no hard feelings. And if migrating sounds annoying — I get
              it. I&apos;ll hop on a call and move your stuff over for you.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Honestly, what&apos;s the worst that happens? You list your stuff,
              nobody buys it, you move on. At least you didn&apos;t pay $130 a
              month in subscriptions to find that out.
            </p>

            {/* --- Sub-section 3: I don't even know what I'd sell --- */}
            <p className="text-lg font-medium text-foreground sm:text-xl">
              &ldquo;I don&apos;t even know what I&apos;d sell.&rdquo;
            </p>

            <p>
              You&apos;re not a &ldquo;creator.&rdquo; You&apos;re a
              producer. You make music. The idea of selling something online
              feels like it&apos;s for other people. That&apos;s fine.
              Start by learning.
            </p>

            <p>
              Take the courses — every course has free preview chapters so you
              can try before you commit, and full access starts at $12/month
              with PPR Pro. Get better at your craft. And then one day — when
              a friend asks how you got that vocal chain sounding so clean, or
              when you realize you&apos;ve built 50 presets you&apos;d
              actually pay money for — you&apos;ll think: I could sell this.
            </p>

            <p>
              When that day comes, you&apos;re already here. You click one
              button, your store is live — free tier, one product, no credit
              card. You go from student to creator without leaving the place
              where you learned everything. And you won&apos;t have to figure
              the platform out alone — I&apos;ll walk you through it
              personally.
            </p>

            <p>
              That&apos;s honestly the whole idea. The same platform where you
              learned mixing is where you eventually sell your mixing templates.
              No pressure at all. I&apos;m not gonna rush you. Just know that
              when you&apos;re ready, everything&apos;s already here. You
              don&apos;t have to go sign up for something new or figure out a
              different system. You just flip a switch and you&apos;re a
              creator.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              Because honestly, a storefront without anyone looking at it is
              just a URL that nobody visits. And I don&apos;t want that for you.
              I want you to actually sell stuff.
            </p>

            <p>
              That said — you also have my audience from day one. 100,000
              followers. 50,000 email subscribers. The creator directory. The
              marketplace. So even while you&apos;re building YOUR audience, mine
              is already looking at your products.
            </p>
          </div>

          {/* --- Divider --- */}
          <SectionVisualBreak />

          {/* --- Section 7: Founding creators --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            I&apos;m looking for founding creators.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>Not 500. Not 100. Right now, I want 10.</p>

            <p>
              10 producers who want to be the first creators on a platform built
              specifically for what they do.
            </p>

            <p>Why would you want to be early?</p>

            <p>
              Because right now, there&apos;s almost no competition. You list a
              preset pack today, you might be the only preset pack on the
              platform. When I send an email to 50,000 producers about presets,
              guess whose product they find? Yours.
            </p>

            <p>
              Because founding creators get to shape what this becomes. If you
              need a feature, I&apos;ll build it. If something&apos;s broken,
              I&apos;ll fix it tonight. I fixed a subscriber&apos;s access issue
              at 11pm last week. That&apos;s the kind of platform this is right
              now. You&apos;re not submitting a support ticket to some
              corporation. You&apos;re DMing me directly.
            </p>

            <p>
              And founding creators get personal onboarding. I will get on a
              call with you, set up your storefront, list your products, build
              your email sequences — the whole thing. This isn&apos;t a chatbot
              or a help doc. It&apos;s the guy who built the platform getting
              your store live himself.
            </p>

            <p>
              And honestly, being early just matters. The producers who got on
              BeatStars in 2015 built audiences that new sellers can&apos;t
              touch now. The creators who joined Gumroad early became the
              featured creators. I&apos;m not saying this to pressure you — I
              just think it&apos;s worth knowing that the people who show up
              first tend to do really well on platforms like this.
            </p>
          </div>

          {/* --- Value Props Grid (merged from /for-creators) --- */}
          <div className="my-16 relative mx-auto w-[calc(100%+2rem)] max-w-[900px] -translate-x-4 sm:w-[calc(100%+6rem)] sm:-translate-x-12 lg:w-[900px] lg:-translate-x-[110px]">
            <h3 className="mb-8 text-center text-xl font-semibold text-foreground sm:text-2xl">
              Why creators choose PausePlayRepeat
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {valueProps.map((prop) => (
                <Card key={prop.title} className="border-border/30 bg-card/30">
                  <CardContent className="p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <prop.icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <h4 className="mb-1 text-sm font-semibold text-foreground">{prop.title}</h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">{prop.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          {/* --- Section 8: What this costs --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            What this costs you.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              The free tier lets you set up your storefront, your link-in-bio,
              get featured in the directory, and list one product. If you want to
              sell more, paid plans start at $12/month plus 10% of sales.
            </p>

            <p>
              That&apos;s it. No hidden fees. No $600/month Kajabi bills. No
              annual contracts. Cancel whenever you want. If you make nothing,
              you pay nothing on the free tier.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Honestly, I just want you to try it. List something and see what
              happens. The audience is already here.
            </p>

            {/* Screenshot: Pricing / free-to-start experience */}
            <ScreenshotShowcase
              alt="PausePlayRepeat pricing — free tier with one product, paid plans starting at $12/month"
              caption="Free to start. No credit card. One product, one storefront, zero risk."
              url="pauseplayrepeat.com/pricing"
              src="/screenshots/pricing.png"
            />
          </div>

          {/* --- Divider --- */}
          <SectionVisualBreak />

          {/* --- Section 9: What I won't tell you --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            Here&apos;s what I&apos;m NOT going to tell you.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              I&apos;m not going to tell you this is a guaranteed path to riches.
              It&apos;s not. You still have to make good products. You still have
              to show up.
            </p>

            <p>
              I&apos;m not going to tell you the platform is perfect. It&apos;s
              not. I&apos;m one person building this. There will be bugs. I will
              fix them fast, but they&apos;ll be there.
            </p>

            <p>
              I&apos;m not going to tell you that 100,000 followers means
              100,000 sales. It doesn&apos;t. Conversion rates are real. Not
              everyone buys. But more people seeing your work means more chances.
            </p>

            <p>
              I&apos;m not going to pretend I&apos;m some venture-backed startup
              with a 50-person team. It&apos;s me. One guy in Missouri who
              taught himself to code because he believed producers deserved a
              better platform.
            </p>

            <p>What I will tell you is this:</p>

            <p>
              I&apos;ve spent years building something that I genuinely believe
              is the future of how music producers sell their work. Not scattered
              across 5 different platforms. Not paying $600/month for tools built
              for life coaches. Not begging the algorithm for scraps.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Everything in one place. Built by a producer, for producers.
              That&apos;s it.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

          {/* --- Section 10: Final CTA --- */}
          <p className="mb-10 text-xl font-semibold leading-relaxed text-foreground sm:text-2xl sm:leading-relaxed">
            If this sounds like something you want to be part of, sign up as a
            creator.
          </p>

          <div className="space-y-6 text-base leading-[1.85] text-muted-foreground sm:text-lg sm:leading-[1.85]">
            <p>
              Or just DM me and tell me what you make. I&apos;ll personally help
              you get set up.
            </p>

            <p>
              I&apos;m not going anywhere. This is what I&apos;m building. And
              I&apos;d rather build it with 10 real producers who give a damn
              than 10,000 people who signed up and never came back.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              Let&apos;s make something.
            </p>

            <p className="text-lg text-foreground">— Andrew</p>
          </div>

          {/* --- Inline CTA --- */}
          <div className="mt-16 flex flex-col items-center gap-6">
            <Link
              href="/sign-up?intent=creator"
              className="group inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-10 text-lg font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30"
            >
              Sign Up as a Creator
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Free to start. No credit card required.
            </p>
          </div>

          {/* --- P.S. --- */}
          <div className="mt-16 rounded-lg border border-border/30 bg-card/30 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
              <span className="font-semibold text-foreground">P.S.</span> — If
              you&apos;ve been sitting on presets, sample packs, beats, or a
              course idea and just never pulled the trigger because you
              didn&apos;t know where to put it — just list one thing. Seriously.
              One product. See if anyone bites. If not, you lost nothing. If
              someone you&apos;ve never met buys your stuff because 100,000
              producers happened to find it? That&apos;s a pretty good day.
            </p>
          </div>
        </div>
      </article>

      <Footer />

      {/* Floating CTA — appears after scrolling past first section */}
      <div
        className={`fixed bottom-6 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${
          showFloatingCta
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <Link
          href="/sign-up?intent=creator"
          className="group inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-purple-900/30 backdrop-blur-sm transition-all hover:bg-purple-500 hover:shadow-xl sm:px-8 sm:py-3.5 sm:text-base"
        >
          Become a Founding Creator
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
