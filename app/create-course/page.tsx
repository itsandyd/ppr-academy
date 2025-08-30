import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateCourseForm from "@/components/create-course-form";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function CreateCoursePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <CreateCourseForm />
    </div>
  );
} 