import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface ContentRequest {
  type: "description" | "tags";
  productType: string;
  title?: string;
  description?: string;
  existingDescription?: string;
  existingTags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: Rate limiting (strict - 5 requests/min)
    const identifier = getRateLimitIdentifier(request, userId);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not found");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const body: ContentRequest = await request.json();
    const { type, productType, title, description, existingDescription, existingTags } = body;

    if (type === "description") {
      return generateDescription(apiKey, productType, title, existingDescription);
    }

    if (type === "tags") {
      return generateTags(apiKey, productType, title, description, existingTags);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function generateDescription(
  apiKey: string,
  productType: string,
  title?: string,
  existingDescription?: string
): Promise<NextResponse> {
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  const productContext = getProductContext(productType);

  const prompt = `You are a professional copywriter for a music production marketplace. Write a compelling product description for a ${productContext.name}.

Product Title: "${title}"
${existingDescription ? `Current Description (improve upon this): "${existingDescription}"` : ""}

Requirements:
- Write 2-3 paragraphs (150-250 words total)
- First paragraph: Hook the reader with what makes this ${productContext.name} special
- Second paragraph: Describe what's included and key features
- Third paragraph (optional): Mention ideal use cases or target audience
- Use professional but approachable tone
- Focus on benefits and value to the buyer
- Include relevant music production terminology
- DO NOT use marketing clichés like "game-changer" or "revolutionary"
- DO NOT include prices or promotional language

${productContext.hints}

Return ONLY the description text, no quotes or formatting.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const generatedDescription = response.choices[0]?.message?.content || "";

  return NextResponse.json({
    success: true,
    description: generatedDescription.trim(),
  });
}

async function generateTags(
  apiKey: string,
  productType: string,
  title?: string,
  description?: string,
  existingTags?: string[]
): Promise<NextResponse> {
  if (!title && !description) {
    return NextResponse.json(
      { error: "Title or description is required" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const productContext = getProductContext(productType);

  const prompt = `You are a SEO expert for a music production marketplace. Generate relevant tags for a ${productContext.name}.

Product Title: "${title || "Untitled"}"
${description ? `Description: "${description.substring(0, 500)}"` : ""}
${existingTags?.length ? `Existing tags (don't repeat these): ${existingTags.join(", ")}` : ""}

Requirements:
- Generate 5-8 relevant tags
- Tags should be lowercase, 1-3 words each
- Include a mix of:
  - Genre/style tags (e.g., "lo-fi", "trap", "ambient")
  - Technical tags (e.g., "808s", "synth presets", "drum loops")
  - Mood/vibe tags (e.g., "dark", "uplifting", "chill")
  - Use-case tags (e.g., "beats", "sound design", "mixing")
- Focus on discoverability and search relevance
- Avoid overly generic tags like "music" or "audio"

${productContext.tagHints}

Return ONLY a JSON array of strings, e.g., ["tag1", "tag2", "tag3"]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = response.choices[0]?.message?.content || "[]";

  // Parse the JSON array from the response
  let tags: string[] = [];
  try {
    // Extract JSON array from response (handle potential markdown formatting)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      tags = JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.error("Failed to parse tags:", responseText);
    // Fallback: split by common delimiters
    tags = responseText
      .replace(/[\[\]"]/g, "")
      .split(/[,\n]/)
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  // Clean and validate tags
  tags = tags
    .map((t: string) => t.toLowerCase().trim())
    .filter((t: string) => t.length > 0 && t.length <= 30)
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    tags,
  });
}

interface ProductContext {
  name: string;
  hints: string;
  tagHints: string;
}

function getProductContext(productType: string): ProductContext {
  const contexts: Record<string, ProductContext> = {
    "sample-pack": {
      name: "sample pack",
      hints:
        "Mention audio formats, number of samples if known, and key musical characteristics.",
      tagHints: 'Include format tags like "wav", "one-shots", "loops" if relevant.',
    },
    "preset-pack": {
      name: "synthesizer preset pack",
      hints:
        "Focus on the sound design quality, versatility, and the types of sounds included.",
      tagHints: "Include synth-related tags and sound design terms.",
    },
    "midi-pack": {
      name: "MIDI pack",
      hints:
        "Emphasize musicality, chord progressions, melodic content, and ease of customization.",
      tagHints:
        'Include music theory related tags like "chord progressions", "melodies", specific keys.',
    },
    "beat-lease": {
      name: "beat for lease",
      hints:
        "Describe the vibe, energy level, and what type of artists/projects it would suit.",
      tagHints: 'Include artist style references and mood tags like "energetic", "smooth".',
    },
    course: {
      name: "music production course",
      hints:
        "Highlight learning outcomes, skill level required, and what students will be able to create.",
      tagHints:
        'Include skill level tags like "beginner", "advanced" and topic tags.',
    },
    coaching: {
      name: "coaching session",
      hints:
        "Describe what the student will learn, your expertise, and the format of the session.",
      tagHints: 'Include session type tags like "feedback", "1-on-1", "mentorship".',
    },
    "mixing-service": {
      name: "mixing service",
      hints: "Describe your mixing approach, what's included, and turnaround time.",
      tagHints:
        'Include service-related tags like "stems", "revisions", genres you specialize in.',
    },
    "mastering-service": {
      name: "mastering service",
      hints: "Describe your mastering process, formats delivered, and quality standards.",
      tagHints: 'Include format tags like "stem mastering", "vinyl", "streaming".',
    },
    "effect-chain": {
      name: "effect chain/rack",
      hints: "Describe the audio processing, what it's designed for, and DAW compatibility.",
      tagHints: 'Include effect type tags like "compression", "saturation", DAW names.',
    },
    pdf: {
      name: "PDF guide/resource",
      hints: "Describe what knowledge is covered and how it will help the reader.",
      tagHints: 'Include topic tags and format tags like "cheat-sheet", "guide".',
    },
    bundle: {
      name: "product bundle",
      hints: "Highlight the value of the bundle and what's included.",
      tagHints: "Include tags for each product type in the bundle.",
    },
    membership: {
      name: "membership tier",
      hints: "Describe the ongoing value, exclusive content, and community benefits.",
      tagHints:
        'Include membership-related tags like "exclusive", "community", "monthly".',
    },
    "playlist-curation": {
      name: "playlist curation service",
      hints: "Describe your playlist reach, genre focus, and submission process.",
      tagHints: "Include genre tags and platform tags.",
    },
  };

  return (
    contexts[productType] || {
      name: "digital product",
      hints: "Describe the value and what's included.",
      tagHints: "Include relevant category tags.",
    }
  );
}
