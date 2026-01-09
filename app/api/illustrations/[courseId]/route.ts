import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return new Response("Course ID is required", { status: 400 });
    }

    // Fetch illustrations where scriptId matches the courseId
    const illustrations = await fetchQuery(api.scriptIllustrationQueries.getIllustrationsByScript, {
      scriptId: courseId,
    });

    return new Response(JSON.stringify(illustrations), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching illustrations:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

