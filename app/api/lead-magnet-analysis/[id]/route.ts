import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leadMagnetApi: any = api.leadMagnetAnalysisMutations;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const analysis = await convex.query(leadMagnetApi.getAnalysis, {
      analysisId: id as Id<"leadMagnetAnalyses">,
    });
    
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Failed to fetch analysis:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}

