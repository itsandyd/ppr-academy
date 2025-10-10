import { SignIn } from "@clerk/nextjs";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your PPR Academy account</p>
        </div>
        <SignIn 
          redirectUrl={params.redirect_url || "/dashboard"}
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/90"
            }
          }}
        />
      </div>
    </div>
  );
} 