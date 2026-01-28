"use client";

import React, { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Star,
  Check,
  ChevronDown,
  Play,
  ArrowRight,
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  settings: any;
  isVisible: boolean;
}

interface LandingPage {
  _id: Id<"landingPages">;
  title: string;
  blocks: Block[];
  linkedProductId?: string;
  linkedCourseId?: string;
}

interface PublicLandingPageProps {
  page: LandingPage;
  storeSlug: string;
}

export function PublicLandingPage({ page, storeSlug }: PublicLandingPageProps) {
  const trackPageView = useMutation(api.landingPages.trackPageView);

  // Track page view on mount
  useEffect(() => {
    trackPageView({ pageId: page._id }).catch(console.error);
  }, [page._id, trackPageView]);

  const visibleBlocks = page.blocks.filter((b) => b.isVisible);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {visibleBlocks.map((block) => (
        <BlockRenderer key={block.id} block={block} storeSlug={storeSlug} />
      ))}
    </div>
  );
}

function BlockRenderer({ block, storeSlug }: { block: Block; storeSlug: string }) {
  switch (block.type) {
    case "hero":
      return <HeroBlock settings={block.settings} />;
    case "features":
      return <FeaturesBlock settings={block.settings} />;
    case "testimonials":
      return <TestimonialsBlock settings={block.settings} />;
    case "pricing":
      return <PricingBlock settings={block.settings} />;
    case "cta":
      return <CTABlock settings={block.settings} />;
    case "faq":
      return <FAQBlock settings={block.settings} />;
    case "video":
      return <VideoBlock settings={block.settings} />;
    case "image":
      return <ImageBlock settings={block.settings} />;
    case "text":
      return <TextBlock settings={block.settings} />;
    case "countdown":
      return <CountdownBlock settings={block.settings} />;
    case "social_proof":
      return <SocialProofBlock settings={block.settings} />;
    case "product_showcase":
      return <ProductShowcaseBlock settings={block.settings} storeSlug={storeSlug} />;
    case "custom_html":
      return <CustomHTMLBlock settings={block.settings} />;
    default:
      return null;
  }
}

// Hero Block
function HeroBlock({ settings }: { settings: any }) {
  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center py-20 px-4"
      style={{ backgroundColor: settings.backgroundColor || "#4F46E5" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          {settings.headline || "Your Headline Here"}
        </h1>
        {settings.subheadline && (
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            {settings.subheadline}
          </p>
        )}
        {settings.ctaText && (
          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6"
            asChild={!!settings.ctaUrl}
          >
            {settings.ctaUrl ? (
              <a href={settings.ctaUrl}>
                {settings.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            ) : (
              <span>
                {settings.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}

// Features Block
function FeaturesBlock({ settings }: { settings: any }) {
  const features = settings.features || [];

  return (
    <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-6xl mx-auto">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {settings.headline}
          </h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature: any, index: number) => (
            <div key={index} className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Block
function TestimonialsBlock({ settings }: { settings: any }) {
  const testimonials = settings.testimonials || [];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {settings.headline}
          </h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial: any, index: number) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-white dark:bg-zinc-800"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                &quot;{testimonial.text}&quot;
              </p>
              <div className="flex items-center gap-3">
                {testimonial.avatar && (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  {testimonial.role && (
                    <p className="text-sm text-zinc-500">{testimonial.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Block
function PricingBlock({ settings }: { settings: any }) {
  const plans = settings.plans || [];

  return (
    <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-6xl mx-auto">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {settings.headline}
          </h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan: any, index: number) => (
            <div
              key={index}
              className={cn(
                "p-6 rounded-lg border bg-white dark:bg-zinc-800",
                plan.featured && "ring-2 ring-primary"
              )}
            >
              {plan.featured && (
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.period && (
                  <span className="text-zinc-500">/{plan.period}</span>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features?.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.featured ? "default" : "outline"}
              >
                {plan.ctaText || "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Block
function CTABlock({ settings }: { settings: any }) {
  return (
    <section className="py-20 px-4 bg-primary text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {settings.headline || "Ready to Get Started?"}
        </h2>
        {settings.subheadline && (
          <p className="text-xl text-white/80 mb-8">{settings.subheadline}</p>
        )}
        {settings.ctaText && (
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
            asChild={!!settings.ctaUrl}
          >
            {settings.ctaUrl ? (
              <a href={settings.ctaUrl}>{settings.ctaText}</a>
            ) : (
              <span>{settings.ctaText}</span>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}

// FAQ Block
function FAQBlock({ settings }: { settings: any }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const faqs = settings.faqs || [];

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {settings.headline}
          </h2>
        )}
        <div className="space-y-4">
          {faqs.map((faq: any, index: number) => (
            <div key={index} className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-zinc-600 dark:text-zinc-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Video Block
function VideoBlock({ settings }: { settings: any }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            {settings.headline}
          </h2>
        )}
        <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900">
          {settings.videoUrl ? (
            <iframe
              src={settings.videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-16 w-16 text-white/50" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Image Block
function ImageBlock({ settings }: { settings: any }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {settings.imageUrl ? (
          <img
            src={settings.imageUrl}
            alt={settings.alt || ""}
            className="w-full rounded-lg"
          />
        ) : (
          <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
            <span className="text-zinc-400">No image</span>
          </div>
        )}
        {settings.caption && (
          <p className="text-center text-sm text-zinc-500 mt-4">
            {settings.caption}
          </p>
        )}
      </div>
    </section>
  );
}

// Text Block
function TextBlock({ settings }: { settings: any }) {
  return (
    <section className="py-20 px-4">
      <div
        className={cn(
          "max-w-3xl mx-auto prose dark:prose-invert",
          settings.alignment === "center" && "text-center",
          settings.alignment === "right" && "text-right"
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: settings.content || "" }} />
      </div>
    </section>
  );
}

// Countdown Block
function CountdownBlock({ settings }: { settings: any }) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    if (!settings.endDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(settings.endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.endDate]);

  return (
    <section className="py-20 px-4 bg-zinc-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            {settings.headline}
          </h2>
        )}
        <div className="flex justify-center gap-4">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/10 rounded-lg p-4 min-w-[80px]"
            >
              <div className="text-3xl font-bold">{item.value}</div>
              <div className="text-sm text-white/60">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Social Proof Block
function SocialProofBlock({ settings }: { settings: any }) {
  return (
    <section className="py-12 px-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {settings.stats?.map((stat: any, index: number) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        {settings.logos && settings.logos.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8 opacity-50">
            {settings.logos.map((logo: string, index: number) => (
              <img
                key={index}
                src={logo}
                alt=""
                className="h-8 grayscale"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Product Showcase Block
function ProductShowcaseBlock({
  settings,
  storeSlug,
}: {
  settings: any;
  storeSlug: string;
}) {
  const products = settings.products || [];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {settings.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {settings.headline}
          </h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product: any, index: number) => (
            <a
              key={index}
              href={`/${storeSlug}/products/${product.slug || product.id}`}
              className="group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              {product.price !== undefined && (
                <p className="text-zinc-600 dark:text-zinc-400">
                  ${product.price}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Custom HTML Block
function CustomHTMLBlock({ settings }: { settings: any }) {
  return (
    <section className="py-20 px-4">
      <div
        className="max-w-6xl mx-auto"
        dangerouslySetInnerHTML={{ __html: settings.html || "" }}
      />
    </section>
  );
}
