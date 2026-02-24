"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "../_components/footer";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

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
              I needed email sequences to nurture leads. I needed a storefront to
              display products. I needed a course platform to host content. I
              needed payment processing. I needed download delivery. I needed
              social media content to keep driving traffic. And none of it talked
              to each other.
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
          <hr className="my-14 border-border/40" />

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

            <p>
              You can sell courses — real text-based courses with modules and
              chapters, not some guy screen recording his DAW for 3 hours. You
              can offer mixing and mastering services. Coaching sessions.
              Bundles. Memberships.
            </p>

            <p>Everything. One storefront. One place.</p>

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
              post content that funnels people to the marketplace. I run
              automations that send direct links to products when people comment
              on posts. And I&apos;m just getting started.
            </p>

            <p>
              Last week was my first real week of sales. $165 in 5 days. From one
              creator — me. Selling $9 courses. With zero paid advertising. Just
              organic traffic from the audience I already built.
            </p>

            <p>
              $165 might not sound like much. But it proves something important.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              The audience is there. They&apos;re willing to pay. They just need
              something worth buying.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

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
              Because here&apos;s the math that nobody in your DMs is offering
              you:
            </p>

            <p>
              If you put your products on Gumroad right now, you get a checkout
              page. Congratulations. Now go build your own audience from scratch
              to drive traffic to it. Good luck. That takes years. I know
              because I did it.
            </p>

            <p>
              If you put your products on PausePlayRepeat, you get a storefront,
              a listing in the creator directory, and access to an audience of
              100,000 producers that I spent years building. You show up, you
              list your products, and people who are already looking for exactly
              what you sell can find you.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              That&apos;s not a pitch. That&apos;s just math.
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
              Built into the platform, you get an AI-powered content engine that
              takes your product — your course, your sample pack, your preset —
              and generates social media scripts, image prompts, and captions
              tailored for TikTok, Instagram, and YouTube. It takes the stuff you
              already made and turns it into content that drives people back to
              your store.
            </p>

            <p>
              You can schedule posts across platforms. You can syndicate your
              content so one piece of work shows up everywhere. You don&apos;t
              have to sit there for two hours figuring out what to post. The
              platform looks at what you sell and helps you create content that
              sells it.
            </p>

            <p>
              And here&apos;s the part that changes everything:{" "}
              <span className="font-medium text-foreground">
                it&apos;s evergreen.
              </span>
            </p>

            <p>
              You create 90 days of content once. The system posts it, cycles
              through it, and when it reaches the end — it starts over. Your
              social media stays active even when you&apos;re not thinking about
              it. Same with email sequences. Build them once and they run
              forever, nurturing every new subscriber who finds you.
            </p>

            <p>
              Most creators burn out because they think they need to come up with
              something new every single day for the rest of their lives. You
              don&apos;t. You need 90 good posts and a system that recycles them.
              By the time your audience sees post #1 again, they&apos;ve either
              forgotten it or they&apos;re a new follower who&apos;s never seen
              it.
            </p>

            <p className="text-lg font-medium text-foreground sm:text-xl">
              That&apos;s not lazy. That&apos;s leverage.
            </p>

            <p>
              Because a storefront without an audience is just a page on the
              internet. And I don&apos;t want you to have a page on the internet.
              I want you to have a business.
            </p>

            <p>
              That said — you also have my audience from day one. 100,000
              followers. 50,000 email subscribers. The creator directory. The
              marketplace. So even while you&apos;re building YOUR audience, mine
              is already looking at your products.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

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
              Because early matters. The producers who got on BeatStars in 2015
              built audiences that new sellers can&apos;t touch. The creators who
              joined Gumroad early became the featured creators.{" "}
              <span className="font-medium text-foreground">
                Being first is an unfair advantage that late arrivals can never
                replicate.
              </span>
            </p>
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
              I&apos;m not asking you to risk anything. I&apos;m asking you to
              list your stuff on a platform that already has an audience looking
              for it.
            </p>
          </div>

          {/* --- Divider --- */}
          <hr className="my-14 border-border/40" />

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
              One place. Built for us. By one of us.
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
              you&apos;re a producer who&apos;s been thinking about selling your
              presets, sample packs, beats, or courses but never knew where to
              start, this is your sign. List one product. See what happens. The
              worst case is nothing changes. The best case is you wake up to a
              sale from someone you&apos;ve never met, because an audience of
              100,000 producers found your work.
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
