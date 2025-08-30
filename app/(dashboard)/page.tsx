import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to the home dashboard page
  redirect('/home')
}
