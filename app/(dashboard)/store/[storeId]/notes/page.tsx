import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotesDashboard } from "@/components/notes/notes-dashboard";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { userId } = await auth();
  const resolvedParams = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="h-screen overflow-hidden">
      <NotesDashboard 
        userId={userId} 
        storeId={resolvedParams.storeId} 
      />
    </div>
  );
}
