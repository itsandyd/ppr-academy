import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your PPR Academy account</p>
        </div>
        <SignIn 
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