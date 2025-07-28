import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    console.log("🎨 Starting thumbnail generation...");
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not found in environment variables");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ No user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", userId);

    const { title, description, category } = await request.json();
    console.log("📝 Request data:", { title, description, category });

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Course title and description are required" },
        { status: 400 }
      );
    }

    // Create a descriptive prompt for DALL-E
    const prompt = createThumbnailPrompt(title, description, category);
    console.log("🎯 Generated prompt:", prompt);

    console.log("🤖 Calling OpenAI DALL-E API...");
    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024", // DALL-E 3's closest to 16:9 (1.75:1)
      quality: "hd",
      n: 1,
    });
    
    console.log("📏 Generated image size: 1792x1024 (1.75:1 ratio)");

    console.log("✅ OpenAI response received:", response);
    const imageUrl = response.data?.[0]?.url;
    console.log("🖼️ Image URL:", imageUrl);
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Download the image from OpenAI
    console.log("📥 Downloading image from OpenAI...");
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageFile = new File([imageBuffer], `thumbnail-${Date.now()}.png`, {
      type: 'image/png'
    });

    // Upload to uploadthing for permanent storage
    console.log("☁️ Uploading to storage...");
    const uploadResponse = await utapi.uploadFiles([imageFile]);
    
    if (!uploadResponse[0]?.data?.url) {
      throw new Error("Failed to upload image to storage");
    }

    const permanentUrl = uploadResponse[0].data.url;
    console.log("✅ Image uploaded successfully:", permanentUrl);

    console.log("🎉 Thumbnail generation successful!");
    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl, // Use the permanent uploadthing URL
      originalUrl: imageUrl,
    });

  } catch (error: any) {
    console.error("❌ Error generating thumbnail:", error);
    console.error("Error details:", {
      message: error.message,
      type: error?.error?.type,
      code: error?.error?.code,
      status: error?.status,
      stack: error.stack
    });
    
    // Handle specific OpenAI errors
    if (error?.error?.type === "invalid_request_error") {
      return NextResponse.json(
        { error: `Invalid request to AI service: ${error?.error?.message || error.message}` },
        { status: 400 }
      );
    }
    
    if (error?.error?.type === "rate_limit_exceeded") {
      return NextResponse.json(
        { error: "AI service rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Check for authentication errors
    if (error.message?.includes('api key') || error?.error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: "OpenAI API key is invalid or missing" },
        { status: 500 }
      );
    }

    // Check for billing errors
    if (error.message?.includes('billing') || error.message?.includes('limit') || error?.error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: "OpenAI billing limit reached. Please add credits to your OpenAI account at platform.openai.com/account/billing" },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: `Failed to generate thumbnail: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function createThumbnailPrompt(title: string, description: string, category?: string): string {
  const baseStyle = "Create a professional, high-quality course thumbnail in landscape format (1792x1024). Use vibrant colors, modern design, and clear visual hierarchy.";
  const musicStyle = category ? `This is a ${category.toLowerCase()} course.` : "This is a music production course.";
  const contentFocus = `The course is titled "${title}" and focuses on: ${description.substring(0, 150)}`;
  const visualElements = "Include relevant visual elements like music equipment, studio gear, waveforms, or audio interfaces. Use a clean, professional layout suitable for online course platforms.";
  const techSpecs = "Make sure the image looks great at thumbnail size and maintains clarity when scaled down.";
  
  const prompt = `${baseStyle} ${musicStyle} ${contentFocus} ${visualElements} ${techSpecs}`;
  
  // Ensure prompt isn't too long (DALL-E has a limit)
  if (prompt.length > 1000) {
    console.warn("⚠️ Prompt is very long, truncating...");
    return prompt.substring(0, 1000);
  }
  
  return prompt;
} 