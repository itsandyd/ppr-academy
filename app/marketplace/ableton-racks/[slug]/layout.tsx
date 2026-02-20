import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

// Helper to strip HTML for meta descriptions
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    // Fetch Ableton rack by slug
    const rack = await fetchQuery(api.abletonRacks.getAbletonRackBySlug, { slug });

    if (!rack) {
      return {
        title: "Ableton Rack Not Found - PausePlayRepeat",
        description: "The Ableton rack you're looking for could not be found.",
      };
    }

    const formatPrice = (price?: number) => {
      if (!price || price === 0) return "Free";
      return `$${price.toFixed(2)}`;
    };

    const rackTypeLabel = 
      rack.rackType === "audioEffect" ? "Audio Effect Rack" :
      rack.rackType === "instrument" ? "Instrument Rack" :
      rack.rackType === "midiEffect" ? "MIDI Effect Rack" :
      rack.rackType === "drumRack" ? "Drum Rack" : "Ableton Rack";

    const pageUrl = `${baseUrl}/marketplace/ableton-racks/${slug}`;
    const metaDescription = rack.description 
      ? stripHtml(rack.description).substring(0, 155) + '...'
      : `${rack.title} - ${rackTypeLabel} for Ableton Live ${rack.abletonVersion || ''}. ${rack.price === 0 ? 'Free download' : `Available for ${formatPrice(rack.price)}`}.`;
    
    const metaTitle = `${rack.title}${rack.creatorName ? ` by ${rack.creatorName}` : ''} - Ableton Rack | PausePlayRepeat`;
    
    const keywords = [
      rack.title,
      rack.creatorName || 'Ableton Live',
      rackTypeLabel,
      'Ableton Live rack',
      'audio effect rack',
      'Ableton preset',
      rack.abletonVersion || 'Ableton Live',
      ...(rack.genre || []),
      ...(rack.effectType || []),
      rack.price === 0 ? 'free Ableton rack' : 'premium Ableton rack',
      'music production',
      'Ableton Live tools',
      'audio rack marketplace',
    ];

    // Build structured data for JSON-LD
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": rack.title,
      "applicationCategory": "MultimediaApplication",
      "applicationSubCategory": "AbletonRack",
      "operatingSystem": "Ableton Live",
      "offers": {
        "@type": "Offer",
        "price": rack.price || 0,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": pageUrl
      },
      ...(rack.creatorName && { "author": { "@type": "Person", "name": rack.creatorName } }),
      ...(rack.description && { "description": stripHtml(rack.description).substring(0, 200) }),
      ...(rack.chainImageUrl && { "image": rack.chainImageUrl }),
      ...(rack.genre && rack.genre.length > 0 && { "genre": rack.genre.join(", ") }),
    };

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: keywords.join(', '),
      authors: rack.creatorName ? [{ name: rack.creatorName }] : undefined,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: pageUrl,
        siteName: "PausePlayRepeat",
        type: "website",
        images: rack.chainImageUrl
          ? [
              {
                url: rack.chainImageUrl,
                width: 1200,
                height: 630,
                alt: `${rack.title} - Ableton Rack`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description: metaDescription,
        images: rack.chainImageUrl ? [rack.chainImageUrl] : undefined,
      },
      alternates: {
        canonical: pageUrl,
      },
      other: {
        'product:price:amount': String(rack.price || 0),
        'product:price:currency': 'USD',
        'product:availability': 'in stock',
        // Add JSON-LD structured data
        'script:ld+json': JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    console.error("Error generating Ableton rack metadata:", error);
    return {
      title: "Ableton Rack - PausePlayRepeat",
      description: "Discover professional Ableton Live racks at PausePlayRepeat",
    };
  }
}

export default function AbletonRackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

