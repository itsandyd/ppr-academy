import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface BioRequest {
  storeId: string;
  creatorName?: string;
  existingBio?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const body: BioRequest = await request.json();
    const { storeId, creatorName, existingBio } = body;

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    // Fetch products from the store using Convex
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    let products: any[] = [];
    let courses: any[] = [];

    try {
      // Get digital products
      products = await convex.query(api.digitalProducts.getProductsByStore, {
        storeId: storeId as any,
      });
    } catch (e) {
      console.log("Could not fetch products:", e);
    }

    try {
      // Get courses
      courses = await convex.query(api.courses.getCoursesByStore, {
        storeId: storeId as any,
      });
    } catch (e) {
      console.log("Could not fetch courses:", e);
    }

    // Combine and summarize products for the AI
    const allProducts = [...(products || []), ...(courses || [])];

    const productSummary = allProducts
      .slice(0, 10) // Limit to 10 products to keep prompt size reasonable
      .map((p: any) => {
        const type = p.productType || p.productCategory || "product";
        return `- ${p.title} (${type})${p.description ? `: ${p.description.substring(0, 100)}` : ""}`;
      })
      .join("\n");

    // Analyze product types
    const productTypes = allProducts.reduce((acc: Record<string, number>, p: any) => {
      const type = p.productType || p.productCategory || "digital product";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const productTypeSummary = Object.entries(productTypes)
      .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
      .join(", ");

    const openai = new OpenAI({ apiKey });

    const prompt = `You are a professional copywriter helping a music creator write their profile bio for their online store.

Creator Name: ${creatorName || "Creator"}
${existingBio ? `Current Bio (improve upon this): "${existingBio}"` : ""}

Their store currently offers: ${productTypeSummary || "various digital products"}

Products in their store:
${productSummary || "No products yet"}

Write a compelling, professional bio that:
- Is 2-3 sentences (50-100 words max)
- Highlights what they offer based on their products
- Sounds authentic and personal (first person "I" voice)
- Appeals to music producers, beatmakers, or artists
- Mentions their expertise based on the types of products they sell
- Is engaging but not overly promotional
- Does NOT use clichés like "passionate about music" or "dedicated to helping"
- Does NOT include emojis

Return ONLY the bio text, no quotes or formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const generatedBio = response.choices[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      bio: generatedBio.trim(),
      productCount: allProducts.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate bio";
    console.error("Bio generation error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
