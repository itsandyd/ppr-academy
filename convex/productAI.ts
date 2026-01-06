"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MUSIC_PRODUCTION_CONTEXT = `You are an expert copywriter for a music production marketplace. 
You write compelling, authentic copy for products like sample packs, presets, MIDI packs, 
Ableton racks, courses, and digital downloads for music producers and beatmakers.
Your tone is professional yet approachable, speaking to producers who want to level up their sound.`;

export const generateProductDescription = action({
  args: {
    title: v.string(),
    category: v.string(),
    keywords: v.optional(v.array(v.string())),
    existingDescription: v.optional(v.string()),
  },
  returns: v.object({
    description: v.string(),
    shortDescription: v.string(),
  }),
  handler: async (ctx, args) => {
    const keywordsContext = args.keywords?.length
      ? `Keywords to incorporate: ${args.keywords.join(", ")}`
      : "";

    const existingContext = args.existingDescription
      ? `Improve upon this existing description: "${args.existingDescription}"`
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MUSIC_PRODUCTION_CONTEXT },
        {
          role: "user",
          content: `Generate a compelling product description for a music production ${args.category} called "${args.title}".
          
${keywordsContext}
${existingContext}

Return a JSON object with:
- "description": A detailed description (150-250 words) that highlights value, quality, and use cases
- "shortDescription": A punchy one-liner (under 20 words) for previews/cards

Focus on:
- What's included and why it's valuable
- Who it's perfect for
- The quality and professional production value
- How it will help producers create better music`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      description: result.description || "",
      shortDescription: result.shortDescription || "",
    };
  },
});

export const generateSEO = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
  },
  returns: v.object({
    metaTitle: v.string(),
    metaDescription: v.string(),
    keywords: v.array(v.string()),
    ogTitle: v.string(),
    ogDescription: v.string(),
  }),
  handler: async (ctx, args) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `${MUSIC_PRODUCTION_CONTEXT} You are also an SEO expert.` },
        {
          role: "user",
          content: `Generate SEO-optimized metadata for this music production product:

Title: ${args.title}
Category: ${args.category}
Description: ${args.description}

Return a JSON object with:
- "metaTitle": SEO title (50-60 characters, include primary keyword)
- "metaDescription": Meta description (150-160 characters, compelling and keyword-rich)
- "keywords": Array of 8-12 relevant keywords for search
- "ogTitle": Open Graph title for social sharing
- "ogDescription": Open Graph description for social sharing (slightly more casual/engaging)`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      metaTitle: result.metaTitle || args.title,
      metaDescription: result.metaDescription || "",
      keywords: result.keywords || [],
      ogTitle: result.ogTitle || args.title,
      ogDescription: result.ogDescription || "",
    };
  },
});

export const generateSalesCopy = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.optional(v.number()),
  },
  returns: v.object({
    headline: v.string(),
    subheadline: v.string(),
    bulletPoints: v.array(v.string()),
    ctaText: v.string(),
    urgencyText: v.optional(v.string()),
    socialProof: v.string(),
  }),
  handler: async (ctx, args) => {
    const priceContext = args.price ? `Price: $${args.price}` : "Free product";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${MUSIC_PRODUCTION_CONTEXT} You write high-converting sales copy.`,
        },
        {
          role: "user",
          content: `Create sales copy for this music production product:

Title: ${args.title}
Category: ${args.category}
Description: ${args.description}
${priceContext}

Return a JSON object with:
- "headline": A powerful, attention-grabbing headline (8-12 words)
- "subheadline": Supporting headline that adds context (15-20 words)
- "bulletPoints": Array of 4-6 benefit-focused bullet points (start with action verbs or outcomes)
- "ctaText": Call-to-action button text (2-4 words, action-oriented)
- "urgencyText": Optional scarcity/urgency message (only if appropriate)
- "socialProof": A trust-building statement about quality/popularity`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      headline: result.headline || "",
      subheadline: result.subheadline || "",
      bulletPoints: result.bulletPoints || [],
      ctaText: result.ctaText || "Get It Now",
      urgencyText: result.urgencyText,
      socialProof: result.socialProof || "",
    };
  },
});

export const suggestTags = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
  },
  returns: v.object({
    tags: v.array(v.string()),
    genres: v.array(v.string()),
    moods: v.array(v.string()),
    instruments: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MUSIC_PRODUCTION_CONTEXT },
        {
          role: "user",
          content: `Suggest tags and keywords for this music production product:

Title: ${args.title}
Category: ${args.category}
Description: ${args.description}

Return a JSON object with:
- "tags": 8-12 general tags for discovery (e.g., "808s", "vinyl", "lo-fi", "hard-hitting")
- "genres": 3-5 relevant music genres (e.g., "Hip Hop", "Trap", "R&B", "Pop")
- "moods": 3-5 mood/vibe descriptors (e.g., "dark", "melodic", "aggressive", "chill")
- "instruments": 3-5 instrument/sound categories (e.g., "drums", "synths", "bass", "vocals")`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      tags: result.tags || [],
      genres: result.genres || [],
      moods: result.moods || [],
      instruments: result.instruments || [],
    };
  },
});

