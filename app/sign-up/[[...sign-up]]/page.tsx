import { SignUp } from "@clerk/nextjs";
import { ReferralCapture } from "./referral-capture";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface SignUpPageProps {
  searchParams: Promise<{ intent?: string; redirect_url?: string; ref?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const isCreator = params.intent === 'creator';
  const referralCode = params.ref;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Capture referral code in localStorage */}
      {referralCode && <ReferralCapture code={referralCode} />}

      <div className="w-full max-w-md">
        {/* Referral Banner */}
        {referralCode && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 rounded-lg text-center">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
              🎁 You were referred by a friend! You'll receive <strong>500 credits</strong> after signing up.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isCreator ? 'Start Creating Today' : 'Create Your Account'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isCreator 
                ? 'Join PPR Academy and share your expertise' 
                : 'Join PPR Academy and start learning'}
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

        {/* Clerk Sign Up Component */}
        <div className="p-8">
        <SignUp 
          fallbackRedirectUrl={params.redirect_url || (isCreator ? "/home" : "/library")}
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
            signInUrl="/sign-in"
          />
        </div>

        {/* Additional Info */}
        {isCreator && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              What you'll get:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Your own professional storefront</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Keep 90% of your sales</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Built-in payment processing</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Email marketing tools included</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 