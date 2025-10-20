import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SocialMediaTabs } from "./components/social-media-tabs";

interface SocialPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default async function SocialMediaPage({ params }: SocialPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Await params as required by Next.js 15
  const { storeId } = await params;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <SocialMediaTabs storeId={storeId} userId={userId} />
    </div>
  );
}
