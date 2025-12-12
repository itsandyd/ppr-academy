import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScriptIllustrationGenerator } from "@/components/script-illustration-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function IllustrationsPage({
  params,
}: {
  params: { storeId: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Script Illustrations</h1>
        <p className="text-muted-foreground">
          Generate AI-powered illustrations from your scripts and course content.
        </p>
      </div>

      <ScriptIllustrationGenerator
        userId={userId}
        storeId={params.storeId}
        sourceType="custom"
      />

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>About This Feature</CardTitle>
          <CardDescription>
            Powered by FAL AI and OpenAI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong>What it does:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Splits your script into individual sentences</li>
              <li>Generates contextual illustration prompts using GPT-4</li>
              <li>Creates custom images using FAL AI (FLUX Schnell model)</li>
              <li>Generates image embeddings for semantic search</li>
              <li>Stores everything in Convex for easy retrieval</li>
            </ul>
          </div>

          <div>
            <strong>Use cases:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Course lesson visualization</li>
              <li>Tutorial step-by-step illustrations</li>
              <li>Documentation and guides</li>
              <li>Social media content creation</li>
              <li>Marketing materials</li>
            </ul>
          </div>

          <div>
            <strong>Semantic Search:</strong>
            <p className="mt-2 text-muted-foreground">
              All generated illustrations are embedded using OpenAI's vision capabilities,
              allowing you to search for images by concept, topic, or description. Perfect
              for finding and reusing relevant visuals across your content.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

