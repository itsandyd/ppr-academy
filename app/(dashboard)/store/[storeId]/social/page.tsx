import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SocialScheduler } from "@/components/social-media/social-scheduler";

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
      <SocialScheduler storeId={storeId} userId={userId} />
    </div>
  );
}
