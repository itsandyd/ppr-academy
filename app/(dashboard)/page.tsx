import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect to the home page within the dashboard
  redirect("/home");
}