export const translateContent = action({
  args: {
    title: v.string(),
    description: v.string(),
    targetLanguage: v.string(),
  },
  returns: v.object({
    title: v.string(),
    description: v.string(),
    language: v.string(),
  }),
  handler: async (ctx, args) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator specializing in music production and creative content. 
Translate while maintaining the marketing appeal and industry terminology.`,
        },
        {
          role: "user",
          content: `Translate the following product content to ${args.targetLanguage}:

Title: ${args.title}
Description: ${args.description}

Return a JSON object with:
- "title": Translated title
- "description": Translated description (maintain formatting and marketing appeal)
- "language": The target language code (e.g., "es", "fr", "de", "ja", "ko", "pt", "zh")`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      title: result.title || args.title,
      description: result.description || args.description,
      language: result.language || args.targetLanguage,
    };
  },
});

export const rewriteInTone = action({
  args: {
    text: v.string(),
    tone: v.union(
      v.literal("professional"),
      v.literal("casual"),
      v.literal("hype"),
      v.literal("minimal"),
      v.literal("storytelling"),
      v.literal("technical")
    ),
    textType: v.union(v.literal("title"), v.literal("description"), v.literal("headline")),
  },
  returns: v.object({
    rewritten: v.string(),
    tone: v.string(),
  }),
  handler: async (ctx, args) => {
    const toneDescriptions: Record<string, string> = {
      professional: "Polished, industry-standard, trustworthy. Like a major label release.",
      casual: "Friendly, conversational, approachable. Like talking to a fellow producer.",
      hype: "Energetic, exciting, FOMO-inducing. Like a product drop announcement.",
      minimal: "Clean, concise, no fluff. Just the essentials.",
      storytelling: "Narrative-driven, emotional connection. Tell the story behind the sounds.",
      technical: "Detailed specifications, precise terminology. For the gear nerds.",
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MUSIC_PRODUCTION_CONTEXT },
        {
          role: "user",
          content: `Rewrite this ${args.textType} in a "${args.tone}" tone:

Original: "${args.text}"

Tone style: ${toneDescriptions[args.tone]}

Return a JSON object with:
- "rewritten": The rewritten text in the specified tone
- "tone": The tone used

Keep the same general length and meaning, but transform the voice/style.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      rewritten: result.rewritten || args.text,
      tone: args.tone,
    };
  },
});

export const generateBulletPoints = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
  },
  returns: v.object({
    features: v.array(v.string()),
    benefits: v.array(v.string()),
    whatsIncluded: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MUSIC_PRODUCTION_CONTEXT },
        {
          role: "user",
          content: `Generate bullet points for this music production product:

Title: ${args.title}
Category: ${args.category}
Description: ${args.description}

Return a JSON object with:
- "features": 4-6 key features (what it is, technical specs, format)
- "benefits": 4-6 benefits (what the producer gains, outcomes, improvements)
- "whatsIncluded": 4-6 items describing what's in the package (files, formats, bonuses)

Each bullet should be concise (5-10 words) and start with an action word or emoji.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      features: result.features || [],
      benefits: result.benefits || [],
      whatsIncluded: result.whatsIncluded || [],
    };
  },
});

export const generateFAQ = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.optional(v.number()),
  },
  returns: v.object({
    faqs: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const priceContext = args.price ? `Price: $${args.price}` : "This is a free product";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MUSIC_PRODUCTION_CONTEXT },
        {
          role: "user",
          content: `Generate FAQs for this music production product:

Title: ${args.title}
Category: ${args.category}
Description: ${args.description}
${priceContext}

Return a JSON object with:
- "faqs": Array of 6-8 FAQ objects, each with "question" and "answer"

Include questions about:
- Compatibility (DAWs, systems)
- File formats and quality
- Usage rights and licensing
- How to use/install
- What's included
- Refund/support policy
- Who it's best for

Make answers helpful, specific, and confidence-building.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      faqs: result.faqs || [],
    };
  },
});

export const generateAll = action({
  args: {
    title: v.string(),
    category: v.string(),
    existingDescription: v.optional(v.string()),
    price: v.optional(v.number()),
  },
  returns: v.object({
    description: v.string(),
    shortDescription: v.string(),
    seo: v.object({
      metaTitle: v.string(),
      metaDescription: v.string(),
      keywords: v.array(v.string()),
    }),
    salesCopy: v.object({
      headline: v.string(),
      subheadline: v.string(),
      bulletPoints: v.array(v.string()),
      ctaText: v.string(),
    }),
    tags: v.array(v.string()),
    faqs: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const priceContext = args.price ? `Price: $${args.price}` : "Free product";
    const existingContext = args.existingDescription
      ? `Current description to improve: "${args.existingDescription}"`
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${MUSIC_PRODUCTION_CONTEXT} Generate comprehensive marketing content.`,
        },
        {
          role: "user",
          content: `Generate complete marketing content for this music production ${args.category}:

Title: "${args.title}"
${priceContext}
${existingContext}

Return a JSON object with ALL of the following:

{
  "description": "Detailed product description (150-250 words)",
  "shortDescription": "One-liner for previews (under 20 words)",
  "seo": {
    "metaTitle": "SEO title (50-60 chars)",
    "metaDescription": "Meta description (150-160 chars)",
    "keywords": ["array", "of", "8-12", "keywords"]
  },
  "salesCopy": {
    "headline": "Attention-grabbing headline",
    "subheadline": "Supporting context line",
    "bulletPoints": ["4-6 benefit-focused points"],
    "ctaText": "Call-to-action text"
  },
  "tags": ["8-12", "discovery", "tags"],
  "faqs": [
    {"question": "Common question?", "answer": "Helpful answer"},
    // 5-6 more FAQs
  ]
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      description: result.description || "",
      shortDescription: result.shortDescription || "",
      seo: {
        metaTitle: result.seo?.metaTitle || args.title,
        metaDescription: result.seo?.metaDescription || "",
        keywords: result.seo?.keywords || [],
      },
      salesCopy: {
        headline: result.salesCopy?.headline || "",
        subheadline: result.salesCopy?.subheadline || "",
        bulletPoints: result.salesCopy?.bulletPoints || [],
        ctaText: result.salesCopy?.ctaText || "Get It Now",
      },
      tags: result.tags || [],
      faqs: result.faqs || [],
    };
  },
});
