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
    <div className="h-[calc(100vh-9rem)] -m-4 md:-m-8 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800/50">
      <NotesDashboard 
        userId={userId} 
        storeId={resolvedParams.storeId} 
      />
    </div>
  );
}
