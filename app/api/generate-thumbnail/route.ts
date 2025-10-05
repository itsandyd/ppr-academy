import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

    // Initialize OpenAI client at runtime
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error("❌ No user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", userId);
    
    // Get Clerk JWT token for Convex authentication
    const token = await getToken({ template: "convex" });
    
    // Initialize Convex client with authentication
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token!);

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

    console.log("🤖 Calling OpenAI GPT-Image API...");
    // Generate image with gpt-image-1
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      n: 1,
      quality: "auto"
    });
    
    console.log("📏 Generated image size: 1024x1024");

    console.log("✅ OpenAI response received:", response);
    
    // Handle both URL and base64 responses
    const imageData = response.data?.[0];
    if (!imageData) {
      return NextResponse.json(
        { error: "No image data received from OpenAI API" },
        { status: 500 }
      );
    }

    const imageUrl = imageData.url;
    const imageB64 = imageData.b64_json;
    
    console.log("🖼️ Image format:", imageUrl ? "URL" : "Base64");

    let imageFile: File;

    if (imageUrl) {
      // Download the image from OpenAI URL
      console.log("📥 Downloading image from OpenAI URL...");
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image");
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      imageFile = new File([imageBuffer], `thumbnail-${Date.now()}.png`, {
        type: 'image/png'
      });
    } else if (imageB64) {
      // Convert base64 to file
      console.log("🔄 Converting base64 image to file...");
      const binaryString = atob(imageB64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageFile = new File([bytes], `thumbnail-${Date.now()}.png`, {
        type: 'image/png'
      });
    } else {
      return NextResponse.json(
        { error: "No image URL or base64 data received from OpenAI API" },
        { status: 500 }
      );
    }

    // Upload to Convex storage
    console.log("☁️ Uploading to Convex storage...");
    
    // First, get the upload URL from Convex
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});
    
    // Upload the file to Convex storage
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": imageFile.type },
      body: imageFile,
    });
    
    if (!uploadResult.ok) {
      throw new Error("Failed to upload image to Convex storage");
    }
    
    const { storageId } = await uploadResult.json();
    
    // Get the public URL for the uploaded file from Convex
    const permanentUrl = await convex.query(api.files.getStorageUrl, { 
      storageId: storageId as Id<"_storage"> 
    });
    
    if (!permanentUrl) {
      throw new Error("Failed to get storage URL from Convex");
    }
    
    console.log("✅ Image uploaded successfully to Convex:", permanentUrl);

    console.log("🎉 Thumbnail generation successful!");
    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl, // Use the permanent Convex storage URL
      originalUrl: imageUrl || "base64_converted",
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