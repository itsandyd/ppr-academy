import { SignUp } from "@clerk/nextjs";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join PPR Academy and start learning</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#6356FF] hover:bg-[#5248E6]",
              footerActionLink: "text-[#6356FF] hover:text-[#5248E6]"
            }
          }}
        />
      </div>
    </div>
  );
} 