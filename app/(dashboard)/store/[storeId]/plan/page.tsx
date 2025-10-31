import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { PlanSettings } from "@/components/creator/plan-settings";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const dynamic = 'force-dynamic';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface PlanPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Await params (Next.js 15 requirement)
  const { storeId } = await params;

  // Verify store ownership
  const store = await convex.query(api.stores.getStoreById, {
    storeId: storeId as Id<"stores">,
  });

  if (!store || store.userId !== userId) {
    redirect("/home");
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Plan & Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan and profile visibility
        </p>
      </div>
      
      <PlanSettings storeId={storeId as Id<"stores">} />
    </div>
  );
}

