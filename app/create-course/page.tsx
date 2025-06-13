import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateCourseForm from "@/components/create-course-form";

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