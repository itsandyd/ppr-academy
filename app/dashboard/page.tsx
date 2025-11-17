import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { DashboardShell } from './components/DashboardShell';

export const dynamic = 'force-dynamic';

type DashboardMode = 'learn' | 'create';

interface SearchParams {
  mode?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get mode from URL (await searchParams for Next.js 15)
  const params = await searchParams;
  let mode = params.mode as DashboardMode | undefined;

  // If no mode in URL, determine default and redirect
  if (!mode || (mode !== 'learn' && mode !== 'create')) {
    // First, get the Convex user by Clerk ID
    // @ts-ignore - Type instantiation depth issue
    const convexUser = await fetchQuery(api.users.getUserFromClerk, {
      clerkId: user.id,
    });

    // Check for saved preference
    const preference = convexUser?.dashboardPreference as DashboardMode | undefined;
    
    if (preference && (preference === 'learn' || preference === 'create')) {
      redirect(`/dashboard?mode=${preference}`);
    }

    // No preference? Determine default based on whether they have stores
    // NOTE: getStoresByUser expects Clerk ID (user.id), not Convex user._id
    // @ts-ignore - Type instantiation depth issue
    const stores = await fetchQuery(api.stores.getStoresByUser, {
      userId: user.id, // This is Clerk ID
    });

    // If they have stores/products, they're probably a creator
    const defaultMode: DashboardMode = stores && stores.length > 0 ? 'create' : 'learn';
    redirect(`/dashboard?mode=${defaultMode}`);
  }

  // Mode is valid, render the shell
  // Children will fetch their own data on the client
  return (
    <DashboardShell mode={mode} />
  );
}
