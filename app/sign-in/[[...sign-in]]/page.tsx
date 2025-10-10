import { SignIn } from "@clerk/nextjs";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string; intent?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const isCreator = params.intent === 'creator';
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isCreator 
                ? 'Sign in to your creator dashboard' 
                : 'Sign in to continue learning'}
            </p>
          </div>
          
          {isCreator && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Creator Account
            </div>
          )}
        </div>

        {/* Clerk Sign In Component */}
        <div className="p-8">
        <SignIn 
          fallbackRedirectUrl={params.redirect_url || "/dashboard"}
          appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none w-full",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors",
                formFieldInput: "rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold",
                identityPreviewText: "text-gray-700 dark:text-gray-300",
                formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                socialButtonsBlockButtonText: "font-semibold text-gray-700 dark:text-gray-300",
                dividerLine: "bg-gray-200 dark:bg-gray-700",
                dividerText: "text-gray-500 dark:text-gray-400",
                formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
              },
            }}
            signUpUrl="/sign-up"
          />
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a 
              href={isCreator ? "/sign-up?intent=creator" : "/sign-up"} 
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isCreator ? 'Become a Creator' : 'Sign up for free'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 